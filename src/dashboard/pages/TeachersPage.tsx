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
import { useT } from '../../lib/language';

export default function TeachersPage() {
  const { t } = useT();
  const [teachers, setTeachers] = useState<TeacherAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const fetchTeachers = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardFetch('/api/dashboard/admin/teachers');
      setTeachers(data.teachers || []);
    } catch (err: any) {
      setError(err.message || t("Teachers couldn't be loaded.", 'تعذر تحميل المعلمين.'));
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
      ? t(`Deactivate ${email}? They won't be able to sign in.`, `توقف ${email}؟ مش هيقدر يسجل دخول.`)
      : t(`Activate ${email}?`, `تفعّل ${email}؟`);

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(email);
    try {
      await dashboardFetch(`/api/dashboard/admin/teachers/${encodeURIComponent(email)}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      await fetchTeachers(true);
    } catch (err: any) {
      alert(err.message || t("Couldn't update the teacher.", 'تعذر تحديث المعلم.'));
    } finally {
      setActionLoading(null);
    }
  };

  // New teachers sign up with this email (or reset their password) and then use the staff login.
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddMessage(null);
    try {
      const res: any = await dashboardFetch('/api/dashboard/admin/teachers', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail.trim(), display_name: newName.trim(), gender: newGender, role: 'teacher' })
      });
      setAddMessage({ kind: 'ok', text: res?.invited
        ? t('Teacher added. We emailed them an invitation to set a password; then they sign in from the staff login.', 'المعلم اتضاف، وبعتنا له إيميل دعوة يحدد فيه كلمة السر، وبعدها يدخل من صفحة دخول المعلمين.')
        : t('Teacher added. This email already has an account, so they can sign in from the staff login now.', 'المعلم اتضاف. الإيميل ده عنده حساب بالفعل، فيقدر يدخل من صفحة دخول المعلمين دلوقتي.') });
      setNewEmail('');
      setNewName('');
      await fetchTeachers(true);
    } catch (err: any) {
      setAddMessage({ kind: 'error', text: err.message || t("Couldn't add the teacher.", 'تعذر إضافة المعلم.') });
    } finally {
      setAdding(false);
    }
  };

  const filteredTeachers = teachers.filter(tc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return tc.display_name.toLowerCase().includes(q) || tc.email.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-accent opacity-60" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-start pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider bg-secondary/30 text-primary border border-secondary/50">
              {t('Admin', 'المدير')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold  text-foreground">
              {t('Teachers', 'المعلمين')}
            </h1>
          </div>
          <p className="text-sm sm:text-sm text-muted-foreground mt-1">
            {t('Teacher accounts, their students and lessons.', 'حسابات المعلمين وطلابهم وحصصهم.')}
          </p>
        </div>
        <button
          onClick={() => fetchTeachers(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold glass-card hover:bg-surface-subtle border border-border text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{t('Refresh', 'تحديث')}</span>
        </button>
      </div>

      {/* Security & Provisioning Note */}
      <div className="glass-surface border border-border rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">{t('Who can sign in as a teacher', 'مين يقدر يدخل كمعلم')}</p>
          <p className="mt-0.5">
            {t('Only emails added to the teacher list can open the dashboard. Each teacher sees only their own students and lessons, and no payments.', 'الإيميلات اللي في قايمة المعلمين بس هي اللي تقدر تفتح لوحة التحكم. كل معلم بيشوف طلابه وحصصه بس، ومن غير أي مدفوعات.')}
          </p>
        </div>
      </div>

      <form onSubmit={handleAddTeacher} className="glass-card rounded-2xl p-4 border border-border space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-accent" />
          {t('Add a teacher', 'إضافة معلم')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="email"
            required
            aria-label={t("Teacher's email", 'إيميل المعلم')}
            placeholder={t("Teacher's email", 'إيميل المعلم')}
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border glass-card text-sm text-foreground"
            dir="ltr"
          />
          <input
            type="text"
            required
            aria-label={t('Name shown to students', 'الاسم اللي هيظهر للطلاب')}
            placeholder={t('Name shown to students', 'الاسم اللي هيظهر للطلاب')}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border glass-card text-sm text-foreground"
          />
          <select
            aria-label={t('Gender', 'النوع')}
            value={newGender}
            onChange={e => setNewGender(e.target.value as 'male' | 'female')}
            className="px-3 py-2 rounded-xl border border-border glass-card text-sm text-foreground"
          >
            <option value="male">{t('Male teacher', 'معلم')}</option>
            <option value="female">{t('Female teacher', 'معلمة')}</option>
          </select>
        </div>
        {addMessage && (
          <p role="status" className={`text-sm ${addMessage.kind === 'ok' ? 'text-success' : 'text-destructive'}`}>{addMessage.text}</p>
        )}
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-60"
        >
          {adding ? t('Adding…', 'جارٍ الإضافة…') : t('Add teacher', 'أضف المعلم')}
        </button>
      </form>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          aria-label={t('Search', 'بحث')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Search by name or email…', 'دوّر بالاسم أو الإيميل…')}
          className="w-full ps-10 pe-4 py-2.5 glass-card border-none rounded-xl text-sm sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Teachers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredTeachers.map((tc) => (
          <div
            key={tc.email}
            className={`glass-card border rounded-2xl p-5 shadow-2xs space-y-4 transition-all ${
              tc.is_active ? 'border-border' : 'border-destructive/30 bg-destructive/5'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/30 text-accent font-display font-bold text-base flex items-center justify-center">
                  {tc.display_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-display font-semibold text-foreground">
                    {tc.display_name}
                  </h3>
                  <p className="text-sm text-muted-foreground" dir="ltr">{tc.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded text-[13px] font-semibold uppercase tracking-wider ${
                  tc.role === 'super_admin' ? 'bg-secondary/30 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {tc.role === 'super_admin' ? t('Admin', 'مدير') : t('Teacher', 'معلم')}
                </span>
                <span className={`text-[13px] font-medium ${
                  tc.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive font-semibold'
                }`}>
                  {tc.is_active ? t('Active', 'نشط') : t('Stopped', 'متوقف')}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center">
              <div>
                <span className="text-[13px] text-muted-foreground block uppercase tracking-wider">{t('Students', 'الطلاب')}</span>
                <span className="text-base font-display font-bold text-foreground">{tc.assigned_students_count}</span>
              </div>
              <div>
                <span className="text-[13px] text-muted-foreground block uppercase tracking-wider">{t('Upcoming', 'جاية')}</span>
                <span className="text-base font-display font-bold text-foreground">{tc.upcoming_lessons_count}</span>
              </div>
              <div>
                <span className="text-[13px] text-muted-foreground block uppercase tracking-wider">{t('Done', 'تمت')}</span>
                <span className="text-base font-display font-bold text-foreground">{tc.completed_lessons_count}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Link
                to={`/dashboard/students?teacher=${encodeURIComponent(tc.email)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold glass-surface glass-hover hover:bg-surface border-none text-foreground transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-accent" />
                <span>{t('Their students', 'طلابه')}</span>
              </Link>

              {tc.role !== 'super_admin' && (
                <button
                  onClick={() => handleToggleActive(tc.email, tc.is_active)}
                  disabled={actionLoading === tc.email}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    tc.is_active
                      ? 'text-destructive hover:bg-destructive/10 border border-destructive/20'
                      : 'text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20'
                  }`}
                >
                  {tc.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  <span>{tc.is_active ? t('Stop', 'وقّف') : t('Activate', 'فعّل')}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
