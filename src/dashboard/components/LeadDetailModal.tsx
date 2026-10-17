import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import {
  X,
  Mail,
  MessageCircle,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Tag,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Save,
  ShieldAlert
} from 'lucide-react';
import { DashboardLead, LeadStatus } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { useT } from '../../lib/language';

interface LeadDetailModalProps {
  lead: DashboardLead | null;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

const AVAILABLE_SERVICES = [
  { id: 'quran-reading', name: 'Quran Reading & Tajweed' },
  { id: 'tajweed', name: 'Tajweed Rules & Articulation' },
  { id: 'quran-memorization', name: 'Quran Memorization (Hifz)' },
  { id: 'quran-revision', name: 'Quran Revision & Retention' },
  { id: 'zad-essentials', name: 'Zad Essentials (Foundations)' },
  { id: 'islamic-studies', name: 'Islamic Studies Foundation' },
  { id: 'aqeedah', name: 'Aqeedah (Islamic Belief)' },
  { id: 'fiqh', name: 'Fiqh (Practical Worship)' },
  { id: 'seerah', name: 'Seerah (Prophetic Biography)' },
  { id: 'arabic-foundations', name: 'Arabic Foundations' },
  { id: 'modern-standard-arabic', name: 'Modern Standard Arabic' },
  { id: 'arabic-conversation', name: 'Arabic Conversation' },
  { id: 'egyptian-arabic', name: 'Egyptian Arabic Dialect' },
  { id: 'english', name: 'English Coaching' }
];

const STAGE_CONFIG: Record<LeadStatus, { label: string; labelAr: string; color: string; description: string; descriptionAr: string }> = {
  visitor: {
    label: 'Visitor',
    labelAr: 'زائر',
    descriptionAr: 'أول تواصل أو تصفح',
    color: 'glass-surface text-muted-foreground border border-border-subtle',
    description: 'Initial touchpoint or browsing inquiry'
  },
  lead: {
    label: 'New Lead',
    labelAr: 'مهتم جديد',
    descriptionAr: 'وصل سؤال من الموقع أو رسالة',
    color: 'bg-secondary/30 text-primary border border-secondary/50',
    description: 'Inquiry received via website form or initial message'
  },
  contacted: {
    label: 'Contacted',
    labelAr: 'اتواصلنا معاه',
    descriptionAr: 'اتكلمنا معاه على واتساب أو إيميل',
    color: 'bg-accent/15 text-accent border border-accent/25',
    description: 'Mahmoud has reached out via WhatsApp or email'
  },
  trial_booked: {
    label: 'Trial Booked',
    labelAr: 'حجز تجربة',
    descriptionAr: 'عنده تجربة مجانية جاية',
    color: 'bg-warning/15 text-warning-foreground border border-warning/30',
    description: 'Scheduled for an upcoming 30-minute free trial session'
  },
  trial_completed: {
    label: 'Trial Completed',
    labelAr: 'التجربة تمت',
    descriptionAr: 'حضر التجربة واتحدد مستواه',
    color: 'bg-secondary/30 text-accent border border-secondary/60',
    description: 'Attended free trial mini-lesson and level evaluated'
  },
  potential_student: {
    label: 'Potential Student',
    labelAr: 'ممكن يكمل',
    descriptionAr: 'وصلته الخطة وبيفكر في المواعيد أو الباقة',
    color: 'bg-accent/10 text-accent border border-accent/25',
    description: 'Received Recommended Learning Plan; discussing schedule or package'
  },
  active_student: {
    label: 'Active Student',
    labelAr: 'طالب نشط',
    descriptionAr: 'بيحضر حصص منتظمة',
    color: 'bg-success/15 text-success border border-success/30',
    description: 'Enrolled in regular lessons with reserved weekly slots'
  },
  returning_student: {
    label: 'Returning Student',
    labelAr: 'طالب راجع',
    descriptionAr: 'رجع بعد فترة توقف',
    color: 'bg-secondary/30 text-primary border border-primary/25',
    description: 'Re-enrolled after a break or completing a previous cycle'
  },
  lost: {
    label: 'Lost / Postponed',
    labelAr: 'مش مكمل / أجّل',
    descriptionAr: 'قرر ما يكملش أو مش بيرد',
    color: 'glass-surface text-muted-foreground border border-border-subtle',
    description: 'Decided not to proceed or uncontactable'
  }
};

export function LeadDetailModal({ lead, onClose, onLeadUpdated }: LeadDetailModalProps) {
  const { t, isAr } = useT();
  const locale = isAr ? 'ar' : 'en';
  const stageLabel = (s: LeadStatus) => (isAr ? STAGE_CONFIG[s]?.labelAr : STAGE_CONFIG[s]?.label) || s;
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>('lead');
  const [notes, setNotes] = useState<string>('');
  const [serviceInterest, setServiceInterest] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [teacherOverride, setTeacherOverride] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setCurrentStatus(lead.status || 'lead');
      setNotes(lead.notes || '');
      setServiceInterest(lead.service_interest_id || '');
      setGoal(lead.goal || '');
      setTeacherOverride(false);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [lead]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!lead) return null;

  const handleUpdate = async (newStatus?: LeadStatus) => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const targetStatus = newStatus || currentStatus;

    try {
      await dashboardFetch(`/api/dashboard/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: targetStatus,
          notes,
          service_interest_id: serviceInterest || null,
          goal: goal || null,
          teacher_correction: teacherOverride
        })
      });

      if (newStatus) {
        setCurrentStatus(newStatus);
      }
      setSuccessMessage(t(`Saved: ${stageLabel(targetStatus)}.`, `اتحفظ: ${stageLabel(targetStatus)}.`));
      if (onLeadUpdated) onLeadUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || t("Couldn't save.", 'تعذر الحفظ.'));
    } finally {
      setSaving(false);
    }
  };

  // Truthful contextual WhatsApp link preparation
  const learnerName = lead.name || 'there';
  let whatsappMsg = `As-salamu alaykum ${learnerName},\n\nThis is Ustadh Mahmoud. Thank you for your interest in learning with me! I would be delighted to assist you.`;
  if (lead.status === 'lead' || lead.status === 'visitor') {
    whatsappMsg = `As-salamu alaykum ${learnerName},\n\nThis is Ustadh Mahmoud. I received your inquiry regarding ${lead.service_interest_name || 'lessons'}. I would love to answer any questions you have, or we can schedule your complimentary 30-minute free trial session at your convenience.`;
  } else if (lead.status === 'trial_completed') {
    whatsappMsg = `As-salamu alaykum ${learnerName},\n\nThis is Ustadh Mahmoud following up on our free trial session. How did you feel about the mini-lesson? Whenever you are ready, I can reserve your recurring weekly slots.`;
  }

  const whatsappUrl = buildContextualWhatsAppUrl(lead.whatsapp, whatsappMsg);

  const createdDateCairo = lead.created_at
    ? DateTime.fromISO(lead.created_at).setZone('Africa/Cairo').setLocale(locale).toFormat('EEE, MMM d, yyyy • hh:mm a')
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-card text-foreground rounded-2xl w-full max-w-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 glass-surface">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-sm font-semibold px-2.5 py-0.5 rounded ${STAGE_CONFIG[currentStatus]?.color || 'glass-surface text-foreground'}`}>
                {stageLabel(currentStatus)}
              </span>
              <span className="text-sm font-medium px-2 py-0.5 rounded glass-card border-none-subtle text-muted-foreground">
                {lead.learner_type === 'child' ? t('Child', 'طفل') : t('Adult', 'بالغ')}
              </span>
              {lead.source && (
                <span className="text-sm text-primary font-mono px-2 py-0.5 rounded bg-secondary/30 border border-secondary/50">
                  {t('Source', 'المصدر')}: {lead.source}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {lead.name}
            </h2>
            {lead.parent_name && (
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                {t('Parent / guardian', 'ولي الأمر')}: <span className="text-foreground">{lead.parent_name}</span>
              </p>
            )}
          </div>
          <button
            aria-label={t('Close', 'إغلاق')}
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground glass-hover hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-success/15 border border-success/30 text-sm text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="teacher-override"
                  checked={teacherOverride}
                  onChange={(e) => setTeacherOverride(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="teacher-override" className="text-sm text-foreground cursor-pointer">
                  {t('Let me set the stage manually', 'خليني أحدد المرحلة بنفسي')}
                </label>
              </div>
            </div>
          )}

          {/* Quick Communication Bar */}
          <div className="p-4 rounded-xl glass-surface border border-border flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 text-sm">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t('Contact', 'التواصل')}
              </div>
              <div className="font-medium text-foreground" dir="ltr">
                {lead.email} {lead.whatsapp && `• ${lead.whatsapp}`}
              </div>
              {createdDateCairo && (
                <div className="text-[11px] text-muted-foreground">
                  {t('First asked', 'أول سؤال')}: {createdDateCairo} ({t('Cairo', 'القاهرة')})
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success hover:bg-success/90 text-white text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('WhatsApp', 'واتساب')}</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-muted-foreground border border-border text-sm font-medium cursor-not-allowed opacity-60">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('No WhatsApp', 'مفيش واتساب')}</span>
                </span>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card border-none text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t('Email', 'إيميل')}</span>
                </a>
              )}
            </div>
          </div>

          {/* Pipeline Stage Transition Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-sm font-semibold uppercase tracking-wider text-foreground">
                {t('Stage', 'المرحلة')}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isAr ? STAGE_CONFIG[currentStatus]?.descriptionAr : STAGE_CONFIG[currentStatus]?.description}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(STAGE_CONFIG) as LeadStatus[]).map((statusKey) => {
                const isSelected = currentStatus === statusKey;
                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => setCurrentStatus(statusKey)}
                    aria-pressed={isSelected}
                    className={`p-2 rounded-xl text-sm text-start border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-secondary/30 text-primary font-semibold shadow-2xs'
                        : 'border-border glass-card text-muted-foreground hover:text-foreground hover:bg-surface-subtle'
                    }`}
                  >
                    <div>{stageLabel(statusKey)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Associated Trial Booking Card */}
          {lead.trial_booking ? (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-warning-foreground font-semibold text-sm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('Free trial', 'التجربة المجانية')}</span>
                </div>
                <span className="text-sm font-mono font-semibold px-2 py-0.5 rounded glass-card text-warning-foreground border border-warning/30">
                  {lead.trial_booking.reference_code}
                </span>
              </div>

              <div className="text-sm text-foreground">
                <span className="text-muted-foreground">{t('Status', 'الحالة')}: </span>
                <span className="font-semibold uppercase">{lead.trial_booking.status || t('booked', 'محجوزة')}</span>
                {lead.trial_booking.scheduled_start && (
                  <span>
                    {' • '}
                    {DateTime.fromISO(lead.trial_booking.scheduled_start).setZone('Africa/Cairo').setLocale(locale).toFormat('EEE, MMM d • hh:mm a')} ({t('Cairo', 'القاهرة')})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px]">
                {lead.trial_booking.has_assessment ? (
                  <span className="text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('Assessment and plan saved', 'التقييم والخطة اتحفظوا')}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {t('Waiting for the assessment', 'مستنيين التقييم')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl glass-surface border border-border text-sm text-muted-foreground flex items-center justify-between">
              <span>{t('No trial booked yet.', 'لسه ما حجزش تجربة.')}</span>
              {lead.status !== 'trial_booked' && (
                <button
                  type="button"
                  onClick={() => setCurrentStatus('trial_booked')}
                  className="text-sm text-primary font-semibold hover:underline cursor-pointer"
                >
                  {t('Mark as booked', 'اعتبره حجز')}
                </button>
              )}
            </div>
          )}

          {/* Learning Goal / Inquiry Content */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="ldm-interest">
                  {t('Interested in', 'مهتم بـ')}
                </label>
                <select
                  id="ldm-interest"
                  value={serviceInterest}
                  onChange={(e) => setServiceInterest(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('Not decided', 'لسه ما قررش')}</option>
                  {AVAILABLE_SERVICES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="ldm-goal">
                  {t('Goal', 'الهدف')}
                </label>
                <input
                  id="ldm-goal"
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t('e.g. fluent reading, memorize Al-Baqarah, speak Egyptian Arabic', 'مثلاً: قراءة سليمة، حفظ البقرة، الكلام بالمصري')}
                  className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="ldm-notes">
                {t('Private notes', 'ملاحظات خاصة')}
              </label>
              <textarea
                id="ldm-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('Notes from chats, background, preferred days, parent requests…', 'ملاحظات من المحادثات، الخلفية، الأيام المفضلة، طلبات ولي الأمر…')}
                className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border glass-surface flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentStatus !== 'active_student' && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate('active_student')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-success hover:bg-success/90 text-white text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('Mark as studying', 'اعتبره بيدرس')}</span>
              </button>
            )}

            {currentStatus !== 'lost' && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate('lost')}
                className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {t('Not continuing', 'مش مكمل')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-border text-sm font-medium text-foreground glass-hover hover:bg-surface transition-colors cursor-pointer"
            >
              {t('Cancel', 'إلغاء')}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleUpdate()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? t('Saving…', 'جارٍ الحفظ…') : t('Save', 'احفظ')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
