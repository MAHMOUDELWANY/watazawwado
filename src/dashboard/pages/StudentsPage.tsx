import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

export default function StudentsPage() {
  const { session, teacherRole } = useTeacherAuth();
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
      setError(err.message || 'Student directory could not be loaded.');
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
            <h1 className="text-2xl font-serif font-bold text-foreground">
              {isSuperAdmin ? 'Students Directory' : 'My Students'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              {counts.active} Active Learners
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isSuperAdmin 
              ? 'Platform-wide student records, faculty assignments, learning goals, and lesson histories.'
              : 'Students assigned to your teaching schedule, progress tracking, and private lesson notes.'}
          </p>
        </div>

        <button
          onClick={() => fetchStudents(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-surface border border-border text-foreground hover:bg-surface-subtle transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border-subtle overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active ({counts.active})
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'paused'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Paused ({counts.paused})
          </button>
          {isSuperAdmin && counts.unassigned > 0 && (
            <button
              onClick={() => setStatusFilter('unassigned')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'unassigned'
                  ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 shadow-2xs font-bold border border-amber-500/30'
                  : 'text-amber-700 dark:text-amber-300 hover:text-foreground'
              }`}
            >
              Unassigned ({counts.unassigned})
            </button>
          )}
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Inactive ({counts.inactive})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by student, parent, email..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="recent">Recently Added</option>
            <option value="name">Name (A-Z)</option>
            <option value="completed">Most Lessons</option>
            <option value="next">Next Lesson</option>
          </select>
        </div>
      </div>

      {/* Body Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-surface rounded-2xl border border-border" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="text-sm font-medium text-destructive">{error}</h3>
          <button
            onClick={() => fetchStudents()}
            className="px-4 py-1.5 text-xs font-medium rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : displayedStudents.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-muted-foreground mx-auto opacity-70" />
          <h3 className="text-base font-serif font-semibold text-foreground">
            {searchQuery || statusFilter !== 'all' ? 'No matching students found' : 'No registered students yet'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting the status filter.'
              : 'Students converted from trial bookings or enrolled directly will be listed here with complete profiles and private notes.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedStudents.map(student => {
            const waUrl = student.whatsapp
              ? buildContextualWhatsAppUrl(
                  student.whatsapp,
                  `As-salamu alaykum ${student.name},\n\nThis is Ustadh Mahmoud checking in regarding our upcoming Quran & Arabic studies.`
                )
              : null;

            return (
              <div
                key={student.id}
                className="bg-surface border border-border rounded-2xl p-5 shadow-2xs space-y-4 hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                {/* Card Header: Name, Learner Type, Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/dashboard/students/${student.id}`}
                          className="text-base font-serif font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {student.name}
                        </Link>
                        {student.learner_type === 'child' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-medium">
                            Child {student.parent_name ? `(${student.parent_name})` : ''}
                          </span>
                        ) : student.learner_type === 'adult' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                            Adult
                          </span>
                        ) : null}
                      </div>

                      {student.primary_service_name && (
                        <p className="text-xs text-primary font-medium mt-0.5">
                          {student.primary_service_name}
                        </p>
                      )}
                    </div>

                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                      student.status === 'active'
                        ? 'bg-success/15 text-success border border-success/30'
                        : student.status === 'paused'
                        ? 'bg-warning/15 text-warning-foreground border border-warning/30'
                        : 'bg-surface-subtle text-muted-foreground border border-border-subtle'
                    }`}>
                      {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Active'}
                    </span>
                  </div>

                  {/* Level & Location Row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {student.current_level ? (
                      <span className="capitalize px-2 py-0.5 rounded-md bg-surface-subtle border border-border-subtle text-foreground">
                        {student.current_level}
                      </span>
                    ) : (
                      <span className="italic opacity-60">Level not assessed</span>
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                        student.assigned_teacher_name ? 'bg-primary/10 text-primary' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        {student.assigned_teacher_name ? `Teacher: ${student.assigned_teacher_name}` : 'Unassigned'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Next Lesson & Stats */}
                <div className="pt-3 border-t border-border-subtle space-y-2 text-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>{student.total_completed_lessons} Completed Lessons</span>
                    </span>

                    {student.notes_count > 0 && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3 text-warning" />
                        <span>{student.notes_count} Notes</span>
                      </span>
                    )}
                  </div>

                  {student.next_lesson ? (
                    <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <div>
                          <span className="font-semibold text-foreground">
                            Next: {DateTime.fromISO(student.next_lesson.scheduled_start).toFormat('EEE, MMM d • hh:mm a')}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                        Upcoming
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      No upcoming lesson scheduled
                    </p>
                  )}
                </div>

                {/* Card Footer: WhatsApp & View Record Link */}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-success font-medium hover:underline cursor-pointer"
                        title="Message student on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <Link
                    to={`/dashboard/students/${student.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  >
                    <span>View Record</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
