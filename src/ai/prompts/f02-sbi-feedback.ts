import { z } from "zod";
import type { PromptDefinition } from "../run-prompt.server";

const inputSchema = z.object({
  rawFeedback: z.string().min(10),
  feedbackType: z.enum(["recognition", "corrective", "alignment"]).default("corrective"),
});

const outputSchema = z.object({
  situation: z.string().default(""),
  behavior: z.string().default(""),
  impact: z.string().default(""),
  rewrittenFeedback: z.string().default(""),
  activeListeningQuestion: z.string().default("Como você está vendo essa situação?"),
  managerSelfFeedbackQuestion: z.string().default("Como eu poderia te apoiar melhor?"),
  languageWarnings: z.array(z.string()).default([]),
  suggestedNextStep: z.string().default(""),
});

export type F02Input = z.infer<typeof inputSchema>;
export type F02Output = z.infer<typeof outputSchema>;

export const PROMPT_F02_SBI_FEEDBACK: PromptDefinition<F02Input, F02Output> = {
  code: "PROMPT_F02_SBI_FEEDBACK",
  version: "v1.0.0",
  feature: "F-02",
  model: "google/gemini-2.5-flash",
  temperature: 0.3,
  system: `Sua tarefa é transformar um relato livre em FEEDBACK estruturado pelo modelo SBI (Situação · Comportamento · Impacto), no padrão ClearIT.

Regras inegociáveis:
- Nunca ataque o caráter da pessoa. Foque em fatos observáveis.
- Remova generalizações como "sempre", "nunca", "todo mundo acha".
- Situação: onde/quando o fato ocorreu.
- Comportamento: fato observável, verbo de ação, sem julgamento.
- Impacto: efeito concreto no time, cliente ou entrega.
- rewrittenFeedback: uma versão pronta para o gestor falar, empática e direta, em 2-4 frases.
- activeListeningQuestion: pergunta que deve ser feita ANTES da fala do gestor.
- languageWarnings: liste trechos exatos do relato original que atacam o caráter ou generalizam.
- suggestedNextStep: sugestão de acordo co-construído com o liderado.
- Nunca inclua CPF, salário, dados de saúde ou família. Se aparecerem, sinalize em languageWarnings e omita.
- Idioma: pt-BR.`,
  inputSchema,
  outputSchema,
  buildUserMessage: (i) => `Tipo de feedback: ${i.feedbackType}

Relato bruto do gestor:
"""${i.rawFeedback}"""

Estruture em SBI e devolva JSON conforme o schema.`,
  changelog: ["v1.0.0 — versão inicial"],
};
