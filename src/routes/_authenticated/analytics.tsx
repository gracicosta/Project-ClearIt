import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportMeetingsCsv } from "@/lib/exports";
import { Download, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", (context as any).user.id).eq("role", "hr").maybeSingle();
    if (error || !data) throw redirect({ to: "/dashboard" });
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: meetingsStats } = useQuery({
    queryKey: ["analytics-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("id, manager_id, employee_id, status, completed_at, scheduled_at, cadence_suggestion");
      if (error) throw error;
      return data;
    },
  });

  const { data: employeesAll } = useQuery({
    queryKey: ["analytics-employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("id, manager_id, full_name, active");
      if (error) throw error;
      return data;
    },
  });

  const { data: managersAll } = useQuery({
    queryKey: ["analytics-managers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const total = meetingsStats?.length ?? 0;
  const completed = meetingsStats?.filter((m) => m.status === "completed").length ?? 0;
  const activeEmployees = employeesAll?.filter((e) => e.active).length ?? 0;

  // Stale (no 1:1 in 30d)
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const lastByEmployee = new Map<string, Date>();
  meetingsStats?.forEach((m) => {
    if (m.completed_at) {
      const cur = lastByEmployee.get(m.employee_id);
      const d = new Date(m.completed_at);
      if (!cur || d > cur) lastByEmployee.set(m.employee_id, d);
    }
  });
  const stale = (employeesAll ?? []).filter((e) => {
    if (!e.active) return false;
    const last = lastByEmployee.get(e.id);
    return !last || last < cutoff;
  });

  // Ranking by manager
  const managerCounts = new Map<string, number>();
  meetingsStats?.forEach((m) => {
    if (m.status === "completed") managerCounts.set(m.manager_id, (managerCounts.get(m.manager_id) ?? 0) + 1);
  });
  const rankingData = Array.from(managerCounts.entries())
    .map(([id, count]) => ({
      name: managersAll?.find((p) => p.id === id)?.full_name?.split(" ")[0] ?? "—",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const handleExport = () => {
    exportMeetingsCsv(
      (meetingsStats ?? []).map((m) => ({
        id: m.id,
        gestor_id: m.manager_id,
        liderado_id: m.employee_id,
        status: m.status,
        agendada_em: m.scheduled_at,
        concluida_em: m.completed_at,
        cadencia: m.cadence_suggestion,
      })),
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Analytics do RH</h1>
          <p className="mt-1 text-muted-foreground">Métricas agregadas de cadência e adesão.</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Stat label="Reuniões totais" value={total} />
        <Stat label="Concluídas" value={completed} />
        <Stat label="Liderados ativos" value={activeEmployees} />
        <Stat label="Sem 1:1 há 30+ dias" value={stale.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" /> Ranking de cadência (top 10 gestores)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {rankingData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={rankingData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="oklch(0.55 0.15 232)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground">Ainda sem dados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
