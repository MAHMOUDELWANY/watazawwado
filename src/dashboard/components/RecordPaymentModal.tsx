import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, AlertCircle, Calendar, Hash, FileText } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { PaymentMethodType, PaymentRecordStatus } from '../types';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string | null;
  studentId?: string | null;
  bookingReference?: string | null;
  contactName?: string | null;
  expectedAmount?: number | null;
  defaultCurrency?: string;
  onPaymentRecorded: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  studentId,
  bookingReference,
  contactName,
  expectedAmount,
  defaultCurrency = '',
  onPaymentRecorded
}) => {
  const [amount, setAmount] = useState<string>(
    expectedAmount !== null && expectedAmount !== undefined && expectedAmount > 0 
      ? String(expectedAmount) 
      : ''
  );
  const [currency, setCurrency] = useState<string>(defaultCurrency || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('paypal');
  const [status, setStatus] = useState<PaymentRecordStatus>('confirmed');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(
        expectedAmount !== null && expectedAmount !== undefined && expectedAmount > 0 
          ? String(expectedAmount) 
          : ''
      );
      setCurrency(defaultCurrency || '');
      setPaymentMethod('paypal');
      setStatus('confirmed');
      setPaymentReference('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, expectedAmount, defaultCurrency]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (!currency || !currency.trim()) {
      setError('Please select or configure a valid payment currency.');
      return;
    }

    setSubmitting(true);
    try {
      await dashboardFetch('/api/dashboard/payments', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: bookingId || null,
          student_id: studentId || null,
          amount: parsedAmount,
          currency: currency.toUpperCase().trim(),
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || null,
          status,
          notes: notes.trim() || null
        })
      });

      onPaymentRecorded();
      onClose();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to record payment. Please check details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-payment-title"
    >
      <div 
        className="bg-[#FAF8F5] dark:bg-[#231E28] border border-[#D5D0CA]/60 dark:border-[#3E3545] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D5D0CA]/40 dark:border-[#3E3545] flex items-center justify-between bg-white/50 dark:bg-[#2A2431]/50">
          <div>
            <h2 id="record-payment-title" className="text-lg font-semibold text-[#362E3B] dark:text-[#F5E6D3] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#8FAE9B]" />
              Record Manual Payment
            </h2>
            <p className="text-xs text-[#362E3B]/70 dark:text-[#F5E6D3]/70 mt-0.5">
              {bookingReference ? `Linked to Booking ${bookingReference}` : 'Record manual receipt or claim'}
              {contactName ? ` (${contactName})` : ''}
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] mb-1">
                Amount Received *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 25.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 text-sm bg-white dark:bg-[#1E1923] border border-[#D5D0CA] dark:border-[#3E3545] rounded-xl text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] mb-1">
                Currency *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1E1923] border border-[#D5D0CA] dark:border-[#3E3545] rounded-xl text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              >
                {!currency && <option value="">Select currency...</option>}
                <option value="USD">USD ($)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="EGP">EGP (E£)</option>
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1E1923] border border-[#D5D0CA] dark:border-[#3E3545] rounded-xl text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
            >
              <option value="paypal">PayPal</option>
              <option value="international_bank_iban">International Bank / IBAN</option>
              <option value="ach_routing">ACH / US Routing</option>
              <option value="payoneer">Payoneer</option>
              <option value="wise">Wise</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] mb-1">
              Initial Verification Status *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label 
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  status === 'confirmed' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-white dark:bg-[#1E1923] border-[#D5D0CA] dark:border-[#3E3545] text-stone-600 dark:text-stone-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="payment_status" 
                  value="confirmed" 
                  checked={status === 'confirmed'} 
                  onChange={() => setStatus('confirmed')}
                  className="text-emerald-600 focus:ring-emerald-500" 
                />
                <div>
                  <span className="block font-semibold">Confirmed</span>
                  <span className="block text-[10px] opacity-75">Funds already received & verified</span>
                </div>
              </label>

              <label 
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  status === 'pending' 
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-800 dark:text-amber-300' 
                    : 'bg-white dark:bg-[#1E1923] border-[#D5D0CA] dark:border-[#3E3545] text-stone-600 dark:text-stone-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="payment_status" 
                  value="pending" 
                  checked={status === 'pending'} 
                  onChange={() => setStatus('pending')}
                  className="text-amber-600 focus:ring-amber-500" 
                />
                <div>
                  <span className="block font-semibold">Pending Review</span>
                  <span className="block text-[10px] opacity-75">To be verified by Mahmoud</span>
                </div>
              </label>
            </div>
          </div>

          {/* Reference / Transaction ID */}
          <div>
            <label className="block text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] mb-1">
              Payment Reference / Transaction ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. PayPal TXN-987654 or Bank Transfer Ref"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1E1923] border border-[#D5D0CA] dark:border-[#3E3545] rounded-xl text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] mb-1">
              Private Teacher Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Sent from student's father account, verified via Wise receipt"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1E1923] border border-[#D5D0CA] dark:border-[#3E3545] rounded-xl text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#D5D0CA]/40 dark:border-[#3E3545]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#6F907D] hover:bg-[#5E7D6B] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Payment Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
