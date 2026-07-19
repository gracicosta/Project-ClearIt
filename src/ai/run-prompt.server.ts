import { generateText, Output, NoObjectGeneratedError } from "ai";
import { jsonrepair } from "jsonrepair";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { clarifyPersona } from "./persona";

export interface PromptDefinition<TIn, TOut> {
  code: string;
  version: string;
  feature: string;
  model: string;
  temperature: number;
  /** persona-specific addendum; a persona global do Clarify é aplicada sempre */
  system: string;
  inputSchema: z.ZodType<TIn, z.ZodTypeDef, unknown>;
  outputSchema: z.ZodType<TOut, z.ZodTypeDef, unknown>;
  buildUserMessage: (input: TIn) => string;
  /** Instrução extra em caso de fallback JSON manual (por ex. "responda apenas JSON válido") */
  jsonHint?: string;
  changelog: string[];
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start !== -1 && end !== -1 ? body.slice(start, end + 1) : body;
}

/**
 * Executor central de prompts. Valida entrada, aplica persona global,
 * chama o AI Gateway e valida a saída pelo schema Zod.
 * Loga metadados (code, version, latência) sem expor conteúdo.
 */
export async function runPrompt<TIn, TOut>(
  prompt: PromptDefinition<TIn, TOut>,
  input: TIn,
): Promise<TOut> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente. Configure o AI Gateway.");

  const parsedInput = prompt.inputSchema.parse(input);
  const gateway = createLovableAiGatewayProvider(apiKey);
  const system = `${clarifyPersona}\n\n---\n\n${prompt.system}`;
  const userMessage = prompt.buildUserMessage(parsedInput);

  const started = Date.now();
  try {
    // Estratégia: chamamos o modelo em modo texto e parseamos JSON manualmente.
    // Isso é mais robusto que Output.object com Gemini, que às vezes devolve o
    // array principal sem o wrapper esperado ou emite lixo depois do JSON.
    const res = await generateText({
      model: gateway(prompt.model),
      system: `${system}\n\nResponda SEMPRE com um único JSON válido, sem markdown, sem comentários, sem texto antes ou depois.${prompt.jsonHint ? "\n" + prompt.jsonHint : ""}`,
      prompt: userMessage,
      temperature: prompt.temperature,
    });
    const raw = extractJson(res.text ?? "");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = JSON.parse(jsonrepair(raw));
    }
    let output: TOut | undefined;
    // Alguns modelos ignoram o wrapper e devolvem apenas o array principal.
    if (Array.isArray(parsed) && prompt.outputSchema instanceof z.ZodObject) {
      for (const key of ["objectives", "items", "results", "data", "output", "findings"]) {
        const attempt = prompt.outputSchema.safeParse({ [key]: parsed });
        if (attempt.success) {
          output = attempt.data as TOut;
          break;
        }
      }
    }
    if (output === undefined) {
      output = prompt.outputSchema.parse(parsed);
    }
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        promptCode: prompt.code,
        version: prompt.version,
        model: prompt.model,
        latencyMs: Date.now() - started,
        ok: true,
      }),
    );
    return output as TOut;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        promptCode: prompt.code,
        version: prompt.version,
        model: prompt.model,
        latencyMs: Date.now() - started,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    throw err;
  }
}
