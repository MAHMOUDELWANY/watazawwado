import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  UserPlus, 
  CreditCard, 
  ArrowRight, 
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { SuperAdminOverviewMetrics } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<SuperAdminOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardFetch('/api/dashboard/overview-metrics');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform overview metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-60" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center text-destructive">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-medium text-sm">{error || 'Unable to load platform snapshot.'}</p>
        <button
          onClick={() => fetchOverview(true)}
          className="mt-4 px-4 py-2 bg-destructive/20 hover:bg-destructive/30 rounded-xl text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-start pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Super Admin
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
              Platform Overview
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Authoritative snapshot of students, teachers, teaching operations, and assignments.
          </p>
        </div>
        <button
          onClick={() => fetchOverview(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-subtle border border-border text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Alerts / Attention Banners */}
      {(metrics.unassigned_students > 0 || metrics.students_needing_attention > 0 || metrics.pending_payments > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.unassigned_students > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {metrics.unassigned_students} Unassigned Student{metrics.unassigned_students > 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                  Students enrolled without an assigned teacher.
                </p>
                <Link
                  to="/dashboard/students"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:underline mt-2"
                >
                  Assign teachers <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {metrics.students_needing_attention > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                  {metrics.students_needing_attention} Attention Item{metrics.students_needing_attention > 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-0.5">
                  Pending outcomes or unverified integration states.
                </p>
                <Link
                  to="/dashboard/today"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 dark:text-red-300 hover:underline mt-2"
                >
                  Review items <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {metrics.pending_payments > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  {metrics.pending_payments} Pending Payment{metrics.pending_payments > 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                  Reported payment claims awaiting verification.
                </p>
                <Link
                  to="/dashboard/bookings"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 dark:text-blue-300 hover:underline mt-2"
                >
                  Reconcile payments <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Core Platform KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Students</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {metrics.active_students}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">+{metrics.new_students_30d}</span>
            <span>new in last 30d</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Teachers</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {metrics.active_teachers}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <Link to="/dashboard/teachers" className="text-primary hover:underline font-medium">
              Manage faculty →
            </Link>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Lessons Today</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {metrics.lessons_today}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <span>{metrics.lessons_this_week} this week</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Trials</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {metrics.trials_upcoming}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <span>{metrics.trials_total} total trials recorded</span>
          </div>
        </div>
      </div>

      {/* Teacher Capacity & Assignment Distribution */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-semibold text-foreground">
              Faculty Workload & Assignment Distribution
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current teaching allocation per authorized faculty member.
            </p>
          </div>
          <Link
            to="/dashboard/teachers"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all teachers →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Teacher</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 text-center">Active Students</th>
                <th className="py-2.5 px-3 text-center">Lessons This Week</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.teacher_capacity.map((t) => (
                <tr key={t.email} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-foreground">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      t.role === 'super_admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {t.role === 'super_admin' ? 'Super Admin' : 'Teacher'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-foreground">
                    {t.active_students}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-foreground">
                    {t.lessons_this_week}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/dashboard/students?teacher=${encodeURIComponent(t.email)}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View students
                    </Link>
                  </td>
                </tr>
              ))}
              {metrics.teacher_capacity.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No active teacher accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
