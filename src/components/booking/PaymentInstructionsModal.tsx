/**
 * ====================================================================
 * WATAZAWWADO ACADEMY — AUTOMATED PAYMENT MODAL
 * File: src/components/booking/PaymentInstructionsModal.tsx
 * Role: Modern 4-color liquid glass checkout modal (PayPal Live & Stripe)
 * ====================================================================
 */

import React from 'react';
import { InstantCheckoutModal } from '../payment/InstantCheckoutModal';
import { Language } from '../../booking/types';

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingReference?: string;
  serviceName?: string;
  amount?: number;
  currency?: string;
  learnerName?: string;
  lang?: Language;
}

export const PaymentInstructionsModal: React.FC<PaymentInstructionsModalProps> = ({
  isOpen,
  onClose,
  bookingReference,
  serviceName,
  amount = 9,
  currency = 'USD',
  lang = 'ar'
}) => {
  return (
    <InstantCheckoutModal
      isOpen={isOpen}
      onClose={onClose}
      targetType="booking"
      targetId={bookingReference || ''}
      itemTitle={serviceName || '1-on-1 Lesson'}
      amount={amount}
      currency={currency}
      lang={lang === 'ar' ? 'ar' : 'en'}
      onSuccess={onClose}
    />
  );
};
