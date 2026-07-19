import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PROMPT_MEETING_SUMMARY } from "@/ai/prompts/meeting-summary";
import { PROMPT_F05_LGPD_AUDITOR } from "@/ai/prompts/f05-lgpd-auditor";
import { runPrompt } from "@/ai/run-prompt.server";
import { maskSensitive, scanSensitive } from "./privacy";

const IdInput = z.object({ recordingId: z.string().uuid() });

/**
 * Transcribe an uploaded recording by fetching the stored audio (admin) and
 * forwarding it to Lovable AI's speech-to-text endpoint. The transcript is
 * masked for LGPD-sensitive data before being persisted.
 */
export const transcribeRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IdInput.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente.");

    const { supabase, userId } = context;
    const { data: rec, error: recErr } = await supabase
      .from("recordings")
      .select("id, manager_id, audio_path, audio_mime")
      .eq("id", data.recordingId)
      .maybeSingle();
    if (recErr || !rec) throw new Error("Gravação não encontrada.");
    if (rec.manager_id !== userId) throw new Error("Sem permissão.");
    if (!rec.audio_path) throw new Error("Áudio ausente.");

    await supabase.from("recordings").update({ status: "transcribing", error_message: null }).eq("id", rec.id);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: blob, error: dlErr } = await supabaseAdmin.storage
        .from("recordings")
        .download(rec.audio_path);
      if (dlErr || !blob) throw new Error(dlErr?.message ?? "Falha ao baixar áudio.");

      const mime = rec.audio_mime ?? blob.type ?? "audio/webm";
      const ext =
        mime.includes("mp4") ? "mp4" :
        mime.includes("mpeg") ? "mp3" :
        mime.includes("wav") ? "wav" :
        mime.includes("ogg") ? "ogg" :
        mime.includes("m4a") ? "m4a" :
        "webm";

      const form = new FormData();
      form.append("model", "openai/gpt-4o-mini-transcribe");
      form.append("file", new File([blob], `recording.${ext}`, { type: mime }));

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`Transcrição falhou (${resp.status}): ${body}`);
      }
      const json = (await resp.json()) as { text?: string };
      const raw = json.text ?? "";
      const masked = maskSensitive(raw);
      const sensitive = scanSensitive(raw, "transcript");

      // F-05 · Auditor LGPD via IA sobre a transcrição
      let aiFindings: Array<{ category: string; reason: string; snippet: string }> = [];
      let aiRisk: "none" | "low" | "medium" | "high" | "critical" = "none";
      if (raw.trim().length > 20) {
        try {
          const audit = await runPrompt(PROMPT_F05_LGPD_AUDITOR, {
            text: raw,
            sourceType: "recording" as const,
          });
          aiRisk = audit.riskLevel;
          aiFindings = audit.findings ?? [];
        } catch {
          // regex já cobre casos óbvios
        }
      }

      await supabase
        .from("recordings")
        .update({
          transcript: masked,
          status: "transcribed",
          sensitive_flags: sensitive.length > 0 ? sensitive : null,
        })
        .eq("id", rec.id);

      const shouldLogAi = aiRisk === "medium" || aiRisk === "high" || aiRisk === "critical";
      const incidents = [
        ...sensitive.slice(0, 20).map((s) => ({
          user_id: userId,
          source_type: "recording" as const,
          source_id: rec.id,
          field: s.field,
          reason: s.reason,
          masked_snippet: s.snippet.slice(0, 40),
        })),
        ...(shouldLogAi
          ? aiFindings.slice(0, 20).map((f) => ({
              user_id: userId,
              source_type: "recording" as const,
              source_id: rec.id,
              field: `ia:${f.category}`,
              reason: `IA (${aiRisk}): ${f.reason}`.slice(0, 200),
              masked_snippet: f.snippet.slice(0, 40),
            }))
          : []),
      ];
      if (incidents.length > 0) {
        await supabase.from("sensitive_incidents").insert(incidents);
      }

      return { ok: true, transcript: masked, lgpdRisk: aiRisk };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro na transcrição.";
      await supabase.from("recordings").update({ status: "error", error_message: msg }).eq("id", rec.id);
      throw new Error(msg);
    }
  });

export const summarizeRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rec } = await supabase
      .from("recordings")
      .select("id, manager_id, transcript, kind")
      .eq("id", data.recordingId)
      .maybeSingle();
    if (!rec) throw new Error("Gravação não encontrada.");
    if (rec.manager_id !== userId) throw new Error("Sem permissão.");
    if (!rec.transcript || rec.transcript.trim().length < 20) {
      throw new Error("Transcrição vazia ou muito curta.");
    }

    await supabase.from("recordings").update({ status: "summarizing" }).eq("id", rec.id);

    try {
      const output = await runPrompt(PROMPT_MEETING_SUMMARY, {
        kind: rec.kind,
        transcript: rec.transcript,
      });

      // clamp caller-stated limits in code, not schema
      const key_topics = output.key_topics.slice(0, 10);
      const action_items = output.action_items.slice(0, 10);
      const cleanedSummary = maskSensitive(output.summary);

      await supabase
        .from("recordings")
        .update({
          summary: cleanedSummary,
          key_topics,
          action_items,
          suggested_blocks: output.one_on_one_blocks,
          suggested_sbi: output.sbi,
          status: "ready",
        })
        .eq("id", rec.id);

      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao resumir.";
      await supabase.from("recordings").update({ status: "error", error_message: msg }).eq("id", rec.id);
      throw new Error(msg);
    }
  });
