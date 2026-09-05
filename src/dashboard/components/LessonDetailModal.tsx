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
  User, 
  FileText,
  ExternalLink,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { DashboardLesson } from '../types';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';

interface LessonDetailModalProps {
  lesson: DashboardLesson | null;
  onClose: () => void;
}

export function LessonDetailModal({ lesson, onClose }: LessonDetailModalProps) {
  const [copiedLink, setCopiedLink] = useState<'host' | 'join' | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!lesson) return null;

  const startUtc = DateTime.fromISO(lesson.scheduled_start);
  const startCairo = startUtc.setZone('Africa/Cairo');
  
  // Safe student timezone handling
  let startStudent: DateTime | null = null;
  try {
    if (lesson.student_timezone && lesson.student_timezone !== 'Africa/Cairo') {
      startStudent = startUtc.setZone(lesson.student_timezone);
    }
  } catch (e) {
    // If timezone string is invalid, fallback gracefully
    startStudent = null;
  }

  const copyToClipboard = (text: string, type: 'host' | 'join') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const hasHostUrl = Boolean(lesson.zoom_host_url || lesson.zoom_meeting_link);
  const hostUrl = lesson.zoom_host_url || lesson.zoom_meeting_link || '';
  const joinUrl = lesson.zoom_join_url || lesson.zoom_meeting_link || '';

  // Contextual WhatsApp link preparation - truthful target
  const learnerGreetingName = lesson.learner_name || 'there';
  const defaultMessage = `As-salamu alaykum ${learnerGreetingName},\n\nThis is Ustadh Mahmoud regarding our scheduled ${lesson.service_name} lesson on ${startCairo.toFormat('EEEE, MMMM d')} at ${startCairo.toFormat('hh:mm a')} (Cairo time).\n\nLooking forward to teaching you!`;
  const whatsappUrl = buildContextualWhatsAppUrl(lesson.contact_whatsapp, defaultMessage);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-detail-title"
    >
      <div 
        className="bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] rounded-2xl w-full max-w-lg shadow-xl border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#D5D0CA]/30 dark:border-[#3E3545]/30 flex items-start justify-between gap-4 bg-[#F8F6F0]/60 dark:bg-[#1E1923]/40">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#8FAE9B]/15 text-[#6F907D] dark:text-[#8FAE9B]">
                {lesson.reference_code}
              </span>
              {lesson.is_free_trial ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  Free Trial (30 min)
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  1-on-1 Lesson ({lesson.duration_minutes} min)
                </span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                lesson.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                lesson.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                lesson.status === 'rescheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {lesson.status || 'Status unavailable'}
              </span>
            </div>
            <h2 id="lesson-detail-title" className="text-xl font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
              {lesson.learner_name || 'Learner name not recorded'}
            </h2>
            {lesson.parent_name && (
              <p className="text-xs opacity-70 mt-0.5">
                Parent/Guardian: <span className="font-medium">{lesson.parent_name}</span>
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-[#D5D0CA]/30 dark:hover:bg-[#3E3545]/40 transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Time and Service Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F8F6F0] dark:bg-[#1E1923]/60 border border-[#D5D0CA]/20 dark:border-[#3E3545]/20">
              <div className="flex items-center gap-2 text-xs font-medium opacity-60 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Cairo Time (Teacher)</span>
              </div>
              <div className="font-semibold text-base">
                {startCairo.toFormat('hh:mm a')}
              </div>
              <div className="text-xs opacity-75 mt-0.5">
                {startCairo.toFormat('EEEE, MMMM d, yyyy')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F6F0] dark:bg-[#1E1923]/60 border border-[#D5D0CA]/20 dark:border-[#3E3545]/20">
              <div className="flex items-center gap-2 text-xs font-medium opacity-60 mb-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Student Timezone</span>
              </div>
              {startStudent ? (
                <>
                  <div className="font-semibold text-base">
                    {startStudent.toFormat('hh:mm a')}
                  </div>
                  <div className="text-xs opacity-75 mt-0.5 truncate" title={lesson.student_timezone || ''}>
                    {lesson.student_timezone}
                  </div>
                </>
              ) : (
                <div className="text-xs opacity-70 mt-1">
                  {lesson.student_timezone ? `Timezone: ${lesson.student_timezone}` : 'Timezone unavailable'}
                </div>
              )}
            </div>
          </div>

          {/* Service & Subject */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#EAF0EB]/50 dark:bg-[#8FAE9B]/10 border border-[#8FAE9B]/20">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6F907D] dark:text-[#8FAE9B]">
                Subject
              </span>
              <p className="text-sm font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
                {lesson.service_name}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6F907D] dark:text-[#8FAE9B]">
                Duration
              </span>
              <p className="text-sm font-medium">
                {lesson.duration_minutes} minutes
              </p>
            </div>
          </div>

          {/* Lesson Fee Context */}
          <div className="flex items-center justify-between text-xs py-2.5 px-3 rounded-xl bg-[#F8F6F0] dark:bg-[#1E1923]/40 border border-[#D5D0CA]/20 dark:border-[#3E3545]/20">
            <span className="opacity-70 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Lesson Fee
            </span>
            <span className="font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {lesson.is_free_trial 
                ? '$0 (Free Trial)' 
                : lesson.fee_amount_usd !== null && lesson.fee_amount_usd !== undefined 
                ? `$${lesson.fee_amount_usd} USD` 
                : 'Price not set'}
            </span>
          </div>

          {/* Zoom Section */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              Zoom Classroom
            </h3>
            
            {hasHostUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <a 
                    href={hostUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-xs"
                  >
                    <Video className="w-4 h-4" />
                    Start Lesson as Host
                    <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                  </a>
                  <button 
                    onClick={() => copyToClipboard(joinUrl || hostUrl, 'join')}
                    className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[#362E3B] dark:text-[#F5E6D3] rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                    title="Copy Student Join Link"
                  >
                    {copiedLink === 'join' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs hidden sm:inline">Copy Link</span>
                  </button>
                </div>
                {lesson.zoom_meeting_id && (
                  <p className="text-[11px] opacity-60">
                    Meeting ID: <span className="font-mono">{lesson.zoom_meeting_id}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Dedicated Zoom meeting link is pending preparation.</span>
              </div>
            )}
          </div>

          {/* Contact Actions */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70">
              Student Communication
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {whatsappUrl ? (
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp ({lesson.contact_whatsapp})
                </a>
              ) : (
                <span className="text-xs opacity-60">No WhatsApp provided</span>
              )}

              {lesson.contact_email && (
                <a 
                  href={`mailto:${lesson.contact_email}?subject=${encodeURIComponent(`Ustadh Mahmoud — ${lesson.service_name} Lesson`)}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 dark:bg-gray-800 text-[#362E3B] dark:text-[#F5E6D3] rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {lesson.contact_email}
                </a>
              )}
            </div>
          </div>

          {/* Calendar Sync Status */}
          <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-[#F8F6F0] dark:bg-[#1E1923]/40 border border-[#D5D0CA]/20 dark:border-[#3E3545]/20">
            <span className="opacity-70 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Google Calendar Sync
            </span>
            <span className={`font-medium ${lesson.google_calendar_event_id ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {lesson.google_calendar_event_id ? 'Synced with Calendar' : 'Sync Pending'}
            </span>
          </div>

          {/* Student Notes */}
          {lesson.notes && lesson.notes.trim().length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F6F0] dark:bg-[#1E1923]/40 border border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
              <div className="flex items-center gap-1.5 text-xs font-semibold opacity-70">
                <FileText className="w-3.5 h-3.5" />
                <span>Student Learning Goal & Notes</span>
              </div>
              <p className="text-xs leading-relaxed opacity-85 whitespace-pre-wrap">
                {lesson.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D5D0CA]/30 dark:border-[#3E3545]/30 bg-[#F8F6F0]/60 dark:bg-[#1E1923]/40 flex items-center justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#362E3B] dark:text-[#F5E6D3] rounded-xl text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
