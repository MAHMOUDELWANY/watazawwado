import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { MASTER_SPEC } from '../../src/data/master_spec.js';
import { FAQS, HOW_IT_WORKS_STEPS } from '../../src/data/content.js';
import { SITE_FACTS } from '../siteFacts.js';
import {
  evaluateAssessment,
  findForbiddenPricingFields,
  type ServiceAssessment
} from '../pricing/pricingEngine.js';
import {
  runIntakeTurn,
  INTAKE_OPENING_AR,
  INTAKE_OPENING_EN,
  type IntakeTurnMessage
} from '../intake/intakeService.js';
import { createIntakeToken, readIntakeToken } from '../intake/intakeToken.js';
import {
  validateIntakeOutput
} from '../intake/intakeSchema.js';
import { notifySuperAdmins } from '../notifications/inbox.js';

/** QA-07 step 4: the homepage learning guide and the AI intake routes, moved out of api/index.ts unchanged. */

type Middleware = (req: any, res: any, next: any) => any;

export function registerIntakeRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  rateLimit: Middleware;
}) {
  app.post('/api/learning-guide', deps.rateLimit, async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
        return res.status(400).json({ error: 'Invalid or missing messages payload.' });
      }

      // Rebuild the conversation server-side: only user/model turns with a single text part,
      // so callers can't smuggle extra parts, files or other roles to the model.
      const contents = messages.map((msg: any) => ({
        role: msg?.role === 'model' ? 'model' : 'user',
        parts: [{ text: typeof msg?.parts?.[0]?.text === 'string' ? msg.parts[0].text : '' }]
      }));
      if (contents[contents.length - 1].role !== 'user' || contents.some(c => !c.parts[0].text)) {
        return res.status(400).json({ error: 'Invalid or missing messages payload.' });
      }

      const totalLength = contents.reduce((acc, c) => acc + c.parts[0].text.length, 0);
      if (totalLength > 10000) {
        return res.status(400).json({ error: 'Payload too large.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI service unavailable.' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Homepage guide (owner request 2026-10-16): answers "who are you / how does it work / prices"
      // from the site's own content, summarizes it for people who don't want to read, and when a
      // visitor sounds interested, warmly invites them to book the free trial.
      const faqText = FAQS.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      const stepsText = (HOW_IT_WORKS_STEPS as any[]).map((s: any, i: number) => `${i + 1}. ${s.title || s.titleEn || ''}: ${s.description || s.descriptionEn || ''}`).join('\n');
      const systemInstruction = `You are the friendly guide on the Watazawwado homepage (online 1-on-1 Quran, Tajweed, the Zad Path, Arabic and English lessons).
Your job:
1. Answer visitors' questions about who we are, how it works, subjects, teachers, prices, the free trial, payments and policies, using ONLY the facts below. If something is not covered, say you'll let the team answer and suggest WhatsApp or the website chat. Never invent prices, names, degrees or promises.
2. If someone doesn't want to read the pages, give a short, clear summary (a few lines or bullets).
3. Whenever the visitor shows any interest in trying, starting, prices, their child, or their level, warmly encourage them to book the free trial lesson: explain it's free, 30 minutes, no card needed, and the steps (free account → short profile → pick a time → short placement test after booking). Invite them with a short call to action like "Book your free trial from the button at the top of the page." Be encouraging, never pushy, no fake urgency.
Tone: warm, human, short answers (usually under 120 words). Reply in the visitor's language: English, or Arabic (simple Arabic with a friendly Egyptian touch) if they write in Arabic.
<current_facts priority="highest">
${SITE_FACTS}
</current_facts>
<how_it_works>
${stepsText}
</how_it_works>
<faq note="older wording; current_facts wins on any difference">
${faqText}
</faq>
<background_spec note="older product vision; current_facts wins on any difference">
${MASTER_SPEC}
</background_spec>`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('AI Error:', error);
      res.status(500).json({ error: 'Failed to generate response.' });
    }
  });

  const INTAKE_MAX_MESSAGES = 40;

  /** Normalise a transcript entry. */
  function coerceTurnMessages(raw: any): IntakeTurnMessage[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-INTAKE_MAX_MESSAGES)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
  }

  // GET /api/intake/opening — brand-appropriate opening line (public, no PII)
  app.get('/api/intake/opening', (_req, res) => {
    res.json({ ar: INTAKE_OPENING_AR, en: INTAKE_OPENING_EN });
  });

  // POST /api/intake/turn — run ONE adaptive intake turn (student-authenticated)
  // The response contains a NON-authoritative draft: reply, profile, assessment,
  // and the deterministic pricing recommendation. Nothing here is a final offer.
  app.post('/api/intake/turn', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI service unavailable.', code: 'AI_UNAVAILABLE' });
      }

      const messages = coerceTurnMessages(req.body?.messages);
      if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
        return res.status(400).json({ error: 'A non-empty conversation ending with a user message is required.' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await runIntakeTurn(messages, ai);

      if (!result.ok || !result.output) {
        // Fail closed: never surface model text as authoritative.
        console.warn('[POST /api/intake/turn] Invalid model output:', result.errors);
        return res.status(502).json({ error: 'The assistant could not produce a valid response. Please try again.', code: 'INVALID_AI_OUTPUT' });
      }

      const output = result.output;

      // Deterministic pricing — the model never provides numbers.
      let recommendation = null;
      if (output.assessment) {
        const forbidden = findForbiddenPricingFields(output.assessment as any);
        if (forbidden.length > 0) {
          return res.status(502).json({ error: 'Invalid assessment payload.', code: 'FORBIDDEN_PRICING_FIELDS' });
        }
        recommendation = evaluateAssessment(output.assessment as ServiceAssessment);
      }

      // The final result is signed so /api/intake/complete saves exactly what the AI produced.
      const intakeToken = output.is_complete && output.assessment && req.studentUser?.auth_id
        ? createIntakeToken(req.studentUser.auth_id, output.profile, output.assessment, (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim())
        : null;

      return res.json({
        reply: output.reply,
        isComplete: output.is_complete,
        nextQuestion: output.next_question || null,
        profile: output.profile,
        assessment: output.assessment,
        recommendation,
        intakeToken,
      });
    } catch (err: any) {
      console.error('Intake error:', err);
      return res.status(500).json({ error: 'Failed to process intake turn.' });
    }
  });

  // POST /api/intake/complete — persist the structured intake (server-authoritative)
  app.post('/api/intake/complete', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    try {
      const authUserId = req.studentUser?.auth_id;
      const learnerStudentId = req.studentUser?.student_id || null;

      if (!authUserId) {
        return res.status(401).json({ error: 'Authenticated student identity is required.' });
      }

      // Only the server-signed result of /api/intake/turn is accepted, never a profile or assessment typed by the browser.
      const signed = readIntakeToken(req.body?.intakeToken, authUserId, (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim());
      const conversation = coerceTurnMessages(req.body?.conversation);

      if (!signed) {
        return res.status(400).json({ error: 'The assessment is missing or expired. Please finish the conversation again.' });
      }

      // Re-validate through the same strict schema used for the model output.
      const synthetic = { reply: 'ok', is_complete: true, profile: signed.profile, assessment: signed.assessment };
      const validated = validateIntakeOutput(synthetic);
      if (!validated.ok || !validated.value?.assessment) {
        return res.status(400).json({ error: 'Invalid intake payload.', details: validated.errors });
      }

      // Recompute the deterministic recommendation SERVER-SIDE. Never trust a
      // browser-supplied recommendation or price.
      const recommendation = evaluateAssessment(validated.value.assessment);

      const supabaseAdmin = deps.getClient();
      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Database integration is not properly configured.' });
      }

      const { data: inserted, error } = await supabaseAdmin
        .from('student_intakes')
        .insert({
          auth_user_id: authUserId,
          learner_student_id: learnerStudentId,
          status: recommendation.teacher_review_required ? 'awaiting_teacher_review' : 'offer_ready',
          conversation,
          learning_profile: validated.value.profile,
          assessment: validated.value.assessment,
          pricing_recommendation: recommendation,
          service_category: recommendation.band === 'religious'
            ? (validated.value.assessment.service_category === 'islamic_studies' ? 'islamic_studies' : 'quran')
            : (validated.value.assessment.service_category === 'english' ? 'english' : 'arabic'),
          teacher_review_required: recommendation.teacher_review_required,
        })
        .select('id, status, teacher_review_required, created_at')
        .single();

      if (error || !inserted) {
        console.error('[POST /api/intake/complete] Insert error:', error?.message);
        return res.status(500).json({ error: 'Could not save the intake.' });
      }

      // On-site only (owner decision 2026-10-16: admin alerts stay on the website, no emails).
      if (inserted.status === 'awaiting_teacher_review') {
        await notifySuperAdmins(supabaseAdmin, {
          kind: 'intake_submitted',
          title: { en: 'New learning request from the AI guide', ar: 'طلب جديد من المرشد الذكي' },
          body: { en: 'A student finished the AI guide chat. Review the request and reply in the chat.', ar: 'طالب خلّص محادثة المرشد. راجع الطلب ورد عليه في الشات.' },
          link: '/dashboard/intakes'
        });
      }

      return res.json({
        intakeId: inserted.id,
        status: inserted.status,
        teacherReviewRequired: inserted.teacher_review_required,
        recommendation,
      });
    } catch (err: any) {
      console.error('[POST /api/intake/complete Error]', err);
      return res.status(500).json({ error: 'Failed to save intake.' });
    }
  });

  // GET /api/intake/:id — owner (or teacher) reads their intake + offer state
  app.get('/api/intake/:id', deps.verifyStudentAuth, async (req: any, res: any) => {
    try {
      const authUserId = req.studentUser?.auth_id;
      if (!authUserId) return res.status(401).json({ error: 'Authenticated student identity is required.' });

      const supabaseAdmin = deps.getClient();
      if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

      const { data: intake, error } = await supabaseAdmin
        .from('student_intakes')
        .select('id, auth_user_id, status, learning_profile, assessment, pricing_recommendation, teacher_review_required, created_at')
        .eq('id', req.params.id)
        .maybeSingle();

      if (error || !intake) return res.status(404).json({ error: 'Intake not found.' });
      // Ownership enforcement (server-side). teacher_notes are never included.
      if (intake.auth_user_id !== authUserId) return res.status(404).json({ error: 'Intake not found.' });

      const { data: offer } = await supabaseAdmin
        .from('learning_offers')
        .select('id, service_category, duration_minutes, approved_price_usd, teacher_adjusted, offer, status, offered_at')
        .eq('intake_id', intake.id)
        .in('status', ['offered', 'accepted'])
        .maybeSingle();

      return res.json({ intake, offer: offer || null });
    } catch (err: any) {
      console.error('[GET /api/intake/:id Error]', err);
      return res.status(500).json({ error: 'Failed to load intake.' });
    }
  });
}
