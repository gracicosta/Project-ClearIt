import { z } from "zod";
import type { PromptDefinition } from "../run-prompt.server";

const inputSchema = z.object({
  legacyFeedbackText: z.string().min(20).max(15000),
});

const outputSchema = z.object({
  lgpdAlerts: z.array(z.string()).default([]),
  sbiMapping: z
    .object({
      situation: z.string().default(""),
      behavior: z.string().default(""),
      impact: z.string().default(""),
    })
    .default({ situation: "", behavior: "", impact: "" }),
  missingElements: z.array(z.string()).default([]),
  toneWarnings: z.array(z.string()).default([]),
  toneScore: z.number().default(5),
  rewrittenFeedback: z.string().default(""),
  agreementsFound: z.array(z.string()).default([]),
  nextStepsFound: z.array(z.string()).default([]),
});

export type F07Input = z.infer<typeof inputSchema>;
export type F07Output = z.infer<typeof outputSchema>;

export const PROMPT_F07_LEGACY_FEEDBACK: PromptDefinition<F07Input, F07Output> = {
  code: "PROMPT_F07_LEGACY_FEEDBACK_ANALYSIS",
  version: "v1.0.0",
  feature: "F-07",
  model: "google/gemini-2.5-flash",
  temperature: 0.3,
  system: `Sua tarefa é analisar um feedback HISTÓRICO da empresa e:
1. Detectar dados pessoais ou sensíveis (CPF, RG, salário, saúde, família, religião, política) — liste em lgpdAlerts e NUNCA os copie para outros campos.
2. Mapear o conteúdo no modelo SBI (Situação/Comportamento/Impacto) em sbiMapping. Se não identificar, preencha "Não identificado".
3. missingElements: liste o que falta para o feedback ser saudável (ex.: "sem impacto claro", "sem próximo passo").
4. toneWarnings: trechos exatos que atacam o caráter ou generalizam. toneScore: 0-10 (10 = construtivo, 0 = agressivo).
5. rewrittenFeedback: reescreva o feedback em modelo SBI humanizado, sem os dados sensíveis.
6. agreementsFound / nextStepsFound: extraia acordos e próximos passos existentes.

Regras:
- Se o texto for muito curto, marque em missingElements.
- Idioma: pt-BR.
- Nunca invente eventos que não estejam no texto.`,
  inputSchema,
  outputSchema,
  buildUserMessage: (i) => `Feedback histórico:
"""${i.legacyFeedbackText}"""

Devolva JSON conforme o schema.`,
  changelog: ["v1.0.0 — versão inicial, contrato alinhado à KB prompt-engineering.md"],
};
