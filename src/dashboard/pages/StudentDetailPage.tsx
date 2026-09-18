import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  ChevronLeft,
  User,
  Users,
  Mail,
  Phone,
  Globe,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  Video,
  Lock,
  Edit3,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  FileText,
  Target,
  RefreshCw
} from 'lucide-react';
import { DashboardStudentDetail, StudentNote } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { StudentEditModal } from '../components/StudentEditModal';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [studentDetail, setStudentDetail] = useState<DashboardStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Notes Form State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteObservations, setNewNoteObservations] = useState('');
  const [newNoteNextSteps, setNewNoteNextSteps] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteFormError, setNoteFormError] = useState<string | null>(null);

  // Note Inline Editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteObservations, setEditNoteObservations] = useState('');
  const [editNoteNextSteps, setEditNoteNextSteps] = useState('');
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);

  const fetchStudent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardFetch(`/api/dashboard/students/${id}`);
      setStudentDetail(data);
    } catch (err: any) {
      setError(err.message || 'Could not load student record.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  // Handle Add Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNoteContent.trim()) return;

    setIsSubmittingNote(true);
    setNoteFormError(null);

    try {
      const res = await dashboardFetch(`/api/dashboard/students/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          content: newNoteContent.trim(),
          observations: newNoteObservations.trim() || undefined,
          next_steps: newNoteNextSteps.trim() || undefined
        })
      });

      if (res.note) {
        setStudentDetail(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notes: [res.note, ...(prev.notes || [])]
          };
        });
        setNewNoteContent('');
        setNewNoteObservations('');
        setNewNoteNextSteps('');
      }
    } catch (err: any) {
      setNoteFormError(err.message || 'Failed to save note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle Start Edit Note
  const handleStartEditNote = (note: StudentNote) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content || '');
    setEditNoteObservations(note.observations || '');
    setEditNoteNextSteps(note.next_steps || '');
  };

  // Handle Update Note
  const handleUpdateNote = async (noteId: string) => {
    if (!id || !editNoteContent.trim()) return;
    setIsUpdatingNote(true);

    try {
      const res = await dashboardFetch(`/api/dashboard/students/${id}/notes/${noteId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: editNoteContent.trim(),
          observations: editNoteObservations.trim() || undefined,
          next_steps: editNoteNextSteps.trim() || undefined
        })
      });

      if (res.note) {
        setStudentDetail(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notes: prev.notes.map(n => n.id === noteId ? res.note : n)
          };
        });
        setEditingNoteId(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update note.');
    } finally {
      setIsUpdatingNote(false);
    }
  };

  // Handle Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this private note?');
    if (!confirmDelete) return;

    try {
      await dashboardFetch(`/api/dashboard/students/${id}/notes/${noteId}`, {
        method: 'DELETE'
      });

      setStudentDetail(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notes: prev.notes.filter(n => n.id !== noteId)
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to delete note.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-surface rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-72 bg-surface rounded-2xl border border-border animate-pulse" />
          <div className="h-72 bg-surface rounded-2xl border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !studentDetail) {
    return (
      <div className="bg-surface rounded-2xl p-8 border border-destructive/30 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-lg font-serif font-bold text-foreground">
          Student Record Not Found
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {error || "The requested student record could not be located or you don't have authorization to view it."}
        </p>
        <Link
          to="/dashboard/students"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </Link>
      </div>
    );
  }

  const { student, guardian, goals, primary_service_name, total_completed_lessons, next_lesson, last_lesson, bookings, trial_context, lead_context, notes } = studentDetail;

  // Local Timezone calculation
  const localTime = student.timezone ? DateTime.now().setZone(student.timezone) : null;

  // WhatsApp helper
  const waUrl = student.whatsapp
    ? buildContextualWhatsAppUrl(
        student.whatsapp,
        `As-salamu alaykum ${student.name},\n\nThis is Ustadh Mahmoud. I am checking in regarding our upcoming Quran & Arabic studies.`
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/students"
            className="p-2 rounded-xl bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
            title="Back to Students Directory"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-serif font-bold text-foreground">
                {student.name}
              </h1>
              {/* Status Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                student.status === 'active'
                  ? 'bg-success/15 text-success border border-success/30'
                  : student.status === 'paused'
                  ? 'bg-warning/15 text-warning-foreground border border-warning/30'
                  : 'bg-surface-subtle text-muted-foreground border border-border-subtle'
              }`}>
                {student.status ? (student.status.charAt(0).toUpperCase() + student.status.slice(1)) : 'Active'}
              </span>

              {/* Learner Type Badge */}
              {student.learner_type === 'child' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/25">
                  <Users className="w-3 h-3" />
                  <span>Child {guardian?.parent_name ? `(Parent: ${guardian.parent_name})` : ''}</span>
                </span>
              ) : student.learner_type === 'adult' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  <User className="w-3 h-3" />
                  <span>Adult Learner</span>
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enrolled: {DateTime.fromISO(student.created_at).toFormat('MMMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-success text-white hover:bg-success/90 shadow-2xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          {student.email && (
            <a
              href={`mailto:${student.email}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-surface border border-border text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>Email</span>
            </a>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Identity, Next Lesson, History, Trial Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity & Learning Profile Card */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-2xs space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Learner Profile & Contacts</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Email */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-muted-foreground">Student Email</span>
                <p className="font-medium text-foreground break-all">
                  {student.email || <span className="opacity-50 italic">Not set</span>}
                </p>
              </div>

              {/* WhatsApp */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-muted-foreground">WhatsApp Phone</span>
                <p className="font-medium text-foreground">
                  {student.whatsapp || <span className="opacity-50 italic">Not set</span>}
                </p>
              </div>

              {/* Parent / Guardian Name & Contact */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-muted-foreground">Parent / Guardian</span>
                <p className="font-medium text-foreground">
                  {guardian?.parent_name || <span className="opacity-50 italic">Not specified</span>}
                </p>
                {(student.learner_type === 'child' || guardian?.parent_name) && (
                  <div className="pt-1 text-[11px] text-muted-foreground space-y-0.5 border-t border-border-subtle mt-1.5">
                    <div>
                      <span className="opacity-60">Email: </span>
                      {guardian?.parent_email ? (
                        <span className="font-mono text-foreground">{guardian.parent_email}</span>
                      ) : (
                        <span className="italic opacity-50">Not provided</span>
                      )}
                    </div>
                    {guardian?.parent_whatsapp && (
                      <div>
                        <span className="opacity-60">WhatsApp: </span>
                        <span className="font-mono text-foreground">{guardian.parent_whatsapp}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Country & Location */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-muted-foreground">Country</span>
                <p className="font-medium text-foreground">
                  {student.country || <span className="opacity-50 italic">Not set</span>}
                </p>
              </div>

              {/* Timezone & Current Time */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Timezone</span>
                  {localTime && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium border border-success/30">
                      Student Local: {localTime.toFormat('hh:mm a')}
                    </span>
                  )}
                </div>
                <p className="font-medium text-foreground">
                  {student.timezone ? (
                    <span>{student.timezone}</span>
                  ) : (
                    <span className="opacity-50 italic">Not set</span>
                  )}
                </p>
              </div>
            </div>

            {/* Academic Focus & Level */}
            <div className="pt-3 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-muted-foreground">Assessed Level</span>
                <p className="font-medium text-foreground capitalize">
                  {student.current_level ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25">
                      {student.current_level}
                    </span>
                  ) : (
                    <span className="opacity-60 italic">Not assessed yet</span>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-muted-foreground">Primary Subject / Service</span>
                <p className="font-medium text-foreground">
                  {primary_service_name || <span className="opacity-60 italic">Not set</span>}
                </p>
              </div>
            </div>

            {/* Profile General Notes */}
            {student.notes && (
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle text-xs">
                <span className="text-muted-foreground block mb-1 font-medium">
                  General Profile Notes
                </span>
                <p className="text-foreground whitespace-pre-line">
                  {student.notes}
                </p>
              </div>
            )}
          </div>

          {/* Next Lesson Card (if any scheduled) */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Next Scheduled Lesson</span>
              </h2>
              {next_lesson && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  Upcoming
                </span>
              )}
            </div>

            {next_lesson ? (
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {next_lesson.service_name || '1-on-1 Teaching Session'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Duration: {next_lesson.duration_minutes} minutes
                    </p>
                  </div>
                  <div className="text-right sm:text-right">
                    <p className="text-xs font-semibold text-primary">
                      {student.timezone 
                        ? DateTime.fromISO(next_lesson.scheduled_start).setZone(student.timezone).toFormat('EEE, MMM d, yyyy • hh:mm a')
                        : DateTime.fromISO(next_lesson.scheduled_start).toFormat('EEE, MMM d, yyyy • hh:mm a')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Cairo: {DateTime.fromISO(next_lesson.scheduled_start).setZone('Africa/Cairo').toFormat('hh:mm a')}
                    </p>
                  </div>
                </div>

                {next_lesson.zoom_join_url && (
                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-primary" />
                      <span>Zoom classroom is active</span>
                    </span>
                    <a
                      href={next_lesson.zoom_join_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <span>Join Zoom</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-surface-subtle border border-dashed border-border text-center">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-muted-foreground">
                  No upcoming lesson scheduled
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  Bookings scheduled for this student will appear here automatically.
                </p>
              </div>
            )}
          </div>

          {/* Trial & Assessment Context (if available) */}
          {trial_context && (
            <div className="bg-surface rounded-2xl p-6 border border-primary/20 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Free Trial Assessment & Recommendation
                  </h2>
                </div>
                {trial_context.reference_code && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-subtle border border-border-subtle text-muted-foreground">
                    Ref: {trial_context.reference_code}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle">
                  <span className="text-muted-foreground block text-[11px]">Assessed Level</span>
                  <p className="font-semibold text-foreground mt-0.5 capitalize">
                    {trial_context.assessed_level || <span className="opacity-50 font-normal">Not recorded</span>}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle">
                  <span className="text-muted-foreground block text-[11px]">Recommended Service</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {trial_context.recommended_service_name || <span className="opacity-50 font-normal">Not recorded</span>}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle">
                  <span className="text-muted-foreground block text-[11px]">Duration & Frequency</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {trial_context.recommended_duration ? `${trial_context.recommended_duration} min` : ''}{' '}
                    {trial_context.recommended_frequency ? `• ${trial_context.recommended_frequency}` : ''}
                    {!trial_context.recommended_duration && !trial_context.recommended_frequency && (
                      <span className="opacity-50 font-normal">Standard 30-45 min</span>
                    )}
                  </p>
                </div>
              </div>

              {trial_context.learning_plan_summary && (
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle text-xs">
                  <span className="text-muted-foreground block mb-1 font-medium">
                    Personalized Learning Plan Summary:
                  </span>
                  <p className="text-foreground whitespace-pre-line">
                    {trial_context.learning_plan_summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bookings & Lessons History Table */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Lesson History & Attendance</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Factual records of completed, pending, and scheduled lessons.
                </p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-medium">
                {total_completed_lessons} Completed
              </span>
            </div>

            {bookings && bookings.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                {bookings.map(b => (
                  <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {b.service_name || 'Teaching Lesson'}
                        </span>
                        {b.booking_type === 'trial' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-medium">
                            Free Trial
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          b.status === 'completed'
                            ? 'bg-success/15 text-success border border-success/30'
                            : b.status === 'cancelled'
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : b.status === 'rescheduled'
                            ? 'bg-warning/15 text-warning-foreground border border-warning/30'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : 'Scheduled'}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {DateTime.fromISO(b.scheduled_start).toFormat('EEE, MMM d, yyyy • hh:mm a')} ({b.duration_minutes} min)
                        {b.reference_code && ` • Ref: ${b.reference_code}`}
                      </p>
                      {b.cancellation_reason && (
                        <p className="text-destructive text-[11px] mt-0.5">
                          Reason: {b.cancellation_reason}
                        </p>
                      )}
                    </div>

                    {b.zoom_join_url && b.status !== 'cancelled' && (
                      <a
                        href={b.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start sm:self-auto inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
                      >
                        <span>Zoom Meeting</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-surface-subtle border border-dashed border-border text-center">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-muted-foreground">
                  No lesson records found for this student
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Private Notes (Mahmoud Only) */}
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-2xs space-y-5">
            {/* Notes Section Header */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-warning" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Teacher Private Notes
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-warning/15 text-warning-foreground border border-warning/25 font-medium">
                  Mahmoud Only
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Strictly confidential private observations, progress tracking, and lesson notes. Never visible to students.
              </p>
            </div>

            {/* Note Creation Box */}
            <form onSubmit={handleCreateNote} className="space-y-3 p-4 rounded-xl bg-surface-subtle border border-border-subtle">
              {noteFormError && (
                <div className="p-2 rounded-lg bg-destructive/15 text-xs text-destructive border border-destructive/30">
                  {noteFormError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  New Private Observation / Note <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  required
                  placeholder="Record lesson observations, Tajweed mastery, pronunciation notes..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={newNoteObservations}
                  onChange={e => setNewNoteObservations(e.target.value)}
                  placeholder="Specific observations (e.g. Needs practice on Noon Sakinah)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={newNoteNextSteps}
                  onChange={e => setNewNoteNextSteps(e.target.value)}
                  placeholder="Next steps / homework assigned"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteContent.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmittingNote ? 'Saving...' : 'Save Private Note'}</span>
                </button>
              </div>
            </form>

            {/* List of Existing Notes */}
            <div className="space-y-3">
              {notes && notes.length > 0 ? (
                notes.map(note => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl bg-surface border border-border-subtle shadow-2xs space-y-2 text-xs"
                  >
                    {editingNoteId === note.id ? (
                      /* Inline Edit Mode */
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={editNoteContent}
                          onChange={e => setEditNoteContent(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground"
                        />
                        <input
                          type="text"
                          value={editNoteObservations}
                          onChange={e => setEditNoteObservations(e.target.value)}
                          placeholder="Observations"
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-surface text-foreground"
                        />
                        <input
                          type="text"
                          value={editNoteNextSteps}
                          onChange={e => setEditNoteNextSteps(e.target.value)}
                          placeholder="Next steps"
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-surface text-foreground"
                        />
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-2.5 py-1 text-[11px] rounded-lg text-muted-foreground hover:bg-surface-subtle cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={isUpdatingNote || !editNoteContent.trim()}
                            className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                          >
                            {isUpdatingNote ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{DateTime.fromISO(note.created_at).toFormat('MMM d, yyyy • hh:mm a')}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEditNote(note)}
                              className="p-1 hover:text-primary transition-colors cursor-pointer"
                              title="Edit note"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 hover:text-destructive transition-colors cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-foreground whitespace-pre-line leading-relaxed">
                          {note.content}
                        </p>

                        {note.observations && (
                          <p className="text-[11px] text-muted-foreground bg-surface-subtle p-2 rounded-lg border border-border-subtle">
                            <strong className="font-semibold text-primary">Observations:</strong> {note.observations}
                          </p>
                        )}

                        {note.next_steps && (
                          <p className="text-[11px] text-muted-foreground bg-surface-subtle p-2 rounded-lg border border-border-subtle">
                            <strong className="font-semibold text-warning-foreground">Next Steps:</strong> {note.next_steps}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-xl bg-surface-subtle border border-dashed border-border text-center">
                  <FileText className="w-7 h-7 text-muted-foreground mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs font-medium text-muted-foreground">
                    No private notes recorded yet
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    Use the box above to record confidential observations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Student Profile Modal */}
      <StudentEditModal
        studentDetail={studentDetail}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={updated => setStudentDetail(updated)}
      />
    </div>
  );
}
