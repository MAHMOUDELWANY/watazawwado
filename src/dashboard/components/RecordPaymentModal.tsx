import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, AlertCircle, Calendar, Hash, FileText } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { PaymentMethodType, PaymentRecordStatus } from '../types';
import { useT } from '../../lib/language';

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
  const { t } = useT();
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
      setError(t('Please enter an amount above zero.', 'اكتب مبلغ أكبر من صفر.'));
      return;
    }

    if (!currency || !currency.trim()) {
      setError(t('Please choose a currency.', 'اختار العملة.'));
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
      setError(err?.data?.error || err?.message || t("Couldn't save the payment. Check the details and try again.", 'تعذر حفظ الدفع. راجع البيانات وحاول تاني.'));
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
        className="glass-card border-none rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between glass-surface/50">
          <div>
            <h2 id="record-payment-title" className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              {t('Record a payment', 'سجّل دفع')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {bookingReference ? t(`For lesson ${bookingReference}`, `للحصة ${bookingReference}`) : t('A payment you received outside the site', 'دفع وصلك برّه الموقع')}
              {contactName ? ` (${contactName})` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center disabled:opacity-50"
            aria-label={t('Close', 'إغلاق')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="rpm-amount">
                {t('Amount received', 'المبلغ اللي وصل')} *
              </label>
              <div className="relative">
                <input
                  id="rpm-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="25.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm glass-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="rpm-currency">
                {t('Currency', 'العملة')} *
              </label>
              <select
                id="rpm-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm glass-surface border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              >
                {!currency && <option value="">{t('Choose…', 'اختار…')}</option>}
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
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="rpm-method">
              {t('Method', 'طريقة الدفع')} *
            </label>
            <select
              id="rpm-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
              className="w-full px-3 py-2 text-sm glass-surface border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="paypal">PayPal</option>
              <option value="international_bank_iban">{t('Bank transfer (IBAN)', 'تحويل بنكي (IBAN)')}</option>
              <option value="ach_routing">{t('ACH (US bank)', 'ACH (بنك أمريكي)')}</option>
              <option value="payoneer">Payoneer</option>
              <option value="wise">Wise</option>
              <option value="other">{t('Other', 'غير ذلك')}</option>
            </select>
          </div>

          {/* Status Selection */}
          <div>
            <span className="block text-sm font-medium text-foreground mb-1">
              {t('Status', 'الحالة')} *
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
                  status === 'confirmed'
                    ? 'bg-success/15 border-success/40 text-success'
                    : 'glass-surface border-border text-foreground glass-hover hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="payment_status"
                  value="confirmed"
                  checked={status === 'confirmed'}
                  onChange={() => setStatus('confirmed')}
                  className="accent-primary focus:ring-primary/40"
                />
                <div>
                  <span className="block font-semibold">{t('Confirmed', 'مؤكد')}</span>
                  <span className="block text-[13px] opacity-75">{t('The money arrived', 'الفلوس وصلت')}</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
                  status === 'pending'
                    ? 'bg-warning/15 border-warning/40 text-warning'
                    : 'glass-surface border-border text-foreground glass-hover hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="payment_status"
                  value="pending"
                  checked={status === 'pending'}
                  onChange={() => setStatus('pending')}
                  className="accent-primary focus:ring-primary/40"
                />
                <div>
                  <span className="block font-semibold">{t('To check', 'محتاج مراجعة')}</span>
                  <span className="block text-[13px] opacity-75">{t('Confirm it later', 'أكّده بعدين')}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Reference / Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="rpm-ref">
              {t('Payment reference (optional)', 'رقم العملية (اختياري)')}
            </label>
            <input
              id="rpm-ref"
              dir="ltr"
              type="text"
              placeholder="TXN-987654"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full px-3 py-2 text-sm glass-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="rpm-notes">
              {t('Private notes (optional)', 'ملاحظات خاصة (اختياري)')}
            </label>
            <textarea
              id="rpm-notes"
              rows={2}
              placeholder={t("e.g. sent from the father's account, checked on Wise", 'مثلاً: اتبعت من حساب الأب، واتأكدت على Wise')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm glass-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer min-h-[40px]"
            >
              {t('Cancel', 'إلغاء')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-primary-foreground btn-primary-material rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer min-h-[40px]"
            >
              {submitting ? (
                <span>{t('Saving…', 'جارٍ الحفظ…')}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('Save payment', 'احفظ الدفع')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
