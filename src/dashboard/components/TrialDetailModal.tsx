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
  AlertCircle
} from 'lucide-react';
import { DashboardTrial, TrialAssessment, LeadStatus } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';

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
  { id: 'islamic-studies', name: 'Islamic Studies Foundation' },
  { id: 'aqeedah', name: 'Aqeedah (Islamic Belief)' },
  { id: 'fiqh', name: 'Fiqh (Practical Worship)' },
  { id: 'seerah', name: 'Seerah (Prophetic Biography)' },
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
  const startCairo = startUtc ? startUtc.setZone('Africa/Cairo') : null;

  let startStudent: DateTime | null = null;
  try {
    if (startUtc && trial.student_timezone && trial.student_timezone !== 'Africa/Cairo') {
      startStudent = startUtc.setZone(trial.student_timezone);
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
  const cairoTimeStr = startCairo ? startCairo.toFormat('EEEE, MMMM d at hh:mm a') : 'our scheduled time';
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

      setSaveMessage('Trial assessment and learning plan saved successfully.');
      if (onAssessmentSaved) {
        onAssessmentSaved();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving assessment.');
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
        className="bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] rounded-2xl w-full max-w-2xl shadow-xl border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#D5D0CA]/30 dark:border-[#3E3545]/30 flex items-start justify-between gap-4 bg-[#F8F6F0]/80 dark:bg-[#1E1923]/60">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B]">
                {trial.reference_code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                Free Trial (30 min)
              </span>
              {trial.status ? (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  trial.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : trial.status === 'cancelled'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {trial.status.toUpperCase()}
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  Status unavailable
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              {trial.learner_name || 'Anonymous Student'}
            </h2>
            {trial.parent_name && (
              <p className="text-xs text-[#6F907D] dark:text-[#8FAE9B] font-medium mt-0.5">
                Parent / Guardian: {trial.parent_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#362E3B]/60 dark:text-[#F5E6D3]/60 hover:bg-[#D5D0CA]/30 dark:hover:bg-[#3E3545]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {saveMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Trial Time & Zoom */}
          <div className="bg-[#F8F6F0]/60 dark:bg-[#1E1923]/40 p-4 rounded-xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[#6F907D] dark:text-[#8FAE9B] font-semibold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Session Timing & Room</span>
              </div>
              <span className="text-xs text-[#362E3B]/70 dark:text-[#F5E6D3]/70 font-mono">
                Requested: {trial.service_name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
                <div className="text-[11px] uppercase tracking-wider text-[#362E3B]/60 dark:text-[#F5E6D3]/60 mb-0.5">
                  Mahmoud's Time (Cairo)
                </div>
                <div className="font-semibold text-sm">
                  {startCairo ? startCairo.toFormat('EEE, MMM d • hh:mm a') : (trial.cairo_time_display || 'Time not set')}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
                <div className="text-[11px] uppercase tracking-wider text-[#362E3B]/60 dark:text-[#F5E6D3]/60 mb-0.5">
                  Student's Local Time
                </div>
                <div className="font-semibold text-sm">
                  {startStudent ? (
                    `${startStudent.toFormat('hh:mm a')} (${trial.student_timezone})`
                  ) : (
                    trial.student_timezone || 'Timezone unavailable'
                  )}
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {hostUrl ? (
                <a
                  href={hostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6F907D] hover:bg-[#5C7868] text-white text-xs font-medium shadow-xs transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start as Host</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>
              ) : (
                <div className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Zoom host link not generated yet</span>
                </div>
              )}

              {joinUrl && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(joinUrl, 'join')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 text-xs font-medium hover:bg-stone-50 transition-colors"
                >
                  {copiedLink === 'join' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  <span>{copiedLink === 'join' ? 'Student Link Copied!' : 'Copy Student Link'}</span>
                </button>
              )}

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send Zoom on WhatsApp</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 text-xs font-medium cursor-not-allowed">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>No WhatsApp Number</span>
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Student Learning Need & Goal */}
          {(trial.goal || trial.notes) && (
            <div className="bg-[#F8F6F0]/40 dark:bg-[#1E1923]/20 p-4 rounded-xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 font-semibold text-xs uppercase tracking-wider mb-1.5">
                <FileText className="w-4 h-4" />
                <span>Learner Goal & Inquired Needs</span>
              </div>
              <p className="text-xs sm:text-sm text-[#362E3B]/85 dark:text-[#F5E6D3]/85 leading-relaxed whitespace-pre-wrap">
                {trial.goal || trial.notes}
              </p>
            </div>
          )}

          {/* Section 3: Trial Assessment (Teacher Observation) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#6F907D] dark:text-[#8FAE9B] font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Mini-Lesson Assessment</span>
              </div>
              <span className="text-[11px] text-[#362E3B]/60 dark:text-[#F5E6D3]/60">
                Teacher Observation
              </span>
            </div>

            {/* Dynamic Learning Plan Templates Picker */}
            <div className="p-3.5 rounded-xl bg-[#8FAE9B]/10 dark:bg-[#8FAE9B]/5 border border-[#8FAE9B]/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6F907D] dark:text-[#8FAE9B]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dynamic Learning Plan Templates</span>
                </div>
                <span className="text-[10px] text-stone-500">1-click pedagogical assessment</span>
              </div>
              <p className="text-[11px] text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
                Choose a pre-defined curriculum baseline to quickly populate assessment goals, strengths, and recommended plan:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {LEARNING_PLAN_TEMPLATES.map((tmpl) => {
                  const isSelected = appliedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#6F907D] text-white shadow-xs'
                          : 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] border border-[#D5D0CA]/50 dark:border-[#3E3545] hover:border-[#8FAE9B]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{tmpl.title}</span>
                      <span className="text-[10px] opacity-60">({tmpl.duration}m)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                  Current Assessed Level
                </label>
                <select
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
                >
                  <option value="">-- Unassessed / Not Evaluated Yet --</option>
                  <option value="beginner">Beginner (Starting from basics)</option>
                  <option value="elementary">Elementary (Recognizes letters/basics)</option>
                  <option value="intermediate">Intermediate (Reads with basic rules)</option>
                  <option value="advanced">Advanced (Fluent / Polishing Tajweed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                  Follow-Up Status
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
                >
                  <option value="needs_follow_up">Needs Follow-Up</option>
                  <option value="awaiting_response">Awaiting Student Response</option>
                  <option value="student_deciding">Student Deciding Schedule</option>
                  <option value="ready_to_continue">Ready to Continue (Send Plan)</option>
                  <option value="enrolled">Enrolled in Lessons</option>
                  <option value="not_now">Not Continuing / Postponed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                Observed Strengths
              </label>
              <input
                type="text"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="e.g. Attentive, knows Arabic alphabet, good pronunciation of standard sounds"
                className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                Areas Needing Work & Gaps
              </label>
              <input
                type="text"
                value={areasNeedingWork}
                onChange={(e) => setAreasNeedingWork(e.target.value)}
                placeholder="e.g. Heavy letters (Taa, Saad), Noon Sakinah rules, reading confidence"
                className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                Private Teacher Notes
              </label>
              <textarea
                rows={2}
                value={assessmentNotes}
                onChange={(e) => setAssessmentNotes(e.target.value)}
                placeholder="Observations on pace, focus, parent expectations, preferred timings..."
                className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
              />
            </div>
          </div>

          {/* Section 4: Recommended Learning Plan */}
          <div className="p-4 rounded-xl bg-[#EAF0EB]/50 dark:bg-[#8FAE9B]/10 border border-[#8FAE9B]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#6F907D] dark:text-[#8FAE9B] font-semibold text-xs uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Your Recommended Learning Plan</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(studentPlanMessage, 'plan')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-[#2A2431] text-xs font-medium text-[#6F907D] dark:text-[#8FAE9B] border border-[#8FAE9B]/40 hover:bg-[#8FAE9B]/15 transition-colors cursor-pointer"
              >
                {copiedLink === 'plan' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink === 'plan' ? 'Plan Copied!' : 'Copy Plan for Student'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                  Recommended Service
                </label>
                <select
                  value={recommendedServiceId}
                  onChange={(e) => setRecommendedServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
                >
                  {AVAILABLE_SERVICES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                  Lesson Length
                </label>
                <select
                  value={recommendedDuration}
                  onChange={(e) => setRecommendedDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
                >
                  <option value={30}>30 minutes (Best for kids)</option>
                  <option value={45}>45 minutes (Standard focus)</option>
                  <option value={60}>60 minutes (Comprehensive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                  Weekly Frequency
                </label>
                <select
                  value={recommendedFrequency}
                  onChange={(e) => setRecommendedFrequency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
                >
                  <option value="1x weekly">1× weekly</option>
                  <option value="2x weekly">2× weekly (Recommended)</option>
                  <option value="3x weekly">3× weekly (Intensive)</option>
                  <option value="Flexible">Flexible / Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#F5E6D3]/80 mb-1">
                Learning Plan Summary / Core Milestone
              </label>
              <textarea
                rows={2}
                value={learningPlanSummary}
                onChange={(e) => setLearningPlanSummary(e.target.value)}
                placeholder="e.g. Master Noon Sakinah rules in 4 weeks, then progress to Surah Al-Mulk recitation..."
                className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer / Pipeline Actions */}
        <div className="p-4 sm:p-5 border-t border-[#D5D0CA]/30 dark:border-[#3E3545]/30 bg-[#F8F6F0]/80 dark:bg-[#1E1923]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveAssessment(false)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA] dark:border-[#3E3545] text-xs font-medium hover:bg-stone-50 transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Assessment'}
            </button>

            {trial.status !== 'completed' && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveAssessment(true, 'trial_completed')}
                className="px-4 py-2 rounded-xl bg-[#6F907D] hover:bg-[#5C7868] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Mark Attended & Completed
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveAssessment(true, 'potential_student')}
              className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Mark Potential Student
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveAssessment(true, 'active_student')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enroll as Active Student</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GraduationCap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
