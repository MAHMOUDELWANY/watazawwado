import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Globe, Phone, Clock, Target, Users, CheckCircle2, AlertCircle, Loader2, Sparkles, Terminal, ShieldCheck, Copy, Check, Activity } from 'lucide-react';
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

  // Temporary Authenticated Diagnostic State (Task 0.58-C1)
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResult, setDiagResult] = useState<any | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [copiedDiag, setCopiedDiag] = useState(false);

  const runIdentityDiagnostic = async () => {
    setDiagRunning(true);
    setDiagError(null);
    setDiagResult(null);
    setCopiedDiag(false);

    try {
      const token = effectiveSession?.access_token;
      if (!token) {
        throw new Error('Authentication required. Active Supabase session token is missing.');
      }

      // Safe client project ref extraction
      const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      let clientRef = '';
      try {
        if (envUrl) {
          const u = new URL(envUrl);
          const parts = u.hostname.toLowerCase().split('.');
          if (parts.length >= 3 && parts[1] === 'supabase' && parts[2] === 'co') {
            clientRef = parts[0];
          }
        }
      } catch {}

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`
      };
      if (clientRef) {
        headers['x-client-project-ref'] = clientRef;
      }

      const res = await fetch('/api/student-auth-diagnostic', {
        method: 'GET',
        headers
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Diagnostic request failed with status ${res.status}`);
      }

      // Safe sanitized result (never storing or rendering raw tokens)
      const safeData = {
        authenticated: Boolean(data.authenticated),
        tokenVerification: data.tokenVerification || 'unknown',
        studentAuthorization: data.studentAuthorization || 'unknown',
        backendProjectRef: data.backendProjectRef || 'unknown',
        projectConsistency: data.projectConsistency || 'UNKNOWN',
        authUserIdHash: data.authUserIdHash || 'none',
        studentIdHash: data.studentIdHash || 'none',
        hasStudentUser: Boolean(data.hasStudentUser),
        hasStudentId: Boolean(data.hasStudentId),
        hasStudentProfile: Boolean(data.hasStudentProfile),
        stage: data.stage || 'UNKNOWN',
        timestamp: new Date().toISOString()
      };

      setDiagResult(safeData);
    } catch (err: any) {
      setDiagError(err.message || 'Error running identity diagnostic probe.');
    } finally {
      setDiagRunning(false);
    }
  };

  const copyDiagnosticResult = () => {
    if (!diagResult) return;
    navigator.clipboard.writeText(JSON.stringify(diagResult, null, 2));
    setCopiedDiag(true);
    setTimeout(() => setCopiedDiag(false), 2000);
  };

  // Temporary /api/student/me Endpoint Probe State (Task 0.58-D)
  const [probeRunning, setProbeRunning] = useState(false);
  const [probeResult, setProbeResult] = useState<any | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [copiedProbe, setCopiedProbe] = useState(false);

  const redactId = (id?: string | null): string => {
    if (!id) return 'none';
    if (id.length <= 8) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  const probeStudentMe = async () => {
    setProbeRunning(true);
    setProbeError(null);
    setProbeResult(null);
    setCopiedProbe(false);

    try {
      const token = effectiveSession?.access_token;
      if (!token) {
        throw new Error('Authentication required. Active Supabase session token is missing.');
      }

      const res = await fetch('/api/student/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const status = res.status;
      let rawData: any = null;
      try {
        rawData = await res.json();
      } catch {
        rawData = { rawText: 'Non-JSON response' };
      }

      const keys = rawData && typeof rawData === 'object' && !Array.isArray(rawData) ? Object.keys(rawData) : [];

      const safeOutput: any = {
        httpStatus: status,
        request: 'GET /api/student/me',
        authenticatedSessionPresent: 'YES',
        responseStatus: status === 200 ? 'OK' : status === 404 ? 'NOT_FOUND' : 'ERROR',
        responseKeys: keys,
        diagHeaders: {
          'x-student-me-branch': res.headers.get('x-student-me-branch'),
          'x-student-auth-verified': res.headers.get('x-student-auth-verified'),
          'x-student-record-found': res.headers.get('x-student-record-found'),
          'x-student-has-student-id': res.headers.get('x-student-has-student-id'),
          'x-student-me-db-code': res.headers.get('x-student-me-db-code')
        },
        timestamp: new Date().toISOString()
      };

      if (status === 200) {
        const studentObj = rawData?.student || rawData;
        safeOutput.hasStudent = Boolean(rawData?.student || rawData?.id);
        safeOutput.hasGuardians = Boolean(rawData?.guardians || rawData?.guardian);
        safeOutput.hasGoals = Boolean(rawData?.goals);
        safeOutput.hasLinkedChildren = Boolean(rawData?.linkedChildren);
        safeOutput.studentId = redactId(rawData?.id || rawData?.student?.id);
        safeOutput.learnerType = studentObj?.learner_type || studentObj?.learnerType || 'unknown';
        safeOutput.currentLevel = studentObj?.current_level || studentObj?.currentLevel || 'unknown';
        safeOutput.status = studentObj?.status || 'unknown';
        safeOutput.bookingPreference = studentObj?.booking_preference || studentObj?.bookingPreference || 'unknown';
      } else {
        // EXACT JSON body captured on 404 or any other error (Section 4 requirement)
        safeOutput.exactBody = rawData;
        safeOutput.safeError = rawData?.error || `Request returned HTTP ${status}`;
      }

      setProbeResult(safeOutput);
    } catch (err: any) {
      setProbeError(err.message || 'Error executing /api/student/me probe.');
    } finally {
      setProbeRunning(false);
    }
  };

  const copyProbeResult = () => {
    if (!probeResult) return;
    navigator.clipboard.writeText(JSON.stringify(probeResult, null, 2));
    setCopiedProbe(true);
    setTimeout(() => setCopiedProbe(false), 2000);
  };

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

          {/* Temporary Diagnostic Probe Card (Task 0.58-C1) */}
          <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 shadow-xs" id="identity-diagnostic-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-serif font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#8FAE9B]" />
                Identity Diagnostic
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#8FAE9B]/10 text-[#6F907D] dark:text-[#8FAE9B] font-semibold">
                Task 0.58-C1
              </span>
            </div>

            <p className="text-xs text-[#7A827B] dark:text-[#A69FA8] mb-4">
              Authenticated probe against <code className="text-[11px] font-mono text-[#30332F] dark:text-[#F8F6F0]">/api/student-auth-diagnostic</code> using active session token.
            </p>

            <button
              id="btn-run-identity-diagnostic"
              type="button"
              onClick={runIdentityDiagnostic}
              disabled={diagRunning}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8FAE9B]/15 hover:bg-[#8FAE9B]/25 text-[#30332F] dark:text-[#F8F6F0] border border-[#8FAE9B]/30 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {diagRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running Diagnostic...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6F907D] dark:text-[#8FAE9B]" />
                  Run Identity Diagnostic
                </>
              )}
            </button>

            {diagError && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{diagError}</span>
              </div>
            )}

            {diagResult && (
              <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 dark:border-[#3E3545]/60 space-y-2.5 text-xs" id="identity-diagnostic-results">
                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Authentication</span>
                  <span className={`font-semibold ${diagResult.authenticated ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                    {diagResult.authenticated ? 'Verified (200 OK)' : 'Failed'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Backend Project Ref</span>
                  <span className="font-mono text-[11px] font-semibold text-[#30332F] dark:text-[#F8F6F0]">
                    {diagResult.backendProjectRef}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Project Consistency</span>
                  <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    diagResult.projectConsistency === 'MATCH'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : diagResult.projectConsistency === 'MISMATCH'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {diagResult.projectConsistency}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Student Record</span>
                  <span className={`font-semibold ${diagResult.hasStudentId ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {diagResult.hasStudentId ? 'Linked / Found' : 'Unlinked (No Student ID)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Auth User Hash</span>
                  <span className="font-mono text-[11px] text-[#30332F] dark:text-[#F8F6F0]">
                    {diagResult.authUserIdHash}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Student ID Hash</span>
                  <span className="font-mono text-[11px] text-[#30332F] dark:text-[#F8F6F0]">
                    {diagResult.studentIdHash}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Diagnostic Stage</span>
                  <span className="font-mono text-[11px] text-[#6F907D] dark:text-[#8FAE9B]">
                    {diagResult.stage}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-[#7A827B] dark:text-[#A69FA8]">Safe JSON Output</span>
                    <button
                      type="button"
                      onClick={copyDiagnosticResult}
                      className="text-[11px] text-[#6F907D] dark:text-[#8FAE9B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedDiag ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-[#1D1822] text-[#F8F6F0] font-mono text-[10px] overflow-x-auto max-h-40 border border-[#3E3545]">
                    {JSON.stringify(diagResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Temporary /api/student/me Endpoint Probe Card (Task 0.58-D) */}
          <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 shadow-xs" id="student-me-probe-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-serif font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8FAE9B]" />
                Endpoint Probe (/me)
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#8FAE9B]/10 text-[#6F907D] dark:text-[#8FAE9B] font-semibold">
                Task 0.58-D
              </span>
            </div>

            <p className="text-xs text-[#7A827B] dark:text-[#A69FA8] mb-4">
              Direct probe against <code className="text-[11px] font-mono text-[#30332F] dark:text-[#F8F6F0]">GET /api/student/me</code> using active Supabase session token.
            </p>

            <button
              id="btn-probe-student-me"
              type="button"
              onClick={probeStudentMe}
              disabled={probeRunning}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8FAE9B]/15 hover:bg-[#8FAE9B]/25 text-[#30332F] dark:text-[#F8F6F0] border border-[#8FAE9B]/30 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {probeRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Probing /api/student/me...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-[#6F907D] dark:text-[#8FAE9B]" />
                  Probe Student /me
                </>
              )}
            </button>

            {probeError && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{probeError}</span>
              </div>
            )}

            {probeResult && (
              <div className="mt-4 pt-3 border-t border-[#E2DDD5]/60 dark:border-[#3E3545]/60 space-y-2.5 text-xs" id="student-me-probe-results">
                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">HTTP Status</span>
                  <span className={`font-mono font-bold text-sm ${probeResult.httpStatus === 200 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {probeResult.httpStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Request</span>
                  <span className="font-mono text-[11px] text-[#30332F] dark:text-[#F8F6F0]">
                    {probeResult.request}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Session Present</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {probeResult.authenticatedSessionPresent}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827B] dark:text-[#A69FA8]">Response Status</span>
                  <span className="font-mono text-[11px] font-semibold text-[#30332F] dark:text-[#F8F6F0]">
                    {probeResult.responseStatus}
                  </span>
                </div>

                {probeResult.diagHeaders && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A827B] dark:text-[#A69FA8]">Branch Header</span>
                    <span className="font-mono text-[11px] text-[#6F907D] dark:text-[#8FAE9B]">
                      {probeResult.diagHeaders['x-student-me-branch'] || 'none'}
                    </span>
                  </div>
                )}

                {probeResult.httpStatus === 200 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A827B] dark:text-[#A69FA8]">Student ID</span>
                      <span className="font-mono text-[11px] text-[#30332F] dark:text-[#F8F6F0]">
                        {probeResult.studentId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A827B] dark:text-[#A69FA8]">Response Keys</span>
                      <span className="font-mono text-[10px] text-[#7A827B] dark:text-[#A69FA8]">
                        {probeResult.responseKeys?.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7A827B] dark:text-[#A69FA8]">Payload Flags</span>
                      <span className="font-mono text-[10px] text-[#30332F] dark:text-[#F8F6F0]">
                        {`student:${probeResult.hasStudent} guardians:${probeResult.hasGuardians} goals:${probeResult.hasGoals}`}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A827B] dark:text-[#A69FA8]">Safe Error</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {probeResult.safeError}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-[#7A827B] dark:text-[#A69FA8]">
                      {probeResult.httpStatus === 404 ? 'Exact 404 Body' : 'Safe Output'}
                    </span>
                    <button
                      type="button"
                      onClick={copyProbeResult}
                      className="text-[11px] text-[#6F907D] dark:text-[#8FAE9B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedProbe ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-[#1D1822] text-[#F8F6F0] font-mono text-[10px] overflow-x-auto max-h-40 border border-[#3E3545]">
                    {JSON.stringify(probeResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
