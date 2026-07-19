import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, MessagesSquare, ClipboardList, Target, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PdiObjectivePanel } from "@/components/pdi/pdi-objective-panel";

export const Route = createFileRoute("/_authenticated/team/$employeeId")({
  component: EmployeeDetail,
});

function EmployeeDetail() {
  const { employeeId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: meetings } = useQuery({
    queryKey: ["employee-meetings", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("employee_id", employeeId)
        .order("scheduled_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: feedbacks } = useQuery({
    queryKey: ["employee-feedbacks", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("employees").delete().eq("id", employeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      navigate({ to: "/team" });
    },
  });

  if (isLoading) return <div className="p-10 text-muted-foreground">Carregando…</div>;
  if (!employee) return <div className="p-10">Liderado não encontrado.</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/team" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{employee.full_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {employee.position ?? "—"}{employee.level ? ` · ${employee.level}` : ""} · Cadência {employee.cadence_days} dias
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/meetings/new" search={{ employeeId } as any}>
              <MessagesSquare className="mr-2 h-4 w-4" /> Nova 1:1
            </Link>
          </Button>
          <Button asChild>
            <Link to="/feedback/new" search={{ employeeId } as any}>
              <ClipboardList className="mr-2 h-4 w-4" /> Feedback SBI
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="meetings">
        <TabsList>
          <TabsTrigger value="meetings">Histórico 1:1</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="pdi">PDI</TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="mt-6 space-y-3">
          {meetings && meetings.length > 0 ? (
            meetings.map((m) => (
              <Link key={m.id} to="/meetings/$id" params={{ id: m.id }}>
                <Card className="transition-all hover:shadow-soft">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">
                        {m.type === "feedback" ? "Feedback SBI" : "Reunião 1:1"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.scheduled_at
                          ? formatDistanceToNow(new Date(m.scheduled_at), { addSuffix: true, locale: ptBR })
                          : m.created_at
                          ? `criado ${formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize">
                      {m.status}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-muted-foreground">Nenhuma reunião registrada ainda.</p>
          )}
        </TabsContent>

        <TabsContent value="feedbacks" className="mt-6 space-y-3">
          {feedbacks && feedbacks.length > 0 ? (
            feedbacks.map((f) => (
              <Card key={f.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Feedback · {formatDistanceToNow(new Date(f.created_at), { addSuffix: true, locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Situação:</strong> {f.situation}</p>
                  <p><strong>Comportamento:</strong> {f.behavior}</p>
                  <p><strong>Impacto:</strong> {f.impact}</p>
                  {f.agreement && <p><strong>Acordo:</strong> {f.agreement}</p>}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">Nenhum feedback registrado.</p>
          )}
        </TabsContent>

        <TabsContent value="pdi" className="mt-6">
          <PdiObjectivePanel employeeId={employeeId} />
        </TabsContent>
      </Tabs>

      <div className="mt-12 border-t border-border pt-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => {
            if (confirm("Remover este liderado? Todo o histórico será apagado.")) deleteMutation.mutate();
          }}
        >
          Remover liderado
        </Button>
      </div>
    </div>
  );
}
