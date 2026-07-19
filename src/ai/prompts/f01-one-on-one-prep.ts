import { z } from "zod";
import type { PromptDefinition } from "../run-prompt.server";

const inputSchema = z.object({
  managerName: z.string().default("Gestor"),
  employeeName: z.string(),
  meetingContext: z.string().default(""),
  previousAgreements: z.array(z.string()).default([]),
  developmentFocus: z.string().default(""),
});

const sectionSchema = z.object({
  key: z.enum(["human_checkin", "employee_agenda", "deliveries", "development", "agreements"]),
  title: z.string().default(""),
  questions: z.array(z.string()).default([]),
});

const outputSchema = z.object({
  language: z.string().default("pt-BR"),
  meetingTitle: z.string().default(""),
  preparationQuestion: z.string().default(""),
  suggestedCadence: z.string().default("quinzenal"),
  sections: z.array(sectionSchema).default([]),
  developmentQuestions: z.array(z.string()).default([]),
  agreementGuidance: z
    .object({
      requiresOwner: z.boolean().default(true),
      requiresDueDate: z.boolean().default(true),
      example: z.string().default(""),
    })
    .default({ requiresOwner: true, requiresDueDate: true, example: "" }),
  warnings: z.array(z.string()).default([]),
});

export type F01Input = z.infer<typeof inputSchema>;
export type F01Output = z.infer<typeof outputSchema>;

export const PROMPT_F01_ONE_ON_ONE_PREP: PromptDefinition<F01Input, F01Output> = {
  code: "PROMPT_F01_ONE_ON_ONE_PREP",
  version: "v1.0.0",
  feature: "F-01",
  model: "google/gemini-2.5-flash",
  temperature: 0.4,
  system: `Sua tarefa é gerar um ROTEIRO estruturado de reunião 1:1 no método ClearIT.
Sempre inclua os 5 blocos obrigatórios na ordem:
1. human_checkin — Check-in Humano
2. employee_agenda — Pauta do Liderado
3. deliveries — Status de Entregas e Obstáculos
4. development — Desenvolvimento, Carreira e Feedback
5. agreements — Acordos e Próximos Passos

Regras:
- Priorize perguntas ABERTAS. Nada de "sim/não".
- Nunca use linguagem de cobrança ou microgestão.
- Inclua AO MENOS 1 pergunta de desenvolvimento em developmentQuestions.
- Acordos precisam de responsável e prazo — sempre lembre no agreementGuidance.example.
- Se faltarem dados, inclua avisos em warnings; nunca invente informações sobre o liderado.
- Nunca inclua dados sensíveis (CPF, salário, saúde, família) na saída.
- Idioma: pt-BR.`,
  inputSchema,
  outputSchema,
  buildUserMessage: (i) => `Contexto:
- Gestor: ${i.managerName}
- Liderado: ${i.employeeName}
- Contexto da reunião: ${i.meetingContext || "não informado"}
- Foco de desenvolvimento: ${i.developmentFocus || "não informado"}
- Acordos anteriores (últimos): ${i.previousAgreements.length ? i.previousAgreements.map((a) => `• ${a}`).join("\n") : "nenhum registrado"}

Gere o roteiro completo em JSON conforme o schema.`,
  changelog: ["v1.0.0 — versão inicial"],
};
