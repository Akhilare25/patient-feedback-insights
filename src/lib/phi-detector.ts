/**
 * Lightweight client-side PHI detector. Warns if text appears to contain
 * phone numbers, emails, or name-like patterns. Not a substitute for proper
 * de-identification; used to prompt users to confirm before submit.
 */

const PHONE_REG = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/;
const EMAIL_REG = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
/** Simple heuristic: "Mr. Smith", "Dr. Jane", or two consecutive capitalized words (possible name) */
const NAME_LIKE_REG =
  /\b(?:Mr|Mrs|Ms|Dr|Prof)\.\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b|\b(?:Patient|pt)\s*:\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/i;

export type PHICheckResult = {
  hasPotentialPHI: boolean;
  reasons: string[];
};

export function detectPotentialPHI(items: { text: string }[]): PHICheckResult {
  const reasons: string[] = [];
  const combined = items.map((i) => i.text).join("\n");

  if (PHONE_REG.test(combined)) reasons.push("Possible phone number(s) detected.");
  if (EMAIL_REG.test(combined)) reasons.push("Possible email address(es) detected.");
  if (NAME_LIKE_REG.test(combined)) reasons.push("Possible name or title+name pattern detected.");

  return {
    hasPotentialPHI: reasons.length > 0,
    reasons
  };
}
