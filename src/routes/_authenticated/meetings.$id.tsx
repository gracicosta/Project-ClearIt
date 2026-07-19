import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { exportMeetingPdf } from "@/lib/exports";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meetings/$id")({
  component: MeetingDetail,
});

const BLOCK_LABEL: Record<string, string> = {
  checkin: "1. Check-in humano",
  agenda: "2. Pauta do liderado",
  deliveries: "3. Entregas e obstáculos",
  development: "4. Desenvolvimento e carreira",
  agreements: "5. Acordos e próximos passos",
};

function MeetingDetail() {
  const { id } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["meeting", id],
    queryFn: async () => {
      const { data: meeting, error } = await supabase
        .from("meetings")
        .select("*, employee:employees(full_name, position), blocks:meeting_blocks(*), actions:action_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return meeting;
    },
  });

  if (!data) return <div className="p-10">Carregando…</div>;

  const blocks = [...(data.blocks ?? [])].sort((a: any, b: any) => a.order_index - b.order_index);
  const actions = data.actions ?? [];

  const handleExport = async () => {
    try {
      await exportMeetingPdf({
        employeeName: data.employee?.full_name ?? "",
        scheduledAt: data.scheduled_at,
        duration: data.duration_min,
        cadence: data.cadence_suggestion,
        blocks: blocks.map((b: any) => ({ kind: b.kind, label: BLOCK_LABEL[b.kind] ?? b.kind, content: b.content })),
        actions: actions.map((a: any) => ({ description: a.description, owner: a.owner, due_date: a.due_date, status: a.status })),
      });
    } catch (e: any) {
      toast.error(e.message ?? "Não foi possível exportar.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            1:1 com {data.employee?.full_name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {data.scheduled_at ? new Date(data.scheduled_at).toLocaleString("pt-BR") : "sem data"}
            {data.duration_min ? ` · ${data.duration_min}min` : ""}
            {data.cadence_suggestion ? ` · cadência ${data.cadence_suggestion}` : ""}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <div className="space-y-4">
        {blocks.map((b: any) => (
          <Card key={b.id}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{BLOCK_LABEL[b.kind] ?? b.kind}</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{b.content || <em className="text-muted-foreground">Vazio</em>}</p></CardContent>
          </Card>
        ))}

        {actions.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Acordos e próximos passos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {actions.map((a: any) => (
                <div key={a.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{a.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Responsável: {a.owner} · Prazo: {a.due_date ? new Date(a.due_date).toLocaleDateString("pt-BR") : "—"} · Status: {a.status}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
