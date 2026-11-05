import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

export type ReviewPayload = { rating: number; body: string; displayName: string; role: 'parent' | 'adult_learner' | ''; country: string; consent: boolean };

/**
 * NX-05: one review, written by a family. Shared by the one-time link page and the portal. The academy never edits the
 * words; the admin only publishes, or declines spam, abuse or personal data.
 */
export function ReviewForm({ isAr, onSubmit }: { isAr: boolean; onSubmit: (p: ReviewPayload) => Promise<void> }) {
  const [p, setP] = useState<ReviewPayload>({ rating: 0, body: '', displayName: '', role: '', country: '', consent: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<ReviewPayload>) => setP((x) => ({ ...x, ...patch }));
  const L = (en: string, ar: string) => (isAr ? ar : en);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p.rating) return setError(L('Choose a rating from 1 to 5.', 'اختر تقييمًا من ١ إلى ٥.'));
    setBusy(true); setError('');
    try {
      await onSubmit(p);
    } catch (err: any) {
      setError(err?.message || L('Could not send. Please try again.', 'تعذّر الإرسال، حاول مرة أخرى.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-5" data-testid="review-form" noValidate>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">{L('How was your experience?', 'كيف كانت تجربتك؟')}</legend>
        <div className="flex gap-1" role="radiogroup" aria-label={L('Rating', 'التقييم')}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={p.rating === n} aria-label={L(`${n} of 5`, `${n} من ٥`)}
              onClick={() => set({ rating: n })}
              className="w-11 h-11 inline-flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Star className={`w-7 h-7 ${n <= p.rating ? 'fill-[#E5A93C] text-[#E5A93C]' : 'text-muted-foreground'}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-foreground">{L('Your review', 'رأيك')}</span>
        <Textarea rows={5} maxLength={1200} value={p.body} onChange={(e) => set({ body: e.target.value })}
          placeholder={L('What changed for you or your child? What would you tell another family?', 'ما الذي تغيّر معك أو مع ابنك؟ وماذا تقول لأسرة أخرى؟')} />
        <span className="block text-xs text-muted-foreground">{L('Arabic or English. Please no links, phone numbers or children’s full names.', 'عربي أو إنجليزي. من غير لينكات أو أرقام تليفون أو أسماء الأطفال كاملة.')}</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-foreground">{L('Name to show', 'الاسم الذي يظهر')}</span>
          <Input maxLength={40} value={p.displayName} onChange={(e) => set({ displayName: e.target.value })} placeholder={L('e.g. Amina K.', 'مثلاً: أمينة ك.')} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-foreground">{L('Country (optional)', 'البلد (اختياري)')}</span>
          <Input maxLength={40} value={p.country} onChange={(e) => set({ country: e.target.value })} placeholder={L('e.g. UK', 'مثلاً: بريطانيا')} />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">{L('You are', 'أنت')}</legend>
        <div className="flex flex-wrap gap-2">
          {([['parent', 'A parent', 'ولي أمر'], ['adult_learner', 'An adult learner', 'طالب كبير']] as const).map(([v, en, ar]) => (
            <label key={v} className={`inline-flex items-center gap-2 min-h-11 px-4 rounded-full border cursor-pointer text-sm font-semibold ${p.role === v ? 'border-[var(--teal)] bg-[var(--teal-light)] text-foreground' : 'border-border text-muted-foreground'}`}>
              <input type="radio" name="review-role" className="sr-only" checked={p.role === v} onChange={() => set({ role: v })} />
              {isAr ? ar : en}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={p.consent} onChange={(e) => set({ consent: e.target.checked })} className="mt-1 w-4 h-4 accent-teal-600" />
        <span>{L('You can show my review and the name above on the Watazawwado site.', 'أوافق على أن يظهر رأيي والاسم أعلاه على موقع وتزودوا.')}</span>
      </label>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" isLoading={busy} className="w-full sm:w-auto">{L('Send my review', 'أرسل رأيي')}</Button>
      <p className="text-xs text-muted-foreground">
        {L('We publish every genuine review, good or bad, and we never reward reviews.', 'بننشر كل رأي حقيقي، حلو أو وحش، ومش بندّي أي مقابل لأي رأي.')}
      </p>
    </form>
  );
}
