import React from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, Save, MessageCircleQuestion, AlertTriangle, Sparkles, Info } from 'lucide-react';
import { analyticsRepository } from '../../lib/analyticsRepository';

/**
 * ====================================================================
 * WATAZAWWADO — TEACHER INTAKE REVIEW
 * File: src/dashboard/components/IntakeReviewPanel.tsx
 *
 * Lets Ustadh Mahmoud review an intake: see the student learning brief,
 * the AI assessment, the deterministic recommendation, then Approve /
 * Adjust / Request More Information. The approved amount is authoritative.
 * ====================================================================
 */

export interface IntakeReviewPanelProps {
  lang: 'en' | 'ar';
  /** Short-lived auth fetch helper provided by the dashboard. */
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

interface IntakeRow {
  id: string;
  status: string;
  service_category: string | null;
  learning_profile: any;
  assessment: any;
  pricing_recommendation: any;
  teacher_review_required: boolean;
  created_at: string;
  offer?: any;
}

const t = {
  en: {
    title: 'Intake Review',
    sub: 'Student learning briefs awaiting your review.',
    queue: 'Review queue',
    empty: 'No intakes awaiting review.',
    brief: 'Student Learning Brief',
    assessment: 'Assessment',
    recommendation: 'Recommended',
    review: 'Teacher review required',
    approve: 'Approve',
    adjust: 'Adjust price',
    more: 'Request more info',
    price: 'Approved price (USD)',
    notes: 'Notes (private)',
    submit: 'Record decision',
    saving: 'Saving…',
    approved: 'Approved',
    adjusted: 'Adjusted — final price is authoritative',
    requested: 'More information requested',
    err: 'Something went wrong.',
    reload: 'Refresh',
    noPrice: 'No deterministic price — adjust to set an explicit approved amount.',
    noDeterministic: 'A manual approved price is required. Use "Adjust price" to set it.',
    subject: 'Subject', goal: 'Goal', level: 'Level', target: 'Target',
    skills: 'Focus', useCase: 'Use case', timeline: 'Timeline', duration: 'Duration',
  },
  ar: {
    title: 'مراجعة الطلبات',
    sub: 'ملخصات احتياج الطلاب في انتظار مراجعتك.',
    queue: 'قائمة المراجعة',
    empty: 'لا توجد طلبات في انتظار المراجعة.',
    brief: 'ملخص احتياج الطالب',
    assessment: 'التقييم',
    recommendation: 'الترشيح',
    review: 'مطلوب مراجعة المعلم',
    approve: 'اعتماد',
    adjust: 'تعديل السعر',
    more: 'طلب معلومات إضافية',
    price: 'السعر المعتمد (دولار)',
    notes: 'ملاحظات (خاصة)',
    submit: 'تسجيل القرار',
    saving: 'جارٍ الحفظ…',
    approved: 'تم الاعتماد',
    adjusted: 'تم التعديل — السعر النهائي معتمد',
    requested: 'تم طلب معلومات إضافية',
    err: 'حدث خطأ.',
    reload: 'تحديث',
    noPrice: 'لا يوجد سعر حتمي — عدّل لتحديد سعر معتمد.',
    noDeterministic: 'السعر المعتمد اليدوي مطلوب. استخدم «تعديل السعر» لتحديده.',
    subject: 'المجال', goal: 'الهدف', level: 'المستوى', target: 'المستهدف',
    skills: 'التركيز', useCase: 'الاستخدام', timeline: 'التوقيت', duration: 'المدة',
  },
};

export default function IntakeReviewPanel({ lang, apiFetch }: IntakeReviewPanelProps) {
  const c = t[lang] || t.en;
  const [intakes, setIntakes] = React.useState<IntakeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<IntakeRow | null>(null);
  const [adjustedPrice, setAdjustedPrice] = React.useState<string>('');
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/dashboard/intakes?status=awaiting_teacher_review');
      const data = await r.json();
      setIntakes(data.intakes || []);
    } catch {
      setIntakes([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  React.useEffect(() => { load(); }, [load]);

  // Approve is only meaningful when a deterministic price exists. The backend
  // guard remains authoritative; this purely prevents a misleading UI action.
  const canApprove = selected?.pricing_recommendation?.recommended_price_usd != null;

  const submitReview = async (action: 'approve' | 'adjust' | 'request_more_info') => {
    if (!selected) return;
    setBusy(action);
    setMessage(null);
    try {
      const body: any = { action, notes };
      if (action === 'adjust') {
        const p = Number(adjustedPrice);
        if (!Number.isFinite(p) || p <= 0) {
          setMessage(c.noPrice);
          setBusy(null);
          return;
        }
        body.approved_price_usd = p;
      }
      const r = await apiFetch(`/api/dashboard/intakes/${selected.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
        setMessage(data?.error || c.err);
        return;
      }
      analyticsRepository.logEvent(
        action === 'approve' ? 'teacher_offer_approved'
          : action === 'adjust' ? 'teacher_offer_adjusted'
          : 'teacher_review_required',
        { band: selected.service_category }
      );
      setMessage(
        action === 'approve' ? c.approved
          : action === 'adjust' ? c.adjusted
          : c.requested
      );
      setSelected(null);
      setAdjustedPrice('');
      setNotes('');
      await load();
    } catch {
      setMessage(c.err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{c.title}</h2>
          <p className="text-sm text-muted-foreground">{c.sub}</p>
        </div>
        <button onClick={load} className="text-sm text-primary hover:underline">{c.reload}</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : intakes.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted-foreground">
          {c.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {intakes.map((i) => {
              const p = i.learning_profile || {};
              const rec = i.pricing_recommendation || {};
              return (
                <motion.button
                  key={i.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setSelected(i); setNotes(''); setAdjustedPrice(''); setMessage(null); }}
                  className={`w-full text-start bg-surface border rounded-xl p-4 transition-colors ${
                    selected?.id === i.id ? 'border-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-primary text-sm font-medium flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> {i.service_category || '—'}
                    </span>
                    {i.teacher_review_required && (
                      <span className="inline-flex items-center gap-1 text-warning text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" /> {c.review}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground font-medium mt-1 truncate">{p.subject || p.learning_goal || 'Student'}</p>
                  <p className="text-muted-foreground text-sm mt-1 truncate">{p.learning_goal || ''}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {rec.recommended_price_usd != null
                      ? `$${rec.recommended_price_usd} · ${rec.duration_minutes}min · ${rec.tier}`
                      : `— · ${rec.baseline_price_usd ? `$${rec.baseline_price_usd}` : ''} · ${rec.tier || ''}`}
                  </p>
                </motion.button>
              );
            })}
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            {!selected ? (
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <Info className="w-4 h-4" /> {lang === 'ar' ? 'اختر طلبًا للمراجعة.' : 'Select an intake to review.'}
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-foreground mb-3">{c.brief}</h3>
                <Brief profile={selected.learning_profile || {}} c={c} />

                <h3 className="font-semibold text-foreground mt-4 mb-2">{c.assessment}</h3>
                <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto whitespace-pre-wrap">
{JSON.stringify(selected.assessment || {}, null, 2)}
                </pre>

                <h3 className="font-semibold text-foreground mt-4 mb-2">{c.recommendation}</h3>
                <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto whitespace-pre-wrap">
{JSON.stringify(selected.pricing_recommendation || {}, null, 2)}
                </pre>

                <div className="mt-4">
                  <label className="block text-sm text-muted-foreground mb-1">{c.price}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={adjustedPrice}
                    onChange={(e) => setAdjustedPrice(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    placeholder={selected.pricing_recommendation?.recommended_price_usd != null
                      ? String(selected.pricing_recommendation.recommended_price_usd)
                      : ''}
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-muted-foreground mb-1">{c.notes}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => submitReview('approve')}
                    disabled={!!busy || !canApprove}
                    title={!canApprove ? c.noDeterministic : undefined}
                    className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {c.approve}
                  </button>
                  <button
                    onClick={() => submitReview('adjust')}
                    disabled={!!busy}
                    className="h-10 px-4 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {busy === 'adjust' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {c.adjust}
                  </button>
                  <button
                    onClick={() => submitReview('request_more_info')}
                    disabled={!!busy}
                    className="h-10 px-4 rounded-lg border border-border text-foreground hover:bg-muted text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {busy === 'request_more_info' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircleQuestion className="w-4 h-4" />}
                    {c.more}
                  </button>
                </div>

                {message && <p className="mt-3 text-sm text-success">{message}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Brief({ profile, c }: { profile: any; c: any }) {
  const rows: [string, string][] = [];
  if (profile.subject) rows.push([c.subject, profile.subject]);
  if (profile.learning_goal) rows.push([c.goal, profile.learning_goal]);
  if (profile.current_level) rows.push([c.level, profile.current_level]);
  if (profile.target_level) rows.push([c.target, profile.target_level]);
  if (Array.isArray(profile.specific_skills) && profile.specific_skills.length)
    rows.push([c.skills, profile.specific_skills.join(', ')]);
  if (profile.use_case) rows.push([c.useCase, profile.use_case]);
  if (profile.timeline) rows.push([c.timeline, profile.timeline]);
  if (profile.preferred_duration) rows.push([c.duration, `${profile.preferred_duration} min`]);

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
