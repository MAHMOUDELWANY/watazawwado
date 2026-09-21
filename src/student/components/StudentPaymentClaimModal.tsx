import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Copy,
  Check,
  Building2,
  Globe2,
  Send,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { OFFICIAL_PAYMENT_DETAILS, PaymentOption } from '../../lib/paymentDetails';
import { buildPaymentWhatsAppUrl } from '../../lib/whatsapp';

export interface StudentPaymentClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingReference?: string;
  entitlementId?: string;
  itemTitle?: string;
  amount?: number;
  currency?: string;
  lang?: 'en' | 'ar';
  onClaimSuccess?: () => void;
  sessionToken?: string;
}

export function StudentPaymentClaimModal({
  isOpen,
  onClose,
  bookingReference,
  entitlementId,
  itemTitle = '1-on-1 Lesson',
  amount,
  currency = 'USD',
  lang = 'en',
  onClaimSuccess,
  sessionToken,
}: StudentPaymentClaimModalProps) {
  const isAr = lang === 'ar';
  const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'payoneer' | 'bank_transfer' | 'ach'>('paypal');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [claimAmount, setClaimAmount] = useState<string>(amount ? String(amount) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOption: PaymentOption = OFFICIAL_PAYMENT_DETAILS[selectedMethod];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const resetForm = () => {
    setPaymentReference('');
    setNotes('');
    setError(null);
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentReference.trim()) {
      setError(isAr ? 'يرجى إدخال الرقم المرجعي أو اسم المحول' : 'Please provide your transaction reference or sender name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const parsedAmount = claimAmount ? Number(claimAmount) : amount;
      const apiMethod =
        selectedMethod === 'bank_transfer'
          ? 'international_bank_iban'
          : selectedMethod === 'ach'
          ? 'ach_routing'
          : selectedMethod;

      const payload: any = {
        payment_method: apiMethod,
        payment_reference: paymentReference.trim(),
        amount: parsedAmount,
        currency: currency || 'USD',
        notes: notes.trim()
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      let endpoint = '';
      if (bookingReference) {
        endpoint = `/api/bookings/${encodeURIComponent(bookingReference)}/payment-claim`;
      } else if (entitlementId) {
        endpoint = `/api/packages/${encodeURIComponent(entitlementId)}/payment-claim`;
      } else {
        throw new Error(isAr ? 'بيانات المطالبة غير مكتملة' : 'Missing booking or package reference');
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isAr ? 'فشل إرسال إشعار الدفع' : 'Failed to submit payment confirmation.'));
      }

      setSubmitted(true);
      if (onClaimSuccess) {
        onClaimSuccess();
      }
    } catch (err: any) {
      console.error('[StudentPaymentClaimModal Error]', err);
      setError(err.message || (isAr ? 'حدث خطأ أثناء إرسال البيانات' : 'Submission failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = buildPaymentWhatsAppUrl({
    bookingRef: bookingReference || entitlementId,
    serviceName: itemTitle,
    amount,
    currency,
    paymentMethod: activeOption?.name
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-foreground">
              {isAr ? 'تأكيد وإثبات الدفع' : 'Payment Instructions & Confirmation'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {itemTitle} {amount ? `• $${amount} ${currency}` : ''}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-foreground text-start">
        {/* Policy Notice */}
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
          <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground block mb-0.5">
              {isAr ? 'التحقق اليدوي المباشر مع الأستاذ محمود' : 'Manual Teacher Verification'}
            </span>
            <span>
              {isAr
                ? 'يتم التحقق من جميع المدفوعات يدوياً من قِبل الأستاذ محمود فور استلام الحوالة وتفعيل رصيدك أو تأكيد حجزك فوراً.'
                : 'All transfers are verified manually by Ustadh Mahmoud. Once your reference is received, your session or package credits will be activated.'}
            </span>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-6 px-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-serif font-bold text-foreground">
                {isAr ? 'تم استلام بيانات التحويل بنجاح' : 'Payment Confirmation Submitted'}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                {isAr
                  ? 'شكراً لك. سيقوم الأستاذ محمود بمراجعة الحوالة وتفعيل الحجز / الرصيد في أقرب وقت. يمكنك أيضاً إرسال إشعار عبر واتساب.'
                  : 'Ustadh Mahmoud will review the transfer and activate your booking or credits. You may also send the confirmation directly via WhatsApp.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              >
                <span>{isAr ? 'إرسال الإشعار عبر واتساب' : 'Notify on WhatsApp'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleClose}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {isAr ? '١. اختر وسيلة التحويل المناسبة' : '1. Choose Payment Method'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['paypal', 'payoneer', 'bank_transfer', 'ach'] as const).map(methodKey => {
                  const opt = OFFICIAL_PAYMENT_DETAILS[methodKey];
                  const isSelected = selectedMethod === methodKey;
                  return (
                    <button
                      key={methodKey}
                      type="button"
                      onClick={() => setSelectedMethod(methodKey)}
                      className={`
                        p-3 rounded-xl border text-start transition-all cursor-pointer min-h-[56px] flex flex-col justify-between
                        ${isSelected
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                          : 'border-border bg-surface hover:bg-surface-subtle text-foreground'
                        }
                      `}
                    >
                      <span className="text-xs font-bold truncate block">{isAr ? opt.nameArabic : opt.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate block mt-0.5">
                        {isAr ? opt.badgeArabic : opt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Official Account Details */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {isAr ? activeOption.nameArabic : activeOption.name}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/15 text-primary font-medium">
                  {isAr ? activeOption.badgeArabic : activeOption.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr ? activeOption.instructionsArabic : activeOption.instructions}
              </p>

              {/* Copyable Credential Fields */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                {Object.entries(activeOption.details).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        {key}
                      </span>
                      <span className="font-mono font-medium text-foreground truncate block select-all">
                        {val}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(key, val)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors shrink-0 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title={isAr ? 'نسخ' : 'Copy to clipboard'}
                    >
                      {copiedKey === key ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Claim Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isAr ? '٢. أدخل بيانات إثبات التحويل' : '2. Provide Transfer Details'}
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {bookingReference ? `Ref: ${bookingReference}` : ''}
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {isAr ? 'الرقم المرجعي للحوالة أو اسم المحول *' : 'Transaction Reference / Sender Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: رقم العملية، أو اسم صاحب الحساب المحول منه'
                        : 'e.g. Transaction ID, PayPal email, or bank sender name'
                    }
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {isAr ? 'المبلغ المحول' : 'Transferred Amount'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder={amount ? String(amount) : '0.00'}
                      className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {isAr ? 'العملة' : 'Currency'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currency}
                      className="w-full px-3.5 py-2.5 bg-surface-subtle border border-border rounded-xl text-xs sm:text-sm text-muted-foreground min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {isAr ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      isAr
                        ? 'أي تفاصيل أخرى تسهل مطابقة الحوالة'
                        : 'Any notes to help identify your transfer'
                    }
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer min-h-[44px]"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جارٍ الإرسال...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isAr ? 'تأكيد إرسال الإشعار' : 'Submit Confirmation'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
