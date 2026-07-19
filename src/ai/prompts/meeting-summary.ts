import { z } from "zod";
import type { PromptDefinition } from "../run-prompt.server";

const inputSchema = z.object({
  kind: z.string().default("one_on_one"),
  transcript: z.string().min(20),
});

const sbiObject = z.object({
  situation: z.string().default(""),
  behavior: z.string().default(""),
  impact: z.string().default(""),
});

const outputSchema = z.object({
  summary: z.string().default(""),
  key_topics: z.array(z.string()).default([]),
  action_items: z
    .array(
      z.object({
        description: z.string(),
        owner: z.string().optional(),
        due_date: z.string().optional(),
      }),
    )
    .default([]),
  one_on_one_blocks: z
    .object({
      checkin: z.string().default(""),
      agenda: z.string().default(""),
      deliveries: z.string().default(""),
      development: z.string().default(""),
      agreements: z.string().default(""),
    })
    .default({ checkin: "", agenda: "", deliveries: "", development: "", agreements: "" }),
  sbi: z
    .preprocess((v) => {
      if (typeof v === "string") {
        try {
          const parsed = JSON.parse(v);
          if (parsed && typeof parsed === "object") return parsed;
        } catch {
          /* fallthrough */
        }
        return { situation: v, behavior: "", impact: "" };
      }
      return v ?? {};
    }, sbiObject)
    .default({ situation: "", behavior: "", impact: "" }),
});

export type MeetingSummaryInput = z.infer<typeof inputSchema>;
export type MeetingSummaryOutput = z.infer<typeof outputSchema>;

export const PROMPT_MEETING_SUMMARY: PromptDefinition<MeetingSummaryInput, MeetingSummaryOutput> = {
  code: "PROMPT_MEETING_SUMMARY",
  version: "v1.0.0",
  feature: "F-01/F-04",
  model: "google/gemini-2.5-flash",
  temperature: 0.3,
  system: `Sua tarefa é analisar transcrições de reuniões 1:1 e feedbacks entre gestor e liderado, e produzir saída estruturada em pt-BR.

Regras:
- Nunca inclua CPF, RG, salário, dados de saúde ou família nas saídas.
- Se um bloco não tiver informação, escreva "Não abordado nesta conversa".
- Seja objetivo: bullets curtos, sem floreio.
- action_items: apenas compromissos claros (o quê + responsável + prazo quando existir).
- sbi: reestruture o feedback dado no modelo Situação/Comportamento/Impacto. Sem feedback = "Não identificado".
- one_on_one_blocks: mapeie o conteúdo aos 5 blocos do método ClearIT (checkin, agenda, deliveries, development, agreements).`,
  inputSchema,
  outputSchema,
  buildUserMessage: (i) =>
    `Tipo da gravação: ${i.kind}

Transcrição:
"""${i.transcript}"""

Limites: no máximo 10 tópicos em key_topics e 10 itens em action_items.`,
  changelog: ["v1.0.0 — extração para biblioteca de prompts versionada"],
};
