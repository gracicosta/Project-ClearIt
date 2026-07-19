import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  MessagesSquare,
  ClipboardList,
  Target,
  Mic,
  Eye,
  Trash2,
  Download,
  Sparkles,
  FolderOpen,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BackButton } from "@/components/back-button";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

type ReportKind = "meeting" | "feedback" | "pdi" | "recording";

type ReportRow = {
  id: string;
  kind: ReportKind;
  title: string;
  employee: string;
  date: string;
  viewTo: string;
  viewParams?: Record<string, string>;
  table: "meetings" | "feedbacks" | "pdi_objectives" | "recordings";
};

const KIND_META: Record<ReportKind, { label: string; icon: typeof FileText; badge: string }> = {
  meeting: { label: "Reunião 1:1", icon: MessagesSquare, badge: "bg-primary/10 text-primary" },
  feedback: { label: "Feedback SBI", icon: ClipboardList, badge: "bg-accent/15 text-accent" },
  pdi: { label: "PDI", icon: Target, badge: "bg-warning/15 text-warning" },
  recording: { label: "Gravação", icon: Mic, badge: "bg-success/15 text-success" },
};

function ReportsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [kindFilter, setKindFilter] = useState<ReportKind | "all">("all");
  const [search, setSearch] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["employees", "map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("id, full_name");
      if (error) throw error;
      const map = new Map<string, string>();
      data?.forEach((e) => map.set(e.id, e.full_name));
      return map;
    },
  });

  const meetingsQuery = useQuery({
    queryKey: ["reports", "meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("id, employee_id, type, scheduled_at, created_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const feedbacksQuery = useQuery({
    queryKey: ["reports", "feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("id, employee_id, situation, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pdiQuery = useQuery({
    queryKey: ["reports", "pdi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_objectives")
        .select("id, employee_id, goal_description, created_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const recordingsQuery = useQuery({
    queryKey: ["reports", "recordings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recordings")
        .select("id, employee_id, title, created_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const isLoading =
    employeesQuery.isLoading ||
    meetingsQuery.isLoading ||
    feedbacksQuery.isLoading ||
    pdiQuery.isLoading ||
    recordingsQuery.isLoading;

  const rows: ReportRow[] = useMemo(() => {
    const empMap = employeesQuery.data ?? new Map<string, string>();
    const list: ReportRow[] = [];

    meetingsQuery.data?.forEach((m) => {
      list.push({
        id: m.id,
        kind: "meeting",
        title: `1:1 · ${m.type === "one_on_one" ? "Recorrente" : m.type}`,
        employee: empMap.get(m.employee_id) ?? "—",
        date: m.scheduled_at ?? m.created_at,
        viewTo: "/meetings/$id",
        viewParams: { id: m.id },
        table: "meetings",
      });
    });
    feedbacksQuery.data?.forEach((f) => {
      list.push({
        id: f.id,
        kind: "feedback",
        title: f.situation ? f.situation.slice(0, 72) + (f.situation.length > 72 ? "…" : "") : "Feedback SBI",
        employee: empMap.get(f.employee_id) ?? "—",
        date: f.created_at,
        viewTo: "/team/$employeeId",
        viewParams: { employeeId: f.employee_id },
        table: "feedbacks",
      });
    });
    pdiQuery.data?.forEach((p) => {
      list.push({
        id: p.id,
        kind: "pdi",
        title: p.goal_description
          ? p.goal_description.slice(0, 72) + (p.goal_description.length > 72 ? "…" : "")
          : "PDI",
        employee: empMap.get(p.employee_id) ?? "—",
        date: p.created_at,
        viewTo: "/team/$employeeId",
        viewParams: { employeeId: p.employee_id },
        table: "pdi_objectives",
      });
    });
    recordingsQuery.data?.forEach((r) => {
      list.push({
        id: r.id,
        kind: "recording",
        title: r.title ?? "Gravação",
        employee: r.employee_id ? empMap.get(r.employee_id) ?? "—" : "—",
        date: r.created_at,
        viewTo: "/recordings/$id",
        viewParams: { id: r.id },
        table: "recordings",
      });
    });

    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [
    employeesQuery.data,
    meetingsQuery.data,
    feedbacksQuery.data,
    pdiQuery.data,
    recordingsQuery.data,
  ]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return r.title.toLowerCase().includes(s) || r.employee.toLowerCase().includes(s);
      }
      return true;
    });
  }, [rows, kindFilter, search]);

  const deleteMutation = useMutation({
    mutationFn: async (row: ReportRow) => {
      const client = supabase as unknown as {
        from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<{ error: unknown }> } };
      };
      const { error } = await client.from(row.table).delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Relatório excluído.");
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir."),
  });

  const handleExport = (row: ReportRow) => {
    toast.success(`PDF de "${row.title}" gerado (simulação).`, {
      description: "Em produção, o download começará automaticamente.",
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <BackButton className="-ml-2 self-start" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Relatórios</h1>
            <p className="text-sm text-muted-foreground">
              Todos os artefatos criados pelo time — 1:1s, feedbacks, PDIs e gravações — em um só lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/meetings/new">
                <Plus className="mr-1 h-4 w-4" /> Nova 1:1
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/feedback/new">
                <Plus className="mr-1 h-4 w-4" /> Novo Feedback
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Buscar por título ou liderado…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as ReportKind | "all")}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="meeting">Reuniões 1:1</SelectItem>
              <SelectItem value="feedback">Feedbacks SBI</SelectItem>
              <SelectItem value="pdi">PDIs</SelectItem>
              <SelectItem value="recording">Gravações</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground sm:ml-auto">
            {filtered.length} de {rows.length} registros
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <FolderOpen className="h-7 w-7 text-primary" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-display text-lg font-semibold">
                {rows.length === 0
                  ? "Nenhum relatório ainda"
                  : "Nenhum relatório encontrado com esses filtros"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {rows.length === 0
                  ? "Ao registrar uma 1:1, um feedback SBI, um PDI ou uma gravação, ele aparece automaticamente aqui."
                  : "Ajuste os filtros ou limpe a busca para ver todos os registros."}
              </p>
            </div>
            {rows.length === 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild size="sm">
                  <Link to="/meetings/new">
                    <MessagesSquare className="mr-1 h-4 w-4" /> Criar primeira 1:1
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/feedback/new">
                    <ClipboardList className="mr-1 h-4 w-4" /> Registrar feedback
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/recordings">
                    <Mic className="mr-1 h-4 w-4" /> Gravar reunião
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setKindFilter("all");
                }}
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => {
            const meta = KIND_META[row.kind];
            const Icon = meta.icon;
            return (
              <Card key={`${row.table}-${row.id}`} className="transition-shadow hover:shadow-elegant">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.badge}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(row.date), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">Liderado: {row.employee}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        (navigate as unknown as (opts: { to: string; params?: Record<string, string> }) => void)({ to: row.viewTo, params: row.viewParams })
                      }
                    >
                      <Eye className="mr-1 h-4 w-4" /> Ver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExport(row)}>
                      <Download className="mr-1 h-4 w-4" /> PDF
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir este relatório?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação remove o registro <strong>{row.title}</strong> e não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(row)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
        <div className="mb-1 flex items-center gap-1.5 font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Dica do assistente
        </div>
        Exportar em PDF nesta versão gera uma simulação. Em produção, cada relatório usará o layout
        oficial do Manual e será entregue com metadados LGPD auditáveis.
      </div>
    </div>
  );
}
