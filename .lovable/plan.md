# Plano de Ação — Adequação da camada de IA à KB Clarify

Objetivo: alinhar a implementação ao `docs/knowledge-base/prompt-engineering.md` e ao `agents/clarify/system_prompt.md`, tornando os prompts versionados, reaproveitáveis e efetivamente consumidos pelas telas (hoje só F-07 e resumo de gravação chamam o modelo).

## Fase 1 — Fundação: biblioteca de prompts versionada

Criar diretório `src/ai/` para centralizar tudo:

```text
src/ai/
├── persona.ts              # carrega o system_prompt.md base do Clarify
├── prompts/
│   ├── f01-one-on-one-prep.ts
│   ├── f02-sbi-feedback.ts
│   ├── f03-pdi-objectives.ts
│   ├── f05-lgpd-auditor.ts
│   ├── f07-legacy-feedback.ts
│   └── meeting-summary.ts
└── schemas/                # Zod schemas de entrada/saída por prompt
```

Cada arquivo exporta:
```ts
export const PROMPT_F02_SBI_FEEDBACK = {
  code: "PROMPT_F02_SBI_FEEDBACK",
  version: "v1.0.0",
  model: "google/gemini-2.5-flash",
  temperature: 0.3,
  system: `${clarifyPersona}\n\n${especificoDaFeature}`,
  inputSchema, outputSchema,
  changelog: ["v1.0.0 — versão inicial"],
};
```

Criar helper `src/ai/run-prompt.server.ts` que recebe um objeto prompt + input e executa via `generateText` com `Output.object`, aplicando fallback `NoObjectGeneratedError` já existente.

## Fase 2 — Refatorar prompts já existentes

- **F-07 (`ai.functions.ts`)**: mover prompt para `f07-legacy-feedback.ts` e ajustar o schema de saída para o contrato oficial da KB (`lgpdAlerts`, `sbiMapping`, `missingElements`, `toneWarnings`, `rewrittenFeedback`, `agreementsFound`, `nextStepsFound`). Atualizar `legacy.tsx` para exibir os novos campos.
- **Resumo de gravação (`recordings.functions.ts`)**: extrair para `meeting-summary.ts` mantendo schema atual; adicionar `temperature: 0.3`.

## Fase 3 — Plugar IA nas features que hoje são só formulário

### F-01 Preparação de 1:1 (`meetings.new.tsx`)
- Nova server fn `generateOneOnOneAgenda` usando `PROMPT_F01_*`.
- Botão "Sugerir pauta com IA" no wizard; preenche os 5 blocos e perguntas de desenvolvimento.
- Entrada: nome do liderado, contexto, acordos anteriores (pega do banco), foco de desenvolvimento.

### F-02 Feedback SBI (`feedback.new.tsx`)
- Nova server fn `structureSbiFeedback` usando `PROMPT_F02_*`.
- Campo "Relato livre" + botão "Estruturar em SBI"; devolve Situação/Comportamento/Impacto + reescrita + pergunta de escuta ativa + avisos de tom.
- Grava o resultado nos campos SBI existentes.

### F-03 PDI (`pdi-objective-panel.tsx`)
- Nova server fn `suggestPdiObjectives` usando `PROMPT_F03_*`.
- Botão "Sugerir objetivos" recebe level do liderado + competências-alvo (do Framework de Levels) e devolve até 3 objetivos com ação, marco de verificação e suporte do gestor.

## Fase 4 — Auditor LGPD como prompt (F-05)

- Manter o filtro regex em `privacy.ts` como primeira barreira determinística (rápido, sem custo).
- Adicionar `auditWithAi` opcional usando `PROMPT_F05_*` (temperatura 0.1) chamado antes de persistir feedback e transcrição, retornando `riskLevel` e `userMessage`.
- Registrar em `sensitive_incidents` quando `riskLevel >= medium`.

## Fase 5 — Persona compartilhada

- Ler `agents/clarify/system_prompt.md` uma vez em build-time (`import raw`) e concatenar no `system` de todos os prompts via `persona.ts`, garantindo tom e regras únicas (3 perfis de liderança, tema estratégico, 8 competências).

## Fase 6 — Observabilidade e testes

- Log estruturado por chamada: `{ promptCode, version, model, latencyMs, ok }`.
- Suite mínima em `src/ai/prompts/__tests__/` com a matriz de casos da KB (caso feliz, entrada incompleta, dado sensível, ambígua, linguagem inadequada).
- Validação de saída sempre via Zod já retornada pelo helper.

## Ordem de execução sugerida

1. Fase 1 (fundação) — sem quebrar nada.
2. Fase 2 (refactor F-07 + resumo) — valida a fundação.
3. Fase 3.1 F-02 (maior ganho percebido no produto).
4. Fase 3.2 F-01.
5. Fase 3.3 F-03.
6. Fase 4 (auditor LGPD IA).
7. Fase 5 (persona unificada) — pode entrar junto da Fase 1.
8. Fase 6 (observabilidade/testes).

## Detalhes técnicos

- Todas as chamadas continuam em `createServerFn` com `requireSupabaseAuth` (middleware já registrado em `src/start.ts`).
- Usar `Output.object` do AI SDK sem `.min/.max` nos schemas (regra `ai-sdk-agent-patterns`); limites no prompt + clamp em código.
- Persistência sem alterar tabelas: os campos SBI/PDI/agenda já existem; só passamos a preencher via IA.
- Nenhuma mudança em RLS, storage ou auth.
- Nenhuma nova secret: `LOVABLE_API_KEY` cobre tudo.

## Fora de escopo

- Redesign visual do dashboard, landing ou telas (já concluído).
- Novas migrações de banco.
- Integrações externas (calendário, Slack) — ficam para roadmap.
