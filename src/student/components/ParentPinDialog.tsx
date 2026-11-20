import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { notify } from '../../components/ui/Feedback';

/** BUILD-LIST 1.6: the proof from the last right PIN, kept for this tab only (the server lets it live 10 minutes). */
const PROOF_KEY = 'wz-parent-proof';
export const parentProof = (): string | null => { try { return sessionStorage.getItem(PROOF_KEY); } catch { return null; } };
const keepProof = (p: string) => { try { sessionStorage.setItem(PROOF_KEY, p); } catch { /* private mode: the dialog asks again */ } };
export const dropParentProof = () => { try { sessionStorage.removeItem(PROOF_KEY); } catch { /* nothing kept */ } };

const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);
const lockedText = (iso: string, isAr: boolean) => {
  const mins = Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 60_000));
  return isAr ? `غلطت كذا مرة. جرّب تاني بعد ${mins} دقيقة.` : `Too many wrong tries. Try again in ${mins} min.`;
};

function PinInput({ label, value, onChange, autoFocus }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}
      <Input type="password" inputMode="numeric" autoComplete="off" maxLength={4} dir="ltr" autoFocus={autoFocus}
        className="text-center text-2xl tracking-[0.5em] tabular-nums" value={value} onChange={(e) => onChange(digits(e.target.value))} />
    </label>
  );
}

/**
 * Asks the parent's 4-digit PIN before a parent-only thing (watching a lesson). With no PIN yet, the parent creates
 * one here first. `onDone` gets the proof the server checks.
 */
export function ParentPinDialog({ isOpen, onClose, onDone, isAr }: { isOpen: boolean; onClose: () => void; onDone: (proof: string) => void; isAr: boolean }) {
  const [mode, setMode] = useState<'loading' | 'set' | 'verify'>('loading');
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);

  useEffect(() => {
    if (!isOpen) return;
    setPin(''); setAgain(''); setError(''); setMode('loading');
    authedJson<{ hasPin: boolean; lockedUntil: string | null }>('/api/student/parent-pin')
      .then((s) => { setMode(s.hasPin ? 'verify' : 'set'); if (s.lockedUntil) setError(lockedText(s.lockedUntil, isAr)); })
      .catch(() => { setMode('verify'); setError(t('Could not check the PIN right now.', 'مقدرناش نتأكد من الرقم دلوقتي.')); });
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return setError(t('The PIN is 4 digits.', 'الرقم السري 4 أرقام.'));
    if (mode === 'set' && pin !== again) return setError(t('The two PINs are not the same.', 'الرقمين مش زي بعض.'));
    setBusy(true); setError('');
    try {
      const { proof } = mode === 'set'
        ? await authedJson<{ proof: string }>('/api/student/parent-pin', { method: 'PUT', body: JSON.stringify({ pin }) })
        : await authedJson<{ proof: string }>('/api/student/parent-pin/verify', { method: 'POST', body: JSON.stringify({ pin }) });
      keepProof(proof);
      onDone(proof);
    } catch (err: any) {
      setPin('');
      const d = err?.data || {};
      setError(d.lockedUntil ? lockedText(d.lockedUntil, isAr)
        : typeof d.attemptsLeft === 'number' ? t(`That PIN is not right. ${d.attemptsLeft} tries left.`, `الرقم غلط. فاضل ${d.attemptsLeft} محاولات.`)
          : t('Could not check the PIN right now.', 'مقدرناش نتأكد من الرقم دلوقتي.'));
    } finally { setBusy(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm"
      title={<span className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-accent" aria-hidden="true" />{mode === 'set' ? t('Make a parent PIN', 'اعمل رقم سري لولي الأمر') : t('Parent PIN', 'الرقم السري لولي الأمر')}</span>}>
      <form onSubmit={submit} className="grid gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {mode === 'set'
            ? t('Choose 4 digits only you know. We ask for them before you watch a lesson, so a child on this device cannot.', 'اختار 4 أرقام انت بس اللي تعرفها. هنسألك عليهم قبل ما تتابع حصة، علشان الطفل ما يقدرش يفتحها من الجهاز ده.')
            : t('Enter your 4-digit parent PIN.', 'اكتب الرقم السري بتاعك (4 أرقام).')}
        </p>
        {mode !== 'loading' && <PinInput label={mode === 'set' ? t('New PIN', 'الرقم الجديد') : t('PIN', 'الرقم السري')} value={pin} onChange={setPin} autoFocus />}
        {mode === 'set' && <PinInput label={t('Type it again', 'اكتبه تاني')} value={again} onChange={setAgain} />}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {mode === 'verify' && <p className="text-xs text-muted-foreground">{t('Forgot it? Message us and we will clear it for you.', 'نسيته؟ ابعتلنا رسالة وهنمسحه لك.')}</p>}
        <Button type="submit" isLoading={busy} disabled={mode === 'loading'}>{mode === 'set' ? t('Save and continue', 'احفظ وكمّل') : t('Continue', 'كمّل')}</Button>
      </form>
    </Modal>
  );
}

/** Family tab: set or change the parent PIN. */
export function ParentPinSetting({ isAr }: { isAr: boolean }) {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);

  useEffect(() => { authedJson<{ hasPin: boolean }>('/api/student/parent-pin').then((s) => setHasPin(s.hasPin)).catch(() => {}); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || (hasPin && current.length !== 4)) return setError(t('The PIN is 4 digits.', 'الرقم السري 4 أرقام.'));
    setBusy(true); setError('');
    try {
      const { proof } = await authedJson<{ proof: string }>('/api/student/parent-pin', { method: 'PUT', body: JSON.stringify({ pin, ...(hasPin ? { currentPin: current } : {}) }) });
      keepProof(proof);
      setHasPin(true); setOpen(false); setPin(''); setCurrent('');
      notify(t('Parent PIN saved.', 'اتحفظ الرقم السري.'));
    } catch (err: any) {
      const d = err?.data || {};
      setError(d.lockedUntil ? lockedText(d.lockedUntil, isAr) : typeof d.attemptsLeft === 'number' ? t('Your current PIN is not right.', 'الرقم الحالي غلط.') : t('Could not save the PIN.', 'مقدرناش نحفظ الرقم.'));
    } finally { setBusy(false); }
  };

  if (hasPin === null) return null;
  return (
    <div className="pt-4 border-t border-border space-y-3" data-testid="parent-pin">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-accent" aria-hidden="true" />
        <span>{t('Parent PIN', 'الرقم السري لولي الأمر')}</span>
      </h3>
      <p className="text-xs text-muted-foreground">
        {hasPin
          ? t('Your PIN is set. We ask for it before you watch a lesson. Forgot it? Message us and we will clear it.', 'الرقم السري متسجل. هنسألك عليه قبل ما تتابع حصة. نسيته؟ ابعتلنا رسالة وهنمسحه.')
          : t('Set 4 digits only you know, so a child using your device cannot watch lessons or open parent things.', 'اختار 4 أرقام انت بس اللي تعرفها، علشان الطفل اللي بيستخدم جهازك ما يقدرش يتابع الحصص.')}
      </p>
      {!open ? (
        <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(true); setError(''); }}>
          {hasPin ? t('Change the PIN', 'غيّر الرقم السري') : t('Set a PIN', 'اعمل رقم سري')}
        </Button>
      ) : (
        <form onSubmit={save} className="grid gap-3 max-w-xs">
          {hasPin && <PinInput label={t('Current PIN', 'الرقم الحالي')} value={current} onChange={setCurrent} autoFocus />}
          <PinInput label={t('New PIN', 'الرقم الجديد')} value={pin} onChange={setPin} autoFocus={!hasPin} />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" isLoading={busy}>{t('Save', 'احفظ')}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
