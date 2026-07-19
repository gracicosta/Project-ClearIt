import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { scanSensitive, maskSensitive } from "@/lib/privacy";
import { generateOneOnOneAgenda, auditLgpd } from "@/lib/ai.functions";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/meetings/new")({
  validateSearch: (s: Record<string, unknown>) => ({
    employeeId: typeof s.employeeId === "string" ? s.employeeId : undefined,
  }),
  component: NewMeetingWizard,
});

const UNIVERSAL_QUESTIONS = [
  "Como você está?",
  "O que está fluindo bem desde a nossa última conversa?",
  "O que está te travando ou consumindo mais energia?",
  "Tem algo que eu, como gestor, poderia fazer diferente para te apoiar melhor?",
  "Como você está se sentindo em relação ao time e ao ambiente?",
  "O que você aprendeu recentemente que vale compartilhar?",
];
const DEVELOPMENT_QUESTIONS = [
  "Em qual competência você sente que mais evoluiu ultimamente?",
  "Onde você quer chegar nos próximos 6 meses?",
  "O que você precisaria para se sentir mais confiante no seu papel?",
  "Tem algum desafio que você gostaria de assumir e ainda não teve a chance?",
  "Como está o progresso dos acordos que fizemos na última reunião?",
];

type BlockKey = "checkin" | "agenda" | "deliveries" | "development" | "agreements";
const STEPS: { key: BlockKey; title: string; hint: string }[] = [
  { key: "checkin", title: "Check-in humano", hint: "Ouça antes de falar. Calibração de energia e bem-estar." },
  { key: "agenda", title: "Pauta do liderado", hint: "A agenda pertence ao liderado. O que ele quer trazer hoje?" },
  { key: "deliveries", title: "Entregas e obstáculos", hint: "Foco em desbloquear. Perguntas abertas, sem microgestão." },
  { key: "development", title: "Desenvolvimento & carreira", hint: "Competências, PDI e aspirações. Escolha ≥ 1 pergunta." },
  { key: "agreements", title: "Acordos e próximos passos", hint: "Pelo menos 1 acordo com responsável e prazo." },
];

type ActionForm = { description: string; owner: string; due_date: string };

function NewMeetingWizard() {
  const { user } = Route.useRouteContext();
  const { employeeId } = Route.useSearch();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>(employeeId);
  const [scheduledAt, setScheduledAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState(30);
  const [priorityNote, setPriorityNote] = useState("");
  const [blocks, setBlocks] = useState<Record<BlockKey, string>>({
    checkin: "", agenda: "", deliveries: "", development: "", agreements: "",
  });
  const [selectedDevQuestion, setSelectedDevQuestion] = useState<string>(DEVELOPMENT_QUESTIONS[0]);
  const [actions, setActions] = useState<ActionForm[]>([
    { description: "", owner: "employee", due_date: "" },
  ]);
  const [cadence, setCadence] = useState<"quinzenal" | "mensal">("quinzenal");
  const [hrSignal, setHrSignal] = useState<string>("none");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAgenda, setAiAgenda] = useState<null | {
    developmentQuestions: string[];
    warnings: string[];
  }>(null);

  const runAiAgenda = async () => {
    if (!selectedEmployee) {
      toast.error("Selecione o liderado antes de gerar a pauta.");
      return;
    }
    setAiLoading(true);
    try {
      const emp = employees?.find((e) => e.id === selectedEmployee);
      // Buscar acordos anteriores para dar contexto ao modelo
      const { data: prevActions } = await supabase
        .from("action_items")
        .select("description")
        .order("created_at", { ascending: false })
        .limit(5);
      const res = await generateOneOnOneAgenda({
        data: {
          managerName: user.email ?? "Gestor",
          employeeName: emp?.full_name ?? "Liderado",
          meetingContext: priorityNote,
          previousAgreements: (prevActions ?? []).map((a) => a.description).filter(Boolean),
          developmentFocus: "",
        },
      });
      const bySection = (key: string) => {
        const sec = res.sections.find((s) => s.key === (key as never));
        if (!sec) return "";
        return sec.questions.map((q) => `• ${q}`).join("\n");
      };
      setBlocks({
        checkin: bySection("human_checkin"),
        agenda: bySection("employee_agenda"),
        deliveries: bySection("deliveries"),
        development: bySection("development"),
        agreements: res.agreementGuidance.example || bySection("agreements"),
      });
      if (res.developmentQuestions[0]) setSelectedDevQuestion(res.developmentQuestions[0]);
      setAiAgenda({ developmentQuestions: res.developmentQuestions, warnings: res.warnings });
      toast.success("IA preencheu o roteiro dos 5 blocos.");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao gerar pauta com IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("id, full_name").eq("active", true).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const sensitive = useMemo(() => {
    const all = [
      ...scanSensitive(blocks.checkin, "check-in"),
      ...scanSensitive(blocks.agenda, "pauta"),
      ...scanSensitive(blocks.deliveries, "entregas"),
      ...scanSensitive(blocks.development, "desenvolvimento"),
      ...scanSensitive(blocks.agreements, "acordos"),
    ];
    return all;
  }, [blocks]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) throw new Error("Selecione o liderado");
      // Validate agreements block
      const validActions = actions.filter((a) => a.description.trim() && a.owner && a.due_date);
      if (validActions.length === 0) {
        throw new Error("Adicione pelo menos 1 acordo com responsável e prazo antes de finalizar.");
      }

      // Mask sensitive content before save
      const clean = Object.fromEntries(
        Object.entries(blocks).map(([k, v]) => [k, maskSensitive(v)]),
      ) as Record<BlockKey, string>;

      // F-05 · Auditor LGPD via IA
      const combinedText = Object.values(blocks).filter(Boolean).join("\n---\n");
      let aiFindings: Array<{ category: string; reason: string; snippet: string }> = [];
      let aiRisk: "none" | "low" | "medium" | "high" | "critical" = "none";
      try {
        const audit = await auditLgpd({ data: { text: combinedText, sourceType: "one_on_one" } });
        aiRisk = audit.riskLevel;
        aiFindings = audit.findings ?? [];
      } catch {
        // regex já cobre casos óbvios
      }

      const { data: meeting, error: mErr } = await supabase
        .from("meetings")
        .insert({
          manager_id: user.id,
          employee_id: selectedEmployee,
          type: "one_on_one",
          status: "completed",
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          completed_at: new Date().toISOString(),
          duration_min: duration,
          cadence_suggestion: cadence,
          hr_signal: hrSignal === "none" ? null : hrSignal,
        })
        .select()
        .single();
      if (mErr) throw mErr;

      const blockRows = STEPS.map((s, i) => ({
        meeting_id: meeting.id,
        kind: s.key,
        content: clean[s.key],
        order_index: i,
      }));
      const { error: bErr } = await supabase.from("meeting_blocks").insert(blockRows);
      if (bErr) throw bErr;

      const actionRows = validActions.map((a) => ({
        meeting_id: meeting.id,
        description: maskSensitive(a.description),
        owner: a.owner,
        due_date: a.due_date,
      }));
      const { error: aErr } = await supabase.from("action_items").insert(actionRows);
      if (aErr) throw aErr;

      // Log incidents (regex + IA quando risco >= medium)
      const shouldLogAi = aiRisk === "medium" || aiRisk === "high" || aiRisk === "critical";
      const incidents = [
        ...sensitive.map((s) => ({
          user_id: user.id,
          source_type: "meeting" as const,
          source_id: meeting.id,
          field: s.field,
          reason: s.reason,
          masked_snippet: s.snippet.slice(0, 40),
        })),
        ...(shouldLogAi
          ? aiFindings.slice(0, 20).map((f) => ({
              user_id: user.id,
              source_type: "meeting" as const,
              source_id: meeting.id,
              field: `ia:${f.category}`,
              reason: `IA (${aiRisk}): ${f.reason}`.slice(0, 200),
              masked_snippet: f.snippet.slice(0, 40),
            }))
          : []),
      ];
      if (incidents.length > 0) {
        await supabase.from("sensitive_incidents").insert(incidents);
      }
      if (shouldLogAi) {
        toast.warning(`Auditor LGPD sinalizou risco ${aiRisk}. Incidente registrado.`);
      }

      return meeting.id;
    },
    onSuccess: (id) => {
      toast.success(sensitive.length > 0 ? "1:1 registrada. Dados sensíveis mascarados." : "1:1 registrada.");
      navigate({ to: "/meetings/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar."),
  });

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const canProceed = () => {
    if (!selectedEmployee) return false;
    if (current.key === "agreements") {
      return actions.some((a) => a.description.trim() && a.due_date);
    }
    return blocks[current.key].trim().length > 0;
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Cancelar
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Nova reunião de 1:1</h1>
      <p className="mt-1 text-muted-foreground">Roteiro estruturado em 5 blocos.</p>

      <div className="mt-6 space-y-2">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s.key} className={i === step ? "font-medium text-foreground" : ""}>
              {i + 1}. {s.title}
              {i < STEPS.length - 1 ? " ›" : ""}
            </span>
          ))}
        </div>
      </div>

      {/* Setup block */}
      {step === 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Preparação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Liderado</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data / hora</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={15} max={120} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Existe algo que o liderado mencionou que deveria entrar na pauta?</Label>
              <Textarea rows={2} value={priorityNote} onChange={(e) => setPriorityNote(e.target.value)}
                placeholder="Anotações rápidas de preparo…" />
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" /> Copiloto IA
              </Label>
              <p className="text-xs text-muted-foreground">
                Gere um roteiro completo dos 5 blocos com base no contexto acima. Você pode editar tudo depois.
              </p>
              <Button size="sm" variant="outline" onClick={runAiAgenda} disabled={aiLoading || !selectedEmployee}>
                {aiLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…</>) : (<><Sparkles className="mr-2 h-4 w-4" /> Sugerir pauta com IA</>)}
              </Button>
              {aiAgenda?.warnings.length ? (
                <p className="text-xs text-warning">Avisos: {aiAgenda.warnings.join(" • ")}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>{step + 1}. {current.title}</span>
            <span className="text-xs font-normal text-muted-foreground">{current.hint}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {current.key === "checkin" && (
            <QuestionHints title="Perguntas obrigatórias — universais" items={UNIVERSAL_QUESTIONS} />
          )}
          {current.key === "development" && (
            <div className="space-y-2">
              <Label>Pergunta de desenvolvimento (≥ 1 por roteiro)</Label>
              <Select value={selectedDevQuestion} onValueChange={setSelectedDevQuestion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEVELOPMENT_QUESTIONS.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {current.key !== "agreements" ? (
            <div className="space-y-2">
              <Label>Anotações</Label>
              <Textarea
                rows={8}
                value={blocks[current.key]}
                onChange={(e) => setBlocks((p) => ({ ...p, [current.key]: e.target.value }))}
                placeholder="Registre os pontos discutidos…"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O sistema exige ao menos <strong>1 acordo</strong> com responsável e prazo.
              </p>
              {actions.map((a, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="grid gap-3">
                    <Textarea
                      rows={2}
                      placeholder="Descreva o acordo…"
                      value={a.description}
                      onChange={(e) => setActions((p) => p.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        value={a.owner}
                        onValueChange={(v) => setActions((p) => p.map((x, j) => (j === i ? { ...x, owner: v } : x)))}
                      >
                        <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Liderado</SelectItem>
                          <SelectItem value="manager">Gestor</SelectItem>
                          <SelectItem value="both">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={a.due_date}
                        onChange={(e) => setActions((p) => p.map((x, j) => (j === i ? { ...x, due_date: e.target.value } : x)))}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline" size="sm"
                onClick={() => setActions((p) => [...p, { description: "", owner: "employee", due_date: "" }])}
              >
                Adicionar acordo
              </Button>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="space-y-2">
                  <Label>Cadência sugerida</Label>
                  <Select value={cadence} onValueChange={(v) => setCadence(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sinal anônimo para RH (opcional)</Label>
                  <Select value={hrSignal} onValueChange={setHrSignal}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="risk_leave">Risco de saída</SelectItem>
                      <SelectItem value="overload">Sobrecarga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {sensitive.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="font-medium">Dados sensíveis detectados</p>
                <p className="text-xs text-muted-foreground">
                  Encontramos {sensitive.length} ocorrência(s) que serão mascaradas ao salvar (LGPD).
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" disabled={isFirst} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        {!isLast ? (
          <Button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
            Próximo <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={!canProceed() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Check className="mr-1 h-4 w-4" /> Finalizar e salvar
          </Button>
        )}
      </div>
    </div>
  );
}

function QuestionHints({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="ml-4 list-disc space-y-1 text-sm">
        {items.map((q) => <li key={q}>{q}</li>)}
      </ul>
    </div>
  );
}
