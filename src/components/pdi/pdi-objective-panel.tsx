import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Target, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { suggestPdiObjectives } from "@/lib/ai.functions";
import { z } from "zod";

const pdiSchema = z.object({
  competency_id: z.string().uuid("Selecione uma competência"),
  goal_description: z.string().trim().min(10, "Descreva o objetivo (mín. 10 caracteres)").max(500),
  actions: z.array(z.string().trim().min(3)).min(1, "Pelo menos 1 ação").max(3, "Máximo 3 ações"),
  deadline: z.string().min(1, "Prazo obrigatório"),
  verification_marker: z.string().trim().min(5, "Descreva o marco de verificação").max(300),
  manager_support: z.string().trim().min(5, "Descreva o suporte do gestor").max(300),
});

export function PdiObjectivePanel({ employeeId }: { employeeId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState<string[]>([""]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    competency: string; objective: string; actions: string[]; verificationMilestone: string; managerSupport: string; dueDateSuggestion: string;
  }>>([]);

  const runAiSuggest = async () => {
    setAiLoading(true);
    try {
      const { data: emp } = await supabase
        .from("employees")
        .select("full_name")
        .eq("id", employeeId)
        .maybeSingle();
      const res = await suggestPdiObjectives({
        data: {
          employeeName: emp?.full_name ?? "Liderado",
          employeeLevel: "L1",
          targetCompetencies: [],
          developmentContext: "",
        },
      });
      setAiSuggestions(res.objectives);
      toast.success(`IA sugeriu ${res.objectives.length} objetivo(s). Clique para aplicar.`);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao consultar IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (s: (typeof aiSuggestions)[number]) => {
    // Try to map competency name to competency_id
    const match = competencies?.find((c: any) => c.name.toLowerCase() === s.competency.toLowerCase());
    setActions(s.actions.length ? s.actions.slice(0, 3) : [""]);
    setOpen(true);
    // Populate form via DOM after dialog opens
    setTimeout(() => {
      const form = document.querySelector<HTMLFormElement>("form");
      if (!form) return;
      const goal = form.querySelector<HTMLTextAreaElement>('[name="goal_description"]');
      const verif = form.querySelector<HTMLTextAreaElement>('[name="verification_marker"]');
      const support = form.querySelector<HTMLTextAreaElement>('[name="manager_support"]');
      if (goal) goal.value = s.objective;
      if (verif) verif.value = s.verificationMilestone;
      if (support) support.value = s.managerSupport;
      if (match) {
        // Shadcn Select is uncontrolled here; hint the user
        toast.info(`Competência sugerida: ${match.name}`);
      }
    }, 200);
  };

  const { data: competencies } = useQuery({
    queryKey: ["competencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competencies").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: pdis } = useQuery({
    queryKey: ["pdis", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_objectives")
        .select("*, competency:competencies(name, category)")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activeCount = pdis?.filter((p) => p.status === "active").length ?? 0;

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof pdiSchema>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sem sessão");
      const { error } = await supabase.from("pdi_objectives").insert({
        manager_id: userData.user.id,
        employee_id: employeeId,
        competency_id: values.competency_id,
        goal_description: values.goal_description,
        actions: values.actions,
        deadline: values.deadline,
        verification_marker: values.verification_marker,
        manager_support: values.manager_support,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdis", employeeId] });
      toast.success("Objetivo PDI criado.");
      setOpen(false);
      setActions([""]);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar PDI."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pdi_objectives").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdis", employeeId] }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pdi_objectives").update({ status: "completed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdis", employeeId] });
      toast.success("PDI concluído.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (activeCount >= 3) {
      return toast.error("Máximo de 3 PDIs ativos por liderado. Conclua ou pause um antes.");
    }
    const f = new FormData(e.currentTarget);
    const cleanActions = actions.map((a) => a.trim()).filter(Boolean);
    const parsed = pdiSchema.safeParse({
      competency_id: f.get("competency_id"),
      goal_description: f.get("goal_description"),
      actions: cleanActions,
      deadline: f.get("deadline"),
      verification_marker: f.get("verification_marker"),
      manager_support: f.get("manager_support"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    createMutation.mutate(parsed.data);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeCount}/3 objetivos ativos {activeCount >= 3 && "· limite atingido"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runAiSuggest} disabled={aiLoading || activeCount >= 3}>
            {aiLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> IA…</>) : (<><Sparkles className="mr-2 h-4 w-4" /> Sugerir com IA</>)}
          </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={activeCount >= 3}>
              <Plus className="mr-2 h-4 w-4" /> Novo objetivo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo objetivo de PDI</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="competency_id">Competência (Framework de Levels)</Label>
                <Select name="competency_id">
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {competencies?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} · {c.category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal_description">Objetivo de desenvolvimento</Label>
                <Textarea
                  id="goal_description" name="goal_description" rows={3} required
                  placeholder="Ex.: Ampliar raio de impacto em Comunicação com Stakeholders, de impacto no time para impacto no cliente."
                />
              </div>
              <div className="space-y-2">
                <Label>Ações concretas (1 a 3)</Label>
                {actions.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={a}
                      onChange={(e) => setActions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`Ação ${i + 1}`}
                    />
                    {actions.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setActions((p) => p.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {actions.length < 3 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setActions((p) => [...p, ""])}>
                    <Plus className="mr-1 h-3 w-3" /> Adicionar ação
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo</Label>
                  <Input id="deadline" name="deadline" type="date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification_marker">Marco de verificação</Label>
                <Textarea
                  id="verification_marker" name="verification_marker" rows={2} required
                  placeholder="Ex.: Apresentação de status do projeto X para o cliente na próxima 1:1."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_support">Suporte do gestor</Label>
                <Textarea
                  id="manager_support" name="manager_support" rows={2} required
                  placeholder="Ex.: Vou reservar 30min semanais para review + garantir acesso à reunião do cliente."
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>Criar objetivo</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {aiSuggestions.length > 0 && (
        <div className="mb-4 space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" /> Sugestões da IA
          </p>
          {aiSuggestions.map((s, i) => (
            <div key={i} className="rounded-md border border-border bg-background/60 p-3 text-sm">
              <p className="font-medium">{s.competency}</p>
              <p className="text-muted-foreground">{s.objective}</p>
              <p className="text-xs text-muted-foreground">Prazo sugerido: {s.dueDateSuggestion}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => applySuggestion(s)}>
                Usar esta sugestão
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {pdis && pdis.length > 0 ? (
          pdis.map((p: any) => (
            <Card key={p.id} className={p.status !== "active" ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    {p.competency?.name ?? "—"}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize">
                    {p.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{p.goal_description}</p>
                {Array.isArray(p.actions) && p.actions.length > 0 && (
                  <ul className="ml-4 list-disc text-muted-foreground">
                    {p.actions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                  </ul>
                )}
                <div className="grid gap-2 pt-2 text-xs text-muted-foreground md:grid-cols-3">
                  <p><strong>Prazo:</strong> {new Date(p.deadline).toLocaleDateString("pt-BR")}</p>
                  <p className="md:col-span-2"><strong>Marco:</strong> {p.verification_marker}</p>
                  <p className="md:col-span-3"><strong>Suporte do gestor:</strong> {p.manager_support}</p>
                </div>
                {p.status === "active" && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => completeMutation.mutate(p.id)}>
                      Marcar como concluído
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Excluir este objetivo?")) deleteMutation.mutate(p.id); }}>
                      Excluir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground">Nenhum objetivo definido.</p>
        )}
      </div>
    </div>
  );
}
