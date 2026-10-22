import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, ShieldCheck, AlertCircle, Lock, X, Tag, Wallet, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { BrandSpinner } from '../ui/BrandLoader';
import { getFreshAccessToken } from '../../lib/auth';

export interface InstantCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'booking' | 'package';
  targetId: string;
  itemTitle?: string;
  amount: number;
  currency?: string;
  lang?: 'en' | 'ar';
  /** Called when a code or the account balance covered the whole price (no payment page). */
  onSuccess?: () => void;
}

/** Server breakdown from /api/checkout/quote and /api/checkout/apply (server/routes/growth.ts). */
interface Quote {
  listAmount: number;
  baseAmount: number;
  priorSavings: number;
  codeDiscount: number;
  codeCapped: boolean;
  creditUsed: number;
  finalAmount: number;
  balance: number;
  code: { code: string; discount_type: 'percent' | 'fixed'; value: number; is_gift: boolean } | null;
  rejection: string | null;
  rejectionText: { en: string; ar: string } | null;
  referral: { firstName: string; welcomeCredit: number } | null;
  confirmed?: boolean;
}

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

async function postJson(path: string, body: object) {
  const token = await getFreshAccessToken();
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function InstantCheckoutModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  itemTitle = '1-on-1 Lesson',
  amount,
  currency = 'USD',
  lang = 'ar',
  onSuccess,
}: InstantCheckoutModalProps) {
  const isAr = lang === 'ar';
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  // Code box and balance (RULES.md §4). The server prices everything; this only shows its numbers.
  const [quote, setQuote] = useState<Quote | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [useCredit, setUseCredit] = useState(true);
  const [confirmedFree, setConfirmedFree] = useState(false);

  const loadQuote = useCallback(async (code: string, credit: boolean) => {
    const { ok, data } = await postJson('/api/checkout/quote', { targetType, targetId, code: code || undefined, useCredit: credit });
    return ok ? (data as Quote) : null;
  }, [targetType, targetId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setConfirmedFree(false);
    setError(null);
    loadQuote(appliedCode, useCredit).then((q) => {
      if (!cancelled) setQuote(q);
    });
    return () => {
      cancelled = true;
    };
    // appliedCode/useCredit changes re-quote through their handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loadQuote]);

  const applyCode = async () => {
    const code = codeInput.trim();
    if (!code) return;
    setCheckingCode(true);
    setCodeError(null);
    const q = await loadQuote(code, useCredit);
    setCheckingCode(false);
    if (!q) {
      setCodeError(isAr ? 'مقدرناش نتأكد من الكود دلوقتي. جرّب تاني.' : "We couldn't check the code right now. Please try again.");
      return;
    }
    if (q.rejection) {
      setCodeError(q.rejectionText ? (isAr ? q.rejectionText.ar : q.rejectionText.en) : (isAr ? 'الكود ده مش شغال.' : "This code doesn't work."));
      return;
    }
    setAppliedCode(code);
    setQuote(q);
  };

  const removeCode = async () => {
    setAppliedCode('');
    setCodeInput('');
    setCodeError(null);
    setQuote(await loadQuote('', useCredit));
  };

  const toggleCredit = async () => {
    const next = !useCredit;
    setUseCredit(next);
    setQuote(await loadQuote(appliedCode, next));
  };

  const total = quote ? quote.finalAmount : Number(amount || 0);
  const formattedAmount = total.toFixed(2);

  const handleCheckout = async () => {
    setIsProcessingStripe(true);
    setError(null);

    try {
      // 1. Put the code/balance on this checkout (server re-checks everything and sets the stored price).
      const needsApply = Boolean(appliedCode) || (quote && quote.balance > 0) || quote?.referral;
      const applied = await postJson('/api/checkout/apply', { targetType, targetId, code: appliedCode || undefined, useCredit });
      if (!applied.ok) {
        if (needsApply || applied.status === 409) {
          const t = applied.data?.rejectionText;
          throw new Error(t ? (isAr ? t.ar : t.en) : applied.data?.error);
        }
      } else if (applied.data?.confirmed) {
        setQuote(applied.data as Quote);
        setConfirmedFree(true);
        setIsProcessingStripe(false);
        onSuccess?.();
        return;
      }

      // 2. Card payment on Stripe for the stored price.
      // Cancel returns to this exact page with only a flag, so the booking draft is restored.
      const cancelTarget = new URL(window.location.href);
      cancelTarget.searchParams.set('payment_cancelled', 'true');
      const cancelUrl = cancelTarget.toString();

      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('gateway', 'stripe');
      currentUrl.searchParams.set('payment_status', 'success');
      currentUrl.searchParams.set('target_id', targetId);
      currentUrl.searchParams.set('target_type', targetType);

      // Stripe only substitutes the literal {CHECKOUT_SESSION_ID}; searchParams would percent-encode the braces.
      const successUrl = `${currentUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`;

      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'stripe',
          targetType,
          targetId,
          successUrl,
          cancelUrl
        })
      });

      const data = await res.json();
      if (!res.ok || !data.sessionUrl) {
        throw new Error(data.error || 'Failed to initialize Stripe Checkout session.');
      }

      // Redirect directly to Stripe hosted checkout page
      window.location.href = data.sessionUrl;
    } catch (err: any) {
      console.error('[Stripe Checkout Error]', err);
      setError(err.message || (isAr ? 'فشل تحويلك إلى صفحة الدفع الآمن.' : 'Failed to redirect to Stripe checkout.'));
      setIsProcessingStripe(false);
    }
  };

  const showBreakdown = Boolean(quote && (quote.priorSavings > 0 || quote.codeDiscount > 0 || quote.creditUsed > 0));
  const codeLabel = quote?.code
    ? quote.code.discount_type === 'percent' ? `${quote.code.value}%` : money(quote.code.value)
    : '';

  if (confirmedFree) {
    return (
      <Modal isOpen={isOpen} onClose={() => { onClose(); window.location.reload(); }} maxWidth="lg">
        <div className="relative w-full max-w-lg mx-auto p-6 sm:p-8 rounded-3xl glass-dialog text-foreground text-center" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold font-display">{isAr ? 'تم، اتأكد الحجز' : "You're all set"}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {isAr
              ? 'الكود أو رصيدك غطّى المبلغ كله، فمش محتاج تدفع حاجة. هتلاقي التفاصيل في حسابك.'
              : 'Your code or balance covered the full price, so there is nothing to pay. You will find the details in your account.'}
          </p>
          <button
            type="button"
            onClick={() => { onClose(); window.location.reload(); }}
            className="mt-6 w-full py-3 px-5 rounded-2xl btn-primary-material font-bold"
          >
            {isAr ? 'تمام' : 'Done'}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div
        className={`relative w-full max-w-lg mx-auto p-6 sm:p-8 rounded-3xl glass-dialog text-foreground overflow-hidden ${
          isAr ? 'rtl' : 'ltr'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Subtle Brand Ambient Glow Edge */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/15 via-accent/15 to-interactive/15 flex items-center justify-center text-primary border border-border/40">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-foreground">
                {isAr ? 'الدفع الآمن الفوري' : 'Instant Secure Checkout'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                <span>{isAr ? 'تشفير آمن وتأكيد فوري للحجز' : 'Encrypted & Automated Fulfillment'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-5">
              {/* Order Summary Glass Card */}
              <div className="p-4 sm:p-5 rounded-2xl glass-card border border-border/50 relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                      {isAr ? 'تفاصيل الطلب' : 'Order Summary'}
                    </span>
                    <h4 className="text-base font-bold text-foreground mt-0.5">{itemTitle}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? 'أكاديمية وتزودوا لتعليم اللغة العربية والقرآن' : 'Watazawwado Academy Arabic & Quran'}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="text-xs text-muted-foreground block">{isAr ? 'المجموع' : 'Total'}</span>
                    <div className="text-2xl font-extrabold font-display text-primary tabular-nums">
                      ${formattedAmount}{' '}
                      <span className="text-xs font-semibold text-muted-foreground">{currency}</span>
                    </div>
                  </div>
                </div>

                {/* Price breakdown, only when something was taken off */}
                {showBreakdown && quote && (
                  <dl className="mt-4 pt-4 border-t border-border/40 space-y-2 text-sm tabular-nums">
                    {quote.priorSavings > 0 && (
                      <>
                        <div className="flex justify-between gap-3 text-muted-foreground">
                          <dt>{isAr ? 'السعر من غير توفير' : 'Price before savings'}</dt>
                          <dd>{money(quote.listAmount)}</dd>
                        </div>
                        <div className="flex justify-between gap-3 text-secondary">
                          <dt>{isAr ? 'توفير الباقة والعيلة' : 'Package & family savings'}</dt>
                          <dd>−{money(quote.priorSavings)}</dd>
                        </div>
                      </>
                    )}
                    {quote.codeDiscount > 0 && quote.code && (
                      <div className="flex justify-between gap-3 text-secondary">
                        <dt>{isAr ? `كود ${quote.code.code}` : `Code ${quote.code.code}`}</dt>
                        <dd>−{money(quote.codeDiscount)}</dd>
                      </div>
                    )}
                    {quote.creditUsed > 0 && (
                      <div className="flex justify-between gap-3 text-secondary">
                        <dt>{isAr ? 'من رصيدك' : 'From your balance'}</dt>
                        <dd>−{money(quote.creditUsed)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3 pt-2 border-t border-border/40 font-bold text-foreground">
                      <dt>{isAr ? 'هتدفع' : 'You pay'}</dt>
                      <dd>{money(quote.finalAmount)}</dd>
                    </div>
                  </dl>
                )}
              </div>

              {/* Account balance */}
              {quote && (quote.balance > 0 || quote.referral) && (
                <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/50 glass-card cursor-pointer">
                  <span className="flex items-center gap-2.5 text-sm">
                    <Wallet className="w-4 h-4 text-secondary shrink-0" />
                    <span>
                      {quote.referral
                        ? (isAr
                          ? `هدية من ${quote.referral.firstName || 'صاحبك'}: ${money(quote.referral.welcomeCredit)} رصيد`
                          : `A gift from ${quote.referral.firstName || 'your friend'}: ${money(quote.referral.welcomeCredit)} credit`)
                        : (isAr ? `استخدم رصيدك (${money(quote.balance)})` : `Use my balance (${money(quote.balance)})`)}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={useCredit}
                    onChange={toggleCredit}
                    className="w-5 h-5 accent-primary shrink-0"
                  />
                </label>
              )}

              {/* Discount code */}
              {quote && (
                <div>
                  {appliedCode && quote.code ? (
                    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/10 border border-secondary/25 text-sm">
                      <span className="flex items-center gap-2 font-semibold text-secondary">
                        <Tag className="w-4 h-4" />
                        {quote.code.code} · {codeLabel}
                      </span>
                      <button type="button" onClick={removeCode} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                        {isAr ? 'شيل الكود' : 'Remove'}
                      </button>
                    </div>
                  ) : !codeOpen ? (
                    <button
                      type="button"
                      onClick={() => setCodeOpen(true)}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border inline-flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {isAr ? 'عندك كود خصم أو كود دعوة؟' : 'Have a discount or invite code?'}
                    </button>
                  ) : (
                    <form
                      onSubmit={(e) => { e.preventDefault(); applyCode(); }}
                      className="flex gap-2"
                    >
                      <Input
                        autoFocus
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(null); }}
                        placeholder={isAr ? 'اكتب الكود' : 'Enter code'}
                        aria-label={isAr ? 'كود الخصم' : 'Discount code'}
                        error={Boolean(codeError)}
                        className="uppercase tracking-wider font-semibold"
                        dir="ltr"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="submit"
                        disabled={!codeInput.trim() || checkingCode}
                        className="shrink-0 px-4 rounded-md border border-border bg-transparent hover:bg-surface-subtle text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {checkingCode && <BrandSpinner size="sm" />}
                        {isAr ? 'طبّق' : 'Apply'}
                      </button>
                    </form>
                  )}
                  {codeError && <p className="mt-2 text-xs text-destructive" role="alert">{codeError}</p>}
                  {quote.codeCapped && quote.codeDiscount >= 0 && appliedCode && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isAr
                        ? 'الخصم اتظبط عشان مجموع التوفير على الطلب ده له حد أقصى.'
                        : 'The code was adjusted because total savings on one order have a limit.'}
                    </p>
                  )}
                </div>
              )}

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-snug">{errorMessage}</div>
                </div>
              )}

              {/* Stripe Checkout (cards, Apple Pay, Google Pay and PayPal are offered on Stripe's page) */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  disabled={isProcessingStripe}
                  onClick={handleCheckout}
                  className="w-full py-3.5 px-5 rounded-2xl btn-primary-material font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingStripe ? (
                    <>
                      <BrandSpinner size="sm" />
                      <span>{total === 0 ? (isAr ? 'بنأكد الحجز...' : 'Confirming...') : (isAr ? 'جارِ التحويل إلى Stripe...' : 'Redirecting to Stripe...')}</span>
                    </>
                  ) : total === 0 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isAr ? 'أكّد الحجز من غير دفع' : 'Confirm, nothing to pay'}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>
                        {isAr
                          ? `ادفع الآن (${formattedAmount} $)`
                          : `Pay with Card / Apple Pay ($${formattedAmount})`}
                      </span>
                    </>
                  )}
                </button>
                {total > 0 && (
                  <p className="text-center text-[11px] text-muted-foreground">
                    {isAr
                      ? 'سيتم تحويلك إلى صفحة الدفع الآمنة من Stripe: بطاقة، أو Apple Pay، أو Google Pay، أو PayPal'
                      : 'You will go to Stripe’s secure checkout: card, Apple Pay, Google Pay or PayPal.'}
                  </p>
                )}
              </div>

              {/* Trust & Guarantee Footer */}
              <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-secondary" />
                  <span>{isAr ? 'تشفير كامل 256-bit SSL' : '256-bit SSL Encrypted'}</span>
                </span>
                <span>{isAr ? 'تأكيد وحجز فوري' : 'Instant Confirmation'}</span>
              </div>
        </div>
      </div>
    </Modal>
  );
}
