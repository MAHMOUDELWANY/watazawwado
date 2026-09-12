import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { BookingFlow } from '../../components/booking/BookingFlow';
import { BOOKING_SERVICES } from '../../booking/mockData';
import { BookingFormData, BookingMode, ProficiencyLevel } from '../../booking/types';
import { useTeacherAuth } from '../../lib/auth';

export interface StudentBookingPageProps {
  profile?: any;
  session?: any;
}

export interface TrialEligibilityResult {
  canBookTrial: boolean;
  hasUsedTrial: boolean;
  trialDisabledReason?: string;
}

/**
 * Pure evaluation of trial eligibility based on verified bookings history.
 * Invariant: An API failure or unverified state must NEVER result in canBookTrial = true.
 */
export function calculateTrialEligibility(
  bookings: any[] | null,
  bookingsError: string | null
): TrialEligibilityResult {
  if (bookingsError) {
    return {
      canBookTrial: false,
      hasUsedTrial: false,
      trialDisabledReason: 'Unable to verify trial eligibility due to a network or server issue. Free trial is unavailable until verified.'
    };
  }

  if (bookings === null) {
    return {
      canBookTrial: false,
      hasUsedTrial: false,
      trialDisabledReason: 'Verifying booking history...'
    };
  }

  const hasUsedTrial = bookings.some(
    (b) => (b.booking_type === 'trial' || b.bookingType === 'trial') && b.status !== 'cancelled'
  );

  return {
    canBookTrial: !hasUsedTrial,
    hasUsedTrial,
    trialDisabledReason: hasUsedTrial
      ? 'You have already scheduled or completed your complimentary trial lesson.'
      : undefined
  };
}

/**
 * Pure mapping of authenticated Student Profile (Adult or Child with Guardian)
 * into initial BookingFormData for BookingFlow.
 */
export function mapStudentProfileToBookingInitialData(
  profile: any,
  canBookTrial: boolean
): {
  initialData: Partial<BookingFormData>;
  matchedServiceId: string;
  initialMode: BookingMode;
} {
  if (!profile) {
    return {
      initialData: {},
      matchedServiceId: 'quran-reading',
      initialMode: canBookTrial ? 'trial' : 'regular'
    };
  }

  let matchedServiceId = 'quran-reading';
  if (profile.learningInterest) {
    const interest = String(profile.learningInterest).toLowerCase();
    const found = BOOKING_SERVICES.find(
      (s) =>
        s.id === interest ||
        s.group.toLowerCase() === interest ||
        s.name.toLowerCase().includes(interest) ||
        (interest.includes('reading') && s.id === 'quran-reading') ||
        (interest.includes('tajweed') && s.id === 'tajweed') ||
        (interest.includes('hifz') && s.id === 'quran-memorization') ||
        (interest.includes('memorization') && s.id === 'quran-memorization') ||
        (interest.includes('islamic') && s.id === 'islamic-studies') ||
        (interest.includes('arabic') && s.id === 'arabic') ||
        (interest.includes('english') && s.id === 'english')
    );
    if (found) {
      matchedServiceId = found.id;
    }
  }

  const isChildAccount = Boolean(
    profile.guardian &&
    (profile.guardian.parentName || profile.guardian.relationship || profile.guardian.parentEmail)
  );

  const mappedLevel: ProficiencyLevel =
    profile.currentLevel === 'beginner' ||
    profile.currentLevel === 'elementary' ||
    profile.currentLevel === 'intermediate' ||
    profile.currentLevel === 'advanced'
      ? profile.currentLevel
      : 'beginner';

  const initialMode: BookingMode = canBookTrial ? 'trial' : 'regular';

  const initialData: Partial<BookingFormData> = {
    serviceId: matchedServiceId,
    mode: initialMode,
    audience: isChildAccount ? 'child' : 'adult',
    studentName: profile.name || '',
    email: profile.email || '',
    whatsapp: profile.whatsapp || '',
    currentLevel: mappedLevel,
    notes: profile.learningNeeds || '',
    goal: profile.learningGoal || '',
    childName: isChildAccount ? profile.name || '' : '',
    childLevel: mappedLevel,
    parentName: isChildAccount ? profile.guardian?.parentName || '' : '',
    parentEmail: isChildAccount ? profile.guardian?.parentEmail || profile.email || '' : '',
    parentWhatsapp: isChildAccount
      ? profile.guardian?.parentWhatsapp || profile.guardian?.parentPhone || profile.whatsapp || ''
      : '',
    parentNotes: isChildAccount ? profile.learningNeeds || '' : '',
    timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    studentId: profile.id
  };

  return {
    initialData,
    matchedServiceId,
    initialMode
  };
}

export default function StudentBookingPage({ profile: initialProfile, session: propSession }: StudentBookingPageProps) {
  const navigate = useNavigate();
  const auth = useTeacherAuth();
  const activeSession = propSession || auth.session;
  // Authenticated Student booking flow must strictly use the session supplied by the auth architecture
  const accessToken = activeSession?.access_token || null;

  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [profileLoading, setProfileLoading] = useState<boolean>(!initialProfile && Boolean(accessToken));
  const [profileError, setProfileError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<any[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(Boolean(accessToken));
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (token?: string | null) => {
    const effectiveToken = token !== undefined ? token : accessToken;
    if (!effectiveToken) {
      setBookings(null);
      setBookingsLoading(false);
      return;
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${effectiveToken}`,
    };

    try {
      setBookingsLoading(true);
      setBookingsError(null);

      const bookRes = await fetch('/api/student/bookings', { headers });
      if (!bookRes.ok) {
        throw new Error(`Failed to load booking history (${bookRes.status})`);
      }
      const bookData = await bookRes.json();
      if (!Array.isArray(bookData)) {
        throw new Error('Invalid booking history response.');
      }
      setBookings(bookData);
      setBookingsError(null);
    } catch (err: any) {
      console.error('[StudentBookingPage] Error loading bookings:', err);
      setBookings(null);
      setBookingsError(err.message || 'Unable to verify your booking history and trial eligibility.');
    } finally {
      setBookingsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    let isMounted = true;

    async function loadStudentData() {
      if (!accessToken) {
        // Do not attempt authenticated Student API calls without an authenticated session
        if (isMounted) {
          setProfileLoading(false);
          setBookingsLoading(false);
        }
        return;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };

      // 1. Load Profile if not provided
      let currentProf = initialProfile;
      if (!currentProf) {
        try {
          setProfileLoading(true);
          setProfileError(null);
          const profRes = await fetch('/api/student/me', { headers });
          if (!profRes.ok) {
            throw new Error(`Failed to load student profile (${profRes.status}).`);
          }
          currentProf = await profRes.json();
          if (isMounted) setProfile(currentProf);
        } catch (err: any) {
          if (isMounted) setProfileError(err.message || 'Unable to load profile.');
        } finally {
          if (isMounted) setProfileLoading(false);
        }
      }

      // 2. Load Bookings for trial eligibility
      if (isMounted) {
        await fetchBookings(accessToken);
      }
    }

    loadStudentData();

    return () => {
      isMounted = false;
    };
  }, [initialProfile, accessToken, fetchBookings]);

  if (auth.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#8FAE9B]" />
        <p className="text-sm font-medium text-[#7A827B] dark:text-[#A69FA8]">
          Verifying your student session...
        </p>
      </div>
    );
  }

  // Authentication Required Gate: No session means no access to authenticated booking
  if (!accessToken) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-[#30332F] dark:text-[#F8F6F0]">
          Authentication Required
        </h2>
        <p className="text-sm text-[#7A827B] dark:text-[#A69FA8]">
          You must be signed in to your student account to access the authenticated lesson booking portal.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/student"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EDE3D4] dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] hover:bg-[#D5D0CA] transition-colors"
          >
            ← Return to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8FAE9B] hover:bg-[#6F907D] text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#8FAE9B]" />
        <p className="text-sm font-medium text-[#7A827B] dark:text-[#A69FA8]">
          Preparing your student booking details...
        </p>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-[#30332F] dark:text-[#F8F6F0]">
          Unable to load student profile
        </h2>
        <p className="text-sm text-[#7A827B] dark:text-[#A69FA8]">
          {profileError || 'Please ensure you are signed in to your student account before booking.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/student"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EDE3D4] dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] hover:bg-[#D5D0CA] transition-colors"
          >
            ← Return to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8FAE9B] hover:bg-[#6F907D] text-white transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate authoritative trial eligibility
  const { canBookTrial, trialDisabledReason } = calculateTrialEligibility(bookings, bookingsError);

  // Map initial form values from profile
  const { initialData, matchedServiceId, initialMode } = mapStudentProfileToBookingInitialData(
    profile,
    canBookTrial
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Context Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2DDD5]/60 dark:border-[#3E3545]/60">
        <div>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A827B] hover:text-[#30332F] dark:text-[#A69FA8] dark:hover:text-white transition-colors mb-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student Portal</span>
          </button>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-[#30332F] dark:text-[#F8F6F0]">
            Book a Lesson
          </h1>
          <p className="text-xs sm:text-sm text-[#7A827B] dark:text-[#A69FA8] mt-0.5">
            Schedule your personalized 1-on-1 session with Ustadh Mahmoud.
          </p>
        </div>

        {/* Authenticated Identity Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#231D28] border border-[#D5D0CA]/50 dark:border-[#3E3545]/50 shadow-xs self-start sm:self-auto">
          <div className="p-1 rounded-full bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-semibold text-[#30332F] dark:text-[#F8F6F0] leading-tight truncate max-w-[160px] sm:max-w-[200px]">
              {profile.name || profile.email}
            </div>
            <div className="text-[10px] text-[#7A827B] dark:text-[#A69FA8] leading-tight">
              Linked Student Account
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Verification Warning / Retry (if /api/student/bookings failed) */}
      {bookingsError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {bookingsError} Free trial booking is unavailable until history is verified.
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchBookings(accessToken)}
            disabled={bookingsLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium self-start sm:self-auto transition-colors cursor-pointer disabled:opacity-50"
          >
            {bookingsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Retry Verification</span>
          </button>
        </div>
      )}

      {/* Embedded Booking Flow Container */}
      <BookingFlow
        initialServiceId={matchedServiceId}
        initialMode={initialMode}
        initialData={initialData}
        trialDisabled={!canBookTrial}
        trialDisabledReason={trialDisabledReason}
        cardClassName="w-full bg-white dark:bg-[#231D28] text-[#362E3B] dark:text-[#D5D0CA] p-5 sm:p-8 rounded-3xl border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 shadow-sm"
        doneLabel="Done & Return to Student Portal"
        onDone={() => navigate('/student')}
        onClose={() => navigate('/student')}
        lang="en"
        isModalView={false}
      />
    </div>
  );
}
