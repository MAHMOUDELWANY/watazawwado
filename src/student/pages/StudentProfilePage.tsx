import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Globe,
  Phone,
  Clock,
  Target,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Moon,
  Sun,
  LogOut,
  ShieldCheck,
  Check
} from 'lucide-react';
import { DateTime } from 'luxon';
import { useTeacherAuth } from '../../lib/auth';
import { useTheme } from '../../components/ThemeProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export interface StudentProfilePageProps {
  profile?: any;
  session?: any;
  onProfileUpdated?: (updated: any) => void;
  lang?: 'en' | 'ar';
  onToggleLang?: () => void;
}

export default function StudentProfilePage({
  profile: initialProfile,
  session: propSession,
  onProfileUpdated,
  lang = (typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar' : 'en'),
  onToggleLang
}: StudentProfilePageProps) {
  const auth = useTeacherAuth();
  const effectiveSession = propSession || auth.session;
  const user = auth.user;
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAr = lang === 'ar';

  // Editable fields
  const [name, setName] = useState(initialProfile?.name || '');
  const [timezone, setTimezone] = useState(initialProfile?.timezone || 'UTC');
  const [whatsapp, setWhatsapp] = useState(initialProfile?.whatsapp || '');
  const [country, setCountry] = useState(initialProfile?.country || '');
  const [bookingPreference, setBookingPreference] = useState<'self' | 'child'>(
    initialProfile?.bookingPreference || initialProfile?.booking_preference || 'self'
  );

  const canBookForChild = Boolean(profile?.canBookForChild);
  const linkedChildren = Array.isArray(profile?.linkedChildren) ? profile.linkedChildren : [];

  // Diagnostic helper for student auth probe
  const probeStudentMe = async () => {
    try {
      const token = effectiveSession?.access_token;
      if (!token) return;
      await fetch('/api/student/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch {
      // Diagnostic safe fallback
    }
  };

  // Diagnostic probe for student auth verification
  const runDiagnosticProbe = async () => {
    try {
      const token = effectiveSession?.access_token;
      if (!token) return;
      await fetch('/api/student-auth-diagnostic', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch {
      // Diagnostic safe fallback
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = effectiveSession?.access_token;
      if (!token) {
        throw new Error(isAr ? 'جلسة تسجيل الدخول منتهية' : 'Authentication required. Session token missing.');
      }

      const res = await fetch('/api/student/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(isAr ? 'تعذر تحميل بيانات الملف الشخصي' : 'Failed to load profile.');
      }

      const data = await res.json();
      setProfile(data);
      setName(data.name || '');
      setTimezone(data.timezone || 'UTC');
      setWhatsapp(data.whatsapp || '');
      setCountry(data.country || '');
      if (data.bookingPreference) {
        setBookingPreference(data.bookingPreference);
      }
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ أثناء تحميل الملف' : 'Error loading profile.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialProfile && effectiveSession?.access_token) {
      fetchProfile();
    } else if (initialProfile) {
      setProfile(initialProfile);
      setName(initialProfile.name || '');
      setTimezone(initialProfile.timezone || 'UTC');
      setWhatsapp(initialProfile.whatsapp || '');
      setCountry(initialProfile.country || '');
      if (initialProfile.bookingPreference) {
        setBookingPreference(initialProfile.bookingPreference);
      }
      setLoading(false);
    }
  }, [initialProfile, effectiveSession?.access_token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const token = effectiveSession?.access_token;
      if (!token) {
        throw new Error(isAr ? 'جلسة تسجيل الدخول منتهية' : 'Authentication required. Session token missing.');
      }

      const res = await fetch('/api/student/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          timezone: timezone.trim(),
          whatsapp: whatsapp.trim() || null,
          country: country.trim() || null,
          bookingPreference
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isAr ? 'فشل تحديث البيانات' : 'Failed to update profile.'));
      }

      setSuccess(isAr ? 'تم حفظ التعديلات وتفضيلات الحجز بنجاح.' : 'Profile and booking preferences updated successfully.');
      const updated = { ...profile, ...data, bookingPreference: data.bookingPreference || bookingPreference };
      setProfile(updated);
      onProfileUpdated?.(updated);
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ أثناء الحفظ' : 'Error updating profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUseDeviceTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
      }
    } catch {
      // safe fallback
    }
  };

  const handleToggleLang = () => {
    if (onToggleLang) {
      onToggleLang();
    } else {
      const newLang = isAr ? 'en' : 'ar';
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
      window.location.reload();
    }
  };

  const formattedMemberSince = useMemo(() => {
    const rawDate = profile?.createdAt || profile?.created_at;
    if (!rawDate) return null;
    try {
      const dt = DateTime.fromISO(rawDate);
      if (!dt.isValid) return null;
      return dt.setLocale(isAr ? 'ar' : 'en').toFormat('LLLL yyyy');
    } catch {
      return null;
    }
  }, [profile?.createdAt, profile?.created_at, isAr]);

  // Settings Category Navigation
  type CategoryId = 'profile' | 'learning' | 'preferences' | 'security';
  const [activeCategory, setActiveCategory] = useState<CategoryId>('profile');

  const categories = useMemo(() => [
    {
      id: 'profile' as const,
      name: isAr ? 'البيانات الشخصية' : 'Personal Details',
      description: isAr ? 'الاسم، وسائل التواصل، والمنطقة الزمنية' : 'Name, contact methods & timezone',
      icon: User
    },
    {
      id: 'learning' as const,
      name: isAr ? 'المسار التعليمي والأستاذ' : 'Learning Track & Teacher',
      description: isAr ? 'الإشراف المباشر مع الأستاذ محمود والتقييم' : '1-on-1 teaching with Ustadh Mahmoud',
      icon: Target
    },
    {
      id: 'preferences' as const,
      name: isAr ? 'تفضيلات الحجز والمظهر' : 'Booking & Preferences',
      description: isAr ? 'المستفيد الافتراضي، لغة المنصة، والمظهر' : 'Default learner, platform language & theme',
      icon: Users
    },
    {
      id: 'security' as const,
      name: isAr ? 'أمان الحساب والجلسة' : 'Security & Account',
      description: isAr ? 'حالة المصادقة، فحص الاتصال، والخروج' : 'Auth verification, diagnostics & sign out',
      icon: ShieldCheck
    }
  ], [isAr]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isAr ? 'جارٍ تحميل بيانات الطالب...' : 'Loading student profile...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-start">
      {/* 1. Page Header & Identity Summary */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/15 border border-primary/25 text-primary text-xl sm:text-2xl font-serif font-bold flex items-center justify-center shrink-0 select-none"
            aria-hidden="true"
          >
            {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-serif font-bold text-foreground tracking-tight truncate">
                {profile?.name || user?.email?.split('@')[0] || (isAr ? 'طالب' : 'Student')}
              </h1>
              <Badge variant="secondary" className="text-xs px-2.5 py-0.5">
                {bookingPreference === 'child'
                  ? (isAr ? 'حساب ولي أمر' : 'Parent Account')
                  : (isAr ? 'طالب' : 'Student')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">
              {profile?.email || user?.email}
            </p>
            {formattedMemberSince && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <span>{isAr ? 'تاريخ الانضمام:' : 'Member since:'}</span>
                <span className="font-medium text-foreground">{formattedMemberSince}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <Badge variant="outline" className="text-xs py-1.5 px-3 border-border bg-surface-subtle">
            {profile?.learnerType === 'child' ? (isAr ? 'ناشئ' : 'Child') : (isAr ? 'بالغ' : 'Adult')} • {profile?.currentLevel || (isAr ? 'مبتدئ' : 'Beginner')}
          </Badge>
        </div>
      </div>

      {/* 2. Notifications & Feedback Alerts */}
      {error && (
        <div 
          role="alert"
          aria-live="polite" 
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {success && (
        <div 
          role="status"
          aria-live="polite" 
          className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-xs sm:text-sm flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="leading-relaxed">{success}</span>
        </div>
      )}

      {/* Mobile/Tablet Category Tabs (< lg) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer min-h-[44px]
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-surface hover:bg-surface-subtle text-muted-foreground hover:text-foreground border border-border'
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. SETTINGS WORKSPACE: CATEGORY NAVIGATION + FOCUSED CONTENT PANEL */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Category Navigation (Desktop lg: 4 columns) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-2 space-y-1 shadow-2xs">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    w-full flex items-start gap-3 p-3.5 rounded-xl text-start transition-all cursor-pointer min-h-[44px]
                    ${isActive
                      ? 'bg-primary/10 border border-primary/25 text-foreground font-semibold ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground border border-transparent'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-surface-subtle text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm ${isActive ? 'text-foreground font-semibold' : 'text-foreground'}`}>
                      {cat.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">
                      {cat.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ustadh Mahmoud Trust Badge */}
          <div className="p-4 rounded-2xl bg-surface border border-border/80 text-xs space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-serif font-bold text-xs">
                م
              </span>
              <span>{isAr ? 'الأستاذ محمود — إشراف مباشر' : 'Ustadh Mahmoud — 1-on-1 Teaching'}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {isAr
                ? 'كافة البرامج التعليمية تُعقد بجلسات فردية مباشرة (1-على-1) مصممة لتناسب وتيرتك وأهدافك الخاصة.'
                : 'All learning is conducted in dedicated 1-on-1 private sessions tailored to your pace and goals.'}
            </p>
          </div>
        </div>

        {/* Right Side: Focused Settings Content Panel (Desktop lg: 8 columns) */}
        <div className="lg:col-span-8">
          {/* PANEL 1: Personal Details */}
          {activeCategory === 'profile' && (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7 shadow-2xs space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                  {isAr ? 'البيانات الشخصية' : 'Personal Details'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {isAr
                    ? 'الاسم الكامل، البريد، ورقم الواتساب المستخدم في تنسيق الدروس والمواعيد'
                    : 'Your contact information used for lesson confirmations and scheduling coordination'}
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="student-name" className="block text-xs font-semibold text-foreground mb-1.5">
                    {isAr ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] transition-colors"
                  />
                </div>

                {/* Account Email (Read-only, Managed by Supabase Auth) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="student-email" className="block text-xs font-semibold text-foreground">
                      {isAr ? 'البريد الإلكتروني' : 'Account Email'}
                    </label>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      <span>{isAr ? 'مرتبط بالحساب الأمني' : 'Managed by Auth'}</span>
                    </span>
                  </div>
                  <input
                    id="student-email"
                    type="email"
                    disabled
                    value={profile?.email || user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-subtle/50 text-muted-foreground font-mono text-xs sm:text-sm opacity-80 cursor-not-allowed min-h-[44px]"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    {isAr
                      ? 'البريد الإلكتروني مرتبط بحسابك الأمني في المنصة ولا يمكن تغييره من هنا مباشرة.'
                      : 'Your email address serves as your secure account identifier.'}
                  </p>
                </div>

                {/* Timezone & WhatsApp Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Timezone */}
                  <div>
                    <label htmlFor="student-timezone" className="block text-xs font-semibold text-foreground mb-1.5">
                      {isAr ? 'المنطقة الزمنية (IANA)' : 'Timezone (IANA)'}
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-primary absolute start-3.5 top-3.5 pointer-events-none" />
                      <input
                        id="student-timezone"
                        type="text"
                        required
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] font-mono text-xs sm:text-sm"
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleUseDeviceTimezone}
                        className="text-[11px] text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      >
                        {isAr ? 'استخدام توقيت جهازي' : 'Use device timezone'}
                      </button>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {isAr ? 'مثال: America/Toronto' : 'e.g. America/Toronto'}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label htmlFor="student-whatsapp" className="block text-xs font-semibold text-foreground mb-1.5">
                      {isAr ? 'رقم الواتساب للتنسيق' : 'WhatsApp Number'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-primary absolute start-3.5 top-3.5 pointer-events-none" />
                      <input
                        id="student-whatsapp"
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] font-mono text-xs sm:text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      {isAr ? 'يُستخدم لتأكيد المواعيد ورسائل التذكير المباشرة' : 'Used for appointment confirmations and direct reminders'}
                    </p>
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="student-country" className="block text-xs font-semibold text-foreground mb-1.5">
                    {isAr ? 'بلد الإقامة' : 'Country / Location'}
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-primary absolute start-3.5 top-3.5 pointer-events-none" />
                    <input
                      id="student-country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder={isAr ? 'مثال: كندا، الولايات المتحدة، بريطانيا' : 'e.g. Canada, United States, United Kingdom'}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={saving}
                    className="min-h-[44px] px-7 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer shadow-xs"
                  >
                    <Save className="w-4 h-4 me-2" />
                    <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* PANEL 2: Learning Track & Ustadh Mahmoud */}
          {activeCategory === 'learning' && (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7 shadow-2xs space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                  {isAr ? 'المسار التعليمي والأستاذ' : 'Learning Track & Teacher'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {isAr
                    ? 'تفاصيل الإشراف المباشر مع الأستاذ محمود، المستوى الحالي، والأهداف المحددة'
                    : 'Your 1-on-1 teaching relationship with Ustadh Mahmoud, current level, and target goals'}
                </p>
              </div>

              {/* Teacher Relationship Banner */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center font-serif font-bold text-lg shrink-0 mt-0.5 select-none">
                  م
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-foreground text-base">
                      {isAr ? 'الأستاذ محمود' : 'Ustadh Mahmoud'}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {isAr ? 'إشراف فردي مباشر' : '1-on-1 Teacher'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {isAr
                      ? 'تأسيس متدرج في تلاوة القرآن الكريم وأحكام التجويد والدراسات الإسلامية واللغة العربية وفق خطة فردية تناسب مستواك وأهدافك.'
                      : 'Personalized curriculum in Quran recitation, Tajweed mastery, Islamic studies, and Arabic language tailored to your actual level.'}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-primary font-medium">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'الدروس تُعقد مباشرة عبر غرفة زووم المخصصة لكل موعد.' : 'Lessons take place directly via dedicated Zoom Classroom sessions.'}</span>
                  </div>
                </div>
              </div>

              {/* Learning Track Details */}
              <div className="space-y-3.5 divide-y divide-border">
                <div className="flex items-center justify-between pt-1 pb-3">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {isAr ? 'فئة المتعلم' : 'Learner Type'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold capitalize text-foreground">
                    {profile?.learnerType === 'child'
                      ? (isAr ? 'ناشئ / طفل' : 'Child Learner')
                      : (isAr ? 'بالغ' : 'Adult Learner')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {isAr ? 'المستوى الحالي' : 'Current Level'}
                  </span>
                  <Badge variant="secondary" className="capitalize text-primary font-medium text-xs">
                    {profile?.currentLevel || (isAr ? 'مبتدئ' : 'Beginner')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {isAr ? 'المادة الأساسية' : 'Primary Subject'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {profile?.learningInterest || (isAr ? 'تلاوة القرآن وتجويده' : 'Quran Reading & Tajweed')}
                  </span>
                </div>

                <div className="py-3">
                  <span className="text-xs text-muted-foreground block mb-2">
                    {isAr ? 'الهدف التعليمي المسجل' : 'Target Learning Goal'}
                  </span>
                  <div className="text-xs sm:text-sm text-foreground italic leading-relaxed bg-surface-subtle p-3.5 rounded-xl border border-border">
                    "{profile?.learningGoal || (isAr ? 'إتقان التلاوة وضبط أحكام التجويد مع الأستاذ محمود' : 'Mastery of Quran recitation and Tajweed rules with Ustadh Mahmoud')}"
                  </div>
                </div>

                {profile?.learningNeeds && (
                  <div className="py-3">
                    <span className="text-xs text-muted-foreground block mb-2">
                      {isAr ? 'ملاحظات وتفضيلات التعلم' : 'Special Notes & Context'}
                    </span>
                    <div className="text-xs text-muted-foreground bg-surface-subtle/50 p-3 rounded-xl border border-border">
                      {profile.learningNeeds}
                    </div>
                  </div>
                )}
              </div>

              {/* Linked Children (if guardian) */}
              {linkedChildren.length > 0 && (
                <div className="pt-4 border-t border-border space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{isAr ? `الأبناء المسجلون (${linkedChildren.length})` : `Registered Children (${linkedChildren.length})`}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {linkedChildren.map((child: any) => (
                      <div
                        key={child.id}
                        className="p-3.5 rounded-xl bg-surface-subtle border border-border text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {child.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {child.learnerType || (isAr ? 'طالب' : 'Child')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{isAr ? 'المستوى:' : 'Level:'}</span>
                          <span className="capitalize text-primary font-medium">
                            {child.currentLevel || (isAr ? 'مبتدئ' : 'Beginner')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parent / Guardian (if child learner) */}
              {profile?.guardian && (
                <div className="pt-4 border-t border-border space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{isAr ? 'بيانات ولي الأمر المسؤول' : 'Parent / Guardian Responsible'}</span>
                  </h3>
                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-border text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isAr ? 'اسم ولي الأمر' : 'Parent Name'}</span>
                      <span className="font-semibold text-foreground">{profile.guardian.parentName}</span>
                    </div>
                    {profile.guardian.parentEmail && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{isAr ? 'البريد الإلكتروني' : 'Parent Email'}</span>
                        <span className="font-mono text-foreground">{profile.guardian.parentEmail}</span>
                      </div>
                    )}
                    {profile.guardian.parentWhatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{isAr ? 'رقم الواتساب' : 'Parent WhatsApp'}</span>
                        <span className="font-mono text-foreground">{profile.guardian.parentWhatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PANEL 3: Booking Preferences & Interface */}
          {activeCategory === 'preferences' && (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7 shadow-2xs space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                  {isAr ? 'تفضيلات الحجز والمظهر' : 'Booking & Preferences'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {isAr
                    ? 'تحديد المستفيد الافتراضي عند حجز الدروس، لغة المنصة، ومظهر العرض'
                    : 'Configure default learner preference, platform language, and display theme'}
                </p>
              </div>

              {/* Default Booking Preference */}
              <div className="space-y-3">
                <div>
                  <span className="block text-xs font-semibold text-foreground">
                    {isAr ? 'تفضيل الحجز الافتراضي' : 'Default Booking Preference'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {isAr
                      ? 'تحديد المستفيد الافتراضي عند حجز أي درس جديد (يمكنك دائماً تبديله لكل درس).'
                      : 'Select who you typically schedule lessons for. You can always adjust this on individual bookings.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" role="radiogroup" aria-label={isAr ? 'تفضيل الحجز الافتراضي' : 'Default Booking Preference'}>
                  {/* Option: Myself */}
                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      bookingPreference === 'self'
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/20'
                        : 'border-border bg-surface-subtle text-muted-foreground hover:border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookingPreference"
                      value="self"
                      checked={bookingPreference === 'self'}
                      onChange={() => setBookingPreference('self')}
                      className="mt-0.5 text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-foreground">
                        {isAr ? 'لنفسي (المتعلم الأساسي)' : 'Myself (Primary Learner)'}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                        {isAr
                          ? 'يتم تخصيص الدروس والمسار التعليمي لحسابك الشخصي.'
                          : 'Lessons are scheduled directly for your own learning track.'}
                      </span>
                    </div>
                  </label>

                  {/* Option: My child */}
                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
                      !canBookForChild
                        ? 'opacity-60 cursor-not-allowed border-border bg-surface-subtle/50'
                        : bookingPreference === 'child'
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/20 cursor-pointer'
                        : 'border-border bg-surface-subtle text-muted-foreground hover:border-border cursor-pointer'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookingPreference"
                      value="child"
                      disabled={!canBookForChild}
                      checked={bookingPreference === 'child'}
                      onChange={() => {
                        if (canBookForChild) setBookingPreference('child');
                      }}
                      className="mt-0.5 text-primary focus:ring-primary disabled:opacity-50 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-foreground">
                        {isAr ? 'لابني / ابنتي' : 'My Child'}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                        {canBookForChild
                          ? (isAr ? 'يتم حجز الدروس للطفل المسجل تحت إشراف ولي الأمر.' : 'Lessons are scheduled for your registered child learner.')
                          : (isAr ? 'متاح للحسابات المسجلة كأولياء أمور مع أطفال مرتبطين.' : 'Available for accounts with registered child/guardian relationships.')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Interface Language */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-subtle border border-border">
                <div>
                  <span className="font-semibold text-foreground text-xs sm:text-sm block">
                    {isAr ? 'لغة الواجهة' : 'Interface Language'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isAr ? 'العربية (الحالية)' : 'English (Current)'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleLang}
                  className="min-h-[44px] px-4 rounded-xl text-xs font-semibold cursor-pointer border-border hover:bg-surface bg-surface"
                  aria-label={isAr ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
                >
                  <Globe className="w-3.5 h-3.5 me-1.5 text-primary" />
                  <span>{isAr ? 'English' : 'العربية'}</span>
                </Button>
              </div>

              {/* Theme Preference */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-subtle border border-border">
                <div>
                  <span className="font-semibold text-foreground text-xs sm:text-sm block">
                    {isAr ? 'مظهر المنصة' : 'Appearance Theme'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {theme === 'dark' 
                      ? (isAr ? 'الوضع الليلي' : 'Dark Mode') 
                      : (isAr ? 'الوضع النهاري' : 'Light Mode')}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="min-h-[44px] px-4 rounded-xl text-xs font-semibold cursor-pointer border-border hover:bg-surface bg-surface"
                  aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-3.5 h-3.5 me-1.5 text-primary" />
                      <span>{isAr ? 'الوضع الليلي' : 'Dark Mode'}</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 me-1.5 text-primary" />
                      <span>{isAr ? 'الوضع النهاري' : 'Light Mode'}</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Save Preferences Button */}
              <div className="pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  isLoading={saving}
                  className="min-h-[44px] px-7 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4 me-2" />
                  <span>{isAr ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* PANEL 4: Security & Account */}
          {activeCategory === 'security' && (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7 shadow-2xs space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                  {isAr ? 'أمان الحساب والجلسة' : 'Security & Account'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {isAr
                    ? 'تفاصيل المصادقة السحابية، فحص الاتصال الأمني، وإدارة تسجيل الدخول'
                    : 'Cloud authentication status, diagnostic verification, and session control'}
                </p>
              </div>

              {/* Auth Verification Banner */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>{isAr ? 'جلسة الطالب مؤمنة' : 'Authenticated Student Session'}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? 'جلسة الدخول مؤمنة ومحمية بقواعد أمان صارمة (RLS). لا يمكن لأي مستخدم آخر الوصول إلى سجلاتك.'
                    : 'Your session is authenticated securely via Supabase Auth and isolated with Row Level Security.'}
                </p>
                <div className="pt-2 text-xs font-mono text-muted-foreground">
                  <span>{isAr ? 'المعرف:' : 'Identifier:'}</span> <span className="text-foreground">{user?.email}</span>
                </div>
              </div>

              {/* Diagnostic Tools */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
                <div>
                  <span className="block text-xs font-semibold text-foreground">
                    {isAr ? 'أدوات الفحص والتحقق الأمني' : 'Security Diagnostics & Connectivity Probe'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr
                      ? 'التحقق من صحة الاتصال بنقاط نهاية حساب الطالب'
                      : 'Verify live connection and token authorization with student endpoints'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={probeStudentMe}
                    className="px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground font-medium hover:bg-surface-subtle transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>{isAr ? 'فحص /api/student/me' : 'Probe /api/student/me'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={runDiagnosticProbe}
                    className="px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground font-medium hover:bg-surface-subtle transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>{isAr ? 'فحص /api/student-auth-diagnostic' : 'Probe /api/student-auth-diagnostic'}</span>
                  </button>
                </div>
              </div>

              {/* Sign Out */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-foreground">
                    {isAr ? 'تسجيل الخروج من المنصة' : 'Sign Out of Student Portal'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? 'إنهاء جلسة الدخول الحالية بأمان' : 'Safely end your current authenticated session'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => auth.signOut()}
                  className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors cursor-pointer min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
