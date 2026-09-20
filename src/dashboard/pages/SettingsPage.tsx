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
  Globe,
  DollarSign
} from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import AvailabilityManager from '../../components/dashboard/AvailabilityManager';
import { IntegrationsManager } from '../../components/dashboard/IntegrationsManager';

interface Setting {
  key: string;
  value: any;
  category: string;
  description?: string;
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

const DEFAULT_SETTINGS = [
  { key: 'teacher_name', value: 'Mahmoud Elwany', category: 'Profile', description: 'Public facing teacher name' },
  { key: 'bio', value: '', category: 'Profile', description: 'Short biography' },
  { key: 'contact_whatsapp', value: '', category: 'Contact', description: 'WhatsApp contact number' },
  { key: 'contact_email', value: '', category: 'Contact', description: 'Contact email' },
  { key: 'timezone', value: 'Africa/Cairo', category: 'Timezone', description: 'Teacher timezone' },
  { key: 'trial_enabled', value: true, category: 'Policies', description: 'Enable free trials' },
  { key: 'trial_duration', value: 30, category: 'Policies', description: 'Trial duration in minutes' },
  { key: 'cancellation_hours', value: 3, category: 'Policies', description: 'Hours before lesson for cancellation' },
  { key: 'payment_methods', value: ['bank_transfer', 'paypal'], category: 'Payment', description: 'Accepted payment methods' },
  { key: 'payment_instructions', value: '', category: 'Payment', description: 'Instructions for offline payments' },
  { key: 'language', value: 'en', category: 'Preferences', description: 'Default dashboard language' },
  { key: 'theme', value: 'light', category: 'Preferences', description: 'Dashboard visual theme' }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [integrationsStatus, setIntegrationsStatus] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('Profile');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [settingsRes, statusRes, servicesRes] = await Promise.all([
        dashboardFetch('/api/dashboard/settings').catch(() => []),
        dashboardFetch('/api/integrations/status').catch(() => null),
        dashboardFetch('/api/services').catch(() => ({ services: [] }))
      ]);

      // Merge settings with schema defaults
      const merged = DEFAULT_SETTINGS.map(def => {
        const found = (settingsRes || []).find((s: Setting) => s.key === def.key);
        return found ? { ...def, value: found.value } : def;
      });
      setSettings(merged);

      if (statusRes) {
        setIntegrationsStatus(statusRes);
      }

      if (servicesRes && Array.isArray(servicesRes.services)) {
        setServices(servicesRes.services);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load settings data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await dashboardFetch('/api/dashboard/settings', {
        method: 'PATCH',
        body: JSON.stringify({ settings })
      });

      setSuccess('Settings saved successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async (service: ServiceItem) => {
    try {
      setSavingServiceId(service.id);
      setError(null);
      setSuccess(null);

      await dashboardFetch(`/api/dashboard/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          hourly_rate_usd: service.hourly_rate_usd,
          trial_allowed: service.trial_allowed,
          is_active: service.is_active
        })
      });

      setSuccess(`Service '${service.title}' updated successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update service.');
    } finally {
      setSavingServiceId(null);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const getSetting = (key: string) => {
    const item = settings.find(s => s.key === key);
    if (!item) return '';
    return item.value;
  };

  const updateServiceField = (id: string, field: keyof ServiceItem, value: any) => {
    setServices(prev => prev.map(srv => srv.id === id ? { ...srv, [field]: value } : srv));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Loading settings & configurations...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'Profile', icon: User, label: 'Profile & Contact' },
    { id: 'Services', icon: BookOpen, label: 'Services & Rates' },
    { id: 'Policy', icon: Calendar, label: 'Policies & Time' },
    { id: 'Payment', icon: CreditCard, label: 'Payment Methods' },
    { id: 'Integrations', icon: Link, label: 'Integrations & Sync' },
    { id: 'Preferences', icon: Globe, label: 'Preferences' }
  ];

  return (
    <div className="space-y-8 pb-10 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Teacher Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authoritative platform configuration, policies, rates, and integrations.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 min-h-[40px] shadow-xs"
        >
          {saving ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Settings
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-success/15 border border-success/30 text-sm text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation Tabs */}
        <div className="lg:w-64 shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-surface text-foreground shadow-2xs border border-border'
                    : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'opacity-70'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 space-y-6">
          {/* 1. Profile & Contact */}
          {activeTab === 'Profile' && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
              <h2 className="text-lg font-serif font-semibold text-foreground">Profile & Contact Info</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Teacher Name</label>
                  <input
                    type="text"
                    value={getSetting('teacher_name')}
                    onChange={(e) => updateSetting('teacher_name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Biography</label>
                  <textarea
                    value={getSetting('bio')}
                    onChange={(e) => updateSetting('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors resize-none placeholder:text-muted-foreground"
                    placeholder="Brief teacher biography..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={getSetting('contact_whatsapp')}
                      onChange={(e) => updateSetting('contact_whatsapp', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors placeholder:text-muted-foreground"
                      placeholder="+20123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={getSetting('contact_email')}
                      onChange={(e) => updateSetting('contact_email', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors placeholder:text-muted-foreground"
                      placeholder="teacher@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Availability */}
          {activeTab === 'Availability' && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
              <AvailabilityManager />
            </div>
          )}

          {/* 2. Services & Pricing */}
          {activeTab === 'Services' && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
              <div>
                <h2 className="text-lg font-serif font-semibold text-foreground">Curriculum Services & Hourly Rates</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage hourly rates (USD) and trial permissions for active subject offerings.
                </p>
              </div>

              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4">No services loaded from database.</p>
              ) : (
                <div className="space-y-4 divide-y divide-border">
                  {services.map(service => (
                    <div key={service.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold text-foreground">{service.title}</span>
                          <span className="ms-2 text-xs text-muted-foreground">({service.arabic_title})</span>
                        </div>
                        <button
                          onClick={() => handleSaveService(service)}
                          disabled={savingServiceId === service.id}
                          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px]"
                        >
                          {savingServiceId === service.id ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Update Service
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div>
                          <label className="block text-[11px] font-medium text-muted-foreground mb-1">Hourly Rate (USD)</label>
                          <div className="relative">
                            <span className="absolute start-3 top-2.5 text-xs text-muted-foreground font-medium">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={service.hourly_rate_usd}
                              onChange={(e) => updateServiceField(service.id, 'hourly_rate_usd', parseFloat(e.target.value) || 0)}
                              className="w-full ps-7 pe-3 py-2 rounded-xl border border-border bg-surface-subtle text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 sm:pt-0">
                          <input
                            type="checkbox"
                            id={`trial-${service.id}`}
                            checked={service.trial_allowed}
                            onChange={(e) => updateServiceField(service.id, 'trial_allowed', e.target.checked)}
                            className="w-4 h-4 accent-primary rounded border-border"
                          />
                          <label htmlFor={`trial-${service.id}`} className="text-xs font-medium text-foreground cursor-pointer">
                            Trial Permitted
                          </label>
                        </div>

                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                          <input
                            type="checkbox"
                            id={`active-${service.id}`}
                            checked={service.is_active}
                            onChange={(e) => updateServiceField(service.id, 'is_active', e.target.checked)}
                            className="w-4 h-4 accent-primary rounded border-border"
                          />
                          <label htmlFor={`active-${service.id}`} className="text-xs font-medium text-foreground cursor-pointer">
                            Active Offering
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Policies & Timezone */}
          {activeTab === 'Policy' && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
              <h2 className="text-lg font-serif font-semibold text-foreground">Policies & Base Timezone</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Base Timezone</label>
                  <select
                    value={getSetting('timezone')}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none"
                  >
                    <option value="Africa/Cairo">Africa/Cairo (Egypt - GMT+2/3)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (Eastern)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">Teacher scheduling baseline timezone.</p>
                </div>

                <hr className="border-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable Complimentary Free Trials</p>
                    <p className="text-[11px] text-muted-foreground">Permit 1-on-1 trial booking for new students.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer min-h-[32px]">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={getSetting('trial_enabled') === true}
                      onChange={(e) => updateSetting('trial_enabled', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {getSetting('trial_enabled') === true && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Trial Duration (Minutes)</label>
                    <input
                      type="number"
                      max={45}
                      min={15}
                      step={15}
                      value={getSetting('trial_duration')}
                      onChange={(e) => updateSetting('trial_duration', parseInt(e.target.value, 10))}
                      className="w-full sm:w-1/3 px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">Must be between 15 and 45 minutes.</p>
                  </div>
                )}

                <hr className="border-border" />

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Cancellation / Reschedule Notice (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={getSetting('cancellation_hours')}
                    onChange={(e) => updateSetting('cancellation_hours', parseInt(e.target.value, 10))}
                    className="w-full sm:w-1/3 px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Students may self-service cancel or reschedule up to {getSetting('cancellation_hours')} hours before start.</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Payment Methods & Instructions */}
          {activeTab === 'Payment' && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
              <h2 className="text-lg font-serif font-semibold text-foreground">Accepted Payment Methods & Offline Instructions</h2>
              <p className="text-xs text-muted-foreground">
                Select allowed payment channels and configure instructions shown during payment claim submission.
              </p>
              
              <div className="space-y-3">
                {[
                  { id: 'bank_transfer', label: 'International Bank Transfer / IBAN' },
                  { id: 'ach', label: 'ACH / US Routing' },
                  { id: 'payoneer', label: 'Payoneer' },
                  { id: 'paypal', label: 'PayPal' },
                  { id: 'wise', label: 'Wise' }
                ].map(method => {
                  const methods = (Array.isArray(getSetting('payment_methods')) ? getSetting('payment_methods') : []) as string[];
                  const isChecked = methods.includes(method.id);
                  
                  return (
                    <label key={method.id} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-surface-subtle transition-colors min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateSetting('payment_methods', [...methods, method.id]);
                          } else {
                            updateSetting('payment_methods', methods.filter(m => m !== method.id));
                          }
                        }}
                        className="w-4 h-4 accent-primary rounded border-border"
                      />
                      <span className="text-sm font-medium text-foreground">{method.label}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Instructions for Students</label>
                <textarea
                  value={getSetting('payment_instructions')}
                  onChange={(e) => updateSetting('payment_instructions', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors resize-none placeholder:text-muted-foreground"
                  placeholder="Provide details or routing numbers for manual payment submission..."
                />
              </div>
            </div>
          )}

          {/* 5. Integrations & Sync */}
          {activeTab === 'Integrations' && (
            <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs">
              <IntegrationsManager lang={(getSetting('language') as any) || 'en'} />
            </div>
          )}

          {/* 6. Preferences */}
          {activeTab === 'Preferences' && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-2xs">
              <h2 className="text-lg font-serif font-semibold text-foreground">Dashboard Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Language</label>
                  <select
                    value={getSetting('language')}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Theme</label>
                  <select
                    value={getSetting('theme')}
                    onChange={(e) => updateSetting('theme', e.target.value)}
                    className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none"
                  >
                    <option value="light">Luxury Light (Warm Ivory × Sage)</option>
                    <option value="dark">Dark Twilight</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
