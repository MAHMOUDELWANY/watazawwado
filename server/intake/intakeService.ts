/**
 * ====================================================================
 * WATAZAWWADO — ADAPTIVE INTAKE SERVICE
 * File: server/intake/intakeService.ts
 *
 * Role: Turns a natural conversation into a structured Student Learning
 *       Profile + Service Assessment via the Gemini SDK's STRUCTURED
 *       OUTPUT, then validates it strictly.
 *
 * The model is NEVER trusted to produce prices. It only classifies.
 * ====================================================================
 */

import { GoogleGenAI } from '@google/genai';
import {
  INTAKE_RESPONSE_SCHEMA,
  validateIntakeOutput,
  type IntakeModelOutput,
  type ValidationResult
} from './intakeSchema.js';

export interface IntakeTurnMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const INTAKE_OPENING_AR =
  'أهلًا بيك ❤️\nقولي بس إيه اللي حابب تتعلمه أو تطوره؟ حتى لو مش عارف اسم المجال بالظبط، احكيلي بطريقتك.';

export const INTAKE_OPENING_EN =
  'Welcome ❤️\nJust tell me what you would like to learn or improve — even if you are not sure of the exact name of the field. Describe it in your own way.';

/**
 * System instruction. Emphasises: human tone, adaptivity, no re-asking,
 * no price invention, no stereotyping, no collection of sensitive data.
 */
export function buildIntakeSystemInstruction(): string {
  return `You are the Watazawwado intake companion — a warm, human teaching assistant speaking on behalf of Ustadh Mahmoud, a 1-to-1 teacher of Quran, Islamic Studies, Arabic and English.

VOICE
- Calm, respectful, educational, culturally appropriate. Mirrors the student's own language (Egyptian Arabic, MSA, or English) and register (casual vs formal).
- Never sound like a corporate chatbot, an application form, an interrogation, an AI sales agent, or a pricing negotiator.
- Keep replies short (2-4 sentences). One idea at a time.

CONVERSATION RULES
- Let the student describe their need naturally BEFORE categorising it.
- Ask ONLY adaptive follow-up questions that reduce meaningful uncertainty. If the student already provided a fact, NEVER ask for it again.
- Example: if they say "English for IELTS", do NOT ask "which subject?". Ask about exam date, prior attempts, the score, which parts need work.
- Example: if they say "Arabic to improve grammar", clarify the actual intended outcome (reading classical texts? writing? Qur'anic comprehension?).
- Ask at most ONE focused question per turn.
- Do NOT collect unnecessary sensitive personal information. Never ask about income, wealth, budget, nationality income level, or demographics for pricing.
- Never stereotype personality, intelligence, financial status, religious commitment, or ability from age/gender.
- Do not promise outcomes, invent credentials, invent availability, or invent policies.

ASSESSMENT PHILOSOPHY (categorical classification only — NEVER a price)
- Identify the base service category: quran | islamic_studies | arabic | english.
- Consider learning goal, current level, target, specific skills, use case, complexity, preparation required, customization, specialization, and meaningful time constraints.
- Level is only ONE input; never price from level alone.
- If the request requires unusual expertise, heavy preparation, or high customization, set specialization/complexity/preparation/customization accordingly and mark uncertain=true.
- Distinguish clearly which facts are student-stated (stated_fields) versus AI-inferred (inferred_fields), and set uncertain=true when you are not sure.
- ONLY produce an assessment when you have enough information; otherwise leave assessment null and set is_complete=false.

Return ONLY the structured JSON conforming to the provided schema. Never include any price, amount, discount, budget, or currency field.`;
}

/** Build the contents array for a Gemini request from the conversation. */
export function buildIntakeContents(messages: IntakeTurnMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/** Extracts a JSON object from a model text that should already be JSON. */
export function parseModelJson(text: string): any {
  if (!text) return null;
  let t = text.trim();
  // Tolerate accidental code fences.
  if (t.startsWith('```')) {
    t = t.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
  }
  try {
    return JSON.parse(t);
  } catch {
    // Last resort: take the outermost JSON object.
    const first = t.indexOf('{');
    const last = t.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(t.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export interface RunIntakeResult {
  ok: boolean;
  errors: string[];
  output?: IntakeModelOutput;
}

/**
 * ====================================================================
 * TEMPORARY DIAGNOSTIC INSTRUMENTATION (provider error capture)
 * --------------------------------------------------------------------
 * Purpose: record ONLY sanitized Google GenAI provider error metadata in
 * runtime logs so a production failure can be classified into one of:
 *   - RESOURCE_EXHAUSTED / rate limit / quota
 *   - UNAVAILABLE / temporary provider overload
 *   - INVALID_ARGUMENT / request or structured-output rejection
 *   - MODEL_NOT_FOUND / model availability
 *   - OTHER
 *
 * It NEVER logs secrets or user data: no API key, no Authorization header,
 * no access token, no request body, no conversation messages, and no raw
 * provider payload. Only a flat, redacted metadata object is emitted.
 *
 * NOTE: This block is intentionally self-contained and behavior-neutral so
 * it can be removed cleanly once the production cause is identified.
 * ====================================================================
 */

export type ProviderErrorClass =
  | 'RESOURCE_EXHAUSTED_OR_RATE_LIMIT'
  | 'UNAVAILABLE_OR_OVERLOAD'
  | 'INVALID_ARGUMENT'
  | 'MODEL_NOT_FOUND'
  | 'OTHER';

export interface SanitizedProviderError {
  name: string;
  constructorName: string;
  status: number | string | null;
  code: number | string | null;
  providerStatus: string | null;
  message: string;
  classification: ProviderErrorClass;
}

/** Patterns that must never reach the logs; replaced with placeholders. */
const PROVIDER_SECRET_PATTERNS: Array<[RegExp, string]> = [
  // Google API keys (e.g. AIza...).
  [/AIza[0-9A-Za-z_\-]{10,}/g, '[REDACTED_API_KEY]'],
  // key= / api_key= / apikey= query-string secrets.
  [/([?&](?:key|api_?key)=)[^&\s"']+/gi, '$1[REDACTED]'],
  // Bearer tokens.
  [/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]'],
  // OAuth-style token query params.
  [/\b(access_token|refresh_token|id_token|client_secret)=[^&\s"']+/gi, '$1=[REDACTED]'],
  // JWTs (three base64url segments).
  [/eyJ[A-Za-z0-9_\-]{6,}\.[A-Za-z0-9_\-]{6,}\.[A-Za-z0-9_\-]{6,}/g, '[REDACTED_JWT]'],
];

/** Redact secrets from an arbitrary string and bound its length. */
export function sanitizeProviderErrorMessage(raw: unknown, maxLen = 600): string {
  let s = typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
  for (const [pattern, replacement] of PROVIDER_SECRET_PATTERNS) {
    s = s.replace(pattern, replacement);
  }
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length > maxLen) s = `${s.slice(0, maxLen)}…[truncated]`;
  return s;
}

function classifyProviderError(
  status: number | string | null,
  code: number | string | null,
  providerStatus: string | null,
  message: string
): ProviderErrorClass {
  const tokens = [status, code, providerStatus].filter((v) => v != null).map((v) => String(v).toUpperCase()).join(' ');
  const msg = (message || '').toUpperCase();
  const haystack = `${tokens} ${msg}`;

  if (/RESOURCE_EXHAUSTED|RATE[_ ]?LIMIT|QUOTA|429|EXHAUSTED/.test(haystack)) {
    return 'RESOURCE_EXHAUSTED_OR_RATE_LIMIT';
  }
  if (/UNAVAILABLE|OVERLOAD|503|SERVICE UNAVAILABLE|TEMPORARILY/.test(haystack)) {
    return 'UNAVAILABLE_OR_OVERLOAD';
  }
  if (/INVALID_ARGUMENT|400|INVALID_JSON|SCHEMA|INVALID VALUE/.test(haystack)) {
    return 'INVALID_ARGUMENT';
  }
  if (/NOT_FOUND|MODEL_NOT_FOUND|404|NOT FOUND|UNSUPPORTED MODEL|MODEL.*NOT.*FOUND/.test(haystack)) {
    return 'MODEL_NOT_FOUND';
  }
  return 'OTHER';
}

function asScalar(v: unknown): number | string | null {
  if (typeof v === 'number' || typeof v === 'string') return v;
  return null;
}

/**
 * Convert a thrown provider error into a flat, sanitized, log-safe object.
 * Reads only top-level scalar metadata; never serializes nested payloads,
 * request context, or user content.
 */
export function sanitizeProviderError(err: any): SanitizedProviderError {
  const name = typeof err?.name === 'string' && err.name ? err.name : 'Error';
  const constructorName = err?.constructor?.name || 'Error';

  const status = asScalar(err?.status) ?? asScalar(err?.statusCode) ?? asScalar(err?.response?.status);
  const code = asScalar(err?.code) ?? asScalar(err?.errorCode) ?? asScalar(err?.error?.code);
  const providerStatus = asScalar(err?.error?.status) != null ? String(err.error.status) : null;

  const rawMessage = err?.message ?? err?.error?.message ?? '';
  const message = sanitizeProviderErrorMessage(rawMessage);

  return {
    name,
    constructorName,
    status,
    code,
    providerStatus,
    message,
    classification: classifyProviderError(status, code, providerStatus, message),
  };
}

/** Emit the sanitized provider-error metadata as a single flat log line. */
function logSanitizedProviderError(scope: string, err: unknown, extra: Record<string, unknown> = {}): void {
  const safe = sanitizeProviderError(err);
  // JSON.stringify guarantees only the flat sanitized object is emitted.
  console.error(`[intake:gemini] ${scope}`, JSON.stringify({ ...safe, ...extra }));
}

/**
 * Run one intake turn against Gemini with structured output, then validate.
 * `ai` may be injected for testing.
 */
export async function runIntakeTurn(
  messages: IntakeTurnMessage[],
  ai: GoogleGenAI,
  model = 'gemini-3.1-flash-lite'
): Promise<RunIntakeResult> {
  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildIntakeContents(messages),
      config: {
        systemInstruction: buildIntakeSystemInstruction(),
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: INTAKE_RESPONSE_SCHEMA as any,
      },
    });
  } catch (err) {
    // TEMPORARY DIAGNOSTIC: log sanitized provider metadata, then preserve the
    // existing control flow by re-throwing for the route's existing handler.
    logSanitizedProviderError('generateContent failed', err, { stage: 'generateContent', model });
    throw err;
  }

  const raw = parseModelJson(response.text || '');
  if (!raw) {
    return { ok: false, errors: ['model_returned_unparseable_json'] };
  }

  const result: ValidationResult = validateIntakeOutput(raw);
  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }
  return { ok: true, errors: [], output: result.value };
}
