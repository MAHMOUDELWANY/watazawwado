import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Sparkles, ChevronLeft, Info, CheckCircle2 } from 'lucide-react';
import { analyticsRepository } from '../../lib/analyticsRepository';

/**
 * ====================================================================
 * WATAZAWWADO — AI INTAKE CONVERSATION
 * File: src/components/intake/IntakeConversation.tsx
 *
 * A calm, human, adaptive conversation — NOT a form and NOT a chatbot.
 * The browser NEVER computes prices; it only renders the server's
 * deterministic recommendation. Nothing here is an authoritative offer
 * until Ustadh Mahmoud reviews it.
 * ====================================================================
 */

export interface IntakeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PricingRecommendationView {
  tier: string;
  band: string;
  duration_minutes: number;
  baseline_price_usd: number;
  recommended_price_usd: number | null;
  teacher_review_required: boolean;
  reasons: string[];
}

interface IntakeConversationProps {
  session?: { access_token?: string | null } | null;
  lang?: 'en' | 'ar';
  onCompleted?: (intakeId: string, teacherReviewRequired: boolean) => void;
}

const copy = {
  en: {
    title: 'Tell me what you want to learn',
    sub: 'A short, natural conversation. No forms. Nothing is final until Ustadh Mahmoud reviews it.',
    placeholder: 'Type your message…',
    send: 'Send',
    start: 'Begin',
    brief: 'Your learning brief',
    reviewReq: 'Ustadh Mahmoud will review this personally before any price is confirmed.',
    reviewNotReq: 'This is a starting recommendation. You can still discuss it with Ustadh Mahmoud.',
    save: 'Save my brief',
    saved: 'Saved — we will take it from here ❤️',
    err: 'Something went wrong. Please try again.',
    unavailableTitle: 'The learning guide is unavailable right now.',
    unavailable: 'You can still book a lesson or message Ustadh Mahmoud directly — your learning brief stays on this page.',
    subject: 'Subject',
    goal: 'Goal',
    level: 'Current level',
    target: 'Target',
    skills: 'Focus areas',
    useCase: 'Use case',
    timeline: 'Timeline',
    duration: 'Preferred duration',
    minutes: 'min',
    recommended: 'Starting recommendation',
    baseline: 'Baseline',
  },
  ar: {
    title: 'احكيلي إيه اللي حابب تتعلمه',
    sub: 'محادثة قصيرة وطبيعية. مفيش استمارات. ومفيش سعر نهائي غير بعد مراجعة الأستاذ محمود.',
    placeholder: 'اكتب رسالتك…',
    send: 'إرسال',
    start: 'ابدأ',
    brief: 'ملخص احتياجك',
    reviewReq: 'الأستاذ محمود هيراجع طلبك بنفسه قبل تأكيد أي سعر.',
    reviewNotReq: 'ده مجرد ترشيح مبدئي، وتقدر تناقشه مع الأستاذ محمود.',
    save: 'احفظ الملخص',
    saved: 'اتحفظ ❤️ وهنكمل من هنا',
    err: 'حصلت مشكلة، جرب تاني.',
    unavailableTitle: 'مرشد التعلّم مش متاح دلوقتي.',
    unavailable: 'تقدر تحجز درس أو تكلم الأستاذ محمود مباشرة — وملخص احتياجك هيفضل محفوظ في الصفحة.',
    subject: 'المجال',
    goal: 'الهدف',
    level: 'المستوى الحالي',
    target: 'المستهدف',
    skills: 'نقاط التركيز',
    useCase: 'الاستخدام',
    timeline: 'التوقيت',
    duration: 'المدة المفضلة',
    minutes: 'دقيقة',
    recommended: 'ترشيح مبدئي',
    baseline: 'الأساس',
  },
};

export default function IntakeConversation({ session, lang = 'en', onCompleted }: IntakeConversationProps) {
  const t = copy[lang] || copy.en;
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [opening, setOpening] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<PricingRecommendationView | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // Fetch brand opening line and log the funnel start once.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/intake/opening');
        const d = await r.json();
        setOpening(lang === 'ar' ? d.ar : d.en);
      } catch {
        setOpening(lang === 'ar'
          ? 'أهلًا بيك ❤️ قولي بس إيه اللي حابب تتعلمه أو تطوره؟ حتى لو مش عارف اسم المجال بالظبط، احكيلي بطريقتك.'
          : 'Welcome ❤️ Just tell me what you would like to learn or improve — even if you are not sure of the exact name of the field.');
      }
      if (!startedRef.current) {
        startedRef.current = true;
        analyticsRepository.logEvent('ai_intake_started', { source: 'student_portal' });
      }
    })();
  }, [lang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const authHeaders = (): Record<string, string> => {
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const r = await fetch('/api/intake/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ messages: next }),
      });
      const data = await r.json();

      if (!r.ok) {
        if (data?.code === 'AI_UNAVAILABLE' || r.status === 503) {
          // Distinct, intentional state — the guide is genuinely unavailable (e.g. server key
          // not configured). Not an error, not a fake reply: keep the brief flow truthful.
          setAiUnavailable(true);
        } else {
          setError(t.err);
        }
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.profile) setProfile(data.profile);
      if (data.recommendation) setRecommendation(data.recommendation);
      if (data.isComplete && data.recommendation) {
        setIsComplete(true);
        analyticsRepository.logEvent('learning_goal_identified', {
          band: data.recommendation.band,
          tier: data.recommendation.tier,
        });
        analyticsRepository.logEvent('pricing_assessment_created', {
          band: data.recommendation.band,
          teacherReviewRequired: data.recommendation.teacher_review_required,
        });
        if (data.recommendation.teacher_review_required) {
          analyticsRepository.logEvent('teacher_review_required', { band: data.recommendation.band });
        }
      }
    } catch {
      setError(t.err);
    } finally {
      setLoading(false);
    }
  };

  const saveBrief = async () => {
    setError(null);
    try {
      const r = await fetch('/api/intake/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ profile, assessment: recommendationAssessment(), conversation: messages }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(t.err);
        return;
      }
      setSaved(true);
      analyticsRepository.logEvent('intake_completed', {
        teacherReviewRequired: data.teacherReviewRequired,
        band: data.recommendation?.band,
      });
      onCompleted?.(data.intakeId, data.teacherReviewRequired);
    } catch {
      setError(t.err);
    }
  };

  // The assessment is re-derived server-side; we only forward the profile here.
  const recommendationAssessment = () => (profile?.assessment || (profile as any)).assessment || null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-2xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 text-primary mb-2">
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-medium">{lang === 'ar' ? 'وتزودوا · مرشد التعلّم' : 'Watazawwado · Learning Guide'}</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-muted-foreground text-sm mt-2">{t.sub}</p>
      </div>

      <div
        ref={scrollRef}
        className="bg-surface border border-border rounded-xl p-4 space-y-4 max-h-[55vh] overflow-y-auto"
        aria-live="polite"
      >
        {opening && (
          <Bubble role="assistant">
            {opening}
          </Bubble>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>{m.content}</Bubble>
          ))}
        </AnimatePresence>
        {loading && (
          <Bubble role="assistant">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> …
            </span>
          </Bubble>
        )}
      </div>

      {aiUnavailable && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2.5 text-sm text-muted-foreground bg-surface-subtle border border-border rounded-lg p-3.5"
        >
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-foreground/60" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">{t.unavailableTitle}</p>
            <p>{t.unavailable}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-warning bg-warning/10 rounded-lg p-3">
          <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {!isComplete && !aiUnavailable && (
        <div className="mt-4 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.placeholder}
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-surface border border-border rounded-lg px-3 py-3 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label={t.placeholder}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="h-11 w-11 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            aria-label={t.send}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      )}

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-surface border border-border rounded-xl p-5"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
            {t.brief}
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {profile?.subject && <Row label={t.subject} value={profile.subject} />}
            {profile?.learning_goal && <Row label={t.goal} value={profile.learning_goal} />}
            {profile?.current_level && <Row label={t.level} value={profile.current_level} />}
            {profile?.target_level && <Row label={t.target} value={profile.target_level} />}
            {Array.isArray(profile?.specific_skills) && profile.specific_skills.length > 0 && (
              <Row label={t.skills} value={profile.specific_skills.join('، ') || profile.specific_skills.join(', ')} />
            )}
            {profile?.use_case && <Row label={t.useCase} value={profile.use_case} />}
            {profile?.timeline && <Row label={t.timeline} value={profile.timeline} />}
            {profile?.preferred_duration && <Row label={t.duration} value={`${profile.preferred_duration} ${t.minutes}`} />}
          </dl>

          {recommendation && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <p className="text-sm text-muted-foreground">
                {t.recommended}:{' '}
                <span className="text-foreground font-medium">
                  {recommendation.recommended_price_usd != null
                    ? `$${recommendation.recommended_price_usd} · ${recommendation.duration_minutes} ${t.minutes}`
                    : `${t.baseline} $${recommendation.baseline_price_usd} · ${recommendation.duration_minutes} ${t.minutes}`}
                </span>{' '}
                · {recommendation.tier}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {recommendation.teacher_review_required ? t.reviewReq : t.reviewNotReq}
              </p>
            </div>
          )}

          {!saved ? (
            <button
              onClick={saveBrief}
              className="mt-5 w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover font-medium"
            >
              {t.save}
            </button>
          ) : (
            <p className="mt-5 text-center text-success font-medium">{t.saved}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={isUser ? 'flex justify-end' : 'flex justify-start'}
    >
      <div
        className={
          isUser
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] whitespace-pre-line'
            : 'bg-muted text-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] whitespace-pre-line'
        }
      >
        {children}
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
