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
  DollarSign,
  CalendarCheck2,
  UserX
} from 'lucide-react';
import { DashboardLesson } from '../types';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { dashboardFetch } from '../lib/dashboardApi';

interface LessonDetailModalProps {
  lesson: DashboardLesson | null;
  onClose: () => void;
  onBookingUpdated?: () => void;
}

export function LessonDetailModal({ lesson, onClose, onBookingUpdated }: LessonDetailModalProps) {
  const [copiedLink, setCopiedLink] = useState<'host' | 'join' | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(lesson?.status || null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setCurrentStatus(lesson?.status || null);
    setStatusMessage(null);
  }, [lesson]);

  const handleUpdateStatus = async (newStatus: 'completed' | 'no_show') => {
    if (!lesson) return;
    
    if (newStatus === 'completed') {
      if (!window.confirm('Mark lesson as completed?\n\nThis records that the lesson took place.')) return;
    } else if (newStatus === 'no_show') {
      if (!window.confirm('Mark student as no-show?\n\nThis records that the scheduled lesson did not take place because the student did not attend.')) return;
    }

    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${lesson.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setCurrentStatus(newStatus);
      setStatusMessage({
        type: 'success',
        text: newStatus === 'completed' ? 'Marked as completed.' : 'Recorded as no-show.'
      });
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to update lesson status.'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

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
        className="bg-surface text-foreground rounded-2xl w-full max-w-lg shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-start justify-between gap-4 bg-surface-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary">
                {lesson.reference_code}
              </span>
              {lesson.is_free_trial ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-warning/15 text-warning-foreground border border-warning/30">
                  Free Trial (30 min)
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  1-on-1 Lesson ({lesson.duration_minutes} min)
                </span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                currentStatus === 'confirmed' ? 'bg-success/15 text-success border border-success/30' :
                currentStatus === 'completed' ? 'bg-surface-subtle text-muted-foreground border border-border-subtle' :
                currentStatus === 'no_show' ? 'bg-warning/15 text-warning-foreground border border-warning/30' :
                currentStatus === 'cancelled' ? 'bg-destructive/15 text-destructive border border-destructive/20' :
                currentStatus === 'rescheduled' ? 'bg-primary/10 text-primary border border-primary/20' :
                'bg-surface-subtle text-muted-foreground border border-border-subtle'
              }`}>
                {currentStatus === 'no_show' ? 'No-Show' : (currentStatus || 'Status unavailable')}
              </span>
            </div>
            <h2 id="lesson-detail-title" className="text-xl font-serif font-semibold tracking-tight text-foreground">
              {lesson.learner_name || 'Learner name not recorded'}
            </h2>
            {lesson.parent_name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Parent/Guardian: <span className="font-medium text-foreground">{lesson.parent_name}</span>
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Time and Service Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Cairo Time (Teacher)</span>
              </div>
              <div className="font-semibold text-base text-foreground">
                {startCairo.toFormat('hh:mm a')}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {startCairo.toFormat('EEEE, MMMM d, yyyy')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Student Timezone</span>
              </div>
              {startStudent ? (
                <>
                  <div className="font-semibold text-base text-foreground">
                    {startStudent.toFormat('hh:mm a')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate" title={lesson.student_timezone || ''}>
                    {lesson.student_timezone}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground mt-1">
                  {lesson.student_timezone ? `Timezone: ${lesson.student_timezone}` : 'Timezone unavailable'}
                </div>
              )}
            </div>
          </div>

          {/* Service & Subject */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/10 border border-primary/20">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-primary block">
                Subject
              </span>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {lesson.service_name}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-primary block">
                Duration
              </span>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {lesson.duration_minutes} minutes
              </p>
            </div>
          </div>

          {/* Lesson Fee Context */}
          <div className="flex items-center justify-between text-xs py-2.5 px-3.5 rounded-xl bg-surface-subtle border border-border-subtle">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              Lesson Fee
            </span>
            <span className="font-semibold text-foreground">
              {lesson.is_free_trial 
                ? '$0 (Free Trial)' 
                : lesson.fee_amount_usd !== null && lesson.fee_amount_usd !== undefined 
                ? `$${lesson.fee_amount_usd} USD` 
                : 'Price not set'}
            </span>
          </div>

          {/* Zoom Section */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
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
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-2xs"
                  >
                    <Video className="w-4 h-4" />
                    Start Lesson as Host
                    <ExternalLink className="w-3.5 h-3.5 ms-1 opacity-70" />
                  </a>
                  <button 
                    onClick={() => copyToClipboard(joinUrl || hostUrl, 'join')}
                    className="px-3.5 py-2.5 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                    title="Copy Student Join Link"
                  >
                    {copiedLink === 'join' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 opacity-70" />}
                    <span className="text-xs hidden sm:inline">Copy Link</span>
                  </button>
                </div>
                {lesson.zoom_meeting_id && (
                  <p className="text-[11px] text-muted-foreground">
                    Meeting ID: <span className="font-mono text-foreground font-medium">{lesson.zoom_meeting_id}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
                <span>Dedicated Zoom meeting link is pending preparation.</span>
              </div>
            )}
          </div>

          {/* Contact Actions */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Student Communication
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {whatsappUrl ? (
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-success/10 text-success border border-success/30 rounded-xl text-xs font-medium hover:bg-success/20 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp ({lesson.contact_whatsapp})
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">No WhatsApp provided</span>
              )}

              {lesson.contact_email && (
                <a 
                  href={`mailto:${lesson.contact_email}?subject=${encodeURIComponent(`Ustadh Mahmoud — ${lesson.service_name} Lesson`)}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-xs font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 opacity-70" />
                  {lesson.contact_email}
                </a>
              )}
            </div>
          </div>

          {/* Calendar Sync Status */}
          <div className="flex items-center justify-between text-xs py-2 px-3.5 rounded-xl bg-surface-subtle border border-border-subtle">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <CalendarIcon className="w-3.5 h-3.5" />
              Google Calendar Sync
            </span>
            <span className={`font-medium ${lesson.google_calendar_event_id ? 'text-success' : 'text-warning'}`}>
              {lesson.google_calendar_event_id ? 'Synced with Calendar' : 'Sync Pending'}
            </span>
          </div>

          {/* Student Notes */}
          {lesson.notes && lesson.notes.trim().length > 0 && (
            <div className="space-y-1.5 p-3.5 rounded-xl bg-surface-subtle border border-border-subtle">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <FileText className="w-3.5 h-3.5" />
                <span>Student Learning Goal & Notes</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                {lesson.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {statusMessage && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                statusMessage.type === 'success' ? 'bg-success/15 text-success border border-success/30' : 'bg-destructive/15 text-destructive border border-destructive/30'
              }`}>
                {statusMessage.text}
              </span>
            )}

            {currentStatus !== 'completed' && currentStatus !== 'no_show' && currentStatus !== 'cancelled' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={updatingStatus || Boolean(startUtc > DateTime.now().plus({ minutes: 15 }))}
                  title={startUtc > DateTime.now().plus({ minutes: 15 }) ? 'Cannot mark completed before lesson start time' : 'Mark lesson completed'}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  {updatingStatus ? 'Updating...' : 'Mark Completed'}
                </button>
                <button
                  onClick={() => handleUpdateStatus('no_show')}
                  disabled={updatingStatus || Boolean(startUtc > DateTime.now().plus({ minutes: 15 }))}
                  title={startUtc > DateTime.now().plus({ minutes: 15 }) ? 'Cannot record no-show before lesson start time' : 'Record student no-show'}
                  className="px-3 py-1.5 bg-warning/10 hover:bg-warning/20 text-warning-foreground border border-warning/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserX className="w-3.5 h-3.5" />
                  No-Show
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors ms-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
