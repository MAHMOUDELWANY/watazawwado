import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Globe, Phone, Clock, Target, Users, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';

export interface StudentProfilePageProps {
  profile?: any;
  session?: any;
  onProfileUpdated?: (updated: any) => void;
}

export default function StudentProfilePage({
  profile: initialProfile,
  session: propSession,
  onProfileUpdated
}: StudentProfilePageProps) {
  const auth = useTeacherAuth();
  const effectiveSession = propSession || auth.session;
  const user = auth.user;

  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = effectiveSession?.access_token;
      if (!token) {
        throw new Error('Authentication required. Session token missing.');
      }

      const res = await fetch('/api/student/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to load profile.');
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
      setError(err.message || 'Error loading profile.');
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
        throw new Error('Authentication required. Session token missing.');
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
        throw new Error(data.error || 'Failed to update profile.');
      }

      setSuccess('Profile and booking preferences updated successfully.');
      const updated = { ...profile, ...data, bookingPreference: data.bookingPreference || bookingPreference };
      setProfile(updated);
      onProfileUpdated?.(updated);
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
        {/* Editable Personal Information & Booking Preferences */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-8 shadow-xs">
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

              {/* Booking Preference Setting Section */}
              <div className="pt-4 border-t border-[#E2DDD5]/60 dark:border-[#3E3545]/60">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0]">
                    Default Booking Preference
                  </label>
                  <p className="text-[11px] text-[#7A827B] dark:text-[#A69FA8] mt-0.5">
                    Pre-select who you typically schedule lessons for. You can always toggle this on individual bookings.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      bookingPreference === 'self'
                        ? 'border-[#6F907D] bg-[#6F907D]/5 dark:bg-[#6F907D]/10 text-[#30332F] dark:text-[#F8F6F0]'
                        : 'border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635] text-[#626A64] dark:text-[#A69FA8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookingPreference"
                      value="self"
                      checked={bookingPreference === 'self'}
                      onChange={() => setBookingPreference('self')}
                      className="mt-0.5 text-[#6F907D] focus:ring-[#8FAE9B]"
                    />
                    <div>
                      <span className="block text-xs font-bold text-[#30332F] dark:text-[#F8F6F0]">Myself</span>
                      <span className="block text-[11px] text-[#7A827B] dark:text-[#A69FA8] mt-0.5">
                        Lessons are scheduled for your own learning journey.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                      !canBookForChild
                        ? 'opacity-60 cursor-not-allowed border-[#E2DDD5] dark:border-[#3E3545] bg-gray-50 dark:bg-[#201A25]'
                        : bookingPreference === 'child'
                        ? 'border-[#6F907D] bg-[#6F907D]/5 dark:bg-[#6F907D]/10 text-[#30332F] dark:text-[#F8F6F0] cursor-pointer'
                        : 'border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635] text-[#626A64] dark:text-[#A69FA8] cursor-pointer'
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
                      className="mt-0.5 text-[#6F907D] focus:ring-[#8FAE9B] disabled:opacity-50"
                    />
                    <div>
                      <span className="block text-xs font-bold text-[#30332F] dark:text-[#F8F6F0]">My child</span>
                      <span className="block text-[11px] text-[#7A827B] dark:text-[#A69FA8] mt-0.5">
                        {canBookForChild
                          ? 'Lessons are scheduled for your registered child learner.'
                          : 'Available for accounts with registered child/guardian relationships.'}
                      </span>
                    </div>
                  </label>
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
        </div>

        {/* Learning Status & Guardian / Children Info */}
        <div className="space-y-6">
          {/* Linked Children Card (if guardian / parent) */}
          {linkedChildren.length > 0 && (
            <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-serif font-bold mb-4 flex items-center gap-2 text-[#30332F] dark:text-[#F8F6F0]">
                <Users className="w-4 h-4 text-[#8FAE9B]" />
                Registered Children ({linkedChildren.length})
              </h3>
              <div className="space-y-3">
                {linkedChildren.map((child: any) => (
                  <div
                    key={child.id}
                    className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2635] border border-[#E2DDD5]/60 dark:border-[#3E3545]/60 text-xs"
                  >
                    <div className="font-semibold text-[#30332F] dark:text-[#F8F6F0]">
                      {child.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[#7A827B] dark:text-[#A69FA8]">
                      <span className="capitalize">{child.learnerType || 'Child'}</span>
                      {child.currentLevel && (
                        <>
                          <span>•</span>
                          <span className="capitalize text-[#6F907D] dark:text-[#8FAE9B]">
                            {child.currentLevel}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
