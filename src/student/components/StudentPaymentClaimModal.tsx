import React from 'react';
import { InstantCheckoutModal } from '../../components/payment/InstantCheckoutModal';

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

/**
 * Student Automated Payment Modal
 * Upgraded from legacy manual bank claim to automated instant PayPal Live and Stripe Checkout.
 */
export function StudentPaymentClaimModal({
  isOpen,
  onClose,
  bookingReference,
  entitlementId,
  itemTitle = '1-on-1 Lesson',
  amount = 9,
  currency = 'USD',
  lang = 'ar',
  onClaimSuccess,
}: StudentPaymentClaimModalProps) {
  const targetType = entitlementId ? 'package' : 'booking';
  const targetId = entitlementId || bookingReference || '';

  return (
    <InstantCheckoutModal
      isOpen={isOpen}
      onClose={onClose}
      targetType={targetType}
      targetId={targetId}
      itemTitle={itemTitle}
      amount={amount}
      currency={currency}
      lang={lang}
      onSuccess={onClaimSuccess}
    />
  );
}
