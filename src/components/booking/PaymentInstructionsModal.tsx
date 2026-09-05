/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — PAYMENT INSTRUCTIONS MODAL
 * File: src/components/booking/PaymentInstructionsModal.tsx
 * Role: Modal dialog for viewing payment instructions & claiming payment
 * ====================================================================
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { PaymentInstructionsCard } from './PaymentInstructionsCard';
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
  amount,
  currency,
  learnerName,
  lang = 'en'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#231D28] rounded-3xl shadow-2xl z-10 overflow-hidden my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <PaymentInstructionsCard
            bookingReference={bookingReference}
            serviceName={serviceName}
            amount={amount}
            currency={currency}
            learnerName={learnerName}
            lang={lang}
            onPaymentClaimSubmitted={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
