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
  { id: 'islamic-studies', name: 'Islamic Studies Foundation' },
  { id: 'aqeedah', name: 'Aqeedah (Islamic Belief)' },
  { id: 'fiqh', name: 'Fiqh (Practical Worship)' },
  { id: 'seerah', name: 'Seerah (Prophetic Biography)' },
  { id: 'modern-standard-arabic', name: 'Modern Standard Arabic' },
  { id: 'arabic-conversation', name: 'Arabic Conversation' },
  { id: 'egyptian-arabic', name: 'Egyptian Arabic Dialect' },
  { id: 'english', name: 'English Coaching' }
];

const STAGE_CONFIG: Record<LeadStatus, { label: string; color: string; description: string }> = {
  visitor: {
    label: 'Visitor',
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    description: 'Initial touchpoint or browsing inquiry'
  },
  lead: {
    label: 'New Lead',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    description: 'Inquiry received via website form or initial message'
  },
  contacted: {
    label: 'Contacted',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    description: 'Mahmoud has reached out via WhatsApp or email'
  },
  trial_booked: {
    label: 'Trial Booked',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    description: 'Scheduled for an upcoming 30-minute free trial session'
  },
  trial_completed: {
    label: 'Trial Completed',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    description: 'Attended free trial mini-lesson and level evaluated'
  },
  potential_student: {
    label: 'Potential Student',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    description: 'Received Recommended Learning Plan; discussing schedule or package'
  },
  active_student: {
    label: 'Active Student',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    description: 'Enrolled in regular lessons with reserved weekly slots'
  },
  returning_student: {
    label: 'Returning Student',
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    description: 'Re-enrolled after a break or completing a previous cycle'
  },
  lost: {
    label: 'Lost / Postponed',
    color: 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
    description: 'Decided not to proceed or uncontactable'
  }
};

export function LeadDetailModal({ lead, onClose, onLeadUpdated }: LeadDetailModalProps) {
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
      setSuccessMessage(`Lead updated successfully to ${STAGE_CONFIG[targetStatus]?.label || targetStatus}.`);
      if (onLeadUpdated) onLeadUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating lead.');
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
    ? DateTime.fromISO(lead.created_at).setZone('Africa/Cairo').toFormat('EEE, MMM d, yyyy • hh:mm a')
    : null;

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
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${STAGE_CONFIG[currentStatus]?.color || 'bg-stone-100'}`}>
                {STAGE_CONFIG[currentStatus]?.label || currentStatus}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {lead.learner_type === 'child' ? 'Child Learner' : 'Adult Learner'}
              </span>
              {lead.source && (
                <span className="text-xs text-[#6F907D] dark:text-[#8FAE9B] font-mono px-2 py-0.5 rounded bg-[#8FAE9B]/10">
                  Source: {lead.source}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              {lead.name}
            </h2>
            {lead.parent_name && (
              <p className="text-xs text-[#6F907D] dark:text-[#8FAE9B] font-medium mt-0.5">
                Parent / Guardian: {lead.parent_name}
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
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 space-y-2">
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
                  className="rounded border-rose-300 text-[#6F907D] focus:ring-[#6F907D]"
                />
                <label htmlFor="teacher-override" className="text-xs text-stone-700 dark:text-stone-300">
                  Allow manual stage correction / teacher override
                </label>
              </div>
            </div>
          )}

          {/* Quick Communication Bar */}
          <div className="p-4 rounded-xl bg-[#F8F6F0]/70 dark:bg-[#1E1923]/40 border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 text-xs">
              <div className="text-[11px] uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60">
                Contact Information
              </div>
              <div className="font-medium text-[#362E3B] dark:text-[#F5E6D3]">
                {lead.email} {lead.whatsapp && `• ${lead.whatsapp}`}
              </div>
              {createdDateCairo && (
                <div className="text-[11px] text-stone-500">
                  First Inquired: {createdDateCairo} (Cairo)
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 text-xs font-medium cursor-not-allowed">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>No WhatsApp</span>
                </span>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/50 text-xs font-medium hover:bg-stone-50 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Pipeline Stage Transition Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium uppercase tracking-wider text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
                Pipeline Lifecycle Stage
              </label>
              <span className="text-[11px] text-stone-500">
                {STAGE_CONFIG[currentStatus]?.description}
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
                    className={`p-2 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#6F907D] bg-[#EAF0EB]/60 dark:bg-[#8FAE9B]/15 text-[#6F907D] dark:text-[#8FAE9B] font-semibold'
                        : 'border-[#D5D0CA]/40 dark:border-[#3E3545]/40 bg-white dark:bg-[#2A2431] hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div>{STAGE_CONFIG[statusKey].label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Associated Trial Booking Card */}
          {lead.trial_booking ? (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Associated Free Trial</span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#2A2431] text-amber-900 dark:text-amber-300">
                  {lead.trial_booking.reference_code}
                </span>
              </div>

              <div className="text-xs text-[#362E3B]/80 dark:text-[#D5D0CA]">
                <span>Status: </span>
                <span className="font-semibold uppercase">{lead.trial_booking.status || 'Scheduled'}</span>
                {lead.trial_booking.scheduled_start && (
                  <span>
                    {' • '}
                    {DateTime.fromISO(lead.trial_booking.scheduled_start).setZone('Africa/Cairo').toFormat('EEE, MMM d • hh:mm a (Cairo)')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px]">
                {lead.trial_booking.has_assessment ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evaluation & Learning Plan Saved</span>
                  </span>
                ) : (
                  <span className="text-stone-500">
                    Awaiting assessment after mini-lesson
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex items-center justify-between">
              <span>No trial booked yet by this lead.</span>
              {lead.status !== 'trial_booked' && (
                <button
                  type="button"
                  onClick={() => setCurrentStatus('trial_booked')}
                  className="text-xs text-[#6F907D] font-medium hover:underline cursor-pointer"
                >
                  Mark as Booked
                </button>
              )}
            </div>
          )}

          {/* Learning Goal / Inquiry Content */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA] mb-1">
                  Service Interest
                </label>
                <select
                  value={serviceInterest}
                  onChange={(e) => setServiceInterest(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
                >
                  <option value="">General / Undecided</option>
                  {AVAILABLE_SERVICES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA] mb-1">
                  Learning Goal Summary
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Reading fluency, Hifz Surah Al-Baqarah, speaking Egyptian Arabic"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#362E3B]/80 dark:text-[#D5D0CA] mb-1">
                Private Teacher Notes & Conversation History
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log notes from WhatsApp chats, student background, budget, preferred lesson days, parent requests..."
                className="w-full px-3 py-2 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs font-sans"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#D5D0CA]/30 dark:border-[#3E3545]/30 bg-[#F8F6F0]/80 dark:bg-[#1E1923]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentStatus !== 'active_student' && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate('active_student')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enroll as Active Student</span>
              </button>
            )}

            {currentStatus !== 'lost' && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate('lost')}
                className="px-3 py-2 rounded-xl text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors cursor-pointer"
              >
                Mark Lost
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] text-xs font-medium hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleUpdate()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6F907D] hover:bg-[#5C7868] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Lead'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
