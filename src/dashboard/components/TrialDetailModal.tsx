import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import {
  X,
  Video,
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Mail,
  MessageCircle,
  Copy,
  Check,
  User,
  FileText,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Send,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { DashboardTrial, TrialAssessment, LeadStatus } from '../types';
import { dashboardFetch, openZoomAsHost } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { useT } from '../../lib/language';

interface TrialDetailModalProps {
  trial: DashboardTrial | null;
  onClose: () => void;
  onAssessmentSaved?: () => void;
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

interface LearningPlanTemplate {
  id: string;
  title: string;
  category: string;
  serviceId: string;
  duration: number;
  frequency: string;
  level: string;
  strengths: string;
  areasNeedingWork: string;
  summary: string;
}

const LEARNING_PLAN_TEMPLATES: LearningPlanTemplate[] = [
  {
    id: 'quran-qaida',
    title: "Quran Reading & Qa'ida",
    category: 'Quran Foundation',
    serviceId: 'quran-reading',
    duration: 30,
    frequency: '2x weekly',
    level: 'beginner',
    strengths: 'Recognizes individual letters, good enthusiasm and ear for pronunciation',
    areasNeedingWork: 'Connecting letters, short vowels (Harakaat), Sukoon stability',
    summary: "Complete Noorani Qa'ida chapters systematically, transition to reading short Quranic phrases with accurate Makharij."
  },
  {
    id: 'tajweed-fluent',
    title: 'Tajweed & Fluent Recitation',
    category: 'Recitation',
    serviceId: 'tajweed',
    duration: 45,
    frequency: '2x weekly',
    level: 'intermediate',
    strengths: 'Reads standard text steadily, good respect for Quranic pace',
    areasNeedingWork: 'Ahkam Noon Sakinah & Tanween, Ghunnah timing, natural Madd elongation',
    summary: 'Applied Tajweed starting from Juz Amma, master Noon/Meem Sakinah rules, achieve smooth, confident recitation.'
  },
  {
    id: 'hifz-retention',
    title: 'Quran Hifz & Retention',
    category: 'Memorization',
    serviceId: 'quran-memorization',
    duration: 45,
    frequency: '3x weekly',
    level: 'intermediate',
    strengths: 'Strong auditory retention, committed motivation to memorize',
    areasNeedingWork: 'Structured retention system (Sabaq, Sabaqi, Manzil), mutashabihat awareness',
    summary: 'Establish a disciplined daily 3-tier memorization cycle (New Portion + Near Review + Distant Retention).'
  },
  {
    id: 'islamic-fiqh',
    title: 'Islamic Studies & Fiqh',
    category: 'Studies',
    serviceId: 'islamic-studies',
    duration: 45,
    frequency: '1x weekly',
    level: 'elementary',
    strengths: 'Curious about practical worship and daily Islamic manners (Adab)',
    areasNeedingWork: 'Step-by-step Taharah & Salah rulings, core Aqeedah foundations',
    summary: 'Foundations of Iman & Islam, practical step-by-step Fiqh of Salah and Wudu with live demonstrations.'
  },
  {
    id: 'arabic-egyptian',
    title: 'Egyptian Spoken Arabic',
    category: 'Conversation',
    serviceId: 'egyptian-arabic',
    duration: 45,
    frequency: '2x weekly',
    level: 'beginner',
    strengths: 'Good listening comprehension and natural conversational instincts',
    areasNeedingWork: 'High-frequency daily phrases, verb conjugation, question formulation',
    summary: 'Interactive dialogue covering everyday situations (greetings, home, shopping, travel), speaking from lesson 1.'
  },
  {
    id: 'arabic-fusha',
    title: 'Modern Standard Arabic',
    category: 'Arabic Fusha',
    serviceId: 'modern-standard-arabic',
    duration: 60,
    frequency: '2x weekly',
    level: 'intermediate',
    strengths: 'Can read Arabic script, motivated by literary and Quranic understanding',
    areasNeedingWork: 'Grammar mechanics (Nahw/Sarf), nominal vs verbal sentence, vocabulary expansion',
    summary: 'Comprehensive curriculum following Madinah Arabic / Bayna Yadayk with structured grammar and comprehension.'
  }
];

export function TrialDetailModal({ trial, onClose, onAssessmentSaved }: TrialDetailModalProps) {
  const { t, isAr } = useT();
  const locale = isAr ? 'ar' : 'en';
  const [copiedLink, setCopiedLink] = useState<'host' | 'join' | 'plan' | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  // Assessment form state - do not invent default levels
  const [currentLevel, setCurrentLevel] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [areasNeedingWork, setAreasNeedingWork] = useState<string>('');
  const [assessmentNotes, setAssessmentNotes] = useState<string>('');

  // Recommendation form state
  const [recommendedServiceId, setRecommendedServiceId] = useState<string>('quran-reading');
  const [recommendedDuration, setRecommendedDuration] = useState<number>(45);
  const [recommendedFrequency, setRecommendedFrequency] = useState<string>('2x weekly');
  const [learningPlanSummary, setLearningPlanSummary] = useState<string>('');
  const [followUpStatus, setFollowUpStatus] = useState<string>('needs_follow_up');
  const [followUpDate, setFollowUpDate] = useState<string>('');

  // Initialize form when trial changes
  useEffect(() => {
    if (trial) {
      const existing = trial.assessment;
      if (existing) {
        setCurrentLevel(existing.current_level || '');
        setStrengths(existing.strengths || '');
        setAreasNeedingWork(existing.areas_needing_work || '');
        setAssessmentNotes(existing.notes || '');
        setRecommendedServiceId(existing.recommended_service_id || trial.service_id || 'quran-reading');
        setRecommendedDuration(existing.recommended_duration_minutes || 45);
        setRecommendedFrequency(existing.recommended_frequency || '2x weekly');
        setLearningPlanSummary(existing.learning_plan_summary || '');
        setFollowUpStatus(existing.follow_up_status || 'needs_follow_up');
        setFollowUpDate(existing.follow_up_date || '');
      } else {
        // Defaults from trial
        setRecommendedServiceId(trial.service_id || 'quran-reading');
        setCurrentLevel('');
        setStrengths('');
        setAreasNeedingWork('');
        setAssessmentNotes('');
        setRecommendedDuration(45);
        setRecommendedFrequency('2x weekly');
        setLearningPlanSummary('');
        setFollowUpStatus('needs_follow_up');
        setFollowUpDate('');
      }
      setSaveMessage(null);
      setErrorMessage(null);
    }
  }, [trial]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!trial) return null;

  const startUtc = trial.scheduled_start ? DateTime.fromISO(trial.scheduled_start) : null;
  const startCairo = startUtc ? startUtc.setZone('Africa/Cairo').setLocale(locale) : null;

  let startStudent: DateTime | null = null;
  try {
    if (startUtc && trial.student_timezone && trial.student_timezone !== 'Africa/Cairo') {
      startStudent = startUtc.setZone(trial.student_timezone).setLocale(locale);
    }
  } catch (e) {
    startStudent = null;
  }

  const copyToClipboard = (text: string, type: 'host' | 'join' | 'plan') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const hostUrl = trial.zoom_host_url || trial.zoom_meeting_link || '';
  const joinUrl = trial.zoom_join_url || trial.zoom_meeting_link || '';

  // Contextual WhatsApp link preparation - truthful target
  const learnerGreetingName = trial.learner_name || 'there';
  const cairoTimeStr = startCairo ? startCairo.setLocale('en').toFormat('EEEE, MMMM d at hh:mm a') : 'our scheduled time';
  const defaultTrialMessage = `As-salamu alaykum ${learnerGreetingName},\n\nThis is Ustadh Mahmoud regarding our scheduled Free Trial Session for ${trial.service_name} on ${cairoTimeStr} (Cairo time).\n\nHere is our Zoom meeting link: ${joinUrl || '[Link]'}\n\nI look forward to meeting you and helping you achieve your learning goals!`;
  const whatsappUrl = buildContextualWhatsAppUrl(trial.contact_whatsapp, defaultTrialMessage);

  // Formatted Learning Plan for Student
  const selectedServiceName = AVAILABLE_SERVICES.find(s => s.id === recommendedServiceId)?.name || recommendedServiceId;
  const studentPlanMessage = `As-salamu alaykum ${learnerGreetingName},\n\nIt was a pleasure conducting our free trial lesson today!\n\nHere is **Your Recommended Learning Plan**:\n\n• **Recommended Service:** ${selectedServiceName}\n• **Recommended Lesson Duration:** ${recommendedDuration} minutes\n• **Recommended Frequency:** ${recommendedFrequency}\n• **Key Focus & Goals:** ${learningPlanSummary || 'Structured progress tailored to your current level.'}\n\nWhenever you are ready to continue your lessons, please let me know and we will reserve your recurring weekly slot.\n\nWarm regards,\nUstadh Mahmoud`;

  const handleApplyTemplate = (tmpl: LearningPlanTemplate) => {
    setAppliedTemplateId(tmpl.id);
    setRecommendedServiceId(tmpl.serviceId);
    setRecommendedDuration(tmpl.duration);
    setRecommendedFrequency(tmpl.frequency);
    setCurrentLevel(tmpl.level);
    setStrengths(tmpl.strengths);
    setAreasNeedingWork(tmpl.areasNeedingWork);
    setLearningPlanSummary(tmpl.summary);
  };

  const handleSaveAssessment = async (markCompleted = false, leadStatusToUpdate?: LeadStatus) => {
    setSaving(true);
    setErrorMessage(null);
    setSaveMessage(null);

    try {
      const payload = {
        assessment: {
          current_level: currentLevel || null,
          strengths: strengths || null,
          areas_needing_work: areasNeedingWork || null,
          notes: assessmentNotes || null,
          recommended_service_id: recommendedServiceId || null,
          recommended_service_name: selectedServiceName || null,
          recommended_duration_minutes: recommendedDuration,
          recommended_frequency: recommendedFrequency,
          learning_plan_summary: learningPlanSummary || null,
          follow_up_status: followUpStatus,
          follow_up_date: followUpDate || null
        },
        mark_completed: markCompleted,
        update_lead_status: leadStatusToUpdate
      };

      await dashboardFetch(`/api/dashboard/trials/${trial.id}/assessment`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSaveMessage(t('Assessment and learning plan saved.', 'التقييم وخطة التعلم اتحفظوا.'));
      if (onAssessmentSaved) {
        onAssessmentSaved();
      }
    } catch (err: any) {
      setErrorMessage(err.message || t("Couldn't save the assessment.", 'تعذر حفظ التقييم.'));
    } finally {
      setSaving(false);
    }
  };

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
        <div className="p-5 sm:p-6 border-b border-border-subtle flex items-start justify-between gap-4 glass-surface">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-mono font-semibold px-2 py-0.5 rounded bg-secondary/40 text-accent">
                {trial.reference_code}
              </span>
              <span className="text-sm font-semibold px-2 py-0.5 rounded bg-warning/15 text-warning-foreground border border-warning/30">
                {t('Free trial', 'تجربة مجانية')}
              </span>
              {trial.status ? (
                <span className={`text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  trial.status === 'completed'
                    ? 'bg-success/15 text-success border border-success/30'
                    : trial.status === 'cancelled'
                    ? 'bg-destructive/15 text-destructive border border-destructive/20'
                    : 'bg-secondary/30 text-primary border border-secondary/50'
                }`}>
                  {({ completed: t('Done', 'تمت'), cancelled: t('Cancelled', 'ملغاة'), confirmed: t('Confirmed', 'مؤكدة'), rescheduled: t('Moved', 'اتغيّر ميعادها'), no_show: t('No-show', 'غياب') } as Record<string, string>)[trial.status] || trial.status}
                </span>
              ) : (
                <span className="text-sm font-medium px-2 py-0.5 rounded glass-surface text-muted-foreground border border-border-subtle">
                  —
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {trial.learner_name || t('Student', 'طالب')}
            </h2>
            {trial.parent_name && (
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                {t('Parent / guardian', 'ولي الأمر')}: <span className="text-foreground">{trial.parent_name}</span>
              </p>
            )}
          </div>
          <button
            aria-label={t('Close', 'إغلاق')}
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground glass-hover hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {saveMessage && (
            <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-sm text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Trial Time & Zoom */}
          <div className="glass-surface p-4 rounded-xl border border-border-subtle space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>{t('Time & room', 'الميعاد والغرفة')}</span>
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {t('Subject', 'المادة')}: {trial.service_name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg glass-card border-none">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  {t('Cairo time', 'بتوقيت القاهرة')}
                </div>
                <div className="font-semibold text-sm text-foreground">
                  {startCairo ? startCairo.toFormat('EEE, MMM d • hh:mm a') : (trial.cairo_time_display || t('Time not set', 'الوقت مش محدد'))}
                </div>
              </div>

              <div className="p-3 rounded-lg glass-card border-none">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  {t("Student's time", 'بتوقيت الطالب')}
                </div>
                <div className="font-semibold text-sm text-foreground">
                  {startStudent ? (
                    `${startStudent.toFormat('hh:mm a')} (${trial.student_timezone})`
                  ) : (
                    trial.student_timezone || t('Not set', 'مش محدد')
                  )}
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {hostUrl ? (
                <a
                  href={hostUrl}
                  onClick={(e) => openZoomAsHost(e, trial.id, hostUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg btn-primary-material text-primary-foreground text-sm font-semibold shadow-2xs transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{t('Start as host', 'ابدأ كمضيف')}</span>
                  <ExternalLink className="w-3 h-3 ms-0.5 opacity-80" />
                </a>
              ) : (
                <div className="text-sm text-warning font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t('The Zoom link is not ready yet', 'رابط Zoom لسه مش جاهز')}</span>
                </div>
              )}

              {joinUrl && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(joinUrl, 'join')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg glass-card border-none text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors"
                >
                  {copiedLink === 'join' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span>{copiedLink === 'join' ? t('Copied!', 'اتنسخ!') : t("Copy the student's link", 'انسخ رابط الطالب')}</span>
                </button>
              )}

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 text-success border border-success/30 text-sm font-medium hover:bg-success/20 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('Send the link on WhatsApp', 'ابعت الرابط على واتساب')}</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg glass-surface text-muted-foreground border border-border-subtle text-sm font-medium cursor-not-allowed">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('No WhatsApp number', 'مفيش رقم واتساب')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Student Learning Need & Goal */}
          {(trial.goal || trial.notes) && (
            <div className="glass-surface p-4 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wider mb-1.5">
                <FileText className="w-4 h-4" />
                <span>{t("Student's goal & needs", 'هدف الطالب واحتياجاته')}</span>
              </div>
              <p className="text-sm sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {trial.goal || trial.notes}
              </p>
            </div>
          )}

          {/* Section 3: Trial Assessment (Teacher Observation) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>{t('Assessment', 'التقييم')}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {t('Your observations', 'ملاحظاتك')}
              </span>
            </div>

            {/* Dynamic Learning Plan Templates Picker */}
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-secondary/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('Ready-made plans', 'خطط جاهزة')}</span>
                </div>
                <span className="text-[13px] text-muted-foreground">{t('one click', 'بضغطة واحدة')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('Pick a starting plan to fill the form, then adjust it:', 'اختار خطة جاهزة علشان تملا الفورم، وبعدين عدّلها:')}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {LEARNING_PLAN_TEMPLATES.map((tmpl) => {
                  const isSelected = appliedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                          : 'glass-card text-foreground border border-border hover:border-accent/40'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{tmpl.title}</span>
                      <span className="text-[13px] opacity-70">({tmpl.duration} {t('min', 'د')})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="tdm-level">
                  {t('Current level', 'المستوى الحالي')}
                </label>
                <select
                  id="tdm-level"
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('— Not assessed yet —', '— لسه ما اتقيّمش —')}</option>
                  <option value="beginner">{t('Beginner (from the basics)', 'مبتدئ (من الأساسيات)')}</option>
                  <option value="elementary">{t('Elementary (knows the letters)', 'أساسي (يعرف الحروف)')}</option>
                  <option value="intermediate">{t('Intermediate (reads with basic rules)', 'متوسط (بيقرا بالأحكام الأساسية)')}</option>
                  <option value="advanced">{t('Advanced (fluent, polishing)', 'متقدم (متمكن، بيحسّن)')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="tdm-follow">
                  {t('Follow-up', 'المتابعة')}
                </label>
                <select
                  id="tdm-follow"
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="needs_follow_up">{t('Needs follow-up', 'محتاج متابعة')}</option>
                  <option value="awaiting_response">{t('Waiting for the student', 'مستنيين رد الطالب')}</option>
                  <option value="student_deciding">{t('Student is choosing times', 'الطالب بيختار مواعيد')}</option>
                  <option value="ready_to_continue">{t('Ready to continue (send plan)', 'جاهز يكمل (ابعت الخطة)')}</option>
                  <option value="enrolled">{t('Booked lessons', 'حجز حصص')}</option>
                  <option value="not_now">{t('Not continuing for now', 'مش هيكمل دلوقتي')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('Strengths', 'نقاط القوة')}
              </label>
              <input
                aria-label={t('Strengths', 'نقاط القوة')}
                type="text"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder={t('e.g. attentive, knows the alphabet, good pronunciation', 'مثلاً: مركز، يعرف الحروف، نطقه كويس')}
                className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('What to work on', 'محتاج يشتغل على')}
              </label>
              <input
                aria-label={t('What to work on', 'محتاج يشتغل على')}
                type="text"
                value={areasNeedingWork}
                onChange={(e) => setAreasNeedingWork(e.target.value)}
                placeholder={t('e.g. heavy letters, Noon Sakinah rules, reading confidence', 'مثلاً: الحروف المفخمة، أحكام النون الساكنة، الثقة في القراءة')}
                className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('Private notes', 'ملاحظات خاصة')}
              </label>
              <textarea
                aria-label={t('Private notes', 'ملاحظات خاصة')}
                rows={2}
                value={assessmentNotes}
                onChange={(e) => setAssessmentNotes(e.target.value)}
                placeholder={t('Pace, focus, parent expectations, preferred times…', 'السرعة، التركيز، توقعات ولي الأمر، المواعيد المفضلة…')}
                className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Section 4: Recommended Learning Plan */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>{t('Recommended learning plan', 'خطة التعلم المقترحة')}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(studentPlanMessage, 'plan')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg glass-card text-sm font-medium text-foreground border border-border hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                {copiedLink === 'plan' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 opacity-70" />}
                <span>{copiedLink === 'plan' ? t('Copied!', 'اتنسخت!') : t('Copy plan for the student', 'انسخ الخطة للطالب')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="tdm-service">
                  {t('Subject', 'المادة')}
                </label>
                <select
                  id="tdm-service"
                  value={recommendedServiceId}
                  onChange={(e) => setRecommendedServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {AVAILABLE_SERVICES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="tdm-length">
                  {t('Lesson length', 'مدة الحصة')}
                </label>
                <select
                  id="tdm-length"
                  value={recommendedDuration}
                  onChange={(e) => setRecommendedDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={30}>{t('30 minutes (great for kids)', '30 دقيقة (مناسبة للأطفال)')}</option>
                  <option value={45}>{t('45 minutes', '45 دقيقة')}</option>
                  <option value={60}>{t('60 minutes', '60 دقيقة')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="tdm-freq">
                  {t('Lessons per week', 'عدد الحصص في الأسبوع')}
                </label>
                <select
                  id="tdm-freq"
                  value={recommendedFrequency}
                  onChange={(e) => setRecommendedFrequency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="1x weekly">{t('Once a week', 'مرة في الأسبوع')}</option>
                  <option value="2x weekly">{t('Twice a week (recommended)', 'مرتين في الأسبوع (مقترح)')}</option>
                  <option value="3x weekly">{t('3 times a week (intensive)', '3 مرات في الأسبوع (مكثف)')}</option>
                  <option value="Flexible">{t('Flexible', 'مرن')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('Plan summary / main goal', 'ملخص الخطة / الهدف الأساسي')}
              </label>
              <textarea
                aria-label={t('Plan summary', 'ملخص الخطة')}
                rows={2}
                value={learningPlanSummary}
                onChange={(e) => setLearningPlanSummary(e.target.value)}
                placeholder={t('e.g. master Noon Sakinah in 4 weeks, then recite Surah Al-Mulk…', 'مثلاً: إتقان أحكام النون الساكنة في 4 أسابيع، وبعدها تلاوة سورة الملك…')}
                className="w-full px-3 py-2 rounded-lg border border-border glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer / Pipeline Actions */}
        <div className="p-4 sm:p-5 border-t border-border-subtle glass-surface flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveAssessment(false)}
              className="px-4 py-2 rounded-xl glass-card border-none text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              {saving ? t('Saving…', 'جارٍ الحفظ…') : t('Save assessment', 'احفظ التقييم')}
            </button>

            {trial.status !== 'completed' && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveAssessment(true, 'trial_completed')}
                className="px-4 py-2 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold transition-colors cursor-pointer"
              >
                {t('Attended & done', 'حضر والحصة تمت')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveAssessment(true, 'potential_student')}
              className="px-3.5 py-2 rounded-xl bg-warning/10 hover:bg-warning/20 text-warning-foreground border border-warning/30 text-sm font-medium transition-colors cursor-pointer"
            >
              {t('Might continue', 'ممكن يكمل')}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveAssessment(true, 'active_student')}
              className="px-3.5 py-2 rounded-xl bg-success hover:bg-success/90 text-white text-sm font-semibold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('Continuing student', 'هيكمل معانا')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
