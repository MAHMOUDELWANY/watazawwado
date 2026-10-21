import React, { useState } from 'react';
import FocusTrap from '../../components/FocusTrap';
import { DateTime } from 'luxon';
import { X, User, Mail, Phone, Globe, Shield, BookOpen, AlertCircle, Check } from 'lucide-react';
import { DashboardStudentDetail } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

interface StudentEditModalProps {
  studentDetail: DashboardStudentDetail;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedDetail: DashboardStudentDetail) => void;
}

const COMMON_TIMEZONES = [
  { label: '—', value: '' },
  { label: 'America/New_York (US Eastern)', value: 'America/New_York' },
  { label: 'America/Chicago (US Central)', value: 'America/Chicago' },
  { label: 'America/Denver (US Mountain)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (US Pacific)', value: 'America/Los_Angeles' },
  { label: 'America/Toronto (Canada Eastern)', value: 'America/Toronto' },
  { label: 'Europe/London (UK GMT/BST)', value: 'Europe/London' },
  { label: 'Australia/Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Australia/Melbourne (AEST)', value: 'Australia/Melbourne' },
  { label: 'Africa/Cairo (Egypt Time)', value: 'Africa/Cairo' },
  { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Asia/Riyadh (AST)', value: 'Asia/Riyadh' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'UTC', value: 'UTC' }
];

export function StudentEditModal({ studentDetail, isOpen, onClose, onUpdated }: StudentEditModalProps) {
  const { student, guardian } = studentDetail;
  const { t } = useT();

  const [name, setName] = useState(student.name || '');
  const [parentName, setParentName] = useState(guardian?.parent_name || '');
  const [parentEmail, setParentEmail] = useState(guardian?.parent_email || '');
  const [parentWhatsapp, setParentWhatsapp] = useState(guardian?.parent_whatsapp || '');
  const [email, setEmail] = useState(student.email || '');
  const [whatsapp, setWhatsapp] = useState(student.whatsapp || '');
  const [learnerType, setLearnerType] = useState<'adult' | 'child' | ''>(student.learner_type || '');
  const [country, setCountry] = useState(student.country || '');
  const [timezone, setTimezone] = useState(student.timezone || '');
  const [customTimezone, setCustomTimezone] = useState(
    COMMON_TIMEZONES.some(tz => tz.value === student.timezone) ? '' : (student.timezone || '')
  );
  const [currentLevel, setCurrentLevel] = useState<string>(student.current_level || '');
  const [status, setStatus] = useState<'active' | 'paused' | 'inactive'>(student.status || 'active');
  const [notes, setNotes] = useState(student.notes || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("The student's name can't be empty.", 'اسم الطالب لازم يتكتب.'));
      return;
    }

    const resolvedTimezone = customTimezone.trim() || timezone.trim() || null;
    if (resolvedTimezone) {
      const isValid = DateTime.now().setZone(resolvedTimezone).isValid;
      if (!isValid) {
        setError(t(`Unknown time zone: '${resolvedTimezone}'. Use a name like Europe/London.`, `المنطقة الزمنية '${resolvedTimezone}' مش معروفة. استخدم اسم زي Europe/London.`));
        return;
      }
    }

    const trimmedEmail = email.trim() || null;
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError(t('Please enter a valid email.', 'اكتب إيميل صحيح.'));
        return;
      }
    }

    const trimmedParentEmail = parentEmail.trim() || null;
    if (trimmedParentEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedParentEmail)) {
        setError(t("Please enter a valid parent's email.", 'اكتب إيميل صحيح لولي الأمر.'));
        return;
      }
    }

    setSaving(true);

    try {
      const payload: Record<string, any> = {
        name: trimmedName,
        parent_name: parentName.trim() || null,
        parent_email: trimmedParentEmail,
        parent_whatsapp: parentWhatsapp.trim() || null,
        email: trimmedEmail,
        whatsapp: whatsapp.trim() || null,
        learner_type: learnerType || null,
        country: country.trim() || null,
        timezone: resolvedTimezone,
        current_level: currentLevel || null,
        status,
        notes: notes.trim() || null
      };

      await dashboardFetch(`/api/dashboard/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      // Refetch full student detail to guarantee complete synchronization
      const refreshedData = await dashboardFetch(`/api/dashboard/students/${student.id}`);
      onUpdated(refreshedData);
      onClose();
    } catch (err: any) {
      setError(err.message || t("Couldn't save the changes.", 'تعذر حفظ التعديلات.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FocusTrap onEscape={onClose}>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="student-edit-title">
      <div
        className="relative w-full max-w-2xl glass-surface rounded-2xl shadow-xl border border-border/40 dark:border-border/40 overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 dark:border-border/30 bg-background dark:bg-background">
          <div>
            <h2 id="student-edit-title" className="text-lg font-display font-bold text-foreground">
              {t('Edit student', 'تعديل بيانات الطالب')}
            </h2>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground/70">
              {t('Details, parent contact, level and time zone.', 'البيانات، تواصل ولي الأمر، المستوى والمنطقة الزمنية.')}
            </p>
          </div>
          <button
            aria-label={t('Close', 'إغلاق')}
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground/60 dark:text-muted-foreground/60 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
                {t("Student's name", 'اسم الطالب')} <span className="text-red-500">*</span>
              </label>
              <input
                aria-label={t("Student's name", 'اسم الطالب')}
                id="sem-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('e.g. Zaid Rahman', 'مثلاً: زيد رحمن')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
                {t('Status', 'الحالة')}
              </label>
              <select
                aria-label={t('Status', 'الحالة')}
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">{t('Active (learning now)', 'نشط (بيدرس دلوقتي)')}</option>
                <option value="paused">{t('Paused (on hold)', 'متوقف مؤقتاً')}</option>
                <option value="inactive">{t('Inactive (past student)', 'غير نشط (طالب سابق)')}</option>
              </select>
            </div>
          </div>

          {/* Learner Type & Parent Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
                {t('Learner', 'نوع المتعلم')}
              </label>
              <select
                aria-label={t('Learner', 'نوع المتعلم')}
                value={learnerType}
                onChange={e => setLearnerType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('Not set', 'مش محدد')}</option>
                <option value="adult">{t('Adult', 'بالغ')}</option>
                <option value="child">{t('Child / teen', 'طفل / مراهق')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
                {t('Parent / guardian', 'ولي الأمر')} {learnerType === 'child' && <span className="text-amber-600 dark:text-amber-400 font-normal">({t('recommended for children', 'مهم للأطفال')})</span>}
              </label>
              <input
                aria-label={t('Parent / guardian', 'ولي الأمر')}
                type="text"
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('e.g. Tariq Rahman', 'مثلاً: طارق رحمن')}
              />
            </div>
          </div>

          {/* Parent / Guardian Contact Details (Optional) */}
          {(learnerType === 'child' || parentName.trim().length > 0) && (
            <div className="p-3.5 rounded-xl bg-background/80 dark:bg-background/60 border border-border/40 dark:border-border/40 space-y-3">
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-accent" />
                {t('Parent contact (optional)', 'تواصل ولي الأمر (اختياري)')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-foreground/70 dark:text-muted-foreground/70 mb-1">
                    {t("Parent's email", 'إيميل ولي الأمر')} <span className="font-normal opacity-60">({t('optional', 'اختياري')})</span>
                  </label>
                  <input
                    aria-label={t("Parent's email", 'إيميل ولي الأمر')}
                    dir="ltr"
                    type="email"
                    value={parentEmail}
                    onChange={e => setParentEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="parent@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground/70 dark:text-muted-foreground/70 mb-1">
                    {t("Parent's WhatsApp", 'واتساب ولي الأمر')} <span className="font-normal opacity-60">({t('optional', 'اختياري')})</span>
                  </label>
                  <input
                    aria-label={t("Parent's WhatsApp", 'واتساب ولي الأمر')}
                    dir="ltr"
                    type="text"
                    value={parentWhatsapp}
                    onChange={e => setParentWhatsapp(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+1 555 987 6543"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
                {t('Email', 'الإيميل')}
              </label>
              <input
                aria-label={t('Email', 'الإيميل')}
                dir="ltr"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
                {t('WhatsApp', 'واتساب')}
              </label>
              <input
                aria-label={t('WhatsApp', 'واتساب')}
                dir="ltr"
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 555 123 4567"
              />
            </div>
          </div>

          {/* Location & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
                {t('Country', 'الدولة')}
              </label>
              <input
                aria-label={t('Country', 'الدولة')}
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('e.g. Canada, UK, USA', 'مثلاً: كندا، بريطانيا، أمريكا')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
                {t('Time zone', 'المنطقة الزمنية')}
              </label>
              <select
                aria-label={t('Time zone', 'المنطقة الزمنية')}
                value={timezone}
                onChange={e => {
                  setTimezone(e.target.value);
                  if (e.target.value) setCustomTimezone('');
                }}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <div className="mt-1.5">
                <input
                  type="text"
                  aria-label={t('Other time zone', 'منطقة زمنية تانية')}
                  dir="ltr"
                  value={customTimezone}
                  onChange={e => {
                    setCustomTimezone(e.target.value);
                    if (e.target.value) setTimezone('');
                  }}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-border/70 dark:border-border/70 glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('Or type another (e.g. Europe/Dublin)', 'أو اكتب غيرها (مثلاً Europe/Dublin)')}
                />
              </div>
            </div>
          </div>

          {/* Level Assessment */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
              {t('Level', 'المستوى')}
            </label>
            <select
              aria-label={t('Level', 'المستوى')}
              value={currentLevel}
              onChange={e => setCurrentLevel(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('Not assessed yet', 'لسه ما اتحددش')}</option>
              <option value="beginner">{t('Beginner', 'مبتدئ')}</option>
              <option value="elementary">{t('Elementary', 'أساسي')}</option>
              <option value="intermediate">{t('Intermediate', 'متوسط')}</option>
              <option value="advanced">{t('Advanced', 'متقدم')}</option>
            </select>
          </div>

          {/* General Profile Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 mb-1.5">
              {t('General notes', 'ملاحظات عامة')}
            </label>
            <textarea
              aria-label={t('General notes', 'ملاحظات عامة')}
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-border glass-card glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t('Background, goals, learning preferences…', 'الخلفية، الأهداف، طريقة التعلم المفضلة…')}
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30 dark:border-border/30">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-xl text-foreground/80 dark:text-muted-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {t('Cancel', 'إلغاء')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium rounded-xl btn-primary-material text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <span>{t('Saving…', 'جارٍ الحفظ…')}</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('Save', 'احفظ')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
