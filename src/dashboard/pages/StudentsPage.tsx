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
  const { session } = useTeacherAuth();
  const [students, setStudents] = useState<DashboardStudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'inactive'>('all');
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

    // Status filter
    if (statusFilter !== 'all') {
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
        (s.primary_service_name && s.primary_service_name.toLowerCase().includes(q))
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
      inactive: students.filter(s => s.status === 'inactive').length
    };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              Students Directory
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF0EB] text-[#6F907D] dark:bg-[#6F907D]/20 dark:text-[#8FAE9B] font-medium">
              {counts.active} Active Learners
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#362E3B]/70 dark:text-[#D5D0CA]/70 mt-1">
            Enrolled 1-on-1 students, learning progress, lesson history, and private teacher notes.
          </p>
        </div>

        <button
          onClick={() => fetchStudents(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/50 dark:border-[#3E3545]/50 text-[#362E3B]/80 dark:text-[#D5D0CA]/80 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/60 dark:bg-[#2A2431]/60 border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#6F907D] text-white shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B] dark:hover:text-white'
            }`}
          >
            All Students ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-[#6F907D] text-white shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B] dark:hover:text-white'
            }`}
          >
            Active ({counts.active})
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'paused'
                ? 'bg-[#6F907D] text-white shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B] dark:hover:text-white'
            }`}
          >
            Paused ({counts.paused})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'inactive'
                ? 'bg-[#6F907D] text-white shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B] dark:hover:text-white'
            }`}
          >
            Inactive ({counts.inactive})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#362E3B]/40 dark:text-[#D5D0CA]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by student, parent, email..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-[#D5D0CA]/50 dark:border-[#3E3545]/50 bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-[#D5D0CA]/50 dark:border-[#3E3545]/50 bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
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
            <div key={i} className="h-44 bg-white/60 dark:bg-[#2A2431]/60 rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
          <button
            onClick={() => fetchStudents()}
            className="px-4 py-1.5 text-xs font-medium rounded-xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 hover:bg-red-200 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : displayedStudents.length === 0 ? (
        <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-[#8FAE9B] mx-auto opacity-70" />
          <h3 className="text-base font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
            {searchQuery || statusFilter !== 'all' ? 'No matching students found' : 'No registered students yet'}
          </h3>
          <p className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60 max-w-sm mx-auto">
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
                className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#8FAE9B]/60 transition-all flex flex-col justify-between"
              >
                {/* Card Header: Name, Learner Type, Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/dashboard/students/${student.id}`}
                          className="text-base font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3] hover:text-[#6F907D] dark:hover:text-[#8FAE9B] transition-colors"
                        >
                          {student.name}
                        </Link>
                        {student.learner_type === 'child' ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                            Child {student.parent_name ? `(${student.parent_name})` : ''}
                          </span>
                        ) : student.learner_type === 'adult' ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                            Adult
                          </span>
                        ) : null}
                      </div>

                      {student.primary_service_name && (
                        <p className="text-xs text-[#6F907D] dark:text-[#8FAE9B] font-medium mt-0.5">
                          {student.primary_service_name}
                        </p>
                      )}
                    </div>

                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                      student.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : student.status === 'paused'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Active'}
                    </span>
                  </div>

                  {/* Level & Location Row */}
                  <div className="flex items-center gap-3 text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]/70 flex-wrap">
                    {student.current_level ? (
                      <span className="capitalize px-2 py-0.5 rounded-md bg-[#F8F6F0] dark:bg-[#1E1923] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
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
                  </div>
                </div>

                {/* Middle: Next Lesson & Stats */}
                <div className="pt-3 border-t border-[#D5D0CA]/20 dark:border-[#3E3545]/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#362E3B]/60 dark:text-[#D5D0CA]/60 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#8FAE9B]" />
                      <span>{student.total_completed_lessons} Completed Lessons</span>
                    </span>

                    {student.notes_count > 0 && (
                      <span className="text-[#362E3B]/60 dark:text-[#D5D0CA]/60 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{student.notes_count} Notes</span>
                      </span>
                    )}
                  </div>

                  {student.next_lesson ? (
                    <div className="p-2.5 rounded-xl bg-[#F8F6F0] dark:bg-[#1E1923] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#6F907D]" />
                        <div>
                          <span className="font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
                            Next: {DateTime.fromISO(student.next_lesson.scheduled_start).toFormat('EEE, MMM d • hh:mm a')}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Upcoming
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#362E3B]/50 dark:text-[#D5D0CA]/50 italic">
                      No upcoming lesson scheduled
                    </p>
                  )}
                </div>

                {/* Card Footer: WhatsApp & View Record Link */}
                <div className="pt-3 border-t border-[#D5D0CA]/20 dark:border-[#3E3545]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                        title="Message student on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <Link
                    to={`/dashboard/students/${student.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#6F907D]/10 text-[#6F907D] dark:bg-[#8FAE9B]/15 dark:text-[#8FAE9B] hover:bg-[#6F907D] hover:text-white dark:hover:bg-[#8FAE9B] dark:hover:text-[#1E1923] transition-colors"
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
