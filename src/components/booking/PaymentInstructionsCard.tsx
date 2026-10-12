/**
 * ====================================================================
 * WATAZAWWADO ACADEMY — AUTOMATED PAYMENT CARD
 * File: src/components/booking/PaymentInstructionsCard.tsx
 * Role: Modern 4-color liquid glass checkout card (PayPal Live & Stripe)
 * ====================================================================
 */

import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { InstantCheckoutModal } from '../payment/InstantCheckoutModal';
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
  amount = 9,
  currency = 'USD',
  learnerName,
  lang = 'en',
  onPaymentClaimSubmitted,
  compact = false
}) => {
  const isEn = lang === 'en';
  const isAr = lang === 'ar';
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={`rounded-3xl glass-card border border-border/50 overflow-hidden ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7'} space-y-5`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/15 via-accent/15 to-interactive/15 flex items-center justify-center text-primary border border-border/40">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              {isEn ? 'Instant Online Checkout' : 'الدفع الإلكتروني الفوري'}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              <span>{isEn ? 'Automated confirmation with PayPal Live & Stripe' : 'تأكيد وحجز فوري عبر PayPal Live و Stripe'}</span>
            </p>
          </div>
        </div>

        {amount && (
          <div className="text-start sm:text-end glass-surface px-4 py-2 rounded-2xl border border-secondary/40 shrink-0">
            <span className="text-[11px] uppercase font-bold text-muted-foreground block">
              {isEn ? 'Lesson Fee' : 'قيمة الدرس'}
            </span>
            <span className="text-xl font-extrabold text-primary font-display">
              ${amount.toFixed(2)}{' '}
              <span className="text-xs font-semibold text-muted-foreground">{currency}</span>
            </span>
          </div>
        )}
      </div>

      {/* Gateway Presentation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Stripe / Cards Feature Card */}
        <div className="p-4 rounded-2xl glass-surface border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{isEn ? 'Credit & Debit Cards' : 'بطاقات الدفع / أبل باي'}</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border/40 text-foreground/80">
              Apple Pay
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isEn ? 'Fast, encrypted global payments powered by Stripe.' : 'دفع مشفر وسريع عبر Stripe لجميع البطاقات وأبل باي.'}
          </p>
        </div>

        {/* PayPal Feature Card */}
        <div className="p-4 rounded-2xl glass-surface border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-[#003087] dark:text-[#0079C1]">PayPal</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {isEn ? 'Live' : 'مباشر'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isEn ? 'Direct checkout with verified PayPal Business account.' : 'دفع مباشر ومعتمد من خلال حساب باي بال التجاري الرسمي.'}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 px-6 rounded-2xl btn-primary-material font-bold text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99]"
        >
          <CreditCard className="w-5 h-5" />
          <span>{isEn ? `Pay Now ($${amount.toFixed(2)})` : `ادفع الآن وأكّد الحجز (${amount.toFixed(2)} $)`}</span>
        </button>
      </div>

      {/* WhatsApp Support fallback */}
      <div className="pt-2 text-center">
        <a
          href="https://wa.me/201026042456?text=Assalamu%20Alaikum%20Ustadh%20Mahmoud%2C%20I%20have%20a%20question%20regarding%20payment."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{isEn ? 'Need help with payment? Contact Mahmoud on WhatsApp' : 'هل تحتاج مساعدة في الدفع؟ تواصل مع الأستاذ محمود على واتساب'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Instant Checkout Modal */}
      {isModalOpen && (
        <InstantCheckoutModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetType="booking"
          targetId={bookingReference || ''}
          itemTitle={serviceName}
          amount={amount}
          currency={currency}
          lang={isAr ? 'ar' : 'en'}
          onSuccess={() => {
            setIsModalOpen(false);
            if (onPaymentClaimSubmitted) {
              onPaymentClaimSubmitted();
            }
          }}
        />
      )}
    </div>
  );
};
