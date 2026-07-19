import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Sparkles,
  Users,
  MessagesSquare,
  ClipboardList,
  Target,
  Mic,
  FileText,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Rocket,
  CheckCircle2,
  Github,
  FolderKanban,
  LogIn,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual do Sistema · Smart Leading" },
      { name: "description", content: "Manual, funcionalidades e roadmap do MVP Smart Leading." },
    ],
  }),
  component: ManualPage,
});

const features = [
  {
    icon: Users,
    title: "Gestão de liderados",
    desc: "Cadastro do squad com nível, cargo e histórico consolidado por pessoa.",
  },
  {
    icon: MessagesSquare,
    title: "1:1s estruturadas (F-01)",
    desc: "Wizard em 5 blocos — Check-in, Pauta, Obstáculos, Desenvolvimento e Acordos — com sugestão de pauta por IA.",
  },
  {
    icon: ClipboardList,
    title: "Feedback SBI (F-02)",
    desc: "Estruturação Situação/Comportamento/Impacto assistida por IA, com medidor de tom.",
  },
  {
    icon: Target,
    title: "PDI conectado a Levels (F-03)",
    desc: "Até 3 objetivos por liderado, vinculados às 8 competências oficiais da ClearIT, com marcos verificáveis.",
  },
  {
    icon: FileText,
    title: "Exportação PDF/Excel (F-04)",
    desc: "Relatórios de 1:1, feedback e PDI prontos para líderes e RH.",
  },
  {
    icon: ShieldCheck,
    title: "Auditor LGPD (F-05)",
    desc: "Filtro regex + auditor de IA que sanitiza texto, classifica risco e registra incidentes sensíveis.",
  },
  {
    icon: BarChart3,
    title: "Painel de RH (F-06)",
    desc: "Analytics multi-squad: cobertura de 1:1, saúde de feedbacks, PDIs ativos e incidentes LGPD.",
  },
  {
    icon: BookOpen,
    title: "Feedbacks legados (F-07)",
    desc: "Importa PDFs antigos, extrai SBI e sugere próximos passos com IA.",
  },
  {
    icon: Mic,
    title: "Registrar Reunião",
    desc: "Gravação no navegador com transcrição, resumo automático e pré-preenchimento do wizard de 1:1/Feedback.",
  },
  {
    icon: FolderKanban,
    title: "Central de Relatórios",
    desc: "Painel único que consolida 1:1s, Feedbacks, PDIs e Gravações com busca, filtros por tipo, exclusão e exportação em PDF.",
  },
  {
    icon: ArrowLeft,
    title: "Navegação consistente",
    desc: "Botão Voltar presente em todas as telas internas e histórico do roteador para nunca prender o usuário.",
  },
  {
    icon: LogIn,
    title: "Acesso rápido para demonstração",
    desc: "Conta demo admin@clearit.com / 123456 pré-provisionada com massa de dados de exemplo e papel de RH.",
  },
];

const pending = [
  "Suíte automatizada de testes de prompts (Fase 6 do plano de IA).",
  "Notificações por e-mail para 1:1s agendadas e action items em atraso.",
  "Integração com calendário (Google/Outlook) para sincronizar reuniões.",
  "Modo offline para gravação em áreas com conectividade instável.",
  "App mobile — hoje o MVP é responsivo, mas não instalável como PWA.",
];

const nextSteps = [
  "Publicar biblioteca de perguntas por competência e nível (Levels).",
  "Adicionar comparativos temporais de tom e evolução de PDI no painel de RH.",
  "Fluxo de calibração 360° cruzando feedbacks recebidos e autoavaliação.",
  "Alertas proativos da IA (ex.: liderado sem 1:1 há 30 dias, PDI parado).",
  "SSO corporativo (Microsoft Entra ID) além do Google já suportado.",
];

const team = [
  "Breno Vilaça",
  "Leticia Gonçalves",
  "Gracielle Costa",
  "Henrique Ferreira",
  "Vitória Silva",
];

function ManualPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
        </Button>
        <ThemeToggle variant="outline" />
      </div>
      <header className="space-y-3">
        <Badge variant="secondary" className="w-fit gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Manual do sistema
        </Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Smart Leading — Assistente de 1:1 e Feedback
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Entregue por <span className="font-medium text-foreground">Squad The Cure</span> como MVP do desafio ClearIT.
          Esta página descreve o sistema, o que já está funcionando, o que ainda está em construção e os próximos passos
          sugeridos para evolução.
        </p>
      </header>

      <Card className="overflow-hidden border-primary/20 bg-brand-gradient text-primary-foreground shadow-soft">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/15 p-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider opacity-80">O que é</p>
              <p className="max-w-2xl text-sm md:text-base">
                Plataforma web para líderes conduzirem 1:1s, registrarem feedbacks estruturados no modelo SBI, manterem
                PDIs conectados ao Framework de Levels da ClearIT e apoiarem o RH com analytics — tudo com apoio de IA
                generativa e proteção LGPD embutida.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <LogIn className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Como acessar a demonstração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Na tela de login use o botão <span className="font-medium text-foreground">"Entrar como Demo · ClearIT"</span> ou digite manualmente:
          </p>
          <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs md:grid-cols-2">
            <div><span className="text-muted-foreground">email:</span> <span className="text-foreground">admin@clearit.com</span></div>
            <div><span className="text-muted-foreground">senha:</span> <span className="text-foreground">123456</span></div>
          </div>
          <p>
            A conta demo já vem com o papel de <span className="font-medium text-foreground">RH</span> e com toda a massa de exemplo do squad The Cure, dando acesso ao painel de Analytics e à Central de Relatórios.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Principais funcionalidades</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">Ainda não está funcionando</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {pending.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Rocket className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Próximos passos e evoluções</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {nextSteps.map((p) => (
                <li key={p} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Stack técnica</h2>
        <Card className="border-border/60">
          <CardContent className="grid gap-4 p-6 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">Frontend</p>
              <p className="text-muted-foreground">React 19 + TanStack Start + Vite 7, Tailwind v4, shadcn/ui, Recharts.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Backend</p>
              <p className="text-muted-foreground">TanStack Server Functions em Cloudflare Workers + Postgres com RLS.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">IA</p>
              <p className="text-muted-foreground">Google Gemini via AI Gateway, prompts versionados por feature (F-01 a F-07).</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Exportação & Mídia</p>
              <p className="text-muted-foreground">@react-pdf/renderer, xlsx, MediaRecorder API e Speech-to-Text.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Squad The Cure</h2>
        <Card className="border-border/60">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Grupo</p>
              <p className="font-display text-lg font-semibold">The Cure</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Integrantes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {team.map((name) => (
                  <Badge key={name} variant="secondary" className="text-sm">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
              <Github className="h-4 w-4" />
              Repositório Git entregue junto com este MVP à ClearIT.
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="pb-6 text-center text-xs text-muted-foreground">
        Smart Leading · MVP entregue em julho de 2026 · Desafio ClearIT
      </footer>
    </div>
  );
}
