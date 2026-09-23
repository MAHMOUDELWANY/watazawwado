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
 * Run one intake turn against Gemini with structured output, then validate.
 * `ai` may be injected for testing.
 */
export async function runIntakeTurn(
  messages: IntakeTurnMessage[],
  ai: GoogleGenAI,
  model = 'gemini-3.1-flash-lite'
): Promise<RunIntakeResult> {
  const response = await ai.models.generateContent({
    model,
    contents: buildIntakeContents(messages),
    config: {
      systemInstruction: buildIntakeSystemInstruction(),
      temperature: 0.5,
      responseMimeType: 'application/json',
      responseSchema: INTAKE_RESPONSE_SCHEMA as any,
    },
  });

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
