/**
 * Client-side lightweight regex pre-check for obvious sensitive data.
 * The authoritative filter runs server-side in privacy.functions.ts.
 */
export type SensitiveMatch = { field: string; reason: string; snippet: string };

const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CNPJ_RE = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const RG_RE = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dxX]\b/g;
const CID_RE = /\b[A-TV-Z]\d{2}(?:\.\d)?\b/g;
const SALARY_RE = /\b(R\$\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|sal[aá]rio\s+de\s+R?\$?\s?\d+)/gi;

const SENSITIVE_KEYWORDS = [
  "câncer", "cancer", "depress", "ansiedade", "bipolar", "hiv", "aids",
  "grávida", "gravidez", "aborto", "divórcio", "divorcio",
  "religião", "religiao", "orientação sexual", "orientacao sexual",
];

export function scanSensitive(text: string, fieldName: string): SensitiveMatch[] {
  if (!text) return [];
  const matches: SensitiveMatch[] = [];
  const push = (re: RegExp, reason: string) => {
    for (const m of text.matchAll(re)) {
      matches.push({ field: fieldName, reason, snippet: m[0] });
    }
  };
  push(CPF_RE, "CPF detectado");
  push(CNPJ_RE, "CNPJ detectado");
  push(RG_RE, "Possível RG detectado");
  push(CID_RE, "Código CID (diagnóstico médico) detectado");
  push(SALARY_RE, "Valor salarial detectado");
  const lower = text.toLowerCase();
  for (const kw of SENSITIVE_KEYWORDS) {
    if (lower.includes(kw)) {
      const i = lower.indexOf(kw);
      matches.push({ field: fieldName, reason: "Palavra sensível", snippet: text.slice(Math.max(0, i - 10), i + kw.length + 10) });
    }
  }
  return matches;
}

export function maskSensitive(text: string): string {
  return text
    .replace(CPF_RE, "[CPF removido]")
    .replace(CNPJ_RE, "[CNPJ removido]")
    .replace(RG_RE, "[RG removido]")
    .replace(CID_RE, "[CID removido]")
    .replace(SALARY_RE, "[valor removido]");
}

/** Detects language that attacks character rather than behavior (F-02). */
export const ATTACK_PATTERNS = [
  /\bvocê sempre\b/i,
  /\bvocê nunca\b/i,
  /\bisso é inaceitável\b/i,
  /\bvocê é (desorganizado|preguiçoso|incompetente|difícil|imaturo|arrogante)\b/i,
  /\bque absurdo\b/i,
  /\bfalta de profissionalismo\b/i,
];

export function detectAttackLanguage(text: string): string[] {
  const flags: string[] = [];
  for (const re of ATTACK_PATTERNS) {
    const m = text.match(re);
    if (m) flags.push(m[0]);
  }
  return flags;
}
