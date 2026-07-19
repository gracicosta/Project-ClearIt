import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowRight, Check, ShieldAlert, AlertTriangle, Sparkles, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { scanSensitive, maskSensitive, detectAttackLanguage } from "@/lib/privacy";
import { structureSbiFeedback, auditLgpd } from "@/lib/ai.functions";
import { z } from "zod";


export const Route = createFileRoute("/_authenticated/feedback/new")({
  validateSearch: (s: Record<string, unknown>) => ({
    employeeId: typeof s.employeeId === "string" ? s.employeeId : undefined,
  }),
  component: FeedbackWizard,
});

const STEPS = [
  { key: "context", title: "Contexto & Intenção", hint: "Foco em desenvolvimento, não punição." },
  { key: "listening", title: "Escuta ativa", hint: "Pergunte a perspectiva do liderado primeiro." },
  { key: "sbi", title: "Feedback SBI", hint: "Situação · Comportamento · Impacto." },
  { key: "agreement", title: "Acordo & próximos passos", hint: "Co-construa a solução." },
  { key: "self", title: "Feedback bilateral", hint: "Peça feedback sobre você também." },
] as const;

const feedbackSchema = z.object({
  situation: z.string().trim().min(10, "Descreva a situação"),
  behavior: z.string().trim().min(10, "Descreva o comportamento observado"),
  impact: z.string().trim().min(10, "Descreva o impacto"),
});

function FeedbackWizard() {
  const { user } = Route.useRouteContext();
  const { employeeId } = Route.useSearch();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>(employeeId);
  const [context, setContext] = useState("");
  const [listening, setListening] = useState("");
  const [situation, setSituation] = useState("");
  const [behavior, setBehavior] = useState("");
  const [impact, setImpact] = useState("");
  const [agreement, setAgreement] = useState("");
  const [selfFeedback, setSelfFeedback] = useState("");
  const [rawFeedback, setRawFeedback] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<null | { rewritten: string; listeningQuestion: string; nextStep: string; warnings: string[] }>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runAiStructure = async () => {
    if (rawFeedback.trim().length < 10) {
      toast.error("Escreva um relato mais detalhado antes de estruturar com IA.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await structureSbiFeedback({ data: { rawFeedback, feedbackType: "corrective" } });
      setSituation(res.situation);
      setBehavior(res.behavior);
      setImpact(res.impact);
      setAiSuggestion({
        rewritten: res.rewrittenFeedback,
        listeningQuestion: res.activeListeningQuestion,
        nextStep: res.suggestedNextStep,
        warnings: res.languageWarnings,
      });
      toast.success("IA estruturou o feedback em SBI.");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao consultar a IA.");
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

  const sensitive = useMemo(() => [
    ...scanSensitive(context, "contexto"),
    ...scanSensitive(listening, "escuta"),
    ...scanSensitive(situation, "situação"),
    ...scanSensitive(behavior, "comportamento"),
    ...scanSensitive(impact, "impacto"),
    ...scanSensitive(agreement, "acordo"),
    ...scanSensitive(selfFeedback, "feedback bilateral"),
  ], [context, listening, situation, behavior, impact, agreement, selfFeedback]);

  const attackFlags = useMemo(() => {
    const all = [behavior, impact, agreement].flatMap((t) => detectAttackLanguage(t));
    return Array.from(new Set(all));
  }, [behavior, impact, agreement]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) throw new Error("Selecione o liderado");
      const parsed = feedbackSchema.safeParse({ situation, behavior, impact });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      // F-05 · Auditoria LGPD via IA antes de persistir
      const combinedText = [context, listening, situation, behavior, impact, agreement, selfFeedback]
        .filter(Boolean)
        .join("\n---\n");
      let aiFindings: Array<{ category: string; reason: string; snippet: string }> = [];
      let aiRisk: "none" | "low" | "medium" | "high" | "critical" = "none";
      try {
        const audit = await auditLgpd({ data: { text: combinedText, sourceType: "feedback" } });
        aiRisk = audit.riskLevel;
        aiFindings = audit.findings ?? [];
      } catch {
        // fallback silencioso: regex já cobre casos óbvios
      }

      const { data: fb, error } = await supabase.from("feedbacks").insert({
        manager_id: user.id,
        employee_id: selectedEmployee,
        context: maskSensitive(context),
        listening_notes: maskSensitive(listening),
        situation: maskSensitive(situation),
        behavior: maskSensitive(behavior),
        impact: maskSensitive(impact),
        agreement: maskSensitive(agreement),
        self_feedback: maskSensitive(selfFeedback),
        tone_flags: attackFlags,
      }).select().single();
      if (error) throw error;

      const shouldLogAi = aiRisk === "medium" || aiRisk === "high" || aiRisk === "critical";
      const incidents = [
        ...sensitive.map((s) => ({
          user_id: user.id,
          source_type: "feedback" as const,
          source_id: fb.id,
          field: s.field,
          reason: s.reason,
          masked_snippet: s.snippet.slice(0, 40),
        })),
        ...(shouldLogAi
          ? aiFindings.slice(0, 20).map((f) => ({
              user_id: user.id,
              source_type: "feedback" as const,
              source_id: fb.id,
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
      return fb.id;
    },
    onSuccess: () => {
      toast.success("Feedback registrado.");
      navigate({ to: "/team/$employeeId", params: { employeeId: selectedEmployee! } });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar."),
  });

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const canProceed = () => {
    if (!selectedEmployee) return false;
    if (current.key === "sbi") return situation.trim().length > 5 && behavior.trim().length > 5 && impact.trim().length > 5;
    if (current.key === "listening") return listening.trim().length > 5;
    if (current.key === "context") return context.trim().length > 5;
    if (current.key === "agreement") return agreement.trim().length > 5;
    if (current.key === "self") return selfFeedback.trim().length > 3;
    return true;
  };

  const hasContent =
    !!context || !!listening || !!situation || !!behavior || !!impact || !!agreement || !!selfFeedback || !!rawFeedback;

  const handleCancel = () => {
    navigate({ to: "/dashboard" });
  };

  const CancelButton = ({ variant = "ghost", className = "" }: { variant?: "ghost" | "outline"; className?: string }) =>
    hasContent ? (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant={variant} className={className}>
            <X className="mr-1 h-4 w-4" /> Cancelar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar este feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              As informações preenchidas serão perdidas. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : (
      <Button type="button" variant={variant} className={className} onClick={handleCancel}>
        <X className="mr-1 h-4 w-4" /> Cancelar
      </Button>
    );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })} className="gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Button>
        <CancelButton variant="outline" />
      </div>

      <h1 className="font-display text-3xl font-semibold tracking-tight">Novo feedback (modelo SBI)</h1>
      <p className="mt-1 text-muted-foreground">Roteiro guiado com escuta ativa e humanização.</p>

      <div className="mt-6">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s.key} className={i === step ? "font-medium text-foreground" : ""}>
              {i + 1}. {s.title}{i < STEPS.length - 1 ? " ›" : ""}
            </span>
          ))}
        </div>
      </div>

      {step === 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Liderado</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {employees?.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
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
          {current.key === "context" && (
            <div className="space-y-2">
              <Label>Contexto e intenção deste feedback</Label>
              <Textarea rows={5} value={context} onChange={(e) => setContext(e.target.value)}
                placeholder="Ex.: 'Quero conversar sobre o projeto X porque acredito no seu potencial e vejo espaço de crescimento…'" />
            </div>
          )}
          {current.key === "listening" && (
            <>
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                Antes de emitir sua opinião, pergunte: <em>"Como você está vendo essa situação?"</em>
              </div>
              <Textarea rows={5} value={listening} onChange={(e) => setListening(e.target.value)}
                placeholder="Anote a perspectiva do liderado…" />
            </>
          )}
          {current.key === "sbi" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" /> Copiloto IA — estruture em SBI
                </Label>
                <Textarea
                  rows={3}
                  value={rawFeedback}
                  onChange={(e) => setRawFeedback(e.target.value)}
                  placeholder="Descreva o que aconteceu com suas palavras. A IA vai reestruturar em Situação/Comportamento/Impacto e sugerir uma reescrita humanizada."
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runAiStructure}
                  disabled={aiLoading || rawFeedback.trim().length < 10}
                >
                  {aiLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Estruturando…</>) : (<><Sparkles className="mr-2 h-4 w-4" /> Estruturar com IA</>)}
                </Button>
                {aiSuggestion && (
                  <div className="mt-2 space-y-1 rounded-md border border-border bg-background/60 p-3 text-xs">
                    <p><strong>Reescrita sugerida:</strong> {aiSuggestion.rewritten}</p>
                    <p><strong>Escuta ativa:</strong> {aiSuggestion.listeningQuestion}</p>
                    {aiSuggestion.nextStep && <p><strong>Próximo passo:</strong> {aiSuggestion.nextStep}</p>}
                    {aiSuggestion.warnings.length > 0 && (
                      <p className="text-destructive">Alertas de linguagem: {aiSuggestion.warnings.join(", ")}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>S — Situação (onde/quando)</Label>
                <Textarea rows={3} value={situation} onChange={(e) => setSituation(e.target.value)}
                  placeholder="Ex.: Na reunião com o cliente na quinta passada…" />
              </div>
              <div className="space-y-2">
                <Label>B — Comportamento (fato observado)</Label>
                <Textarea rows={3} value={behavior} onChange={(e) => setBehavior(e.target.value)}
                  placeholder="Ex.: Você interrompeu o cliente três vezes ao apresentar a proposta." />
              </div>
              <div className="space-y-2">
                <Label>I — Impacto (efeito gerado)</Label>
                <Textarea rows={3} value={impact} onChange={(e) => setImpact(e.target.value)}
                  placeholder="Ex.: O cliente relatou depois que não sentiu espaço para tirar dúvidas." />
              </div>
              {attackFlags.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Linguagem que ataca o caráter detectada</p>
                    <p className="text-xs text-muted-foreground">
                      Trechos como {attackFlags.map((f) => `"${f}"`).join(", ")} fecham o diálogo. Reformule em torno de fato + impacto.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {current.key === "agreement" && (
            <div className="space-y-2">
              <Label>Acordo co-construído</Label>
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                Sugira: <em>"O que você acha que faz sentido mudar? Como posso te apoiar nessa mudança?"</em>
              </div>
              <Textarea rows={5} value={agreement} onChange={(e) => setAgreement(e.target.value)}
                placeholder="Registre o combinado com prazo e critério de sucesso…" />
            </div>
          )}
          {current.key === "self" && (
            <div className="space-y-2">
              <Label>Feedback bilateral (sobre você, gestor)</Label>
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                Pergunte: <em>"Como eu poderia te apoiar melhor?"</em>
              </div>
              <Textarea rows={5} value={selfFeedback} onChange={(e) => setSelfFeedback(e.target.value)}
                placeholder="Anote o que o liderado trouxe sobre sua gestão…" />
            </div>
          )}

          {sensitive.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="font-medium">Dados sensíveis detectados</p>
                <p className="text-xs text-muted-foreground">{sensitive.length} ocorrência(s) serão mascaradas ao salvar.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          <CancelButton />
        </div>

        {!isLast ? (
          <Button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
            Próximo <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={!canProceed() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Check className="mr-1 h-4 w-4" /> Registrar feedback
          </Button>
        )}
      </div>
    </div>
  );
}
