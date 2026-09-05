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
        <div className="w-10 h-10 border-3 border-[#8FAE9B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#362E3B]/70 dark:text-[#D5D0CA]">Loading settings & configurations...</p>
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
          <h1 className="text-2xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3] flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#8FAE9B]" />
            Teacher Settings
          </h1>
          <p className="text-sm text-[#362E3B]/70 dark:text-[#D5D0CA] mt-1">
            Authoritative platform configuration, policies, rates, and integrations.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-[#8FAE9B] text-white text-sm font-medium hover:bg-[#6F907D] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Settings
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs border border-[#D5D0CA]/30 dark:border-[#3E3545]/30'
                    : 'text-[#362E3B]/60 dark:text-[#D5D0CA]/60 hover:bg-white/50 dark:hover:bg-[#2A2431]/50 hover:text-[#362E3B] dark:hover:text-[#F5E6D3]'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#8FAE9B]' : 'opacity-70'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 space-y-6">
          {/* 1. Profile & Contact */}
          {activeTab === 'Profile' && (
            <div className="bg-white dark:bg-[#2A2431] rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 p-6 space-y-6">
              <h2 className="text-lg font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Profile & Contact Info</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Teacher Name</label>
                  <input
                    type="text"
                    value={getSetting('teacher_name')}
                    onChange={(e) => updateSetting('teacher_name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Biography</label>
                  <textarea
                    value={getSetting('bio')}
                    onChange={(e) => updateSetting('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none transition-colors resize-none"
                    placeholder="Brief teacher biography..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={getSetting('contact_whatsapp')}
                      onChange={(e) => updateSetting('contact_whatsapp', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none transition-colors"
                      placeholder="+20123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={getSetting('contact_email')}
                      onChange={(e) => updateSetting('contact_email', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none transition-colors"
                      placeholder="teacher@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Services & Pricing */}
          {activeTab === 'Services' && (
            <div className="bg-white dark:bg-[#2A2431] rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Curriculum Services & Hourly Rates</h2>
                <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]">
                  Manage hourly rates (USD) and trial permissions for active subject offerings.
                </p>
              </div>

              {services.length === 0 ? (
                <p className="text-sm text-stone-500 italic py-4">No services loaded from database.</p>
              ) : (
                <div className="space-y-4 divide-y divide-[#D5D0CA]/30 dark:divide-[#3E3545]/30">
                  {services.map(service => (
                    <div key={service.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold text-[#362E3B] dark:text-[#F5E6D3]">{service.title}</span>
                          <span className="ml-2 text-xs text-stone-400">({service.arabic_title})</span>
                        </div>
                        <button
                          onClick={() => handleSaveService(service)}
                          disabled={savingServiceId === service.id}
                          className="self-start sm:self-auto px-3 py-1 rounded-lg bg-[#8FAE9B]/10 hover:bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {savingServiceId === service.id ? <div className="w-3 h-3 border-2 border-[#6F907D] border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Update Service
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div>
                          <label className="block text-[11px] font-medium text-stone-500 mb-1">Hourly Rate (USD)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-medium">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={service.hourly_rate_usd}
                              onChange={(e) => updateServiceField(service.id, 'hourly_rate_usd', parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-sm text-[#362E3B] dark:text-[#F5E6D3] outline-none focus:border-[#8FAE9B]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 sm:pt-0">
                          <input
                            type="checkbox"
                            id={`trial-${service.id}`}
                            checked={service.trial_allowed}
                            onChange={(e) => updateServiceField(service.id, 'trial_allowed', e.target.checked)}
                            className="w-4 h-4 text-[#8FAE9B] rounded border-stone-300"
                          />
                          <label htmlFor={`trial-${service.id}`} className="text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3]">
                            Trial Permitted
                          </label>
                        </div>

                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                          <input
                            type="checkbox"
                            id={`active-${service.id}`}
                            checked={service.is_active}
                            onChange={(e) => updateServiceField(service.id, 'is_active', e.target.checked)}
                            className="w-4 h-4 text-[#8FAE9B] rounded border-stone-300"
                          />
                          <label htmlFor={`active-${service.id}`} className="text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3]">
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
            <div className="bg-white dark:bg-[#2A2431] rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 p-6 space-y-6">
              <h2 className="text-lg font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Policies & Base Timezone</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Base Timezone</label>
                  <select
                    value={getSetting('timezone')}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none"
                  >
                    <option value="Africa/Cairo">Africa/Cairo (Egypt - GMT+2/3)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (Eastern)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-stone-500">Teacher scheduling baseline timezone.</p>
                </div>

                <hr className="border-[#D5D0CA]/30 dark:border-[#3E3545]/30" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#362E3B] dark:text-[#F5E6D3]">Enable Complimentary Free Trials</p>
                    <p className="text-[11px] text-stone-500">Permit 1-on-1 trial booking for new students.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={getSetting('trial_enabled') === true}
                      onChange={(e) => updateSetting('trial_enabled', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8FAE9B]/50 rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-[#8FAE9B]"></div>
                  </label>
                </div>

                {getSetting('trial_enabled') === true && (
                  <div>
                    <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Trial Duration (Minutes)</label>
                    <input
                      type="number"
                      max={45}
                      min={15}
                      step={15}
                      value={getSetting('trial_duration')}
                      onChange={(e) => updateSetting('trial_duration', parseInt(e.target.value, 10))}
                      className="w-full sm:w-1/3 px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none transition-colors"
                    />
                    <p className="mt-1 text-[11px] text-stone-500">Must be between 15 and 45 minutes.</p>
                  </div>
                )}

                <hr className="border-[#D5D0CA]/30 dark:border-[#3E3545]/30" />

                <div>
                  <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Cancellation / Reschedule Notice (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={getSetting('cancellation_hours')}
                    onChange={(e) => updateSetting('cancellation_hours', parseInt(e.target.value, 10))}
                    className="w-full sm:w-1/3 px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-stone-500">Students may self-service cancel or reschedule up to {getSetting('cancellation_hours')} hours before start.</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Payment Methods & Instructions */}
          {activeTab === 'Payment' && (
            <div className="bg-white dark:bg-[#2A2431] rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 p-6 space-y-6">
              <h2 className="text-lg font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Accepted Payment Methods & Offline Instructions</h2>
              <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]">
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
                    <label key={method.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
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
                        className="w-4 h-4 text-[#8FAE9B] border-stone-300 rounded focus:ring-[#8FAE9B]"
                      />
                      <span className="text-sm font-medium text-[#362E3B] dark:text-[#F5E6D3]">{method.label}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Payment Instructions for Students</label>
                <textarea
                  value={getSetting('payment_instructions')}
                  onChange={(e) => updateSetting('payment_instructions', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none transition-colors resize-none"
                  placeholder="Provide details or routing numbers for manual payment submission..."
                />
              </div>
            </div>
          )}

          {/* 5. Integrations & Sync */}
          {activeTab === 'Integrations' && (
            <div className="bg-white dark:bg-[#2A2431] rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Integrations & External Synchronization</h2>
                <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]">
                  Connection status for Google Calendar and Zoom meeting engines. Secrets are securely managed on the server.
                </p>
              </div>

              <div className="space-y-4">
                {/* Google Calendar */}
                <div className="p-4 rounded-xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[#362E3B] dark:text-[#F5E6D3] block">Google Calendar</span>
                    <span className="text-xs text-stone-500">
                      {integrationsStatus?.googleCalendar?.isConnected 
                        ? `Connected as ${integrationsStatus.googleCalendar.accountEmail}` 
                        : integrationsStatus?.googleCalendar?.isConfigured 
                          ? 'Configured (OAuth Ready)' 
                          : 'Not Configured'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    integrationsStatus?.googleCalendar?.isConnected 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                  }`}>
                    {integrationsStatus?.googleCalendar?.isConnected ? 'Active' : 'Offline'}
                  </span>
                </div>

                {/* Zoom */}
                <div className="p-4 rounded-xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[#362E3B] dark:text-[#F5E6D3] block">Zoom Video Integration</span>
                    <span className="text-xs text-stone-500">
                      {integrationsStatus?.zoom?.isConfigured ? 'OAuth / Server Credentials Active' : 'Not Configured'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    integrationsStatus?.zoom?.isConfigured 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                  }`}>
                    {integrationsStatus?.zoom?.isConfigured ? 'Active' : 'Offline'}
                  </span>
                </div>

                {/* Brevo Transactional Email */}
                <div className="p-4 rounded-xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[#362E3B] dark:text-[#F5E6D3] block">Brevo Transactional Email</span>
                    <span className="text-xs text-stone-500">
                      {integrationsStatus?.email?.isConfigured
                        ? `Active — ${integrationsStatus.email.senderName} (${integrationsStatus.email.senderEmail})`
                        : 'Not Configured (Requires BREVO_API_KEY)'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    integrationsStatus?.email?.isConfigured 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                  }`}>
                    {integrationsStatus?.email?.isConfigured ? 'Active' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6. Preferences */}
          {activeTab === 'Preferences' && (
            <div className="bg-white dark:bg-[#2A2431] rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 p-6 space-y-6">
              <h2 className="text-lg font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Dashboard Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Language</label>
                  <select
                    value={getSetting('language')}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA] mb-1">Theme</label>
                  <select
                    value={getSetting('theme')}
                    onChange={(e) => updateSetting('theme', e.target.value)}
                    className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] text-sm focus:border-[#8FAE9B] outline-none"
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
