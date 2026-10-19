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
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Award
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { DashboardStudentDetail, StudentNote } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { StudentEditModal } from '../components/StudentEditModal';
import { PostLessonSummaryEditor } from '../components/PostLessonSummaryEditor';
import { useT } from '../../lib/language';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teacherRole } = useTeacherAuth();
  const isSuperAdmin = teacherRole === 'super_admin';
  const { t, isAr } = useT();
  const locale = isAr ? 'ar' : 'en';

  const [studentDetail, setStudentDetail] = useState<DashboardStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment State for Super Admin
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [isAssigningTeacher, setIsAssigningTeacher] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);
  const [assignErrorMessage, setAssignErrorMessage] = useState<string | null>(null);

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
  const [editNoteFamilySummary, setEditNoteFamilySummary] = useState('');
  const [editNoteObservations, setEditNoteObservations] = useState('');
  const [editNoteNextSteps, setEditNoteNextSteps] = useState('');
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);

  // AI Brief State
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const handleGenerateAiBrief = async () => {
    if (!id) return;
    setIsGeneratingBrief(true);
    setBriefError(null);
    setAiBrief(null);
    try {
      const res = await dashboardFetch(`/api/dashboard/students/${id}/ai-brief`, {
        method: 'POST'
      });
      setAiBrief(res.brief);
    } catch (err: any) {
      setBriefError(err.message || t("Couldn't prepare the brief.", 'تعذر تجهيز الملخص.'));
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const fetchStudent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardFetch(`/api/dashboard/students/${id}`);
      setStudentDetail(data);
      setSelectedTeacherId(data.student.assigned_teacher_id || '');
    } catch (err: any) {
      setError(err.message || t("Couldn't load this student.", 'تعذر تحميل بيانات الطالب.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
    if (isSuperAdmin) {
      dashboardFetch('/api/dashboard/admin/teachers')
        .then((data) => {
          if (data && Array.isArray(data.teachers)) {
            setAvailableTeachers(data.teachers.filter((tc: any) => tc.is_active));
          }
        })
        .catch(() => {});
    }
  }, [fetchStudent, isSuperAdmin]);

  // Handle Teacher Assignment (Super Admin Only)
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsAssigningTeacher(true);
    setAssignSuccessMessage(null);
    setAssignErrorMessage(null);

    try {
      const res = await dashboardFetch(`/api/dashboard/admin/students/${id}/assign-teacher`, {
        method: 'PATCH',
        body: JSON.stringify({
          teacher_id: selectedTeacherId || null
        })
      });

      setAssignSuccessMessage(isAr ? 'المعلم اتغيّر. الحجوزات الجديدة هتروح للمعلم الجديد، والحصص المحجوزة قبل كده بتفضل مع المعلم القديم لحد ما تغيّرها.' : (res.message || 'Teacher updated.'));
      setStudentDetail(prev => {
        if (!prev) return null;
        return {
          ...prev,
          student: {
            ...prev.student,
            assigned_teacher_id: res.assigned_teacher_id ?? null,
            assigned_teacher_name: res.assigned_teacher ? res.assigned_teacher.name : null
          }
        };
      });
    } catch (err: any) {
      setAssignErrorMessage(err.message || t("Couldn't change the teacher.", 'تعذر تغيير المعلم.'));
    } finally {
      setIsAssigningTeacher(false);
    }
  };

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
      setNoteFormError(err.message || t("Couldn't save the note.", 'تعذر حفظ الملاحظة.'));
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle Start Edit Note
  const handleStartEditNote = (note: StudentNote) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content || '');
    setEditNoteFamilySummary(note.family_summary || '');
    setEditNoteObservations(note.observations || '');
    setEditNoteNextSteps(note.next_steps || '');
  };

  // Handle Update Note
  const handleUpdateNote = async (noteId: string) => {
    if (!id || (!editNoteContent.trim() && !editNoteFamilySummary.trim())) return;
    setIsUpdatingNote(true);

    try {
      const res = await dashboardFetch(`/api/dashboard/students/${id}/notes/${noteId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: editNoteContent.trim() || undefined,
          family_summary: editNoteFamilySummary.trim() || null,
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
      alert(err.message || t("Couldn't update the note.", 'تعذر تعديل الملاحظة.'));
    } finally {
      setIsUpdatingNote(false);
    }
  };

  // Handle Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;
    const confirmDelete = window.confirm(t('Delete this private note?', 'تمسح الملاحظة دي؟'));
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
      alert(err.message || t("Couldn't delete the note.", 'تعذر مسح الملاحظة.'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 glass-card rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-72 glass-card rounded-2xl border border-border animate-pulse" />
          <div className="h-72 glass-card rounded-2xl border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !studentDetail) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-destructive/30 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-lg font-display font-bold text-foreground">
          {t('Student not found', 'الطالب مش موجود')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {error || t("This student doesn't exist or isn't assigned to you.", 'الطالب ده مش موجود أو مش معاك.')}
        </p>
        <Link
          to="/dashboard/students"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('Back to students', 'رجوع للطلاب')}</span>
        </Link>
      </div>
    );
  }

  const { student, guardian, goals, primary_service_name, total_completed_lessons, next_lesson, last_lesson, bookings, trial_context, lead_context, notes } = studentDetail;

  // Local Timezone calculation
  const localTime = student.timezone ? DateTime.now().setZone(student.timezone).setLocale(locale) : null;

  // WhatsApp helper
  const waUrl = student.whatsapp
    ? buildContextualWhatsAppUrl(
        student.whatsapp,
        `As-salamu alaykum ${student.name},`
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/students"
            className="p-2 rounded-xl glass-card border-none text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
            title={t('Back to students', 'رجوع للطلاب')}
            aria-label={t('Back to students', 'رجوع للطلاب')}
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-display font-bold text-foreground">
                {student.name}
              </h1>
              {/* Status Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                student.status === 'active'
                  ? 'bg-success/15 text-success border border-success/30'
                  : student.status === 'paused'
                  ? 'bg-warning/15 text-warning-foreground border border-warning/30'
                  : 'glass-surface text-muted-foreground border border-border-subtle'
              }`}>
                {({ active: t('Active', 'نشط'), paused: t('Paused', 'متوقف مؤقتاً'), inactive: t('Inactive', 'غير نشط') } as Record<string, string>)[student.status || 'active'] || student.status}
              </span>

              {/* Learner Type Badge */}
              {student.learner_type === 'child' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-accent/15 text-accent border border-accent/25">
                  <Users className="w-3 h-3" />
                  <span>{t('Child', 'طفل')} {guardian?.parent_name ? `(${t('Parent', 'ولي الأمر')}: ${guardian.parent_name})` : ''}</span>
                </span>
              ) : student.learner_type === 'adult' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-secondary/30 text-primary border border-secondary/50">
                  <User className="w-3 h-3" />
                  <span>{t('Adult', 'بالغ')}</span>
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('Joined', 'انضم')}: {DateTime.fromISO(student.created_at).setLocale(locale).toFormat('MMMM d, yyyy')}
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-success text-white hover:bg-success/90 shadow-2xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t('WhatsApp', 'واتساب')}</span>
            </a>
          )}

          {student.email && (
            <a
              href={`mailto:${student.email}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl glass-card border-none text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-accent" />
              <span>{t('Email', 'إيميل')}</span>
            </a>
          )}

          <button
            onClick={handleGenerateAiBrief}
            disabled={isGeneratingBrief}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingBrief ? t('Preparing…', 'جارٍ التحضير…') : t('AI brief', 'ملخص بالذكاء الاصطناعي')}</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('Edit profile', 'عدّل البيانات')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Identity, Next Lesson, History, Trial Context */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI Brief Section */}
          {(aiBrief || briefError) && (
            <div className="glass-card rounded-2xl p-6 border border-accent/30 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    {t('AI lesson prep', 'تحضير الحصة بالذكاء الاصطناعي')}
                  </h2>
                </div>
                <button
                  onClick={() => { setAiBrief(null); setBriefError(null); }}
                  className="text-xl leading-none text-muted-foreground hover:text-foreground p-1 transition-colors"
                  title={t('Dismiss', 'إخفاء')}
                  aria-label={t('Dismiss', 'إخفاء')}
                >
                  &times;
                </button>
              </div>
              {briefError ? (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {briefError}
                </div>
              ) : (
                <div
                  className="p-5 rounded-xl glass-surface border border-border-subtle text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                  dir="auto"
                >
                  {aiBrief}
                </div>
              )}
            </div>
          )}

          {/* Identity & Learning Profile Card */}
          <div className="glass-card rounded-2xl p-6 border border-border shadow-2xs space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              <span>{t('Profile & contact', 'البيانات والتواصل')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Email */}
              <div className="p-3 rounded-xl glass-surface border border-border-subtle space-y-1">
                <span className="text-muted-foreground">{t("Student's email", 'إيميل الطالب')}</span>
                <p className="font-medium text-foreground break-all" dir="ltr">
                  {student.email || <span className="opacity-50 italic">{t('Not set', 'مش محدد')}</span>}
                </p>
              </div>

              {/* WhatsApp */}
              <div className="p-3 rounded-xl glass-surface border border-border-subtle space-y-1">
                <span className="text-muted-foreground">{t('WhatsApp', 'واتساب')}</span>
                <p className="font-medium text-foreground" dir="ltr">
                  {student.whatsapp || <span className="opacity-50 italic">{t('Not set', 'مش محدد')}</span>}
                </p>
              </div>

              {/* Parent / Guardian Name & Contact */}
              <div className="p-3 rounded-xl glass-surface border border-border-subtle space-y-1">
                <span className="text-muted-foreground">{t('Parent / guardian', 'ولي الأمر')}</span>
                <p className="font-medium text-foreground">
                  {guardian?.parent_name || <span className="opacity-50 italic">{t('Not set', 'مش محدد')}</span>}
                </p>
                {(student.learner_type === 'child' || guardian?.parent_name) && (
                  <div className="pt-1 text-[11px] text-muted-foreground space-y-0.5 border-t border-border-subtle mt-1.5">
                    <div>
                      <span className="opacity-60">{t('Email', 'الإيميل')}: </span>
                      {guardian?.parent_email ? (
                        <span className="font-mono text-foreground">{guardian.parent_email}</span>
                      ) : (
                        <span className="italic opacity-50">{t('Not set', 'مش محدد')}</span>
                      )}
                    </div>
                    {guardian?.parent_whatsapp && (
                      <div>
                        <span className="opacity-60">{t('WhatsApp', 'واتساب')}: </span>
                        <span className="font-mono text-foreground">{guardian.parent_whatsapp}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Country & Location */}
              <div className="p-3 rounded-xl glass-surface border border-border-subtle space-y-1">
                <span className="text-muted-foreground">{t('Country', 'الدولة')}</span>
                <p className="font-medium text-foreground">
                  {student.country || <span className="opacity-50 italic">{t('Not set', 'مش محدد')}</span>}
                </p>
              </div>

              {/* Timezone & Current Time */}
              <div className="p-3 rounded-xl glass-surface border border-border-subtle space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('Time zone', 'المنطقة الزمنية')}</span>
                  {localTime && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium border border-success/30">
                      {t("Student's time now", 'الساعة عند الطالب')}: {localTime.toFormat('hh:mm a')}
                    </span>
                  )}
                </div>
                <p className="font-medium text-foreground">
                  {student.timezone ? (
                    <span dir="ltr">{student.timezone}</span>
                  ) : (
                    <span className="opacity-50 italic">{t('Not set', 'مش محدد')}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Academic Focus & Level */}
            <div className="pt-3 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl glass-surface border border-border-subtle space-y-1">
                <span className="text-muted-foreground">{t('Level', 'المستوى')}</span>
                <p className="font-medium text-foreground capitalize">
                  {student.current_level ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25">
                      {student.current_level}
                    </span>
                  ) : (
                    <span className="opacity-60 italic">{t('Not assessed yet', 'لسه ما اتحددش')}</span>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl glass-surface border border-border-subtle space-y-1">
                <span className="text-muted-foreground">{t('Main subject', 'المادة الأساسية')}</span>
                <p className="font-medium text-foreground">
                  {primary_service_name || <span className="opacity-60 italic">{t('Not set', 'مش محدد')}</span>}
                </p>
              </div>
            </div>

            {/* Profile General Notes */}
            {student.notes && (
              <div className="p-3.5 rounded-xl glass-surface border border-border-subtle text-sm">
                <span className="text-muted-foreground block mb-1 font-medium">
                  {t('General notes', 'ملاحظات عامة')}
                </span>
                <p className="text-foreground whitespace-pre-line">
                  {student.notes}
                </p>
              </div>
            )}
          </div>

          {/* Next Lesson Card (if any scheduled) */}
          <div className="glass-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <span>{t('Next lesson', 'الحصة الجاية')}</span>
              </h2>
              {next_lesson && (
                <span className="text-sm px-2.5 py-0.5 rounded-full bg-secondary/30 text-primary border border-secondary/50 font-medium">
                  {t('Upcoming', 'جاية')}
                </span>
              )}
            </div>

            {next_lesson ? (
              <div className="p-4 rounded-xl glass-surface border border-border-subtle space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {next_lesson.service_name || t('Private lesson', 'حصة فردية')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('Length', 'المدة')}: {next_lesson.duration_minutes} {t('minutes', 'دقيقة')}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold text-primary">
                      {student.timezone
                        ? DateTime.fromISO(next_lesson.scheduled_start).setZone(student.timezone).setLocale(locale).toFormat('EEE, MMM d, yyyy • hh:mm a')
                        : DateTime.fromISO(next_lesson.scheduled_start).setLocale(locale).toFormat('EEE, MMM d, yyyy • hh:mm a')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t('Cairo', 'القاهرة')}: {DateTime.fromISO(next_lesson.scheduled_start).setZone('Africa/Cairo').setLocale(locale).toFormat('hh:mm a')}
                    </p>
                  </div>
                </div>

                {next_lesson.zoom_join_url && (
                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-accent" />
                      <span>{t('Zoom room is ready', 'غرفة Zoom جاهزة')}</span>
                    </span>
                    <a
                      href={next_lesson.zoom_join_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <span>{t('Open Zoom', 'افتح Zoom')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl glass-surface border border-dashed border-border text-center">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t('No upcoming lesson', 'مفيش حصة جاية')}
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {t('New bookings for this student show up here.', 'الحجوزات الجديدة للطالب هتظهر هنا.')}
                </p>
              </div>
            )}
          </div>

          {/* Trial & Assessment Context (if available) */}
          {trial_context && (
            <div className="glass-card rounded-2xl p-6 border border-secondary/50 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    {t('Free trial assessment', 'تقييم الحصة التجريبية')}
                  </h2>
                </div>
                {trial_context.reference_code && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md glass-surface border border-border-subtle text-muted-foreground">
                    {t('Ref', 'رقم')}: {trial_context.reference_code}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-xl glass-surface border border-border-subtle">
                  <span className="text-muted-foreground block text-[11px]">{t('Level', 'المستوى')}</span>
                  <p className="font-semibold text-foreground mt-0.5 capitalize">
                    {trial_context.assessed_level || <span className="opacity-50 font-normal">{t('Not recorded', 'مش متسجل')}</span>}
                  </p>
                </div>

                <div className="p-3 rounded-xl glass-surface border border-border-subtle">
                  <span className="text-muted-foreground block text-[11px]">{t('Suggested subject', 'المادة المقترحة')}</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {trial_context.recommended_service_name || <span className="opacity-50 font-normal">{t('Not recorded', 'مش متسجل')}</span>}
                  </p>
                </div>

                <div className="p-3 rounded-xl glass-surface border border-border-subtle">
                  <span className="text-muted-foreground block text-[11px]">{t('Length & frequency', 'المدة وعدد المرات')}</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {trial_context.recommended_duration ? `${trial_context.recommended_duration} min` : ''}{' '}
                    {trial_context.recommended_frequency ? `• ${trial_context.recommended_frequency}` : ''}
                    {!trial_context.recommended_duration && !trial_context.recommended_frequency && (
                      <span className="opacity-50 font-normal">{t('Not recorded', 'مش متسجل')}</span>
                    )}
                  </p>
                </div>
              </div>

              {trial_context.learning_plan_summary && (
                <div className="p-3.5 rounded-xl glass-surface border border-border-subtle text-sm">
                  <span className="text-muted-foreground block mb-1 font-medium">
                    {t('Learning plan', 'خطة التعلم')}:
                  </span>
                  <p className="text-foreground whitespace-pre-line">
                    {trial_context.learning_plan_summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bookings & Lessons History Table */}
          <div className="glass-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <span>{t('Lesson history', 'سجل الحصص')}</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('Done, upcoming and cancelled lessons.', 'الحصص اللي تمت والجاية والملغاة.')}
                </p>
              </div>
              <span className="text-sm px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-medium">
                {t(`${total_completed_lessons} done`, `${total_completed_lessons} تمت`)}
              </span>
            </div>

            {bookings && bookings.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                {bookings.map(b => (
                  <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {b.service_name || t('Lesson', 'حصة')}
                        </span>
                        {b.booking_type === 'trial' && (
                          <span className="text-[13px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-medium">
                            {t('Free trial', 'تجربة مجانية')}
                          </span>
                        )}
                        <span className={`text-[13px] px-2 py-0.5 rounded-full font-medium ${
                          b.status === 'completed'
                            ? 'bg-success/15 text-success border border-success/30'
                            : b.status === 'cancelled'
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : b.status === 'rescheduled'
                            ? 'bg-warning/15 text-warning-foreground border border-warning/30'
                            : 'bg-secondary/30 text-primary border border-secondary/50'
                        }`}>
                          {({ completed: t('Done', 'تمت'), cancelled: t('Cancelled', 'ملغاة'), rescheduled: t('Moved', 'اتغيّر ميعادها'), confirmed: t('Confirmed', 'مؤكدة'), pending: t('Waiting', 'في الانتظار'), no_show: t('No-show', 'غياب') } as Record<string, string>)[b.status || ''] || t('Booked', 'محجوزة')}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {DateTime.fromISO(b.scheduled_start).setLocale(locale).toFormat('EEE, MMM d, yyyy • hh:mm a')} ({b.duration_minutes} {t('min', 'دقيقة')})
                        {b.reference_code && ` • ${b.reference_code}`}
                      </p>
                      {b.cancellation_reason && (
                        <p className="text-destructive text-[11px] mt-0.5">
                          {t('Reason', 'السبب')}: {b.cancellation_reason}
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
                        <span>{t('Zoom', 'Zoom')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl glass-surface border border-dashed border-border text-center">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t('No lessons yet', 'لسه مفيش حصص')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Faculty Assignment & Private Notes */}
        <div className="space-y-6">
          {/* Faculty Assignment & Preferences Card */}
          <div className="glass-card rounded-2xl p-6 border border-border shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  {t('Teacher', 'المعلم')}
                </h2>
              </div>
              {isSuperAdmin && (
                <span className="text-[13px] px-2 py-0.5 rounded bg-secondary/30 text-accent border border-primary/25 font-bold uppercase tracking-wider">
                  {t('Admin', 'المدير')}
                </span>
              )}
            </div>

            {/* Current Assignment Status */}
            <div className="p-3.5 rounded-xl glass-surface border border-border-subtle space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('Teacher', 'المعلم')}:</span>
                <span className={`font-semibold ${student.assigned_teacher_name ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`}>
                  {student.assigned_teacher_name || t('No teacher yet', 'لسه من غير معلم')}
                </span>
              </div>

              {/* Student Gender */}
              <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle">
                <span className="text-muted-foreground">{t("Student's gender", 'نوع الطالب')}:</span>
                <span className="capitalize font-medium text-foreground">
                  {student.gender === 'male' ? t('Male', 'ذكر') : student.gender === 'female' ? t('Female', 'أنثى') : t('Not said', 'مش محدد')}
                </span>
              </div>

              {/* Teacher Gender Preference */}
              <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle">
                <span className="text-muted-foreground">{t('Prefers', 'بيفضّل')}:</span>
                <span className="capitalize font-medium text-foreground">
                  {student.teacher_gender_preference === 'female_teacher'
                    ? t('A female teacher', 'معلمة')
                    : student.teacher_gender_preference === 'male_teacher'
                    ? t('A male teacher', 'معلم')
                    : t('No preference', 'مفيش تفضيل')}
                </span>
              </div>
            </div>

            {/* Super Admin Assignment Action Form */}
            {isSuperAdmin && (
              <form onSubmit={handleAssignTeacher} className="space-y-3 pt-2">
                <label className="block text-sm font-semibold text-foreground" htmlFor="sdp-teacher">
                  {t('Move to another teacher', 'انقله لمعلم تاني')}:
                </label>
                <select
                  id="sdp-teacher"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('— No teacher —', '— من غير معلم —')}</option>
                  {availableTeachers.map((tc) => (
                    <option key={tc.id || tc.email} value={tc.id || tc.email}>
                      {tc.display_name} ({tc.role === 'super_admin' ? t('Admin', 'مدير') : t('Teacher', 'معلم')})
                    </option>
                  ))}
                </select>

                {assignSuccessMessage && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{assignSuccessMessage}</span>
                  </p>
                )}

                {assignErrorMessage && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{assignErrorMessage}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isAssigningTeacher}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAssigningTeacher ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{isAssigningTeacher ? t('Saving…', 'جارٍ الحفظ…') : t('Save', 'احفظ')}</span>
                </button>
              </form>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6 border border-border shadow-2xs space-y-5">
            {/* Post-lesson Summary, Achievements, Milestones & Private Notes Editor (PR-06) */}
            <PostLessonSummaryEditor
              studentId={student.id}
              studentName={student.name}
              bookingId={last_lesson?.id || next_lesson?.id || null}
              subjectHint={primary_service_name || studentDetail.primary_service_id || student.notes}
              onSaved={({ note, milestone }) => {
                setStudentDetail((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    notes: note ? [note, ...(prev.notes || [])] : prev.notes,
                    milestones: milestone
                      ? [milestone, ...(prev.milestones || [])]
                      : prev.milestones,
                  };
                });
              }}
            />

            {/* Recorded Milestones List */}
            {studentDetail.milestones && studentDetail.milestones.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-border-subtle" data-testid="student-milestones-list">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#E5A93C]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {t('Recorded milestones', 'الأوسمة المسجلة للطالب')}
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {studentDetail.milestones.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {studentDetail.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      className="p-3 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {isAr ? ms.title_ar : ms.title_en}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {isAr ? ms.title_en : ms.title_ar}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {DateTime.fromISO(ms.reached_at).setLocale(locale).toFormat('MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section Header */}
            <div className="pt-2 border-t border-border-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-warning" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    {t('Notes & family summaries history', 'سجل الملاحظات وملخصات الأسرة')}
                  </h2>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-warning/15 text-warning-foreground border border-warning/25 font-medium">
                  {t('Private notes: only you and the admin', 'الملاحظات الخاصة: لك وللمدير فقط')}
                </span>
              </div>
            </div>

            {/* List of Existing Notes */}
            <div className="space-y-3">
              {notes && notes.length > 0 ? (
                notes.map(note => {
                  const achList = Array.isArray(note.achievements) ? note.achievements : [];
                  return (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl glass-card border-none-subtle shadow-2xs space-y-2.5 text-sm"
                    >
                      {editingNoteId === note.id ? (
                        /* Inline Edit Mode */
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                              {t('For the family (shared)', 'ملخص للأسرة (مشترك)')}
                            </label>
                            <textarea
                              rows={2}
                              value={editNoteFamilySummary}
                              onChange={e => setEditNoteFamilySummary(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border glass-card text-foreground"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                              {t('Private notes (only you and the admin)', 'ملاحظات خاصة (لك وللمدير فقط)')}
                            </label>
                            <textarea
                              rows={2}
                              value={editNoteContent}
                              onChange={e => setEditNoteContent(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border glass-card text-foreground"
                            />
                          </div>
                          <input
                            type="text"
                            value={editNoteObservations}
                            onChange={e => setEditNoteObservations(e.target.value)}
                            placeholder={t('Details', 'تفاصيل')}
                            className="w-full px-2.5 py-1 text-sm rounded-lg border border-border glass-card text-foreground"
                          />
                          <input
                            type="text"
                            value={editNoteNextSteps}
                            onChange={e => setEditNoteNextSteps(e.target.value)}
                            placeholder={t('Next steps', 'الخطوة الجاية')}
                            className="w-full px-2.5 py-1 text-sm rounded-lg border border-border glass-card text-foreground"
                          />
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 text-[11px] rounded-lg text-muted-foreground hover:bg-surface-subtle cursor-pointer"
                            >
                              {t('Cancel', 'إلغاء')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={isUpdatingNote || (!editNoteContent.trim() && !editNoteFamilySummary.trim())}
                              className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                            >
                              {isUpdatingNote ? t('Saving…', 'جارٍ الحفظ…') : t('Save', 'احفظ')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{DateTime.fromISO(note.created_at).setLocale(locale).toFormat('MMM d, yyyy • hh:mm a')}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStartEditNote(note)}
                                className="p-1 hover:text-primary transition-colors cursor-pointer"
                                title={t('Edit note', 'عدّل الملاحظة')}
                                aria-label={t('Edit note', 'عدّل الملاحظة')}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 hover:text-destructive transition-colors cursor-pointer"
                                title={t('Delete note', 'امسح الملاحظة')}
                                aria-label={t('Delete note', 'امسح الملاحظة')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {note.family_summary && (
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                                {t('For the family', 'ملخص للأسرة')}
                              </span>
                              <p className="text-foreground whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                                {note.family_summary}
                              </p>
                            </div>
                          )}

                          {achList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {achList.map((item: any, idx: number) => {
                                const text =
                                  typeof item === 'string'
                                    ? item
                                    : isAr
                                      ? item?.ar || item?.label || item?.title || item?.en
                                      : item?.en || item?.label || item?.title || item?.ar;
                                if (!text) return null;
                                return (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/40 text-primary border border-secondary/60"
                                  >
                                    ✓ {text}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {note.content && (
                            <div className="p-2.5 rounded-lg glass-surface border border-border-subtle space-y-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-warning-foreground flex items-center gap-1">
                                <Lock className="w-3 h-3 text-warning" />
                                {t('Only you and the admin', 'لك وللمدير فقط')}
                              </span>
                              <p className="text-foreground whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                                {note.content}
                              </p>
                            </div>
                          )}

                          {note.observations && (
                            <p className="text-[11px] text-muted-foreground glass-surface p-2 rounded-lg border border-border-subtle">
                              <strong className="font-semibold text-primary">{t('Details', 'تفاصيل')}:</strong> {note.observations}
                            </p>
                          )}

                          {note.next_steps && (
                            <p className="text-[11px] text-muted-foreground glass-surface p-2 rounded-lg border border-border-subtle">
                              <strong className="font-semibold text-warning-foreground">{t('Next steps', 'الخطوة الجاية')}:</strong> {note.next_steps}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-xl glass-surface border border-dashed border-border text-center">
                  <FileText className="w-7 h-7 text-muted-foreground mx-auto mb-1.5 opacity-50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('No notes yet', 'لسه مفيش ملاحظات')}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    {t('Write your first note in the box above.', 'اكتب أول ملاحظة في الخانة اللي فوق.')}
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
