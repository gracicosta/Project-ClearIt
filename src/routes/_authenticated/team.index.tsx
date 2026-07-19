import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/team/")({
  component: TeamPage,
});

const employeeSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  position: z.string().trim().max(120).optional().or(z.literal("")),
  level: z.string().trim().max(60).optional().or(z.literal("")),
  cadence_days: z.number().int().min(7).max(90).default(15),
});

function TeamPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof employeeSchema>) => {
      const { error } = await supabase.from("employees").insert({
        manager_id: user.id,
        full_name: values.full_name,
        email: values.email || null,
        position: values.position || null,
        level: values.level || null,
        cadence_days: values.cadence_days,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Liderado adicionado.");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Não foi possível salvar."),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = employeeSchema.safeParse({
      full_name: f.get("full_name"),
      email: f.get("email") || "",
      position: f.get("position") || "",
      level: f.get("level") || "",
      cadence_days: Number(f.get("cadence_days") || 15),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    createMutation.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Meus liderados</h1>
          <p className="mt-1 text-muted-foreground">Cadastre pessoas do seu time para começar.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Adicionar liderado</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo liderado</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field name="full_name" label="Nome completo" required />
              <Field name="email" label="Email (opcional)" type="email" />
              <div className="grid grid-cols-2 gap-3">
                <Field name="position" label="Cargo" />
                <Field name="level" label="Level" placeholder="ex.: L3" />
              </div>
              <Field name="cadence_days" label="Cadência ideal (dias)" type="number" defaultValue={15} />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : employees && employees.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((e) => (
            <Link key={e.id} to="/team/$employeeId" params={{ employeeId: e.id }}>
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-primary" /> {e.full_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{e.position ?? "Cargo não definido"}{e.level ? ` · ${e.level}` : ""}</p>
                  <p className="mt-1 text-xs">Cadência: {e.cadence_days} dias</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Nenhum liderado ainda. Comece adicionando o primeiro.</p>
        </div>
      )}
    </div>
  );
}

function Field({ name, label, type = "text", required = false, placeholder, defaultValue }: {
  name: string; label: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: any;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue} />
    </div>
  );
}
