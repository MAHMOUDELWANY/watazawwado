import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  ExternalLink,
  X,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { BrandSpinner } from '../ui/BrandLoader';
import { GlassSurface } from '../ui/GlassSurface';

export interface InstantCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'booking' | 'package';
  targetId: string;
  itemTitle?: string;
  amount: number;
  currency?: string;
  lang?: 'en' | 'ar';
  onSuccess?: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
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
  onSuccess
}: InstantCheckoutModalProps) {
  const isAr = lang === 'ar';
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal'>('stripe');
  const [config, setConfig] = useState<{
    paypalClientId?: string;
    paypalMode?: string;
    stripePublishableKey?: string;
  } | null>(null);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [isProcessingPayPal, setIsProcessingPayPal] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  const paypalContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch public payment gateway configuration
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoadingConfig(true);
    setError(null);
    setPaymentSuccess(false);

    fetch('/api/payments/config')
      .then(res => res.json())
      .then(data => {
        if (mounted) {
          setConfig(data);
          setLoadingConfig(false);
        }
      })
      .catch(err => {
        if (mounted) {
          console.error('[Payment Config Error]', err);
          setError(isAr ? 'تعذر الاتصال ببوابة الدفع. يرجى المحاولة لاحقاً.' : 'Could not reach payment services. Please try again.');
          setLoadingConfig(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, isAr]);

  // 2. Load and render PayPal SDK when PayPal tab is active
  useEffect(() => {
    if (!isOpen || selectedGateway !== 'paypal' || !config?.paypalClientId || paymentSuccess) {
      return;
    }

    let isMounted = true;
    const clientId = config.paypalClientId;
    const scriptId = 'paypal-js-sdk-live';

    const renderPayPalButtons = () => {
      if (!window.paypal || !paypalContainerRef.current) return;
      paypalContainerRef.current.innerHTML = '';

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'pill',
          label: 'pay',
          height: 48
        },
        createOrder: async () => {
          setIsProcessingPayPal(true);
          setError(null);
          try {
            const res = await fetch('/api/payments/create-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gateway: 'paypal',
                targetType,
                targetId
              })
            });
            const data = await res.json();
            if (!res.ok || !data.orderId) {
              throw new Error(data.error || 'Failed to initialize PayPal order.');
            }
            return data.orderId;
          } catch (err: any) {
            console.error('[PayPal createOrder error]', err);
            setError(err.message || (isAr ? 'فشل إنشاء طلب باي بال' : 'Failed to create PayPal order.'));
            setIsProcessingPayPal(false);
            throw err;
          }
        },
        onApprove: async (data: any) => {
          try {
            const res = await fetch('/api/payments/paypal/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                targetType,
                targetId
              })
            });
            const captureData = await res.json();
            if (!res.ok || !captureData.success) {
              throw new Error(captureData.error || 'Payment capture failed.');
            }

            if (isMounted) {
              setPaymentSuccess(true);
              setIsProcessingPayPal(false);
              if (onSuccess) {
                setTimeout(() => onSuccess(), 1500);
              }
            }
          } catch (err: any) {
            console.error('[PayPal onApprove error]', err);
            if (isMounted) {
              setError(err.message || (isAr ? 'حدث خطأ أثناء تأكيد الدفع.' : 'Payment capture failed.'));
              setIsProcessingPayPal(false);
            }
          }
        },
        onError: (err: any) => {
          console.error('[PayPal SDK onError]', err);
          if (isMounted) {
            setError(isAr ? 'حدث خطأ من جانب باي بال. يرجى إعادة المحاولة.' : 'A PayPal error occurred. Please try again.');
            setIsProcessingPayPal(false);
          }
        },
        onCancel: () => {
          if (isMounted) {
            setIsProcessingPayPal(false);
          }
        }
      }).render(paypalContainerRef.current);

      if (isMounted) {
        setPaypalLoaded(true);
      }
    };

    if (window.paypal) {
      renderPayPalButtons();
    } else {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.addEventListener('load', renderPayPalButtons);
      } else {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
        script.async = true;
        script.onload = () => {
          renderPayPalButtons();
        };
        script.onerror = () => {
          if (isMounted) {
            setError(isAr ? 'تعذر تحميل مكتبة باي بال.' : 'Could not load PayPal SDK.');
          }
        };
        document.body.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
      if (paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = '';
      }
    };
  }, [isOpen, selectedGateway, config?.paypalClientId, targetType, targetId, paymentSuccess, isAr, onSuccess]);

  // 3. Handle Stripe Checkout Redirect
  const handleStripeCheckout = async () => {
    setIsProcessingStripe(true);
    setError(null);

    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
      currentUrl.searchParams.set('gateway', 'stripe');
      currentUrl.searchParams.set('payment_status', 'success');

      const successUrl = currentUrl.toString();
      currentUrl.searchParams.delete('session_id');
      currentUrl.searchParams.set('payment_cancelled', 'true');
      const cancelUrl = currentUrl.toString();

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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
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
          {paymentSuccess ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-foreground font-display">
                {isAr ? 'تم تأكيد الدفع بنجاح!' : 'Payment Confirmed!'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {isAr
                  ? 'تم استلام المبلغ بنجاح وتأكيد حجزك آلياً. تم إرسال رسالة التأكيد وتفاصيل الدرس إلى بريدك الإلكتروني.'
                  : 'Your payment was successfully captured and confirmed. A confirmation receipt has been sent to your email.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl btn-primary-material font-semibold text-sm shadow-md"
                >
                  {isAr ? 'تم، العودة إلى لوحة التحكم' : 'Done, return to dashboard'}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
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

              {/* Gateway Tabs */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-3 uppercase tracking-wider">
                  {isAr ? 'اختر وسيلة الدفع المفضلة' : 'Select Payment Gateway'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Stripe Card Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateway('stripe');
                      setError(null);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between gap-3 ${
                      selectedGateway === 'stripe'
                        ? 'border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/30'
                        : 'border-border/60 glass-surface hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <CreditCard className={`w-5 h-5 ${selectedGateway === 'stripe' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border/40 text-foreground/80">
                          Apple Pay
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border/40 text-foreground/80">
                          Cards
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {isAr ? 'بطاقات الدفع / أبل باي' : 'Cards & Apple Pay'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {isAr ? 'دفع آمن عبر Stripe' : 'Powered by Stripe'}
                      </div>
                    </div>
                  </button>

                  {/* PayPal Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateway('paypal');
                      setError(null);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between gap-3 ${
                      selectedGateway === 'paypal'
                        ? 'border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/30'
                        : 'border-border/60 glass-surface hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="font-extrabold text-sm text-[#003087] dark:text-[#0079C1] tracking-tight">
                        PayPal
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {isAr ? 'مباشر' : 'Live'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {isAr ? 'حساب باي بال' : 'PayPal Account'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {isAr ? 'الدفع الآمن الفوري' : 'Instant & Global'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Gateway Action Area */}
              <div className="pt-2">
                {selectedGateway === 'stripe' ? (
                  /* Stripe Action */
                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={isProcessingStripe || loadingConfig}
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
                        ? 'سيتم تحويلك إلى نافذة الدفع المشفرة التابعة لـ Stripe لإتمام المعاملة بأمان'
                        : 'You will be redirected to Stripe’s secure encrypted checkout page.'}
                    </p>
                  </div>
                ) : (
                  /* PayPal Action */
                  <div className="space-y-3">
                    <div
                      ref={paypalContainerRef}
                      className="min-h-[48px] flex items-center justify-center"
                    >
                      {(!paypalLoaded || isProcessingPayPal) && (
                        <div className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <BrandSpinner size="sm" />
                          <span>{isAr ? 'جارِ تهيئة بوابة باي بال...' : 'Loading PayPal gateway...'}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-center text-[11px] text-muted-foreground">
                      {isAr
                        ? 'معاملة رسمية ومباشرة عبر حساب باي بال التجاري الرسمي'
                        : 'Official live transaction with verified PayPal Business account.'}
                    </p>
                  </div>
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
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
