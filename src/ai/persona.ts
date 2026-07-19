import clarifySystemPrompt from "../../agents/clarify/system_prompt.md?raw";

/**
 * Persona compartilhada do agente Clarify.
 * Carregada em build-time a partir de `agents/clarify/system_prompt.md`
 * conforme KB `docs/knowledge-base/prompt-engineering.md`.
 */
export const clarifyPersona = clarifySystemPrompt;
