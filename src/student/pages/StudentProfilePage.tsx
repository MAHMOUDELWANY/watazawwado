import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Globe, Phone, Clock, Target, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';

export default function StudentProfilePage() {
  const { user } = useTeacherAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/student/me', { headers });
      if (!res.ok) {
        throw new Error('Failed to load profile.');
      }

      const data = await res.json();
      setProfile(data);
      setName(data.name || '');
      setTimezone(data.timezone || 'UTC');
      setWhatsapp(data.whatsapp || '');
      setCountry(data.country || '');
    } catch (err: any) {
      setError(err.message || 'Error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const token = localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/student/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          timezone: timezone.trim(),
          whatsapp: whatsapp.trim() || null,
          country: country.trim() || null,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setSuccess('Profile updated successfully.');
      setProfile((prev: any) => ({ ...prev, ...data }));
    } catch (err: any) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#6F907D] dark:text-[#8FAE9B]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#30332F] dark:text-[#F8F6F0]">
          Student Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA] mt-1">
          Manage your personal details, timezone, and lesson contact information.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editable Personal Information */}
        <div className="lg:col-span-2 bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-serif font-bold mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-[#8FAE9B]" />
            Personal Details
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                Email Address (Managed by account)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || user?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#EAE8E3] dark:bg-[#211B27] text-sm opacity-75 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                  Timezone (IANA)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#8FAE9B] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8FAE9B] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                Country
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#8FAE9B] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Canada, United States, United Kingdom"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#6F907D] hover:bg-[#557161] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Learning Status & Guardian Info */}
        <div className="space-y-6">
          {/* Level & Subject Card */}
          <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-serif font-bold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#8FAE9B]" />
              Learning Assessment
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#E2DDD5]/60 dark:border-[#3E3545]/60">
                <span className="text-[#7A827B] dark:text-[#A69FA8]">Learner Type</span>
                <span className="font-semibold capitalize text-[#30332F] dark:text-[#F8F6F0]">
                  {profile?.learnerType || 'Adult'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#E2DDD5]/60 dark:border-[#3E3545]/60">
                <span className="text-[#7A827B] dark:text-[#A69FA8]">Current Level</span>
                <span className="font-semibold capitalize text-[#6F907D] dark:text-[#8FAE9B]">
                  {profile?.currentLevel || 'Beginner'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#E2DDD5]/60 dark:border-[#3E3545]/60">
                <span className="text-[#7A827B] dark:text-[#A69FA8]">Primary Subject</span>
                <span className="font-semibold text-[#30332F] dark:text-[#F8F6F0]">
                  {profile?.learningInterest || 'Quran Reading'}
                </span>
              </div>

              <div className="py-2">
                <span className="text-[#7A827B] dark:text-[#A69FA8] block mb-1">Target Goal</span>
                <span className="text-[#30332F] dark:text-[#F8F6F0] italic">
                  "{profile?.learningGoal || 'Personalized mastery with Ustadh Mahmoud'}"
                </span>
              </div>
            </div>
          </div>

          {/* Parent Info (if child) */}
          {profile?.guardian && (
            <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-serif font-bold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8FAE9B]" />
                Parent / Guardian
              </h3>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[#7A827B] dark:text-[#A69FA8] block">Parent Name</span>
                  <span className="font-semibold">{profile.guardian.parentName}</span>
                </div>
                {profile.guardian.parentWhatsapp && (
                  <div>
                    <span className="text-[#7A827B] dark:text-[#A69FA8] block">Parent WhatsApp</span>
                    <span className="font-semibold">{profile.guardian.parentWhatsapp}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
