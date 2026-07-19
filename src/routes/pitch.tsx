import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  ShieldCheck,
  Brain,
  Users,
  Target,
  Mic,
  BarChart3,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Presentation,
  Heart,
  Layers,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pitch")({
  head: () => ({
    meta: [
      { title: "Smart Leading — Pitch • Squad The Cure" },
      {
        name: "description",
        content:
          "Apresentação do projeto Smart Leading, o copiloto de IA para líderes técnicos — Squad The Cure • Pulse Mais x ClearIT.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PitchDeck,
});

type Slide = {
  id: string;
  kicker: string;
  title: string;
  render: () => React.ReactElement;
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur">
      {children}
    </span>
  );
}

function GlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.07] ${className}`}
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-primary-glow/20 via-transparent to-accent/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

function IconBubble({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-glow/30 to-accent/20 ring-1 ring-white/15">
      <Icon className="h-6 w-6 text-white" />
    </div>
  );
}

const slides: Slide[] = [
  {
    id: "cover",
    kicker: "Pulse Mais • ClearIT",
    title: "Smart Leading",
    render: () => (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary-glow" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Squad The Cure
          </span>
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        </div>
        <h1 className="animate-gradient-x bg-gradient-to-r from-white via-primary-glow to-accent bg-[length:200%_auto] bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-8xl">
          Smart Leading
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-white/70 md:text-2xl">
          O copiloto de IA que devolve tempo — e humanidade — para líderes
          técnicos conduzirem 1:1s, feedbacks e PDIs.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Chip>Líderes: Breno • Graciele</Chip>
          <Chip>Time: Letícia • Henrique • Vitória</Chip>
        </div>
      </div>
    ),
  },
  {
    id: "intro",
    kicker: "01 • Introdução",
    title: "Quem somos e o que trouxemos",
    render: () => (
      <div className="grid h-full gap-8 md:grid-cols-2 md:items-center">
        <div>
          <IconBubble icon={Users} />
          <h2 className="text-4xl font-bold text-white md:text-5xl">Squad The Cure</h2>
          <p className="mt-4 text-lg text-white/70">
            Um time multidisciplinar do Pulse Mais em parceria com a ClearIT,
            unindo produto, IA, design e engenharia para atacar uma dor real
            das lideranças técnicas.
          </p>
          <ul className="mt-6 space-y-2 text-white/80">
            <li>
              <span className="text-white/50">Lideranças:</span>{" "}
              <strong>Breno</strong> & <strong>Graciele</strong>
            </li>
            <li>
              <span className="text-white/50">Squad:</span>{" "}
              <strong>Letícia</strong>, <strong>Henrique</strong> e{" "}
              <strong>Vitória</strong>
            </li>
          </ul>
        </div>
        <GlowCard>
          <IconBubble icon={Sparkles} />
          <h3 className="text-2xl font-semibold text-white">
            Um agente de IA para o líder técnico
          </h3>
          <p className="mt-3 text-white/70">
            Não é um RH. É um copiloto que prepara, conduz e registra
            conversas de liderança — com segurança LGPD por padrão.
          </p>
        </GlowCard>
      </div>
    ),
  },
  {
    id: "problem",
    kicker: "02 • Problema de Negócio",
    title: "Liderar pessoas ainda é o ponto cego dos times técnicos",
    render: () => (
      <div className="grid h-full gap-6 md:grid-cols-3">
        <GlowCard>
          <IconBubble icon={Heart} />
          <h3 className="text-xl font-semibold text-white">Quem sofre</h3>
          <p className="mt-3 text-white/70">
            Líderes técnicos promovidos por skill, sem repertório de
            gestão. Liderados sem clareza de expectativas nem trilha.
          </p>
        </GlowCard>
        <GlowCard>
          <IconBubble icon={Brain} />
          <h3 className="text-xl font-semibold text-white">Por que dói</h3>
          <p className="mt-3 text-white/70">
            1:1s viram status report. Feedbacks agressivos ou vagos.
            PDIs esquecidos. Turnover de talentos e retrabalho.
          </p>
        </GlowCard>
        <GlowCard>
          <IconBubble icon={ShieldCheck} />
          <h3 className="text-xl font-semibold text-white">E ainda tem LGPD</h3>
          <p className="mt-3 text-white/70">
            Registros em ferramentas soltas expõem dados sensíveis de
            colaboradores — risco jurídico invisível ao gestor.
          </p>
        </GlowCard>
      </div>
    ),
  },
  {
    id: "solution",
    kicker: "03 • Solução Proposta",
    title: "Um copiloto que padroniza a conversa — sem robotizar o líder",
    render: () => (
      <div className="grid h-full gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <IconBubble icon={Sparkles} />
            <h3 className="text-3xl font-bold text-white">O que construímos</h3>
            <p className="mt-3 text-lg text-white/70">
              Uma plataforma web com IA generativa que apoia o líder em
              cada momento crítico da relação com o liderado.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              ["1:1 guiada", "Wizard em 5 blocos com sugestões contextuais"],
              ["Feedback SBI", "Roteiro Situação–Comportamento–Impacto assistido"],
              ["PDI estruturado", "Objetivos ligados ao framework de levels"],
              ["Gravações", "Transcrição + resumo + preenchimento automático"],
              ["LGPD ativo", "Filtro que mascara dados sensíveis por padrão"],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-glow" />
                <div>
                  <div className="font-semibold text-white">{t}</div>
                  <div className="text-sm text-white/60">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <GlowCard className="flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-glow/40 to-accent/30 ring-1 ring-white/20">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="font-display text-2xl font-semibold text-white">
              "Menos planilhas.
              <br />
              Mais conversas."
            </div>
            <p className="mt-4 text-white/60">
              O líder chega mais preparado; o liderado sai com clareza.
            </p>
          </div>
        </GlowCard>
      </div>
    ),
  },
  {
    id: "arch",
    kicker: "04 • Arquitetura & IA",
    title: "Como a informação flui — com segurança embutida",
    render: () => (
      <div className="flex h-full flex-col justify-center">
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { icon: Mic, label: "Input", desc: "Voz, texto, PDF legado" },
            { icon: ShieldCheck, label: "Filtro LGPD", desc: "Máscara + audit log" },
            { icon: Brain, label: "IA Gemini", desc: "Resumo, SBI, PDI" },
            { icon: Layers, label: "Persistência", desc: "Postgres + RLS por gestor" },
            { icon: Presentation, label: "Output", desc: "Dashboard, PDF, Excel" },
          ].map((s, i) => (
            <div key={s.label} className="relative">
              <GlowCard className="h-full">
                <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-glow">
                  Etapa {i + 1}
                </div>
                <s.icon className="mb-3 h-7 w-7 text-white" />
                <div className="text-lg font-semibold text-white">{s.label}</div>
                <div className="mt-1 text-sm text-white/60">{s.desc}</div>
              </GlowCard>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <GlowCard>
            <div className="text-xs uppercase tracking-widest text-white/50">Stack</div>
            <div className="mt-2 text-white/85">
              TanStack Start • React 19 • Tailwind v4 • Lovable Cloud
              (Postgres + Auth + Storage)
            </div>
          </GlowCard>
          <GlowCard>
            <div className="text-xs uppercase tracking-widest text-white/50">IA</div>
            <div className="mt-2 text-white/85">
              Lovable AI Gateway com Gemini 2.5 — STT + geração estruturada
              via Zod
            </div>
          </GlowCard>
          <GlowCard>
            <div className="text-xs uppercase tracking-widest text-white/50">Segurança</div>
            <div className="mt-2 text-white/85">
              RLS por gestor • Filtro LGPD automático • Papéis Gestor/RH
              isolados
            </div>
          </GlowCard>
        </div>
      </div>
    ),
  },
  {
    id: "demo",
    kicker: "05 • Demonstração do MVP",
    title: "O fluxo que vamos mostrar ao vivo",
    render: () => (
      <div className="grid h-full gap-6 md:grid-cols-2">
        <GlowCard>
          <IconBubble icon={BarChart3} />
          <h3 className="text-2xl font-semibold text-white">1. Dashboard</h3>
          <p className="mt-2 text-white/70">
            Cabeçalho dinâmico, prioridades sugeridas pela IA, insights e
            analytics com sparkline, radar de competências e heatmap.
          </p>
        </GlowCard>
        <GlowCard>
          <IconBubble icon={Target} />
          <h3 className="text-2xl font-semibold text-white">2. Wizard 1:1</h3>
          <p className="mt-2 text-white/70">
            5 blocos guiados, sugestões da IA e exportação em PDF ao
            encerrar.
          </p>
        </GlowCard>
        <GlowCard>
          <IconBubble icon={Mic} />
          <h3 className="text-2xl font-semibold text-white">3. Gravação</h3>
          <p className="mt-2 text-white/70">
            Consentimento → captura ao vivo → processamento → resumo,
            acordos e blocos SBI preenchidos.
          </p>
        </GlowCard>
        <GlowCard>
          <IconBubble icon={ShieldCheck} />
          <h3 className="text-2xl font-semibold text-white">4. Auditoria LGPD</h3>
          <p className="mt-2 text-white/70">
            Painel de RH com incidentes mascarados e histórico completo
            por gestor.
          </p>
        </GlowCard>
      </div>
    ),
  },
  {
    id: "value",
    kicker: "06 • Valor para o negócio",
    title: "Impacto para líderes, liderados e ClearIT",
    render: () => (
      <div className="grid h-full gap-6 md:grid-cols-3">
        {[
          {
            icon: Heart,
            title: "Retenção",
            body: "Conversas de qualidade reduzem turnover de talentos — o ativo mais caro de uma tech company.",
          },
          {
            icon: Users,
            title: "Padronização",
            body: "Toda liderança passa a operar no mesmo playbook: 1:1, SBI e PDI — sem depender de senioridade.",
          },
          {
            icon: ShieldCheck,
            title: "Segurança jurídica",
            body: "LGPD deixa de ser risco e vira feature: dados sensíveis mascarados e auditáveis por padrão.",
          },
        ].map((c) => (
          <GlowCard key={c.title}>
            <IconBubble icon={c.icon} />
            <h3 className="text-2xl font-semibold text-white">{c.title}</h3>
            <p className="mt-3 text-white/70">{c.body}</p>
          </GlowCard>
        ))}
      </div>
    ),
  },
  {
    id: "next",
    kicker: "07 • Próximos passos",
    title: "Como evoluímos daqui",
    render: () => (
      <div className="grid h-full gap-6 md:grid-cols-2">
        <GlowCard>
          <IconBubble icon={Workflow} />
          <h3 className="text-2xl font-semibold text-white">Integrações</h3>
          <ul className="mt-4 space-y-2 text-white/75">
            <li>• Google/Outlook Calendar — 1:1s automáticas</li>
            <li>• Slack/Teams — lembretes e resumos</li>
            <li>• Google Meet — captura nativa de reunião</li>
          </ul>
        </GlowCard>
        <GlowCard>
          <IconBubble icon={Rocket} />
          <h3 className="text-2xl font-semibold text-white">Produto</h3>
          <ul className="mt-4 space-y-2 text-white/75">
            <li>• Benchmarks por competência & level</li>
            <li>• Alertas preditivos de risco de saída</li>
            <li>• Modo copiloto ao vivo durante a reunião</li>
          </ul>
        </GlowCard>
      </div>
    ),
  },
  {
    id: "close",
    kicker: "Encerramento",
    title: "Obrigado.",
    render: () => (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <Sparkles className="mb-6 h-10 w-10 text-primary-glow" />
        <h2 className="animate-gradient-x bg-gradient-to-r from-white via-primary-glow to-accent bg-[length:200%_auto] bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
          IA para devolver
          <br /> humanidade à liderança.
        </h2>
        <p className="mt-8 max-w-xl text-lg text-white/70">
          Squad <strong>The Cure</strong> — Breno, Graciele, Letícia, Henrique
          e Vitória.
        </p>
        <div className="mt-10 flex items-center gap-3">
          <Chip>Pulse Mais</Chip>
          <Chip>ClearIT</Chip>
          <Chip>2026</Chip>
        </div>
      </div>
    ),
  },
];

function PitchDeck() {
  const [i, setI] = useState(0);
  const total = slides.length;

  const go = useCallback(
    (delta: number) => {
      setI((prev) => Math.max(0, Math.min(total - 1, prev + delta)));
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(total - 1);
      else if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  const slide = slides[i];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1e] text-white">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-primary-glow/20 blur-[120px] animate-float-slow" />
        <div className="absolute -right-40 bottom-0 h-[600px] w-[600px] rounded-full bg-accent/15 blur-[120px] animate-float-slow [animation-delay:1s]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0f1e_75%)]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-glow/40 to-accent/30 ring-1 ring-white/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <div className="font-display font-semibold">Smart Leading</div>
            <div className="text-xs text-white/50">Squad The Cure • Pitch</div>
          </div>
        </div>
        <div className="text-xs uppercase tracking-[0.25em] text-white/50">
          {slide.kicker}
        </div>
        <div className="text-sm tabular-nums text-white/60">
          {String(i + 1).padStart(2, "0")}{" "}
          <span className="text-white/30">/ {String(total).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Slide content */}
      <main
        key={slide.id}
        className="relative z-10 mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 flex-col px-8 py-6 duration-500"
      >
        {slide.id !== "cover" && slide.id !== "close" && (
          <h2 className="mb-10 font-display text-3xl font-bold leading-tight text-white md:text-5xl">
            {slide.title}
          </h2>
        )}
        <div className="flex-1">{slide.render()}</div>
      </main>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-between px-8 pb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(-1)}
          disabled={i === 0}
          className="text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>

        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              aria-label={`Ir para slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === i
                  ? "w-8 bg-gradient-to-r from-primary-glow to-accent"
                  : "w-1.5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(1)}
          disabled={i === total - 1}
          className="text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          Próximo <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/30">
        ← → navegar • F tela cheia
      </div>
    </div>
  );
}
