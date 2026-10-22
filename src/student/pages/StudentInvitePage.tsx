import React, { useEffect, useState } from 'react';
import { Gift, Copy, Check, Share2, Wallet, UserPlus, BookOpenCheck, Sparkles } from 'lucide-react';
import { getFreshAccessToken } from '../../lib/auth';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { WhatsAppIcon } from '../../components/ui/WhatsAppIcon';

/**
 * Invite a friend (RULES.md §4, owner decisions 2026-10-22): a personal link; the friend gets credit when they join,
 * and this family gets credit after the friend's first paid lesson is completed. Data: GET /api/student/referral.
 */

interface ReferralData {
  program: { enabled: boolean; friendCredit: number; referrerCredit: number };
  code: string | null;
  balance: number;
  invites: Array<{ id: string; name: string | null; status: 'signed_up' | 'rewarded' | 'not_rewarded' | 'void'; reward: number; joinedAt: string }>;
  ledger: Array<{ id: string; amount: number; reason: string; at: string }>;
}

const money = (n: number) => `$${Number(n || 0).toFixed(2).replace(/\.00$/, '')}`;

export default function StudentInvitePage({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const [data, setData] = useState<ReferralData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getFreshAccessToken();
        const res = await fetch('/api/student/referral', { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setData(body);
      } catch (err: any) {
        setError(err.message || (isAr ? 'مقدرناش نحمّل الصفحة.' : "We couldn't load this page."));
      }
    })();
  }, []);

  if (error) return <p className="p-6 text-sm text-destructive">{error}</p>;
  if (!data) return <div className="py-24 flex justify-center"><BrandLoader /></div>;

  const { program } = data;
  const link = data.code ? `${window.location.origin}/?ref=${data.code}` : '';
  const shareText = isAr
    ? `بتعلّم في وتزودوا، حصص فردية في القرآن والعربي مع مدرسين محترمين. أول حصة تجريبية مجانًا، ولو سجّلت من اللينك ده هتاخد ${money(program.friendCredit)} رصيد لأول حجز: ${link}`
    : `I learn with Watazawwado, one-on-one Quran and Arabic lessons with caring teachers. The first trial lesson is free, and if you join from this link you get ${money(program.friendCredit)} credit for your first booking: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Watazawwado', text: shareText });
        return;
      } catch { /* closed */ }
    }
    copy();
  };

  const statusText: Record<string, string> = {
    signed_up: isAr ? 'سجّل، مستنيين أول حصة مدفوعة' : 'Joined, waiting for the first paid lesson',
    rewarded: isAr ? 'اتضافت مكافأتك' : 'Your reward was added',
    not_rewarded: isAr ? 'وصلت للحد السنوي للمكافآت' : 'Yearly reward limit reached',
    void: isAr ? 'اتلغت' : 'Cancelled',
  };
  const reasonText: Record<string, string> = {
    referral_welcome: isAr ? 'هدية ترحيب' : 'Welcome gift',
    referral_reward: isAr ? 'مكافأة دعوة' : 'Invite reward',
    checkout_use: isAr ? 'اتخصم من حجز' : 'Used on a booking',
    checkout_release: isAr ? 'رجع (الحجز ما اكتملش)' : 'Returned (booking not completed)',
    refund_return: isAr ? 'رجع مع استرداد' : 'Returned with a refund',
    admin_adjust: isAr ? 'تعديل من الأكاديمية' : 'Adjusted by the academy',
  };

  if (!program.enabled || !data.code) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center glass-card border border-border rounded-3xl" dir={isAr ? 'rtl' : 'ltr'}>
        <Gift className="w-8 h-8 mx-auto text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          {isAr ? 'برنامج الدعوات مش شغال دلوقتي.' : 'The invite program is paused right now.'}
        </p>
        {data.balance > 0 && <p className="mt-2 font-semibold">{isAr ? `رصيدك: ${money(data.balance)}` : `Your balance: ${money(data.balance)}`}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero: the link */}
      <section className="relative overflow-hidden rounded-3xl glass-card border border-border p-6 sm:p-8">
        <div className="absolute -top-20 -end-20 w-56 h-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-foreground leading-tight">
            {isAr
              ? `ادعُ صاحبك: هو ياخد ${money(program.friendCredit)}، وانت تاخد ${money(program.referrerCredit)}`
              : `Invite a friend: they get ${money(program.friendCredit)}, you get ${money(program.referrerCredit)}`}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
            {isAr
              ? 'لو حد من العيلة أو الأصحاب بيدوّر على مدرس قرآن أو عربي، ابعتله اللينك ده. والدال على الخير كفاعله.'
              : 'If someone in your family or circle is looking for a Quran or Arabic teacher, send them this link. Pointing someone to good counts as doing it.'}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2 h-12 px-4 rounded-xl border border-border bg-background/60 font-mono text-sm" dir="ltr">
              <span className="truncate text-muted-foreground">{link.replace(/^https?:\/\//, '')}</span>
            </div>
            <button type="button" onClick={copy}
              className="h-12 px-5 rounded-xl btn-primary-material font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? (isAr ? 'اتنسخ' : 'Copied') : (isAr ? 'انسخ اللينك' : 'Copy link')}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
              className="h-11 px-4 rounded-xl border border-border glass-surface inline-flex items-center gap-2 text-sm font-semibold hover:bg-surface-subtle">
              <WhatsAppIcon className="w-4 h-4" />
              {isAr ? 'ابعته على واتساب' : 'Send on WhatsApp'}
            </a>
            <button type="button" onClick={share}
              className="h-11 px-4 rounded-xl border border-border glass-surface inline-flex items-center gap-2 text-sm font-semibold hover:bg-surface-subtle">
              <Share2 className="w-4 h-4" />
              {isAr ? 'شارك' : 'Share'}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {isAr ? 'كودك:' : 'Your code:'} <span className="font-mono font-bold text-foreground" dir="ltr">{data.code}</span>
            {' · '}
            {isAr ? 'صاحبك يقدر يكتبه في خانة الكود وقت الدفع لو ما فتحش اللينك.' : 'Your friend can also type it in the code box at checkout.'}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: UserPlus, t: isAr ? 'صاحبك يسجّل من لينكك' : 'Your friend joins from your link', d: isAr ? `وياخد ${money(program.friendCredit)} رصيد على طول.` : `They get ${money(program.friendCredit)} credit right away.` },
          { icon: BookOpenCheck, t: isAr ? 'ياخد أول حصة مدفوعة' : 'They finish a first paid lesson', d: isAr ? 'الحصة التجريبية المجانية مش محسوبة.' : "The free trial doesn't count." },
          { icon: Sparkles, t: isAr ? `انت تاخد ${money(program.referrerCredit)}` : `You get ${money(program.referrerCredit)}`, d: isAr ? 'بتتخصم لوحدها من حجزك الجاي.' : 'It comes off your next booking on its own.' },
        ].map((s, i) => (
          <div key={i} className="glass-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center tabular-nums">{i + 1}</span>
              <s.icon className="w-4 h-4 text-secondary" />
            </div>
            <p className="mt-3 font-semibold text-sm text-foreground">{s.t}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.d}</p>
          </div>
        ))}
      </section>

      {/* Balance */}
      <section className="glass-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-secondary" />
            <h3 className="font-semibold text-foreground">{isAr ? 'رصيدك' : 'Your balance'}</h3>
          </div>
          <span className="text-2xl font-display font-bold tabular-nums text-foreground">{money(data.balance)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {isAr ? 'بيتخصم لوحده وقت الدفع، وتقدر تقفله لو حابب.' : 'Used automatically at checkout; you can switch it off there.'}
        </p>
        {data.ledger.length > 0 && (
          <ul className="mt-4 divide-y divide-border text-sm">
            {data.ledger.slice(0, 8).map((l) => (
              <li key={l.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{reasonText[l.reason] || l.reason}</span>
                <span className={`tabular-nums font-semibold ${l.amount > 0 ? 'text-success' : 'text-foreground'}`} dir="ltr">
                  {l.amount > 0 ? '+' : '−'}{money(Math.abs(l.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invites */}
      <section className="glass-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground">{isAr ? 'اللي دعيتهم' : 'People you invited'}</h3>
        {data.invites.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{isAr ? 'لسه محدش سجّل من لينكك.' : 'Nobody has joined from your link yet.'}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {data.invites.map((r) => (
              <li key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground truncate">{r.name || (isAr ? 'صاحبك' : 'A friend')}</span>
                <span className={`text-xs shrink-0 ${r.status === 'rewarded' ? 'text-success font-semibold' : 'text-muted-foreground'}`}>
                  {statusText[r.status]}{r.status === 'rewarded' ? ` · +${money(r.reward)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Terms in plain words */}
      <details className="glass-surface border border-border rounded-2xl p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-foreground">{isAr ? 'الشروط باختصار' : 'The terms, briefly'}</summary>
        <ul className="mt-3 space-y-1.5 text-muted-foreground leading-relaxed list-disc ps-5">
          <li>{isAr ? 'الهدية للحسابات الجديدة بس، ومرة واحدة لكل حساب.' : 'The gift is for new accounts only, once per account.'}</li>
          <li>{isAr ? 'مكافأتك بتتضاف بعد ما صاحبك يحضر أول حصة مدفوعة. الحصة التجريبية المجانية مش محسوبة.' : 'Your reward is added after your friend attends their first paid lesson. The free trial does not count.'}</li>
          <li>{isAr ? 'الرصيد بيتخصم من الحصص والباقات، ومش بيتحوّل لفلوس.' : 'Balance comes off lessons and packages; it cannot be cashed out.'}</li>
          <li>{isAr ? 'مينفعش تدعي نفسك أو تعمل حسابات تانية. لو حصل استخدام غلط، الأكاديمية ممكن تلغي المكافأة.' : "You can't invite yourself or make extra accounts. If the program is misused, the academy may cancel a reward."}</li>
          <li>{isAr ? 'لو اتعمل استرداد لحجز اتدفع جزء منه بالرصيد، الجزء ده بيرجع لرصيدك.' : 'If a booking paid partly with balance is refunded, that part goes back to your balance.'}</li>
        </ul>
      </details>
    </div>
  );
}
