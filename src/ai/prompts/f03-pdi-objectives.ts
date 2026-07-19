import { z } from "zod";
import type { PromptDefinition } from "../run-prompt.server";

const inputSchema = z.object({
  employeeName: z.string().default("Liderado"),
  employeeLevel: z.string().default("L1"),
  targetCompetencies: z.array(z.string()).default([]),
  developmentContext: z.string().default(""),
});

const objectiveSchema = z.object({
  competency: z.string().default(""),
  objective: z.string().default(""),
  actions: z.array(z.string()).default([]),
  verificationMilestone: z.string().default(""),
  managerSupport: z.string().default(""),
  dueDateSuggestion: z.string().default(""),
});

const outputSchema = z.object({
  objectives: z.array(objectiveSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export type F03Input = z.infer<typeof inputSchema>;
export type F03Output = z.infer<typeof outputSchema>;

export const PROMPT_F03_PDI_OBJECTIVES: PromptDefinition<F03Input, F03Output> = {
  code: "PROMPT_F03_PDI_OBJECTIVES",
  version: "v1.0.0",
  feature: "F-03",
  model: "google/gemini-2.5-flash",
  temperature: 0.4,
  system: `Sua tarefa é sugerir objetivos de PDI para um liderado, alinhados ao Framework de Levels da ClearIT.

Regras:
- Máximo de 3 objetivos. Se sugerir mais, o sistema descarta o excedente.
- Cada objetivo DEVE ter competência do Levels, ação concreta, marco de verificação e suporte do gestor.
- Cada objetivo DEVE ser comportamental (não genérico como "estudar mais").
- actions: 1 a 3 ações concretas por objetivo.
- verificationMilestone: como o gestor vai saber que evoluiu (evento, entrega, comportamento observável).
- managerSupport: o que o gestor se compromete a fazer.
- dueDateSuggestion: horizonte razoável (ex.: "3 meses", "próxima reunião trimestral").
- Nunca sugira métricas de vaidade sem comportamento por trás.
- Idioma: pt-BR. Sem dados sensíveis.`,
  inputSchema,
  outputSchema,
  buildUserMessage: (i) => `Liderado: ${i.employeeName}
Level atual: ${i.employeeLevel}
Competências-alvo: ${i.targetCompetencies.length ? i.targetCompetencies.join(", ") : "não especificadas"}
Contexto de desenvolvimento: ${i.developmentContext || "não informado"}

Devolva JSON com até 3 objetivos.`,
  changelog: ["v1.0.0 — versão inicial"],
};
