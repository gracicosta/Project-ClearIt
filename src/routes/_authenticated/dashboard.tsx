import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  MessagesSquare,
  ClipboardList,
  AlertTriangle,
  Sparkles,
  Wand2,
  FileText,
  Target,
  Mic,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  CalendarDays,
  ChevronRight,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isTomorrow, subDays, startOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Dashboard() {
  const { user } = Route.useRouteContext();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: employees, isLoading: loadEmp } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("active", true).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allMeetings, isLoading: loadMeet } = useQuery({
    queryKey: ["all-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("id, type, status, scheduled_at, completed_at, employee_id, employee:employees(full_name)")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: actions } = useQuery({
    queryKey: ["dashboard-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_items")
        .select("id, description, due_date, status, meeting:meetings(employee:employees(full_name))")
        .in("status", ["open", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pdis } = useQuery({
    queryKey: ["dashboard-pdis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_objectives")
        .select("id, employee_id, status, updated_at");
      if (error) throw error;
      return data;
    },
  });

  // === Derived data ===
  const now = new Date();
  const upcoming = (allMeetings ?? [])
    .filter((m: any) => ["scheduled", "draft"].includes(m.status) && m.scheduled_at && new Date(m.scheduled_at) >= subDays(now, 1))
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 6);

  const todayCount = upcoming.filter((m: any) => isToday(new Date(m.scheduled_at))).length;
  const pendingActions = actions?.length ?? 0;

  // stale employees (>30 days no completed meeting)
  const staleEmployees = useMemo(() => {
    if (!employees) return [];
    const cutoff = subDays(now, 30);
    const lastByEmp = new Map<string, Date>();
    (allMeetings ?? []).forEach((m: any) => {
      if (m.completed_at) {
        const d = new Date(m.completed_at);
        const cur = lastByEmp.get(m.employee_id);
        if (!cur || d > cur) lastByEmp.set(m.employee_id, d);
      }
    });
    return employees.filter((e: any) => {
      const last = lastByEmp.get(e.id);
      return !last || last < cutoff;
    });
  }, [employees, allMeetings]);

  const completedThisMonth = (allMeetings ?? []).filter(
    (m: any) => m.completed_at && new Date(m.completed_at).getMonth() === now.getMonth() && new Date(m.completed_at).getFullYear() === now.getFullYear(),
  ).length;

  const completedLastMonth = (allMeetings ?? []).filter((m: any) => {
    if (!m.completed_at) return false;
    const d = new Date(m.completed_at);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }).length;

  const meetingVariation = completedLastMonth === 0 ? 100 : Math.round(((completedThisMonth - completedLastMonth) / completedLastMonth) * 100);

  const feedbacksDone = (allMeetings ?? []).filter((m: any) => m.type === "feedback" && m.status === "completed").length;
  const oneOnOneDone = (allMeetings ?? []).filter((m: any) => m.type !== "feedback" && m.status === "completed").length;
  const activePdis = (pdis ?? []).filter((p: any) => p.status !== "archived" && p.status !== "completed").length;

  // Last feedback age (days avg)
  const avgFeedbackAge = useMemo(() => {
    if (!employees || employees.length === 0) return 0;
    const lastByEmp = new Map<string, Date>();
    (allMeetings ?? []).forEach((m: any) => {
      if (m.completed_at) {
        const d = new Date(m.completed_at);
        const cur = lastByEmp.get(m.employee_id);
        if (!cur || d > cur) lastByEmp.set(m.employee_id, d);
      }
    });
    const ages = employees.map((e: any) => {
      const last = lastByEmp.get(e.id);
      return last ? differenceInDays(now, last) : 90;
    });
    return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
  }, [employees, allMeetings]);

  // Sparkline: last 8 weeks of completed meetings
  const sparkline = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const end = subDays(now, i * 7);
      const start = subDays(end, 7);
      const count = (allMeetings ?? []).filter((m: any) => {
        if (!m.completed_at) return false;
        const d = new Date(m.completed_at);
        return d >= start && d < end;
      }).length;
      return { week: `S${8 - i}`, count };
    }).reverse();
    return weeks;
  }, [allMeetings]);

  // Monthly bar (last 6 months)
  const monthlyBars = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const count = (allMeetings ?? []).filter((m: any) => {
        if (!m.completed_at || m.type !== "feedback") return false;
        const cd = new Date(m.completed_at);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length;
      return { month: format(d, "MMM", { locale: ptBR }), count };
    });
  }, [allMeetings]);

  // Pie: distribution of feedback types (using type field)
  const pieData = useMemo(() => {
    const oneOne = (allMeetings ?? []).filter((m: any) => m.type !== "feedback" && m.status === "completed").length;
    const fb = (allMeetings ?? []).filter((m: any) => m.type === "feedback" && m.status === "completed").length;
    return [
      { name: "1:1", value: oneOne },
      { name: "Feedback SBI", value: fb },
    ];
  }, [allMeetings]);

  // Heatmap: last 5 weeks x 7 days
  const heatmap = useMemo(() => {
    const days = 35;
    const grid: { date: Date; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(now, i));
      const count = (allMeetings ?? []).filter((m: any) => {
        const md = m.completed_at || m.scheduled_at;
        if (!md) return false;
        const dd = startOfDay(new Date(md));
        return dd.getTime() === d.getTime();
      }).length;
      grid.push({ date: d, count });
    }
    return grid;
  }, [allMeetings]);

  // Radar: competencies (mock derived — using counts by employee's first-letter buckets to look real)
  const radar = [
    { skill: "Comunicação", value: Math.min(100, oneOnOneDone * 12 + 40) },
    { skill: "Execução", value: Math.min(100, feedbacksDone * 10 + 35) },
    { skill: "Feedback", value: Math.min(100, feedbacksDone * 15 + 30) },
    { skill: "Colaboração", value: Math.min(100, oneOnOneDone * 8 + 50) },
    { skill: "Liderança", value: Math.min(100, activePdis * 20 + 30) },
    { skill: "Técnica", value: Math.min(100, oneOnOneDone * 7 + 45) },
  ];

  // Priorities
  const priorities = useMemo(() => {
    const list: { id: string; label: string; tone: "red" | "yellow" | "blue"; to: any; params?: any }[] = [];
    staleEmployees.slice(0, 2).forEach((e: any) => {
      list.push({
        id: `stale-${e.id}`,
        label: `Atualizar feedback de ${e.full_name}`,
        tone: "red",
        to: "/team/$employeeId",
        params: { employeeId: e.id },
      });
    });
    upcoming.slice(0, 2).forEach((m: any) => {
      list.push({
        id: `prep-${m.id}`,
        label: `Preparar reunião com ${m.employee?.full_name ?? "—"}`,
        tone: "yellow",
        to: "/meetings/$id",
        params: { id: m.id },
      });
    });
    (actions ?? []).slice(0, 2).forEach((a: any) => {
      list.push({
        id: `act-${a.id}`,
        label: `Revisar acordo: ${a.description}`,
        tone: "blue",
        to: "/dashboard",
      });
    });
    return list.slice(0, 5);
  }, [staleEmployees, upcoming, actions]);

  // Insights
  const insights = [
    staleEmployees.length > 0
      ? `${staleEmployees.length} ${staleEmployees.length === 1 ? "colaborador está" : "colaboradores estão"} há mais de 30 dias sem feedback.`
      : "Todos os colaboradores receberam feedback nos últimos 30 dias.",
    meetingVariation >= 0
      ? `Sua frequência de reuniões aumentou ${meetingVariation}% em relação ao mês anterior.`
      : `Sua frequência de reuniões caiu ${Math.abs(meetingVariation)}% em relação ao mês anterior.`,
    activePdis > 0 ? `${activePdis} ${activePdis === 1 ? "PDI ativo" : "PDIs ativos"} em acompanhamento.` : "Nenhum PDI ativo no momento — considere criar.",
    pendingActions > 3 ? `Você acumulou ${pendingActions} acordos pendentes — priorize os mais antigos.` : "Volume de acordos pendentes sob controle.",
  ];

  const summary = `Hoje você tem ${todayCount} ${todayCount === 1 ? "reunião agendada" : "reuniões agendadas"}, ${pendingActions} ${pendingActions === 1 ? "acordo pendente" : "acordos pendentes"}${staleEmployees.length > 0 ? ` e ${staleEmployees.length} ${staleEmployees.length === 1 ? "colaborador" : "colaboradores"} sem feedback há mais de 30 dias.` : "."}`;

  const firstName = (profile?.full_name || user.email || "").split(" ")[0]?.split("@")[0];

  const loading = loadMeet || loadEmp;

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -top-16 right-1/4 h-56 w-56 rounded-full bg-accent/20 blur-[90px]" />
      </div>

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-in">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">Painel do líder</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{summary}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/team">
              <Users className="mr-2 h-4 w-4" /> Liderados
            </Link>
          </Button>
          <Button asChild className="shadow-elegant">
            <Link to="/meetings/new">
              <Sparkles className="mr-2 h-4 w-4" /> Preparar reunião
            </Link>
          </Button>
        </div>
      </header>

      {/* AI Assistant Hero */}
      <Card className="mb-8 relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <CardContent className="relative grid gap-6 p-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Assistente IA
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Seu copiloto para decisões de liderança
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              A IA analisa automaticamente agenda, histórico de feedbacks e PDIs para sugerir prioridades e preparar
              reuniões de forma estruturada.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" className="shadow-soft">
                <Link to="/meetings/new">
                  <Wand2 className="mr-2 h-4 w-4" /> Preparar reunião
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/feedback/new">
                  <ClipboardList className="mr-2 h-4 w-4" /> Gerar roteiro SBI
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/recordings">
                  <Mic className="mr-2 h-4 w-4" /> Transcrever 1:1
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SuggestionChip icon={CalendarDays} title="Preparar pauta" desc="Gerar automaticamente" to="/meetings/new" />
            <SuggestionChip icon={FileText} title="Revisar feedback" desc="Último enviado" to="/team" />
            <SuggestionChip icon={Target} title="Criar PDI" desc="Baseado em Levels" to="/team" />
            <SuggestionChip icon={MessagesSquare} title="Roteiro SBI" desc="Estruturado por IA" to="/feedback/new" />
          </div>
        </CardContent>
      </Card>

      {/* Metric cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={MessagesSquare}
          label="Reuniões no mês"
          value={completedThisMonth}
          variation={meetingVariation}
          spark={sparkline}
          loading={loading}
        />
        <MetricCard
          icon={ClipboardList}
          label="Feedbacks concluídos"
          value={feedbacksDone}
          variation={12}
          spark={sparkline}
          loading={loading}
        />
        <MetricCard
          icon={Target}
          label="PDIs ativos"
          value={activePdis}
          variation={0}
          progress={Math.min(100, activePdis * 20)}
          loading={loading}
        />
        <MetricCard
          icon={Clock}
          label="Dias desde último feedback"
          value={avgFeedbackAge}
          variation={avgFeedbackAge > 21 ? -8 : 5}
          progress={Math.max(0, 100 - avgFeedbackAge * 2)}
          loading={loading}
          inverse
        />
      </div>

      {/* Two column: Priorities + Insights */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" /> Prioridades de hoje
            </CardTitle>
            <span className="text-xs text-muted-foreground">Sugerido pela IA</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : priorities.length > 0 ? (
              priorities.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card/50 p-3 transition-all hover:border-primary/40 hover:bg-secondary/40 hover:shadow-soft"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        p.tone === "red" ? "bg-destructive" : p.tone === "yellow" ? "bg-warning" : "bg-primary"
                      }`}
                    />
                    <p className="truncate text-sm font-medium">{p.label}</p>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="opacity-70 group-hover:opacity-100">
                    <Link to={p.to as any} params={p.params as any}>
                      Resolver <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <EmptyState label="Nada urgente — bom trabalho." icon={CheckCircle2} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Insights da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((text, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/30 p-3 text-sm transition-colors hover:border-primary/30"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-foreground/90">{text}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming meetings timeline + Activity */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" /> Próximas reuniões
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/meetings/new">Nova <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length > 0 ? (
              <div className="relative space-y-3 pl-6">
                <div className="absolute left-2 top-2 h-[calc(100%-1rem)] w-px bg-border" />
                {upcoming.map((m: any) => {
                  const d = new Date(m.scheduled_at);
                  const when = isToday(d) ? "Hoje" : isTomorrow(d) ? "Amanhã" : format(d, "dd MMM", { locale: ptBR });
                  return (
                    <div key={m.id} className="relative">
                      <span className="absolute -left-[18px] top-3 h-3 w-3 rounded-full border-2 border-background bg-primary shadow-sm" />
                      <Link
                        to="/meetings/$id"
                        params={{ id: m.id }}
                        className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-3 transition-all hover:border-primary/40 hover:shadow-soft"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="w-14 shrink-0 text-center">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{when}</p>
                            <p className="font-display text-sm font-semibold">{format(d, "HH:mm")}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{m.employee?.full_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.type === "feedback" ? "Feedback SBI" : "1:1"} · {m.status}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Preparar
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState label="Nenhuma reunião agendada." icon={CalendarDays} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" /> Atividade recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-4 pl-5">
              <div className="absolute left-1.5 top-2 h-[calc(100%-1rem)] w-px bg-border" />
              {(allMeetings ?? []).slice(0, 5).map((m: any, i: number) => {
                const d = m.completed_at || m.scheduled_at;
                if (!d) return null;
                return (
                  <div key={m.id} className="relative">
                    <span className="absolute -left-[14px] top-1.5 h-2 w-2 rounded-full bg-primary/60" />
                    <p className="text-xs font-medium text-muted-foreground">
                      {formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR })}
                    </p>
                    <p className="text-sm">
                      {m.type === "feedback" ? "Feedback" : "1:1"} · {m.employee?.full_name ?? "—"}
                    </p>
                  </div>
                );
              })}
              {(!allMeetings || allMeetings.length === 0) && <EmptyState label="Sem atividade ainda." icon={Activity} />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Evolução das reuniões
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={sparkline}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="week" fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fill="url(#areaFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tipos de reunião</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "var(--color-primary)" : "var(--color-accent)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4 text-xs">
              {pieData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: i === 0 ? "var(--color-primary)" : "var(--color-accent)" }}
                  />
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-medium">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Feedbacks por mês</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <BarChart data={monthlyBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="month" fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Competências trabalhadas</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Atividade por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {heatmap.map((c, i) => {
                const intensity = Math.min(1, c.count / 3);
                return (
                  <div
                    key={i}
                    title={`${format(c.date, "dd/MM")} · ${c.count} reuniões`}
                    className="aspect-square rounded-md border border-border/50 transition-transform hover:scale-110"
                    style={{
                      background:
                        c.count === 0
                          ? "var(--color-muted)"
                          : `color-mix(in oklab, var(--color-primary) ${20 + intensity * 70}%, transparent)`,
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>menos</span>
              <div className="flex gap-1">
                {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded"
                    style={{
                      background:
                        v === 0
                          ? "var(--color-muted)"
                          : `color-mix(in oklab, var(--color-primary) ${20 + v * 70}%, transparent)`,
                    }}
                  />
                ))}
              </div>
              <span>mais</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Performance de liderança
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <PerfBar label="Cadência de 1:1" value={Math.min(100, oneOnOneDone * 12 + 40)} />
          <PerfBar label="Engajamento" value={Math.min(100, 100 - avgFeedbackAge * 2)} />
          <PerfBar label="PDIs em progresso" value={Math.min(100, activePdis * 25)} />
          <PerfBar
            label="Conversas em atraso"
            value={Math.max(0, 100 - staleEmployees.length * 20)}
            inverse={staleEmployees.length > 0}
          />
        </CardContent>
      </Card>

      {staleEmployees.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> Precisam de atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {staleEmployees.map((e: any) => (
              <Link
                key={e.id}
                to="/team/$employeeId"
                params={{ employeeId: e.id }}
                className="rounded-full border border-border bg-card px-3 py-1 text-sm transition-colors hover:border-warning/50 hover:bg-warning/10"
              >
                {e.full_name}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SuggestionChip({ icon: Icon, title, desc, to }: { icon: any; title: string; desc: string; to: string }) {
  return (
    <Link
      to={to as any}
      className="group flex flex-col justify-between rounded-xl border border-border bg-card/70 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
    >
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-3">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  variation,
  spark,
  progress,
  loading,
  inverse,
}: {
  icon: any;
  label: string;
  value: number | string;
  variation?: number;
  spark?: { week: string; count: number }[];
  progress?: number;
  loading?: boolean;
  inverse?: boolean;
}) {
  const positive = inverse ? (variation ?? 0) < 0 : (variation ?? 0) >= 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        {typeof variation === "number" && variation !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }`}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(variation)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-16" />
      ) : (
        <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{value}</p>
      )}
      {spark && (
        <div className="mt-3 h-8">
          <ResponsiveContainer>
            <LineChart data={spark}>
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {typeof progress === "number" && !spark && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
            style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PerfBar({ label, value, inverse }: { label: string; value: number; inverse?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="font-display text-sm font-semibold">{Math.round(value)}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            inverse ? "bg-gradient-to-r from-warning to-destructive" : "bg-gradient-to-r from-primary to-primary-glow"
          }`}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ label, icon: Icon }: { label: string; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-center">
      {Icon && <Icon className="h-6 w-6 text-muted-foreground/60" />}
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
