import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  Users,
  User,
  Search,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  AlertCircle,
  MessageCircle,
  ChevronRight,
  BookOpen,
  Filter,
  RefreshCw,
  Sparkles,
  Lock,
  FileText
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { DashboardStudentListItem } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { EmptyState } from '../../components/EmptyState';
import { useT } from '../../lib/language';

export default function StudentsPage() {
  const { teacherRole } = useTeacherAuth();
  const { t, isAr } = useT();
  const locale = isAr ? 'ar' : 'en';
  const isSuperAdmin = teacherRole === 'super_admin';
  const [students, setStudents] = useState<DashboardStudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'inactive' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'completed' | 'next'>('recent');

  const fetchStudents = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardFetch('/api/dashboard/students');
      setStudents(data.students || []);
    } catch (err: any) {
      setError(err.message || t("Students couldn't be loaded.", 'تعذر تحميل الطلاب.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter & Sort
  const displayedStudents = useMemo(() => {
    let list = [...students];

    // Status / Assignment filter
    if (statusFilter === 'unassigned') {
      list = list.filter(s => !s.assigned_teacher_id);
    } else if (statusFilter !== 'all') {
      list = list.filter(s => s.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(q)) ||
        (s.whatsapp && s.whatsapp.toLowerCase().includes(q)) ||
        (s.primary_service_name && s.primary_service_name.toLowerCase().includes(q)) ||
        (s.assigned_teacher_name && s.assigned_teacher_name.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'completed') {
        return (b.total_completed_lessons || 0) - (a.total_completed_lessons || 0);
      }
      if (sortBy === 'next') {
        if (!a.next_lesson && !b.next_lesson) return 0;
        if (!a.next_lesson) return 1;
        if (!b.next_lesson) return -1;
        return a.next_lesson.scheduled_start.localeCompare(b.next_lesson.scheduled_start);
      }
      // 'recent' (default)
      return b.created_at.localeCompare(a.created_at);
    });

    return list;
  }, [students, statusFilter, searchQuery, sortBy]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      all: students.length,
      active: students.filter(s => s.status === 'active').length,
      paused: students.filter(s => s.status === 'paused').length,
      inactive: students.filter(s => s.status === 'inactive').length,
      unassigned: students.filter(s => !s.assigned_teacher_id).length
    };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {isSuperAdmin ? t('All students', 'كل الطلاب') : t('My students', 'طلابي')}
            </h1>
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-secondary/30 text-primary border border-secondary/50 font-medium">
              {t(`${counts.active} active`, `${counts.active} نشط`)}
            </span>
          </div>
          <p className="text-sm sm:text-sm text-muted-foreground mt-1">
            {isSuperAdmin
              ? t('Every student, their teacher, goals and lesson history.', 'كل الطلاب ومعلميهم وأهدافهم وسجل حصصهم.')
              : t('Your students, their progress and your private notes.', 'طلابك وتقدمهم وملاحظاتك الخاصة.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        {isSuperAdmin && <ExportCsvButton kind="students" />}
        {isSuperAdmin && <ExportCsvButton kind="payments" />}
        <button
          onClick={() => fetchStudents(true)}
          disabled={refreshing}
          className="tap-44 relative self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl glass-card border-none text-foreground hover:bg-surface-subtle transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{t('Refresh', 'تحديث')}</span>
        </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass-surface border border-border-subtle overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('All', 'الكل')} ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'active'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Active', 'نشط')} ({counts.active})
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'paused'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Paused', 'متوقف مؤقتاً')} ({counts.paused})
          </button>
          {isSuperAdmin && counts.unassigned > 0 && (
            <button
              onClick={() => setStatusFilter('unassigned')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'unassigned'
                  ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 shadow-2xs font-bold border border-amber-500/30'
                  : 'text-amber-700 dark:text-amber-300 hover:text-foreground'
              }`}
            >
              {t('No teacher', 'من غير معلم')} ({counts.unassigned})
            </button>
          )}
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'inactive'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Inactive', 'غير نشط')} ({counts.inactive})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              aria-label={t('Search', 'بحث')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('Search student, parent, email…', 'دوّر بالطالب أو ولي الأمر أو الإيميل…')}
              className="w-full ps-9 pe-3.5 py-1.5 text-sm rounded-xl border border-border glass-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            aria-label={t('Sort', 'ترتيب')}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-sm rounded-xl border border-border glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="recent">{t('Newest', 'الأحدث')}</option>
            <option value="name">{t('Name', 'الاسم')}</option>
            <option value="completed">{t('Most lessons', 'الأكثر حصص')}</option>
            <option value="next">{t('Next lesson', 'الحصة الجاية')}</option>
          </select>
        </div>
      </div>

      {/* Body Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 glass-card rounded-2xl border border-border" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="text-sm font-medium text-destructive">{error}</h3>
          <button
            onClick={() => fetchStudents()}
            className="tap-44 relative px-4 py-1.5 text-sm font-medium rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors cursor-pointer"
          >
            {t('Try again', 'حاول تاني')}
          </button>
        </div>
      ) : displayedStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery || statusFilter !== 'all' ? t('No matching students', 'مفيش طلاب مطابقين') : t('No students yet', 'لسه مفيش طلاب')}
          description={searchQuery || statusFilter !== 'all'
            ? t('Try another search or filter.', 'جرّب بحث أو فلتر تاني.')
            : t('Students show up here once they book with you.', 'الطلاب هيظهروا هنا أول ما يحجزوا معاك.')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedStudents.map(student => {
            const waUrl = student.whatsapp
              ? buildContextualWhatsAppUrl(
                  student.whatsapp,
                  `As-salamu alaykum ${student.name},`
                )
              : null;

            return (
              <div
                key={student.id}
                className="glass-card border-none rounded-2xl p-5 shadow-2xs space-y-4 hover:border-accent/40 transition-all flex flex-col justify-between"
              >
                {/* Card Header: Name, Learner Type, Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/dashboard/students/${student.id}`}
                          className="text-base font-display font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {student.name}
                        </Link>
                        {student.learner_type === 'child' ? (
                          <span className="text-[13px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-medium">
                            {t('Child', 'طفل')} {student.parent_name ? `(${student.parent_name})` : ''}
                          </span>
                        ) : student.learner_type === 'adult' ? (
                          <span className="text-[13px] px-2 py-0.5 rounded-full bg-secondary/30 text-primary border border-secondary/50 font-medium">
                            {t('Adult', 'بالغ')}
                          </span>
                        ) : null}
                      </div>

                      {student.primary_service_name && (
                        <p className="text-sm text-primary font-medium mt-0.5">
                          {student.primary_service_name}
                        </p>
                      )}
                    </div>

                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                      student.status === 'active'
                        ? 'bg-success/15 text-success border border-success/30'
                        : student.status === 'paused'
                        ? 'bg-warning/15 text-warning-foreground border border-warning/30'
                        : 'glass-surface text-muted-foreground border border-border-subtle'
                    }`}>
                      {({ active: t('Active', 'نشط'), paused: t('Paused', 'متوقف مؤقتاً'), inactive: t('Inactive', 'غير نشط') } as Record<string, string>)[student.status || 'active'] || student.status}
                    </span>
                  </div>

                  {/* Level & Location Row */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    {student.current_level ? (
                      <span className="capitalize px-2 py-0.5 rounded-md glass-surface border border-border-subtle text-foreground">
                        {student.current_level}
                      </span>
                    ) : (
                      <span className="italic opacity-60">{t('Level not assessed', 'المستوى لسه ما اتحددش')}</span>
                    )}

                    {student.country && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 opacity-60" />
                        <span>{student.country}</span>
                      </span>
                    )}

                    {student.timezone && (
                      <span className="text-[11px] opacity-60">
                        {student.timezone}
                      </span>
                    )}

                    {isSuperAdmin && (
                      <span className={`px-2 py-0.5 rounded text-[13px] font-semibold tracking-wider uppercase ${
                        student.assigned_teacher_name ? 'bg-secondary/30 text-primary' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        {student.assigned_teacher_name ? `${t('Teacher', 'المعلم')}: ${student.assigned_teacher_name}` : t('No teacher', 'من غير معلم')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Next Lesson & Stats */}
                <div className="pt-3 border-t border-border-subtle space-y-2 text-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-accent" />
                      <span>{t(`${student.total_completed_lessons} lessons done`, `${student.total_completed_lessons} حصة تمت`)}</span>
                    </span>

                    {student.notes_count > 0 && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3 text-warning" />
                        <span>{t(`${student.notes_count} notes`, `${student.notes_count} ملاحظة`)}</span>
                      </span>
                    )}
                  </div>

                  {student.next_lesson ? (
                    <div className="p-2.5 rounded-xl glass-surface border border-border-subtle flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        <div>
                          <span className="font-semibold text-foreground">
                            {t('Next', 'الجاية')}: {DateTime.fromISO(student.next_lesson.scheduled_start).setLocale(locale).toFormat('EEE, MMM d • hh:mm a')}
                          </span>
                        </div>
                      </div>
                      <span className="text-[13px] px-1.5 py-0.5 rounded bg-secondary/30 text-primary border border-secondary/50 font-medium">
                        {t('Upcoming', 'جاية')}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      {t('No upcoming lesson', 'مفيش حصة جاية')}
                    </p>
                  )}
                </div>

                {/* Card Footer: WhatsApp & View Record Link */}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSuperAdmin && waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-success font-medium hover:underline cursor-pointer"
                        title={t('Message on WhatsApp', 'راسله على واتساب')}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{t('WhatsApp', 'واتساب')}</span>
                      </a>
                    )}
                  </div>

                  <Link
                    to={`/dashboard/students/${student.id}`}
                    className="tap-44 relative inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-xl bg-secondary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  >
                    <span>{t('Open', 'افتح')}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
