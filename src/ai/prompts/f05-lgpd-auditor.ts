import { z } from "zod";
import type { PromptDefinition } from "../run-prompt.server";

const inputSchema = z.object({
  text: z.string().min(1),
  sourceType: z.enum(["feedback", "one_on_one", "recording", "pdi", "legacy"]).default("feedback"),
});

const findingSchema = z.object({
  category: z.string().default("outro"),
  reason: z.string().default(""),
  snippet: z.string().default(""),
  suggestion: z.string().default(""),
});

const outputSchema = z.object({
  riskLevel: z.enum(["none", "low", "medium", "high", "critical"]).default("none"),
  findings: z.array(findingSchema).default([]),
  sanitizedText: z.string().default(""),
  summary: z.string().default(""),
});

export type F05Input = z.infer<typeof inputSchema>;
export type F05Output = z.infer<typeof outputSchema>;

export const PROMPT_F05_LGPD_AUDITOR: PromptDefinition<F05Input, F05Output> = {
  code: "PROMPT_F05_LGPD_AUDITOR",
  version: "v1.0.0",
  feature: "F-05",
  model: "google/gemini-2.5-flash",
  temperature: 0.1,
  system: `Você é um auditor de dados sensíveis conforme a LGPD (Lei 13.709/18) aplicada ao contexto de RH e liderança.

Classifique o texto quanto ao risco de conter dados pessoais sensíveis ou informação que não deve ser registrada em ferramenta de gestão.

Categorias sensíveis (dados pessoais sensíveis LGPD art. 5º, II):
- saude (diagnósticos, medicamentos, transtornos, CIDs, tratamentos)
- financeiro (salário exato, dívidas, valores em R$, patrimônio)
- documento (CPF, RG, CNPJ, CNH, passaporte, cartão)
- familia (divórcio, gravidez, aborto, filhos, cônjuge, luto)
- religiao (crença, denominação religiosa, prática religiosa)
- politica (partido, orientação política, filiação)
- sexualidade (orientação sexual, identidade de gênero)
- etnia (raça, cor, origem étnica, nacionalidade quando discriminatório)
- juridico (processos, ações trabalhistas, denúncias criminais)
- ataque_carater (linguagem que ataca a pessoa em vez do comportamento)
- outro (qualquer outro dado sensível não listado)

Regras:
- riskLevel: "none" (nada sensível), "low" (menção genérica), "medium" (dado identificável parcial), "high" (dado sensível claro), "critical" (documento oficial ou saúde/sexualidade explícita).
- findings: liste cada trecho problemático com category (uma das acima), reason curto, snippet com o texto EXATO encontrado (máx 60 chars) e suggestion de reescrita neutra.
- sanitizedText: devolva o texto reescrito substituindo cada trecho sensível por marcadores como [dado de saúde removido], [valor financeiro removido], mantendo o restante intacto e o sentido preservado quando possível.
- summary: 1 frase explicando o veredito para o gestor.
- Se nada sensível for encontrado, retorne riskLevel "none", findings [], sanitizedText igual ao texto original e summary confirmando conformidade.
- Idioma: pt-BR.`,
  inputSchema,
  outputSchema,
  buildUserMessage: (i) => `Origem: ${i.sourceType}

Texto para auditoria:
"""${i.text}"""

Devolva JSON conforme o schema.`,
  changelog: ["v1.0.0 — auditor LGPD inicial"],
};
