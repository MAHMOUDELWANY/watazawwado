import React, { useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { WhatsAppIcon } from '../../components/ui/WhatsAppIcon';

export interface BoughtGift {
  id: string;
  packageName: string;
  packageNameAr: string | null;
  status: string;
  purchasedQuantity: number;
  durationMinutes: number | null;
  pricePaid: number;
  currency: string;
  code: string | null;
  season: string | null;
  toName: string | null;
  message: string | null;
}

export const seasonGiftLabel = (season: string | null | undefined, isAr: boolean) =>
  season === 'eid-fitr' ? (isAr ? 'عيدية عيد الفطر' : 'Eid al-Fitr gift')
    : season === 'dhul-hijjah' ? (isAr ? 'هدية عيد الأضحى' : 'Eid al-Adha gift')
      : (isAr ? 'هدية رمضان' : 'Ramadan gift');

export function giftShareText(g: Pick<BoughtGift, 'purchasedQuantity' | 'code' | 'toName' | 'message' | 'season'>, isAr: boolean, origin: string) {
  const hello = g.toName ? (isAr ? `${g.toName}، ` : `${g.toName}, `) : '';
  const note = g.message ? `\n${g.message}\n` : '\n';
  return isAr
    ? `${hello}${seasonGiftLabel(g.season, true)}: ${g.purchasedQuantity} حصص في أكاديمية وتزودوا.${note}افتح ${origin}/student/wallet وادخل الكود: ${g.code}`
    : `${hello}${seasonGiftLabel(g.season, false)}: ${g.purchasedQuantity} lessons at Watazawwado Academy.${note}Open ${origin}/student/wallet and enter the code: ${g.code}`;
}

/**
 * NX-06: redeem a gift code (any time), and the gifts this account bought (code to share, or finish paying).
 */
export function GiftsPanel({ gifts, learners, isAr, onRedeemed, onPay }: {
  gifts: BoughtGift[];
  learners: Array<{ id: string; name: string }>;
  isAr: boolean;
  onRedeemed: () => void;
  onPay: (g: BoughtGift) => void;
}) {
  const [code, setCode] = useState('');
  const [learnerId, setLearnerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://watazawwado.academy';

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await authedJson<{ lessons: number }>('/api/student/gifts/redeem', {
        method: 'POST', body: JSON.stringify({ code, learnerStudentId: learnerId || undefined }),
      });
      setMsg({ ok: true, text: isAr ? `وصلتك الهدية: ${r.lessons} حصص في رصيدك. تقبّل الله.` : `Gift received: ${r.lessons} lessons added to your balance.` });
      setCode('');
      onRedeemed();
    } catch (err: any) {
      const text = err?.code === 'DISCOUNT_CODE'
        ? (isAr ? 'هذا رمز خصم، لا رمز هدية. اكتبه في خطوة الدفع عند الحجز.' : 'This is a discount code, not a gift code. Type it on the payment step when you book.')
        : (isAr ? 'هذا الرمز لا يعمل. تأكد منه، أو راسلنا على واتساب.' : err?.message || 'This code did not work.');
      setMsg({ ok: false, text });
    } finally {
      setBusy(false);
    }
  };

  const copy = async (g: BoughtGift) => {
    try { await navigator.clipboard.writeText(giftShareText(g, isAr, origin)); setCopied(g.id); } catch { /* clipboard blocked */ }
  };

  return (
    <section className="space-y-4" data-testid="gifts-panel" aria-labelledby="gifts-title">
      <h2 id="gifts-title" className="text-lg font-display font-bold text-foreground flex items-center gap-2">
        <Gift className="w-4 h-4 text-accent" aria-hidden="true" />{isAr ? 'الهدايا' : 'Gifts'}
      </h2>

      <form onSubmit={redeem} className="p-4 rounded-2xl glass-card border border-border space-y-3" data-testid="gift-redeem">
        <label htmlFor="gift-code" className="text-sm font-semibold text-foreground">{isAr ? 'عندك كود هدية؟' : 'Have a gift code?'}</label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input id="gift-code" dir="ltr" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WZ-ABCD-EFGH" autoComplete="off" className="font-mono tracking-wider" />
          <Button type="submit" isLoading={busy} disabled={!code.trim() || (learners.length > 1 && !learnerId)}>{isAr ? 'فعّل الهدية' : 'Redeem'}</Button>
        </div>
        {learners.length > 1 && (
          <Select aria-label={isAr ? 'لمين الهدية؟' : 'Who is it for?'} value={learnerId} onChange={(e) => setLearnerId(e.target.value)}>
            <option value="">{isAr ? 'لمين الهدية؟' : 'Who is it for?'}</option>
            {learners.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        )}
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-teal' : 'text-destructive'}`}>{msg.text}</p>}
      </form>

      {gifts.length > 0 && (
        <ul className="space-y-3" data-testid="gifts-bought">
          {gifts.map((g) => (
            <li key={g.id} className="p-4 rounded-2xl glass-card border border-border space-y-2">
              <p className="text-xs font-semibold text-accent">{seasonGiftLabel(g.season, isAr)}{g.toName ? (isAr ? ` · لـ${g.toName}` : ` · for ${g.toName}`) : ''}</p>
              <p className="text-sm font-semibold text-foreground">
                {isAr ? (g.packageNameAr || g.packageName) : g.packageName} · {isAr ? `${g.purchasedQuantity} حصص` : `${g.purchasedQuantity} lessons`}
              </p>
              {g.code ? (
                <>
                  <p className="font-mono text-lg tracking-widest text-foreground" dir="ltr" data-testid="gift-code">{g.code}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? 'أرسل الرمز إلى صاحب الهدية. تُفعَّل الحصص في حسابه هو، لا في رصيدك.' : 'Send the code to the person. The lessons go to their account, not your balance.'}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`https://wa.me/?text=${encodeURIComponent(giftShareText(g, isAr, origin))}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-[#25D366] text-white text-sm font-semibold">
                      <WhatsAppIcon className="w-4 h-4" />{isAr ? 'ابعتها واتساب' : 'Send on WhatsApp'}
                    </a>
                    <Button type="button" variant="outline" size="sm" onClick={() => copy(g)} className="h-10">
                      {copied === g.id ? <Check className="w-4 h-4 me-1" /> : <Copy className="w-4 h-4 me-1" />}
                      {copied === g.id ? (isAr ? 'اتنسخت' : 'Copied') : (isAr ? 'انسخ الرسالة' : 'Copy the message')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">{isAr ? 'سيظهر الرمز هنا بعد الدفع.' : 'The code shows here once it is paid.'}</p>
                  <Button type="button" size="sm" onClick={() => onPay(g)}>{isAr ? 'ادفع' : 'Pay'}</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
