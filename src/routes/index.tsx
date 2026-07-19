import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  MessagesSquare,
  ClipboardList,
  Users,
  ArrowRight,
  FileText,
  Sparkles,
  CheckCircle2,
  BarChart3,
} from "lucide-react";


export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070a1f] text-white selection:bg-[#4fb3d9]/30">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] h-[600px] w-[600px] rounded-full bg-[#1e2f9e]/40 blur-[130px]" />
        <div className="absolute -right-[10%] top-[35%] h-[520px] w-[520px] rounded-full bg-[#4fb3d9]/15 blur-[110px]" />
        <div className="absolute bottom-[-15%] left-[30%] h-[480px] w-[480px] rounded-full bg-[#2a3eb8]/25 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070a1f]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4fb3d9] to-[#1e2f9e] shadow-[0_0_20px_rgba(79,179,217,0.35)]">
              <span className="font-display text-sm font-bold text-white">C</span>
            </div>
            <span className="font-display text-base font-semibold tracking-tight">
              ClearIT <span className="text-white/40">/</span> Assistente 1:1
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm text-white/60 transition hover:text-white">Recursos</a>
            <a href="#framework" className="text-sm text-white/60 transition hover:text-white">Levels</a>
            <a href="#lgpd" className="text-sm text-white/60 transition hover:text-white">LGPD</a>
            <Link to="/manual" className="text-sm text-white/60 transition hover:text-white">Manual</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white/80 hover:bg-white/5 hover:text-white md:hidden">
              <Link to="/manual">Manual</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white/80 hover:bg-white/5 hover:text-white">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[#1e2f9e] text-white shadow-[0_0_20px_rgba(30,47,158,0.5)] hover:bg-[#2a3eb8]"
            >
              <Link to="/auth">Começar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-28">
          {/* Left */}
          <div className="flex flex-col justify-center space-y-8 animate-fade-in">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#4fb3d9]/25 bg-[#1e2f9e]/30 px-3 py-1 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4fb3d9] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4fb3d9]" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-[#7fd0ec]">
                Assistente para líderes tech
              </span>
            </div>

            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-[64px]">
              Líderes que{" "}
              <span className="animate-gradient-x bg-gradient-to-r from-[#4fb3d9] via-white to-[#4fb3d9] bg-clip-text text-transparent">
                desenvolvem pessoas
              </span>{" "}
              escalam com a ClearIT.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-white/70">
              Conduza 1:1s estruturadas, aplique feedback no modelo SBI e gerencie PDIs
              conectados ao Framework de Levels. Tudo em conformidade com a LGPD.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="group bg-[#1e2f9e] text-white shadow-[0_0_30px_rgba(30,47,158,0.55)] hover:bg-[#2a3eb8]"
              >
                <Link to="/auth">
                  Criar conta grátis
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <a href="#features">Ver demonstração</a>
              </Button>
            </div>

            <div className="flex items-center gap-6 border-t border-white/10 pt-8">
              <div>
                <p className="font-display text-xl font-bold">100%</p>
                <p className="text-[11px] uppercase tracking-wider text-white/40">LGPD Ready</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="font-display text-xl font-bold">SBI + IA</p>
                <p className="text-[11px] uppercase tracking-wider text-white/40">Feedback humanizado</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="font-display text-xl font-bold">5 blocos</p>
                <p className="text-[11px] uppercase tracking-wider text-white/40">Roteiro 1:1</p>
              </div>
            </div>
          </div>

          {/* Right — Product Mockup */}
          <div className="relative animate-scale-in lg:pl-4">
            {/* Floating 1:1 card */}
            <div className="absolute -left-4 -top-8 z-20 w-64 -rotate-3 rounded-2xl border border-white/15 bg-[#1e2f9e]/70 p-4 shadow-2xl backdrop-blur-xl animate-float-slow">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4fb3d9]/25">
                  <MessagesSquare className="h-4 w-4 text-[#4fb3d9]" />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                  Próxima 1:1
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-3/4 bg-[#4fb3d9]" />
                </div>
                <p className="text-sm font-medium text-white">Crescimento em Backend · L3</p>
                <p className="text-[11px] text-white/50">Bloco 3 · Entregas · em 2 dias</p>
              </div>
            </div>

            {/* Main dashboard mock */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1e2f9e]/25 via-transparent to-[#4fb3d9]/10" />
              <div className="relative space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/50">
                    clearit / dashboard
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex h-32 flex-col justify-end rounded-xl border border-white/5 bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#4fb3d9]">Level 4</p>
                    <p className="font-display text-lg leading-tight text-white">Senior Engineer</p>
                    <div className="mt-2 flex items-end gap-1">
                      <div className="h-2 w-3 rounded-sm bg-white/15" />
                      <div className="h-3 w-3 rounded-sm bg-white/25" />
                      <div className="h-4 w-3 rounded-sm bg-[#4fb3d9]" />
                      <div className="h-5 w-3 rounded-sm bg-[#1e2f9e]" />
                      <div className="h-6 w-3 rounded-sm bg-white/10" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                    <p className="mb-3 text-[11px] uppercase tracking-wider text-white/50">Skill radar</p>
                    <div className="flex h-24 items-center justify-center">
                      <svg viewBox="0 0 100 100" className="h-24 w-24">
                        <polygon
                          points="50,10 90,40 74,90 26,90 10,40"
                          className="fill-none stroke-[#4fb3d9]/40"
                          strokeWidth={0.6}
                        />
                        <polygon
                          points="50,35 78,50 66,78 34,78 22,50"
                          className="fill-[#4fb3d9]/25 stroke-[#4fb3d9]"
                          strokeWidth={0.6}
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#4fb3d9]/25 bg-[#1e2f9e]/25 p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#7fd0ec]">
                    Feedback SBI
                  </p>
                  <p className="text-xs italic leading-relaxed text-white/80">
                    "Na revisão de arquitetura de ontem, você trouxe dados de latência que redirecionaram a
                    decisão — o time saiu com clareza técnica e prazo realista."
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-gradient-to-r from-white/5 to-transparent px-4 py-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[11px] text-white/70">
                    Filtro LGPD ativo · dados sensíveis anonimizados
                  </span>
                </div>
              </div>
            </div>

            {/* Floating PDI card */}
            <div className="absolute -bottom-6 -right-2 z-20 w-48 rotate-2 rounded-2xl bg-white p-5 text-[#1e2f9e] shadow-2xl animate-float-slower">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-60">
                Progresso PDI
              </p>
              <p className="font-display text-3xl font-bold">84%</p>
              <div className="mt-3 flex -space-x-2">
                <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />
                <div className="h-6 w-6 rounded-full border-2 border-white bg-[#4fb3d9]" />
                <div className="h-6 w-6 rounded-full border-2 border-white bg-[#1e2f9e]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#7fd0ec]">
              Recursos
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
              Estrutura para líderes,{" "}
              <span className="text-white/60">resultado para pessoas</span>
            </h2>
            <p className="mt-4 text-white/60">
              Seis pilares alinhados ao método ClearIT de desenvolvimento contínuo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#4fb3d9]/40 hover:bg-white/[0.06]"
              >
                <div className="absolute inset-0 -z-0 bg-gradient-to-br from-[#1e2f9e]/0 via-transparent to-[#4fb3d9]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1e2f9e]/40 text-[#7fd0ec] transition-colors group-hover:bg-[#1e2f9e] group-hover:text-white">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{f.description}</p>
                  <span className="mt-4 inline-block text-[10px] font-mono uppercase tracking-wider text-white/25">
                    0{i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Framework */}
      <section id="framework" className="relative border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#7fd0ec]">
              Framework de Levels
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              PDIs conectados à régua oficial de competências
            </h2>
            <p className="mt-4 leading-relaxed text-white/60">
              Cada PDI é vinculado a uma competência do Framework de Levels da ClearIT, com no
              máximo 3 objetivos ativos, marco de verificação e compromisso do gestor. Sem listas
              de intenções — só compromissos rastreáveis.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["3 objetivos ativos", "Marco de verificação", "Compromisso do gestor"].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                >
                  <CheckCircle2 className="h-3 w-3 text-[#4fb3d9]" /> {t}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-2.5">
            {COMPETENCIES.map((c, i) => (
              <div
                key={c}
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 transition-all hover:border-[#4fb3d9]/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-white/30">L{i + 1}</span>
                  <span className="text-sm font-medium text-white/90">{c}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-[#4fb3d9]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LGPD */}
      <section id="lgpd" className="relative">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl border border-[#4fb3d9]/20 bg-gradient-to-br from-[#1e2f9e] via-[#1a2478] to-[#0a0f2e] p-10 shadow-[0_30px_80px_-20px_rgba(30,47,158,0.5)] md:p-14">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#4fb3d9]/25 blur-[80px]" />
            <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#4fb3d9]/15 blur-[80px]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl font-semibold md:text-3xl">
                  Privacidade por padrão
                </h2>
                <p className="mt-3 max-w-2xl text-white/75">
                  Toda entrada de texto passa por um filtro anti-dados sensíveis (CPF, CNPJ, RG,
                  CID, salário, contexto familiar). Nada vaza para históricos, exportações ou
                  dashboards sem passar pelo bloqueio LGPD — e cada incidente fica registrado para
                  auditoria.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    "Mascaramento automático",
                    "Log de incidentes",
                    "Sem exposição em exports",
                  ].map((t) => (
                    <div
                      key={t}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7fd0ec]" />
                      <span className="text-white/85">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="mx-auto max-w-4xl px-6 pb-24 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            Pronto para uma cadência de 1:1s que{" "}
            <span className="animate-gradient-x bg-gradient-to-r from-[#4fb3d9] via-white to-[#4fb3d9] bg-clip-text text-transparent">
              desenvolve o time
            </span>
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Comece grátis. Traga seu time, importe feedbacks legados e veja o método ClearIT em ação.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="group bg-[#1e2f9e] text-white shadow-[0_0_30px_rgba(30,47,158,0.55)] hover:bg-[#2a3eb8]"
            >
              <Link to="/auth">
                Criar conta grátis
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-white/40 md:flex-row">
          <p>© {new Date().getFullYear()} ClearIT · Assistente de 1:1s e Feedbacks</p>
          <p>Feito com o método Onion Spec-as-Code.</p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Roteiro de 1:1 em 5 blocos",
    description:
      "Check-in humano, pauta do liderado, entregas, desenvolvimento e acordos — na ordem certa, sem virar reunião de status.",
  },
  {
    icon: Sparkles,
    title: "Feedback SBI humanizado",
    description:
      "Situação, Comportamento e Impacto guiados pela IA. Detectamos linguagem-ataque e sugerimos reescrita baseada em fatos.",
  },
  {
    icon: ClipboardList,
    title: "PDI vinculado a Levels",
    description:
      "Máximo 3 objetivos ativos, com competência oficial, ações, marco de verificação e suporte do gestor.",
  },
  {
    icon: ShieldCheck,
    title: "Filtro LGPD automático",
    description:
      "Bloqueia CPF/CNPJ/RG, mascara doenças e salários. Incidentes ficam registrados para auditoria.",
  },
  {
    icon: BarChart3,
    title: "Painel para RH",
    description:
      "Adesão, cadência, colaboradores sem 1:1 há mais de 30 dias e temas recorrentes — sem quebrar privacidade.",
  },
  {
    icon: FileText,
    title: "Análise de feedbacks legados",
    description:
      "Importe PDFs históricos e receba análise de tom + reestruturação no modelo SBI com sugestões.",
  },
];

const COMPETENCIES = [
  "Entrega Técnica",
  "Resolução de Problemas",
  "Comunicação com Stakeholders",
  "Ownership",
  "Liderança e Influência",
  "Foco no Cliente",
];
