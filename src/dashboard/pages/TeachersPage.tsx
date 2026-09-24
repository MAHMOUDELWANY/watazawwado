import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  UserPlus,
  Power,
  PowerOff,
  Search
} from 'lucide-react';
import { TeacherAccountItem } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeachers = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardFetch('/api/dashboard/admin/teachers');
      setTeachers(data.teachers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleToggleActive = async (email: string, currentStatus: boolean) => {
    const confirmMsg = currentStatus
      ? `Are you sure you want to deactivate ${email}? They will no longer be able to log in.`
      : `Activate ${email}?`;
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(email);
    try {
      await dashboardFetch(`/api/dashboard/admin/teachers/${encodeURIComponent(email)}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      await fetchTeachers(true);
    } catch (err: any) {
      alert(err.message || 'Failed to update teacher status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return t.display_name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-60" />
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
              Teachers & Faculty
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Authoritative faculty management, active teaching accounts, and student assignment capacity.
          </p>
        </div>
        <button
          onClick={() => fetchTeachers(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-subtle border border-border text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Security & Provisioning Note */}
      <div className="bg-surface-subtle border border-border rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">Authoritative Access Control</p>
          <p className="mt-0.5">
            Teacher accounts are provisioned administratively via the platform allowlist. Role and workspace access boundaries are strictly verified server-side on every request.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search teachers by name or email..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Teachers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredTeachers.map((t) => (
          <div 
            key={t.email} 
            className={`bg-surface border rounded-2xl p-5 shadow-2xs space-y-4 transition-all ${
              t.is_active ? 'border-border' : 'border-destructive/30 bg-destructive/5'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-serif font-bold text-base flex items-center justify-center">
                  {t.display_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-serif font-semibold text-foreground">
                    {t.display_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  t.role === 'super_admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {t.role === 'super_admin' ? 'Super Admin' : 'Teacher'}
                </span>
                <span className={`text-[10px] font-medium ${
                  t.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive font-semibold'
                }`}>
                  {t.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Assigned</span>
                <span className="text-base font-serif font-bold text-foreground">{t.assigned_students_count}</span>
                <span className="text-[10px] text-muted-foreground block">students</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Upcoming</span>
                <span className="text-base font-serif font-bold text-foreground">{t.upcoming_lessons_count}</span>
                <span className="text-[10px] text-muted-foreground block">lessons</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Completed</span>
                <span className="text-base font-serif font-bold text-foreground">{t.completed_lessons_count}</span>
                <span className="text-[10px] text-muted-foreground block">lessons</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Link
                to={`/dashboard/students?teacher=${encodeURIComponent(t.email)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-subtle hover:bg-surface border border-border text-foreground transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>View Assigned Students</span>
              </Link>

              {t.role !== 'super_admin' && (
                <button
                  onClick={() => handleToggleActive(t.email, t.is_active)}
                  disabled={actionLoading === t.email}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    t.is_active 
                      ? 'text-destructive hover:bg-destructive/10 border border-destructive/20'
                      : 'text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20'
                  }`}
                >
                  {t.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  <span>{t.is_active ? 'Deactivate' : 'Activate'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
