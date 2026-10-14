import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import {
  X,
  Video,
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  FileText,
  ExternalLink,
  DollarSign,
  CalendarCheck2,
  UserX,
  Sparkles,
  Send
} from 'lucide-react';
import { DashboardLesson } from '../types';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { dashboardFetch } from '../lib/dashboardApi';
import FocusTrap from '../../components/FocusTrap';
import { useTeacherAuth } from '../../lib/auth';
import { useT } from '../../lib/language';

interface LessonDetailModalProps {
  lesson: DashboardLesson | null;
  onClose: () => void;
  onBookingUpdated?: () => void;
}

/** Quick lesson view from Today / Schedule. Teachers see no fees (RULES.md §1). */
export function LessonDetailModal({ lesson, onClose, onBookingUpdated }: LessonDetailModalProps) {
  const { t, isAr } = useT();
  const { teacherRole } = useTeacherAuth();
  const isSuperAdmin = teacherRole === 'super_admin';
  const locale = isAr ? 'ar' : 'en';

  const [copiedLink, setCopiedLink] = useState<'host' | 'join' | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(lesson?.status || null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);
  const [coveredMaterial, setCoveredMaterial] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  const [noShowCreditDecision, setNoShowCreditDecision] = useState<'returned' | 'used'>('returned');

  const [isRequestingMove, setIsRequestingMove] = useState(false);
  const [moveNote, setMoveNote] = useState('');

  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const handleGenerateAiBrief = async () => {
    if (!lesson?.student_id) return;
    setIsGeneratingBrief(true);
    setBriefError(null);
    setAiBrief(null);
    try {
      const res = await dashboardFetch(`/api/dashboard/students/${lesson.student_id}/ai-brief`, { method: 'POST' });
      setAiBrief(res.brief);
    } catch (err: any) {
      setBriefError(err.message || t("Couldn't prepare the brief.", 'تعذر تجهيز الملخص.'));
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  useEffect(() => {
    setCurrentStatus(lesson?.status || null);
    setStatusMessage(null);
    setIsMarkingCompleted(false);
    setIsMarkingNoShow(false);
    setIsRequestingMove(false);
    setCoveredMaterial('');
    setCompletionNotes('');
    setNoShowReason('');
    setMoveNote('');
    setNoShowCreditDecision('returned');
  }, [lesson]);

  const patchLesson = async (body: object, okText: string, nextStatus?: string) => {
    if (!lesson) return;
    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${lesson.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      if (nextStatus) setCurrentStatus(nextStatus);
      setStatusMessage({ type: 'success', text: okText });
      setIsMarkingCompleted(false);
      setIsMarkingNoShow(false);
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || t("Couldn't update the lesson.", 'تعذر تحديث الحصة.') });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmCompleted = () => lesson && patchLesson({
    status: 'completed',
    covered_material: coveredMaterial.trim() || undefined,
    notes: completionNotes.trim()
      ? (lesson.notes ? `${lesson.notes}\n[Lesson Notes]: ${completionNotes.trim()}` : completionNotes.trim())
      : undefined
  }, t('Marked as completed.', 'اتسجلت إنها تمت.'), 'completed');

  const handleConfirmNoShow = () => lesson && patchLesson({
    status: 'no_show',
    no_show_credit_decision: noShowCreditDecision,
    consume_package_credit: noShowCreditDecision === 'used',
    notes: noShowReason.trim()
      ? (lesson.notes ? `${lesson.notes}\n[No-Show Note]: ${noShowReason.trim()}` : `[No-Show Note]: ${noShowReason.trim()}`)
      : undefined
  }, t('Recorded as a no-show.', 'اتسجل غياب.'), 'no_show');

  const handleRequestMove = async () => {
    if (!lesson) return;
    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${lesson.id}/reschedule-request`, {
        method: 'POST',
        body: JSON.stringify({ note: moveNote.trim() })
      });
      setStatusMessage({ type: 'success', text: t('Request sent to the student.', 'الطلب اتبعت للطالب.') });
      setIsRequestingMove(false);
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || t("Couldn't send the request.", 'تعذر إرسال الطلب.') });
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!lesson) return null;

  const startUtc = DateTime.fromISO(lesson.scheduled_start);
  const startCairo = startUtc.setZone('Africa/Cairo').setLocale(locale);
  let startStudent: DateTime | null = null;
  try {
    if (lesson.student_timezone && lesson.student_timezone !== 'Africa/Cairo') {
      startStudent = startUtc.setZone(lesson.student_timezone).setLocale(locale);
    }
  } catch {
    startStudent = null;
  }
  const notStartedYet = startUtc > DateTime.now().plus({ minutes: 15 });
  const isActive = currentStatus !== 'completed' && currentStatus !== 'no_show' && currentStatus !== 'cancelled';
  const isUpcoming = isActive && startUtc > DateTime.now();

  const copyToClipboard = (text: string, type: 'host' | 'join') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const hasHostUrl = Boolean(lesson.zoom_host_url || lesson.zoom_meeting_link);
  const hostUrl = lesson.zoom_host_url || lesson.zoom_meeting_link || '';
  const joinUrl = lesson.zoom_join_url || lesson.zoom_meeting_link || '';

  const learnerGreetingName = lesson.learner_name || 'there';
  const defaultMessage = `As-salamu alaykum ${learnerGreetingName},\n\nAbout our ${lesson.service_name} lesson on ${startCairo.setLocale('en').toFormat('EEEE, MMMM d')} at ${startCairo.setLocale('en').toFormat('hh:mm a')} (Cairo time).`;
  const whatsappUrl = buildContextualWhatsAppUrl(lesson.contact_whatsapp, defaultMessage);

  const statusText = ({
    confirmed: t('Confirmed', 'مؤكدة'),
    completed: t('Completed', 'تمت'),
    no_show: t('No-show', 'غياب'),
    cancelled: t('Cancelled', 'ملغاة'),
    rescheduled: t('Moved', 'اتغيّر ميعادها'),
    pending: t('Waiting', 'في الانتظار')
  } as Record<string, string>)[currentStatus || ''] || t('Unknown', 'غير معروف');

  const fieldClass = 'w-full p-2 text-sm glass-card border-none rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-detail-title"
    >
      <FocusTrap isActive={true}>
        <div
          className="glass-card text-foreground rounded-2xl w-full max-w-lg shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-border-subtle flex items-start justify-between gap-4 glass-surface">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-mono font-semibold px-2 py-0.5 rounded bg-secondary/30 text-accent">{lesson.reference_code}</span>
                {lesson.is_free_trial ? (
                  <span className="text-sm font-semibold px-2 py-0.5 rounded bg-warning/15 text-warning-foreground border border-warning/30">
                    {t('Free trial', 'تجربة مجانية')} ({lesson.duration_minutes} {t('min', 'دقيقة')})
                  </span>
                ) : (
                  <span className="text-sm font-semibold px-2 py-0.5 rounded bg-secondary/30 text-primary border border-secondary/50">
                    {t('Private lesson', 'حصة فردية')} ({lesson.duration_minutes} {t('min', 'دقيقة')})
                  </span>
                )}
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                  currentStatus === 'confirmed' ? 'bg-success/15 text-success border border-success/30' :
                  currentStatus === 'no_show' ? 'bg-warning/15 text-warning-foreground border border-warning/30' :
                  currentStatus === 'cancelled' ? 'bg-destructive/15 text-destructive border border-destructive/20' :
                  currentStatus === 'rescheduled' ? 'bg-secondary/30 text-primary border border-secondary/50' :
                  'glass-surface text-muted-foreground border border-border-subtle'
                }`}>
                  {statusText}
                </span>
              </div>
              <h2 id="lesson-detail-title" className="text-xl font-display font-semibold text-foreground">
                {lesson.learner_name || t('Name not recorded', 'الاسم مش متسجل')}
              </h2>
              {lesson.parent_name && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('Parent / guardian', 'ولي الأمر')}: <span className="font-medium text-foreground">{lesson.parent_name}</span>
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground glass-hover hover:bg-surface transition-colors" aria-label={t('Close', 'إغلاق')}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl glass-surface border border-border-subtle">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('Cairo time', 'بتوقيت القاهرة')}</span>
                </div>
                <div className="font-semibold text-base text-foreground">{startCairo.toFormat('hh:mm a')}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{startCairo.toFormat('EEEE, MMMM d, yyyy')}</div>
              </div>
              <div className="p-4 rounded-xl glass-surface border border-border-subtle">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t("Student's time", 'بتوقيت الطالب')}</span>
                </div>
                {startStudent ? (
                  <>
                    <div className="font-semibold text-base text-foreground">{startStudent.toFormat('hh:mm a')}</div>
                    <div className="text-sm text-muted-foreground mt-0.5 truncate" title={lesson.student_timezone || ''} dir="ltr">{lesson.student_timezone}</div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground mt-1">
                    {lesson.student_timezone ? t('Same as Cairo', 'نفس توقيت القاهرة') : t('Not set', 'مش محدد')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-secondary/50">
              <div>
                <span className="text-[11px] tracking-wider font-semibold text-primary block">{t('Subject', 'المادة')}</span>
                <p className="text-sm font-semibold text-foreground mt-0.5">{lesson.service_name}</p>
              </div>
              <div className="text-end">
                <span className="text-[11px] tracking-wider font-semibold text-primary block">{t('Length', 'المدة')}</span>
                <p className="text-sm font-medium text-foreground mt-0.5">{lesson.duration_minutes} {t('minutes', 'دقيقة')}</p>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="flex items-center justify-between text-sm py-2.5 px-3.5 rounded-xl glass-surface border border-border-subtle">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <DollarSign className="w-3.5 h-3.5" />
                  {t('Lesson price', 'سعر الحصة')}
                </span>
                <span className="font-semibold text-foreground">
                  {lesson.is_free_trial
                    ? t('Free trial', 'تجربة مجانية')
                    : lesson.fee_amount_usd !== null && lesson.fee_amount_usd !== undefined
                      ? `$${lesson.fee_amount_usd} USD`
                      : t('Not set', 'مش محدد')}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                {t('Zoom classroom', 'فصل Zoom')}
              </h3>
              {hasHostUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={hostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-primary-material text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-2xs"
                    >
                      <Video className="w-4 h-4" />
                      {t('Start lesson as host', 'ابدأ الحصة كمضيف')}
                      <ExternalLink className="w-3.5 h-3.5 ms-1 opacity-70" />
                    </a>
                    <button
                      onClick={() => copyToClipboard(joinUrl || hostUrl, 'join')}
                      className="px-3.5 py-2.5 glass-card hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                      title={t("Copy the student's link", 'انسخ رابط الطالب')}
                      aria-label={t("Copy the student's link", 'انسخ رابط الطالب')}
                    >
                      {copiedLink === 'join' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 opacity-70" />}
                      <span className="text-sm hidden sm:inline">{t('Copy link', 'انسخ الرابط')}</span>
                    </button>
                  </div>
                  {lesson.zoom_meeting_id && (
                    <p className="text-[11px] text-muted-foreground">
                      {t('Meeting ID', 'رقم الاجتماع')}: <span className="font-mono text-foreground font-medium" dir="ltr">{lesson.zoom_meeting_id}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-sm text-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
                  <span>{t('The Zoom link is still being prepared.', 'رابط Zoom لسه بيتجهز.')}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm tracking-wider font-semibold text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('AI lesson prep', 'تحضير الحصة بالذكاء الاصطناعي')}
                </span>
                {!aiBrief && (
                  <button
                    onClick={handleGenerateAiBrief}
                    disabled={isGeneratingBrief}
                    className="text-[13px] bg-accent/10 hover:bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium transition-colors disabled:opacity-50"
                  >
                    {isGeneratingBrief ? t('Preparing…', 'جارٍ التحضير…') : t('Prepare brief', 'جهّز ملخص')}
                  </button>
                )}
              </h3>
              {(aiBrief || briefError) && (
                <div className="p-4 rounded-xl glass-surface border border-accent/20 text-sm">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => { setAiBrief(null); setBriefError(null); }}
                      className="text-muted-foreground hover:text-foreground p-1 transition-colors leading-none"
                      aria-label={t('Dismiss', 'إخفاء')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {briefError ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {briefError}
                    </div>
                  ) : (
                    <div className="text-foreground whitespace-pre-wrap leading-relaxed" dir="auto">{aiBrief}</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm tracking-wider font-semibold text-muted-foreground">{t('Contact the student', 'تواصل مع الطالب')}</h3>
              <div className="flex flex-wrap items-center gap-2">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-success/10 text-success border border-success/30 rounded-xl text-sm font-medium hover:bg-success/20 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t('WhatsApp', 'واتساب')} (<span dir="ltr">{lesson.contact_whatsapp}</span>)
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">{t('No WhatsApp number', 'مفيش رقم واتساب')}</span>
                )}
                {lesson.contact_email && (
                  <a
                    href={`mailto:${lesson.contact_email}?subject=${encodeURIComponent(`${lesson.service_name} lesson`)}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 glass-card hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 opacity-70" />
                    <span dir="ltr">{lesson.contact_email}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm py-2 px-3.5 rounded-xl glass-surface border border-border-subtle">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <CalendarIcon className="w-3.5 h-3.5" />
                {t('Google Calendar', 'تقويم جوجل')}
              </span>
              <span className={`font-medium ${lesson.google_calendar_event_id ? 'text-success' : 'text-warning'}`}>
                {lesson.google_calendar_event_id ? t('Added', 'متضافة') : t('Not added yet', 'لسه ما اتضافتش')}
              </span>
            </div>

            {lesson.notes && lesson.notes.trim().length > 0 && (
              <div className="space-y-1.5 p-3.5 rounded-xl glass-surface border border-border-subtle">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t("Student's goal & notes", 'هدف الطالب وملاحظاته')}</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap" dir="auto">{lesson.notes}</p>
              </div>
            )}

            {isRequestingMove && (
              <div className="p-4 bg-secondary/15 border border-secondary/30 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-secondary-foreground flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    {t('Ask the student to reschedule', 'اطلب من الطالب يغيّر الميعاد')}
                  </h4>
                  <button onClick={() => setIsRequestingMove(false)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">{t('Cancel', 'إلغاء')}</button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('The student gets a notification on the site and picks a new time.', 'الطالب هيوصله إشعار على الموقع ويختار ميعاد جديد.')}
                </p>
                <input type="text" maxLength={500} placeholder={t('Short note (optional)', 'ملاحظة قصيرة (اختياري)')} value={moveNote} onChange={(e) => setMoveNote(e.target.value)} className={fieldClass} />
                <button
                  onClick={handleRequestMove}
                  disabled={updatingStatus}
                  className="w-full py-2 text-sm font-semibold text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                >
                  {updatingStatus ? t('Sending…', 'جارٍ الإرسال…') : t('Send request', 'ابعت الطلب')}
                </button>
              </div>
            )}

            {isMarkingCompleted && (
              <div className="p-4 bg-secondary/30 border border-secondary/50 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    {t('Record a completed lesson', 'سجّل إن الحصة تمت')}
                  </h4>
                  <button onClick={() => setIsMarkingCompleted(false)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">{t('Back', 'رجوع')}</button>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1" htmlFor="ldm-covered">
                    {t('What was covered', 'اللي اتشرح')} <span className="text-muted-foreground font-normal">({t('surah / ayahs, page, topics', 'سورة / آيات، صفحة، موضوعات')})</span>
                  </label>
                  <input id="ldm-covered" type="text" placeholder={t('e.g. Al-Baqarah 1–25, rules of Meem Sakinah', 'مثلاً: البقرة 1–25، أحكام الميم الساكنة')} value={coveredMaterial} onChange={(e) => setCoveredMaterial(e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1" htmlFor="ldm-notes">
                    {t('Notes', 'ملاحظات')} <span className="text-muted-foreground font-normal">({t('optional', 'اختياري')})</span>
                  </label>
                  <input id="ldm-notes" type="text" placeholder={t('e.g. Good Tajweed, review ayah 15 next time', 'مثلاً: تجويد كويس، نراجع آية 15 المرة الجاية')} value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} className={fieldClass} />
                </div>
                <button
                  onClick={handleConfirmCompleted}
                  disabled={updatingStatus}
                  className="w-full py-2 text-sm font-semibold text-primary-foreground btn-primary-material rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                >
                  {updatingStatus ? t('Saving…', 'جارٍ الحفظ…') : t('Confirm lesson completed', 'أكّد إن الحصة تمت')}
                </button>
              </div>
            )}

            {isMarkingNoShow && (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-warning flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5" />
                    {t('Record a no-show', 'سجّل غياب الطالب')}
                  </h4>
                  <button onClick={() => setIsMarkingNoShow(false)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">{t('Back', 'رجوع')}</button>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-semibold text-foreground">{t('Package credit', 'رصيد الباقة')}:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([
                      ['returned', t('Keep the credit', 'خلّي الرصيد'), t('The lesson stays in the package.', 'الحصة تفضل في الباقة.'), 'border-primary ring-primary'],
                      ['used', t('Use 1 credit', 'اخصم حصة'), t('The missed lesson counts as taken.', 'الحصة اللي اتفوتت تتحسب.'), 'border-warning ring-warning']
                    ] as const).map(([value, title, hint, ring]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setNoShowCreditDecision(value)}
                        aria-pressed={noShowCreditDecision === value}
                        className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                          noShowCreditDecision === value ? `glass-card ring-1 ${ring} text-foreground` : 'glass-card/60 border-border text-muted-foreground glass-hover hover:bg-surface'
                        }`}
                      >
                        <span className="font-semibold text-sm block text-foreground">{title}</span>
                        <span className="text-[13px] text-muted-foreground block mt-0.5">{hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1" htmlFor="ldm-noshow">
                    {t('Note', 'ملاحظة')} <span className="text-muted-foreground font-normal">({t('optional', 'اختياري')})</span>
                  </label>
                  <input id="ldm-noshow" type="text" placeholder={t('e.g. Did not join, waited 15 minutes', 'مثلاً: ما دخلش، استنيت 15 دقيقة')} value={noShowReason} onChange={(e) => setNoShowReason(e.target.value)} className="w-full p-2 text-sm glass-card border-none rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-warning/40" />
                </div>
                <button
                  onClick={handleConfirmNoShow}
                  disabled={updatingStatus}
                  className="w-full py-2 text-sm font-semibold text-warning-foreground bg-warning hover:bg-warning/90 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                >
                  {updatingStatus ? t('Saving…', 'جارٍ الحفظ…') : t('Confirm no-show', 'أكّد الغياب')}
                </button>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border-subtle glass-surface flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {statusMessage && (
                <span role="status" className={`text-sm font-medium px-2.5 py-1 rounded-lg ${
                  statusMessage.type === 'success' ? 'bg-success/15 text-success border border-success/30' : 'bg-destructive/15 text-destructive border border-destructive/30'
                }`}>
                  {statusMessage.text}
                </span>
              )}
              {isActive && (
                <div className="flex flex-wrap items-center gap-2">
                  {!isMarkingCompleted && (
                    <button
                      onClick={() => { setIsMarkingCompleted(true); setIsMarkingNoShow(false); setIsRequestingMove(false); }}
                      disabled={updatingStatus || notStartedYet}
                      title={notStartedYet ? t('Available once the lesson starts', 'متاح لما الحصة تبدأ') : undefined}
                      className="px-3 py-1.5 btn-primary-material text-primary-foreground rounded-xl text-sm font-semibold shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <CalendarCheck2 className="w-3.5 h-3.5" />
                      {t('Mark completed', 'الحصة تمت')}
                    </button>
                  )}
                  {!isMarkingNoShow && (
                    <button
                      onClick={() => { setIsMarkingNoShow(true); setIsMarkingCompleted(false); setIsRequestingMove(false); }}
                      disabled={updatingStatus || notStartedYet}
                      title={notStartedYet ? t('Available once the lesson starts', 'متاح لما الحصة تبدأ') : undefined}
                      className="px-3 py-1.5 bg-warning/10 hover:bg-warning/20 text-warning-foreground border border-warning/30 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      {t('No-show', 'غياب')}
                    </button>
                  )}
                  {isUpcoming && !isRequestingMove && (
                    <button
                      onClick={() => { setIsRequestingMove(true); setIsMarkingCompleted(false); setIsMarkingNoShow(false); }}
                      className="px-3 py-1.5 glass-card hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t('Ask to reschedule', 'اطلب تغيير الميعاد')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} className="px-4 py-2 glass-card hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors ms-auto">
              {t('Close', 'إغلاق')}
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
