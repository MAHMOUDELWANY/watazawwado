/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — PAYMENT INSTRUCTIONS CARD
 * File: src/components/booking/PaymentInstructionsCard.tsx
 * Role: Art-directed payment options selector with 1-click copy & claim
 * ====================================================================
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  Info,
  CheckCircle2,
  Building2,
  Globe2,
  Send,
  HelpCircle
} from 'lucide-react';
import { OFFICIAL_PAYMENT_DETAILS, PaymentOption } from '../../lib/paymentDetails';
import { buildPaymentWhatsAppUrl } from '../../lib/whatsapp';
import { Language } from '../../booking/types';

interface PaymentInstructionsCardProps {
  bookingReference?: string;
  serviceName?: string;
  amount?: number;
  currency?: string;
  learnerName?: string;
  lang?: Language;
  onPaymentClaimSubmitted?: () => void;
  compact?: boolean;
}

export const PaymentInstructionsCard: React.FC<PaymentInstructionsCardProps> = ({
  bookingReference,
  serviceName = '1-on-1 Lesson',
  amount,
  currency = 'USD',
  learnerName,
  lang = 'en',
  onPaymentClaimSubmitted,
  compact = false
}) => {
  const isEn = lang === 'en';
  const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'payoneer' | 'bank_transfer' | 'ach'>('paypal');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Claim Payment Form State
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [claimReference, setClaimReference] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimAmount, setClaimAmount] = useState<string>(amount ? String(amount) : '');
  const [claimCurrency, setClaimCurrency] = useState<string>(currency);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const activeOption = OFFICIAL_PAYMENT_DETAILS[selectedMethod];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingReference) return;
    if (!claimReference.trim()) {
      setClaimError(isEn ? 'Please provide your transaction reference or sender name.' : 'يرجى إدخال الرقم المرجعي أو اسم المحول.');
      return;
    }

    setIsSubmittingClaim(true);
    setClaimError(null);

    try {
      const parsedAmt = Number(claimAmount) || amount;
      const res = await fetch(`/api/bookings/${bookingReference}/payment-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: selectedMethod === 'bank_transfer' ? 'international_bank_iban' : selectedMethod === 'ach' ? 'ach_routing' : selectedMethod,
          payment_reference: claimReference.trim(),
          amount: parsedAmt,
          currency: claimCurrency.trim().toUpperCase(),
          notes: claimNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment confirmation.');
      }

      setClaimSubmitted(true);
      if (onPaymentClaimSubmitted) {
        onPaymentClaimSubmitted();
      }
    } catch (err: any) {
      setClaimError(err.message || 'Could not record payment. Please reach out to Mahmoud on WhatsApp.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const whatsappUrl = buildPaymentWhatsAppUrl({
    bookingRef: bookingReference,
    serviceName,
    amount,
    currency,
    paymentMethod: activeOption.name
  });

  return (
    <div className={`rounded-3xl bg-white dark:bg-[#231D28] border border-[#87A878]/30 shadow-xs overflow-hidden ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7'} space-y-5`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#D5D0CA] dark:border-[#3E3545]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#EDE3D4] dark:bg-[#1E1923] text-[#87A878]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {isEn ? 'Payment Instructions' : 'تفاصيل وطرق الدفع'}
            </h3>
            <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
              {isEn
                ? 'Choose the method that is most convenient for you.'
                : 'اختر الطريقة الأنسب والأسهل بالنسبة لك.'}
            </p>
          </div>
        </div>

        {amount && (
          <div className="text-left sm:text-right bg-[#FAF8F5] dark:bg-[#1E1923] px-3.5 py-2 rounded-2xl border border-[#87A878]/20">
            <span className="text-[11px] uppercase font-semibold text-[#362E3B]/55 dark:text-[#D5D0CA]/55 block">
              {isEn ? 'Lesson Fee' : 'قيمة الدرس'}
            </span>
            <span className="text-base font-bold text-[#6F907D] dark:text-[#8FAE9B]">
              {amount.toFixed(2)} {currency}
            </span>
          </div>
        )}
      </div>

      {/* Payment Method Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['paypal', 'payoneer', 'bank_transfer', 'ach'] as const).map((methodKey) => {
          const opt = OFFICIAL_PAYMENT_DETAILS[methodKey];
          const isSelected = selectedMethod === methodKey;
          return (
            <button
              key={methodKey}
              type="button"
              onClick={() => {
                setSelectedMethod(methodKey);
                setClaimSubmitted(false);
              }}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#EAF0EB] dark:bg-[#2A352F] border-[#6F907D] text-[#30332F] dark:text-[#F5E6D3] shadow-xs'
                  : 'bg-[#FAF8F5] dark:bg-[#1E1923] border-[#D5D0CA]/60 dark:border-[#3E3545] text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:border-[#87A878]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">{isEn ? opt.name : opt.nameArabic}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#6F907D]" />}
              </div>
              <span className="text-[10px] text-[#6F907D] dark:text-[#8FAE9B] font-medium">
                {isEn ? opt.badge : opt.badgeArabic}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Payment Method Details Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1923] border border-[#87A878]/30 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6F907D] dark:text-[#8FAE9B]">
              {isEn ? activeOption.name : activeOption.nameArabic}
            </span>
            <span className="text-[11px] text-[#362E3B]/60 dark:text-[#D5D0CA]/60">
              {isEn ? activeOption.badge : activeOption.badgeArabic}
            </span>
          </div>
          <p className="text-xs text-[#362E3B]/80 dark:text-[#D5D0CA]/80 mt-1 leading-relaxed">
            {isEn ? activeOption.instructions : activeOption.instructionsArabic}
          </p>
        </div>

        {/* Details Table with Copy Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#D5D0CA]/50 dark:border-[#3E3545]">
          {Object.entries(activeOption.details).map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#231D28] border border-[#D5D0CA]/40 dark:border-[#3E3545]"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-semibold text-[#362E3B]/50 dark:text-[#D5D0CA]/50 block">
                  {label}
                </span>
                <span className="text-xs font-mono font-medium text-[#362E3B] dark:text-[#F5E6D3] select-all break-all">
                  {val}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(label, val)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#EDE3D4]/50 dark:bg-[#1E1923] hover:bg-[#87A878]/20 text-[#362E3B] dark:text-[#F5E6D3] transition-colors cursor-pointer shrink-0"
              >
                {copiedKey === label ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#6F907D]" />
                    <span className="text-[#6F907D] font-semibold">{isEn ? 'Copied' : 'تم'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 opacity-60" />
                    <span>{isEn ? 'Copy' : 'نسخ'}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Notice & Claim Status */}
      {claimSubmitted ? (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isEn ? 'Payment Claim Submitted' : 'تم استلام بيانات التحويل بنجاح'}</span>
          </div>
          <p className="leading-relaxed">
            {isEn
              ? 'Thank you! Your payment details have been recorded as Pending Review. Ustadh Mahmoud will verify receipt and confirm your payment status shortly.'
              : 'شكراً لك! تم تسجيل بيانات الدفع وهي قيد المراجعة. سيقوم الأستاذ محمود بالتحقق وتأكيد استلام المبلغ قريباً.'}
          </p>
        </div>
      ) : (
        /* Action Buttons: "I've Made the Payment" & "Ask on WhatsApp" */
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {bookingReference && (
              <button
                type="button"
                onClick={() => setIsClaimOpen(!isClaimOpen)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#6F907D] hover:bg-[#5C7969] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isEn ? "I've Made the Payment" : 'قمت بالتحويل بالفعل'}</span>
              </button>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#1E1923] border border-[#D5D0CA] dark:border-[#3E3545] text-xs font-semibold text-[#362E3B] dark:text-[#F5E6D3] hover:bg-[#FAF8F5] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#87A878]" />
              <span>{isEn ? 'Ask Mahmoud on WhatsApp' : 'استفسار عبر واتساب'}</span>
            </a>
          </div>

          {/* Form to submit payment confirmation claim */}
          <AnimatePresence>
            {isClaimOpen && bookingReference && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitClaim}
                className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1923] border border-[#87A878]/30 space-y-4"
              >
                <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
                  <Send className="w-4 h-4 text-[#6F907D]" />
                  <span>{isEn ? 'Confirm Your Payment' : 'تأكيد إرسال الدفعة'}</span>
                </div>

                <p className="text-[11px] text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
                  {isEn
                    ? 'Please share your transaction reference code or sender name to help Mahmoud verify your payment.'
                    : 'يرجى تزويدنا برقم العملية أو اسم الحساب المحول منه ليتمكن الأستاذ محمود من تأكيد استلامها.'}
                </p>

                {claimError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-300">
                    {claimError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">
                      {isEn ? 'Transaction Reference / Sender Name *' : 'رقم الحوالة أو اسم المحول *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isEn ? 'e.g. PayPal Transaction ID or Bank Ref' : 'مثال: رقم الحوالة أو اسم الحساب'}
                      value={claimReference}
                      onChange={(e) => setClaimReference(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#231D28] text-[#362E3B] dark:text-[#F5E6D3] focus:border-[#6F907D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">
                      {isEn ? 'Amount Paid' : 'المبلغ المحول'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="15.00"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                        className="w-2/3 px-3.5 py-2 rounded-xl text-xs border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#231D28] text-[#362E3B] dark:text-[#F5E6D3] focus:border-[#6F907D] outline-none"
                      />
                      <input
                        type="text"
                        maxLength={3}
                        value={claimCurrency}
                        onChange={(e) => setClaimCurrency(e.target.value.toUpperCase())}
                        className="w-1/3 px-2 py-2 text-center rounded-xl text-xs font-mono uppercase border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#231D28] text-[#362E3B] dark:text-[#F5E6D3] focus:border-[#6F907D] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">
                    {isEn ? 'Optional Note' : 'ملاحظات إضافية (اختياري)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEn ? 'Any additional transfer info...' : 'أي تفاصيل أخرى حول التحويل...'}
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#231D28] text-[#362E3B] dark:text-[#F5E6D3] focus:border-[#6F907D] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsClaimOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:bg-[#EDE3D4] transition-colors cursor-pointer"
                  >
                    {isEn ? 'Cancel' : 'إلغاء'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClaim}
                    className="px-5 py-2 rounded-xl bg-[#6F907D] hover:bg-[#5C7969] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingClaim ? (isEn ? 'Submitting...' : 'جاري الإرسال...') : (isEn ? 'Submit for Verification' : 'إرسال للمراجعة')}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Safety & Integrity Guarantee Footer */}
      <div className="flex items-center gap-2 pt-2 text-[11px] text-[#362E3B]/60 dark:text-[#D5D0CA]/60">
        <ShieldCheck className="w-3.5 h-3.5 text-[#6F907D] shrink-0" />
        <span>
          {isEn
            ? 'Payments are verified directly by Mahmoud. We never store credit cards or sensitive bank credentials.'
            : 'يتم التحقق من الدفع يدوياً بواسطة الأستاذ محمود. لا نطلب ولا نخزن بيانات بطاقات بنكية أو كلمات سر.'}
        </span>
      </div>
    </div>
  );
};
