import React, { useState, useEffect } from 'react';
import {
  Save,
  Settings as SettingsIcon,
  User,
  CreditCard,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Link,
  Globe
} from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { IntegrationsManager } from '../../components/dashboard/IntegrationsManager';
import { CountryTimezonePicker } from '../../components/ui/CountryTimezonePicker';
import { setActiveWorkingTimezone, getActiveWorkingTimezone } from '../../lib/countryTimezones';
import { useTeacherAuth } from '../../lib/auth';
import { useT } from '../../lib/language';
import { notify } from '../../components/ui/Feedback';
import { Switch } from '../../components/ui/Switch';

interface Setting {
  key: string;
  value: any;
  category: string;
}

interface ServiceItem {
  id: string;
  title: string;
  arabic_title: string;
  category: string;
  hourly_rate_usd: number;
  trial_allowed: boolean;
  is_active: boolean;
}

const DEFAULT_SETTINGS: Setting[] = [
  { key: 'teacher_name', value: '', category: 'Profile' },
  { key: 'bio', value: '', category: 'Profile' },
  { key: 'contact_whatsapp', value: '', category: 'Contact' },
  { key: 'contact_email', value: '', category: 'Contact' },
  { key: 'timezone', value: 'Africa/Cairo', category: 'Timezone' },
  { key: 'payment_methods', value: [], category: 'Payment' },
  { key: 'payment_instructions', value: '', category: 'Payment' },
  { key: 'theme', value: 'light', category: 'Preferences' }
];

/**
 * Settings. Teachers get Google Calendar and their working time zone; the super admin also
 * gets profile, subjects & prices and payment methods (RULES.md §1). Booking policies are
 * fixed by RULES.md, so they are shown read-only here instead of being editable.
 */
export default function SettingsPage() {
  const { t, lang } = useT();
  const { teacherRole } = useTeacherAuth();
  const isSuperAdmin = teacherRole === 'super_admin';

  const [settings, setSettings] = useState<Setting[]>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'Profile' : 'Integrations');
  // The zone the schedule uses (this device, auto-detected until changed); the old site-wide setting is not it.
  const [workingTz, setWorkingTz] = useState(() => getActiveWorkingTimezone());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [settingsRes, servicesRes] = await Promise.all([
          dashboardFetch('/api/dashboard/settings').catch(() => []),
          isSuperAdmin ? dashboardFetch('/api/services').catch(() => ({ services: [] })) : Promise.resolve({ services: [] })
        ]);
        setSettings(DEFAULT_SETTINGS.map(def => {
          const found = (Array.isArray(settingsRes) ? settingsRes : []).find((s: Setting) => s.key === def.key);
          return found ? { ...def, value: found.value } : def;
        }));
        if (Array.isArray((servicesRes as any)?.services)) setServices((servicesRes as any).services);
      } catch (err: any) {
        setError(err.message || t("Settings couldn't be loaded.", 'تعذر تحميل الإعدادات.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isSuperAdmin]);

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value ?? '';
  const updateSetting = (key: string, value: any) => setSettings(prev => prev.map(s => (s.key === key ? { ...s, value } : s)));
  const updateServiceField = (id: string, field: keyof ServiceItem, value: any) =>
    setServices(prev => prev.map(srv => (srv.id === id ? { ...srv, [field]: value } : srv)));

  const flash = (text: string) => notify(text);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      // Site-wide settings are the admin's; a teacher's time zone is saved on this device only.
      if (isSuperAdmin) await dashboardFetch('/api/dashboard/settings', { method: 'PATCH', body: JSON.stringify({ settings }) });
      flash(t('Settings saved.', 'الإعدادات اتحفظت.'));
    } catch (err: any) {
      setError(err.message || t("Couldn't save the settings.", 'تعذر حفظ الإعدادات.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async (service: ServiceItem) => {
    try {
      setSavingServiceId(service.id);
      setError(null);
      await dashboardFetch(`/api/dashboard/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ hourly_rate_usd: service.hourly_rate_usd, trial_allowed: service.trial_allowed, is_active: service.is_active })
      });
      flash(t(`Saved: ${service.title}.`, `اتحفظ: ${service.arabic_title || service.title}.`));
    } catch (err: any) {
      setError(err.message || t("Couldn't save the subject.", 'تعذر حفظ المادة.'));
    } finally {
      setSavingServiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">{t('Loading…', 'جارٍ التحميل…')}</p>
      </div>
    );
  }

  const tabs = [
    ...(isSuperAdmin ? [
      { id: 'Profile', icon: User, label: t('Profile & contact', 'البيانات والتواصل') },
      { id: 'Services', icon: BookOpen, label: t('Subjects & prices', 'المواد والأسعار') },
      { id: 'Policy', icon: Calendar, label: t('Booking rules', 'قواعد الحجز') }
    ] : []),
    { id: 'Integrations', icon: Link, label: isSuperAdmin ? t('Connections', 'الربط') : t('Calendar', 'التقويم') },
    { id: 'Preferences', icon: Globe, label: t('Time zone', 'التوقيت') }
  ];

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors placeholder:text-muted-foreground';
  const canSaveSettings = isSuperAdmin;

  return (
    <div className="space-y-8 pb-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            {t('Settings', 'الإعدادات')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin
              ? t('Profile, subjects, prices, payments and connections.', 'البيانات، المواد، الأسعار، الدفع والربط.')
              : t('Your calendar and time zone. Language and dark mode are in the top bar.', 'تقويمك وتوقيتك. اللغة والوضع الليلي من الشريط اللي فوق.')}
          </p>
        </div>
        {canSaveSettings && activeTab !== 'Services' && activeTab !== 'Integrations' && activeTab !== 'Policy' && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 min-h-[40px] shadow-xs"
          >
            {saving ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {t('Save', 'احفظ')}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div role="status" className="p-4 rounded-xl bg-success/15 border border-success/30 text-sm text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeTab === tab.id ? 'glass-card text-foreground shadow-2xs border border-border' : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-accent' : 'opacity-70'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {isSuperAdmin && activeTab === 'Profile' && (
            <div className="glass-card rounded-2xl border border-border p-6 space-y-4 shadow-2xs">
              <h2 className="text-lg font-display font-semibold text-foreground">{t('Profile & contact', 'البيانات والتواصل')}</h2>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="sp-name">{t('Name', 'الاسم')}</label>
                <input id="sp-name" type="text" value={getSetting('teacher_name')} onChange={(e) => updateSetting('teacher_name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="sp-bio">{t('About', 'نبذة')}</label>
                <textarea id="sp-bio" value={getSetting('bio')} onChange={(e) => updateSetting('bio', e.target.value)} rows={4} className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="sp-wa">{t('WhatsApp', 'واتساب')}</label>
                  <input id="sp-wa" type="tel" dir="ltr" value={getSetting('contact_whatsapp')} onChange={(e) => updateSetting('contact_whatsapp', e.target.value)} className={inputClass} placeholder="+48508157886" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="sp-email">{t('Contact email', 'إيميل التواصل')}</label>
                  <input id="sp-email" type="email" dir="ltr" value={getSetting('contact_email')} onChange={(e) => updateSetting('contact_email', e.target.value)} className={inputClass} placeholder="support@watazawwado.academy" />
                </div>
              </div>
            </div>
          )}

          {isSuperAdmin && activeTab === 'Services' && (
            <div className="glass-card rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">{t('Subjects & hourly prices', 'المواد وسعر الساعة')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('Agreed prices: $9/hour for Quran & Islamic studies, from $13/hour for Arabic & English. Change them only after updating the academy rules.', 'الأسعار المتفق عليها: 9$ للساعة للقرآن والعلوم الشرعية، ومن 13$ للعربي والإنجليزي. غيّرها بس بعد ما تحدّث قواعد الأكاديمية.')}
                </p>
              </div>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4">{t('No subjects found.', 'مفيش مواد.')}</p>
              ) : (
                <div className="space-y-4 divide-y divide-border">
                  {services.map(service => (
                    <div key={service.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold text-foreground">{lang === 'ar' ? service.arabic_title : service.title}</span>
                          <span className="ms-2 text-sm text-muted-foreground">({lang === 'ar' ? service.title : service.arabic_title})</span>
                        </div>
                        <button
                          onClick={() => handleSaveService(service)}
                          disabled={savingServiceId === service.id}
                          className="tap-44 relative self-start sm:self-auto px-3 py-1.5 rounded-xl bg-secondary/30 hover:bg-secondary/40 text-accent text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px]"
                        >
                          {savingServiceId === service.id ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {t('Save', 'احفظ')}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div>
                          <label className="block text-[11px] font-medium text-muted-foreground mb-1" htmlFor={`rate-${service.id}`}>{t('Price per hour (USD)', 'سعر الساعة (دولار)')}</label>
                          <div className="relative">
                            <span className="absolute start-3 top-2.5 text-sm text-muted-foreground font-medium">$</span>
                            <input
                              id={`rate-${service.id}`}
                              type="number"
                              min="0"
                              step="0.5"
                              value={service.hourly_rate_usd}
                              onChange={(e) => updateServiceField(service.id, 'hourly_rate_usd', parseFloat(e.target.value) || 0)}
                              className="w-full ps-7 pe-3 py-2 rounded-xl border border-border glass-surface text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        </div>
                        <Switch checked={service.trial_allowed} onChange={(v) => updateServiceField(service.id, 'trial_allowed', v)}>
                          {t('Free trial allowed', 'التجربة المجانية متاحة')}
                        </Switch>
                        <Switch checked={service.is_active} onChange={(v) => updateServiceField(service.id, 'is_active', v)}>
                          {t('Shown on the site', 'ظاهرة على الموقع')}
                        </Switch>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isSuperAdmin && activeTab === 'Policy' && (
            <div className="glass-card rounded-2xl border border-border p-6 space-y-4 shadow-2xs">
              <h2 className="text-lg font-display font-semibold text-foreground">{t('Booking rules', 'قواعد الحجز')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('These rules are fixed for everyone and match the terms students accept.', 'القواعد دي ثابتة للكل ونفس الشروط اللي الطلاب بيوافقوا عليها.')}
              </p>
              <ul className="list-disc ps-5 space-y-2 text-sm text-foreground">
                <li>{t('Free trial: one per new student, 30 minutes (max 45); can be moved once up to 1 hour before.', 'التجربة المجانية: واحدة لكل طالب جديد، 30 دقيقة (بحد أقصى 45)؛ تتغيّر مرة واحدة لحد ساعة قبلها.')}</li>
                <li>{t('Students cancel up to 3 hours before (a paid lesson becomes a credit) and move lessons up to 1 hour before.', 'الطلاب يلغوا لحد 3 ساعات قبل الحصة (الحصة المدفوعة ترجع رصيد) ويغيّروا الميعاد لحد ساعة قبلها.')}</li>
                <li>{t('Inside the last hour nothing changes; emergencies go to the admin on WhatsApp.', 'في آخر ساعة مفيش تغيير؛ الظروف الطارئة بتروح للمدير على واتساب.')}</li>
                <li>{t('Teachers ask the student to reschedule from the lesson window; only the admin moves or cancels lessons directly.', 'المعلم يطلب من الطالب يغيّر الميعاد من شاشة الحصة؛ المدير بس هو اللي يغيّر أو يلغي الحصص مباشرة.')}</li>
              </ul>
            </div>
          )}

          {activeTab === 'Integrations' && (
            <div className="glass-card rounded-2xl border border-border p-6 shadow-2xs">
              <IntegrationsManager lang={lang} isAdmin={isSuperAdmin} />
            </div>
          )}

          {activeTab === 'Preferences' && (
            <div className="glass-card rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
              <h2 className="text-lg font-display font-semibold text-foreground">{t('Time zone', 'التوقيت')}</h2>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{t('Your working time zone', 'التوقيت اللي بتشتغل بيه')}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {t('Your schedule is shown in this time zone. If you travel, change it here to see lessons in your local time.', 'جدولك بيظهر بالتوقيت ده. لو سافرت، غيّره هنا علشان تشوف الحصص بالتوقيت المحلي.')}
                </p>
                <div className="p-4 rounded-xl glass-surface border border-border">
                  <CountryTimezonePicker
                    timezone={workingTz}
                    onTimezoneChange={(newTz) => {
                      updateSetting('timezone', newTz);
                      setWorkingTz(newTz);
                      setActiveWorkingTimezone(newTz);
                      notify(t('Time zone saved. Your schedule now uses it.', 'التوقيت اتحفظ. جدولك بقى بيستخدمه.'));
                    }}
                    isAr={lang === 'ar'}
                    showTimePreview={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
