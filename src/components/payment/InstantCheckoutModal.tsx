import React, { useState } from 'react';
import { CreditCard, ShieldCheck, AlertCircle, Lock, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { BrandSpinner } from '../ui/BrandLoader';

export interface InstantCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'booking' | 'package';
  targetId: string;
  itemTitle?: string;
  amount: number;
  currency?: string;
  lang?: 'en' | 'ar';
  /** shortcut: never called, Stripe Checkout redirects away and the return page confirms the payment; remove with the callers' handlers when they are next touched. */
  onSuccess?: () => void;
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
}: InstantCheckoutModalProps) {
  const isAr = lang === 'ar';
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  // 3. Handle Stripe Checkout Redirect
  const handleStripeCheckout = async () => {
    setIsProcessingStripe(true);
    setError(null);

    try {
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

  const formattedAmount = Number(amount || 0).toFixed(2);

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
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6">
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
                    <div className="text-2xl font-extrabold font-display text-primary">
                      ${formattedAmount}{' '}
                      <span className="text-xs font-semibold text-muted-foreground">{currency}</span>
                    </div>
                  </div>
                </div>
              </div>

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
                  onClick={handleStripeCheckout}
                  className="w-full py-3.5 px-5 rounded-2xl btn-primary-material font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingStripe ? (
                    <>
                      <BrandSpinner size="sm" />
                      <span>{isAr ? 'جارِ التحويل إلى Stripe...' : 'Redirecting to Stripe...'}</span>
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
                <p className="text-center text-[11px] text-muted-foreground">
                  {isAr
                    ? 'سيتم تحويلك إلى صفحة الدفع الآمنة من Stripe: بطاقة، أو Apple Pay، أو Google Pay، أو PayPal'
                    : 'You will go to Stripe’s secure checkout: card, Apple Pay, Google Pay or PayPal.'}
                </p>
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
