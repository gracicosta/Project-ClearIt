import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, RefreshCw, ShieldAlert, Sparkles, Trash2, MessagesSquare, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { transcribeRecording, summarizeRecording } from "@/lib/recordings.functions";

export const Route = createFileRoute("/_authenticated/recordings/$id")({
  component: RecordingDetail,
});

function RecordingDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const transcribe = useServerFn(transcribeRecording);
  const summarize = useServerFn(summarizeRecording);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const { data: rec, isLoading } = useQuery({
    queryKey: ["recording", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recordings")
        .select("*, employees(full_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: (q) => {
      const s = (q.state.data as { status?: string } | undefined)?.status;
      return s === "transcribing" || s === "summarizing" ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!rec?.audio_path) return;
    supabase.storage.from("recordings").createSignedUrl(rec.audio_path, 3600).then(({ data }) => {
      if (data?.signedUrl) setAudioUrl(data.signedUrl);
    });
  }, [rec?.audio_path]);

  const runPipeline = useMutation({
    mutationFn: async () => {
      await transcribe({ data: { recordingId: id } });
      await summarize({ data: { recordingId: id } });
    },
    onSuccess: () => {
      toast.success("Análise concluída.");
      qc.invalidateQueries({ queryKey: ["recording", id] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro."),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (rec?.audio_path) await supabase.storage.from("recordings").remove([rec.audio_path]);
      const { error } = await supabase.from("recordings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gravação excluída.");
      qc.invalidateQueries({ queryKey: ["recordings", user.id] });
      navigate({ to: "/recordings" });
    },
  });

  if (isLoading) return <div className="p-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!rec) return <div className="p-10">Gravação não encontrada.</div>;

  const busy = rec.status === "transcribing" || rec.status === "summarizing";
  const sbi = rec.suggested_sbi as { situation: string; behavior: string; impact: string } | null;
  const blocks = rec.suggested_blocks as Record<string, string> | null;
  const actionItems = (rec.action_items as { description: string; owner?: string; due_date?: string }[] | null) ?? [];
  const topics = (rec.key_topics as string[] | null) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/recordings" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{rec.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(rec.created_at).toLocaleString("pt-BR")}
            {rec.employees?.full_name ? ` · ${rec.employees.full_name}` : ""}
            {" · "}
            {rec.kind === "one_on_one" ? "Reunião 1:1" : rec.kind === "feedback" ? "Feedback SBI" : "Outro"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={rec.status === "ready" ? "default" : rec.status === "error" ? "destructive" : "secondary"}>
            {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            {rec.status}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => runPipeline.mutate()} disabled={busy || runPipeline.isPending}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reprocessar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir definitivamente?")) del.mutate(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {rec.error_message && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {rec.error_message}
        </div>
      )}

      {audioUrl && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <audio controls src={audioUrl} className="w-full" />
          </CardContent>
        </Card>
      )}

      {rec.sensitive_flags && Array.isArray(rec.sensitive_flags) && rec.sensitive_flags.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-medium">Dados sensíveis mascarados</p>
            <p className="text-xs text-muted-foreground">
              {rec.sensitive_flags.length} ocorrência(s) foram identificadas e substituídas na transcrição.
            </p>
          </div>
        </div>
      )}

      {rec.summary && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{rec.summary}</p>
            {topics.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tópicos-chave</p>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
                </div>
              </div>
            )}
            {actionItems.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Compromissos</p>
                <ul className="list-inside list-disc space-y-1">
                  {actionItems.map((a, i) => (
                    <li key={i}>
                      {a.description}
                      {a.owner ? ` — ${a.owner}` : ""}
                      {a.due_date ? ` (até ${a.due_date})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {rec.kind === "one_on_one" && blocks && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><MessagesSquare className="h-4 w-4" /> Blocos sugeridos da 1:1</span>
              <Button asChild size="sm" variant="outline">
                <Link
                  to="/meetings/new"
                  search={rec.employee_id ? { employeeId: rec.employee_id } : undefined}
                >
                  Abrir wizard de 1:1
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(["checkin", "agenda", "deliveries", "development", "agreements"] as const).map((k) => (
              <div key={k}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{labelBlock(k)}</p>
                <p className="whitespace-pre-wrap">{blocks[k] ?? "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {rec.kind === "feedback" && sbi && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Feedback estruturado (SBI)</span>
              <Button asChild size="sm" variant="outline">
                <Link
                  to="/feedback/new"
                  search={rec.employee_id ? { employeeId: rec.employee_id } : undefined}
                >
                  Registrar feedback
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Situação</p><p>{sbi.situation}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comportamento</p><p>{sbi.behavior}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Impacto</p><p>{sbi.impact}</p></div>
          </CardContent>
        </Card>
      )}

      {rec.transcript && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Transcrição</CardTitle></CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{rec.transcript}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function labelBlock(k: string) {
  return {
    checkin: "Check-in humano",
    agenda: "Pauta do liderado",
    deliveries: "Entregas & obstáculos",
    development: "Desenvolvimento & carreira",
    agreements: "Acordos & próximos passos",
  }[k] ?? k;
}
