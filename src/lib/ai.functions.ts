import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROMPT_F07_LEGACY_FEEDBACK } from "@/ai/prompts/f07-legacy-feedback";
import { PROMPT_F02_SBI_FEEDBACK } from "@/ai/prompts/f02-sbi-feedback";
import { PROMPT_F01_ONE_ON_ONE_PREP } from "@/ai/prompts/f01-one-on-one-prep";
import { PROMPT_F03_PDI_OBJECTIVES } from "@/ai/prompts/f03-pdi-objectives";
import { PROMPT_F05_LGPD_AUDITOR } from "@/ai/prompts/f05-lgpd-auditor";
import { runPrompt } from "@/ai/run-prompt.server";

/**
 * F-07 · Análise de feedback histórico (KB prompt-engineering.md).
 */
export const analyzeLegacyFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    PROMPT_F07_LEGACY_FEEDBACK.inputSchema.parse(
      // aceita tanto o campo novo (legacyFeedbackText) quanto o legado (text)
      typeof (data as { text?: unknown } | null)?.text === "string"
        ? { legacyFeedbackText: (data as { text: string }).text }
        : data,
    ),
  )
  .handler(async ({ data }) => runPrompt(PROMPT_F07_LEGACY_FEEDBACK, data));

/**
 * F-02 · Estruturar feedback livre em SBI.
 */
export const structureSbiFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PROMPT_F02_SBI_FEEDBACK.inputSchema.parse(data))
  .handler(async ({ data }) => runPrompt(PROMPT_F02_SBI_FEEDBACK, data));

/**
 * F-01 · Sugerir pauta completa de 1:1.
 */
export const generateOneOnOneAgenda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PROMPT_F01_ONE_ON_ONE_PREP.inputSchema.parse(data))
  .handler(async ({ data }) => runPrompt(PROMPT_F01_ONE_ON_ONE_PREP, data));

/**
 * F-03 · Sugerir até 3 objetivos de PDI. Aplica clamp em código.
 */
export const suggestPdiObjectives = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PROMPT_F03_PDI_OBJECTIVES.inputSchema.parse(data))
  .handler(async ({ data }) => {
    const out = await runPrompt(PROMPT_F03_PDI_OBJECTIVES, data);
    return { ...out, objectives: out.objectives.slice(0, 3) };
  });

/**
 * F-05 · Auditor LGPD — analisa texto antes de persistir feedback/1:1/transcrição.
 * Retorna nível de risco, achados categorizados e versão sanitizada.
 */
export const auditLgpd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PROMPT_F05_LGPD_AUDITOR.inputSchema.parse(data))
  .handler(async ({ data }) => runPrompt(PROMPT_F05_LGPD_AUDITOR, data));
