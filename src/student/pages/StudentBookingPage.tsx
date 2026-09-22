import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, ShieldCheck, RefreshCw, RotateCcw, Check, Sparkles } from 'lucide-react';
import { BookingFlow } from '../../components/booking/BookingFlow';
import { BOOKING_SERVICES } from '../../booking/mockData';
import { BookingFormData, BookingMode, ProficiencyLevel, LessonDuration } from '../../booking/types';
import { useTeacherAuth } from '../../lib/auth';
import { StudentPageBack } from '../components/StudentPageBack';

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
 * Resolves the most recent eligible previous booking for repeating.
 * Eligibility rules:
 * - Must belong to authenticated student (enforced by API & DB)
 * - Must not be cancelled or failed
 * - Must have a valid service recognized in BOOKING_SERVICES
 * - Must have a valid duration (30, 45, or 60)
 * - Sorts newest first by scheduled start or creation date
 * - Returns null if none eligible (fails closed safely)
 */
export function findLastEligibleBooking(bookings: any[] | null): any | null {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return null;
  }

  const validDurations = [30, 45, 60];
  const validStatuses = ['completed'];

  const eligible = bookings.filter((b) => {
    if (!b || typeof b !== 'object') return false;

    // Check status: reject cancelled or failed or no_show
    const status = String(b.status || '').toLowerCase().trim();
    if (status === 'cancelled' || status === 'failed' || status === 'no_show') return false;
    if (status && !validStatuses.includes(status)) return false;

    // Check completion/past status: must be actually taken/completed
    // Do NOT include future pending/confirmed/rescheduled bookings.
    const dateStr = b.scheduledStart || b.scheduled_start || b.lesson_date;
    if (dateStr) {
      const scheduledTime = new Date(dateStr).getTime();
      const now = Date.now();
      // Future completed is logically contradictory, but we block it just in case
      if (scheduledTime > now) {
        return false;
      }
    }

    // Check service validity
    const rawServiceId = b.serviceId || b.service_id;
    if (!rawServiceId || typeof rawServiceId !== 'string') return false;
    const cleanServiceId = rawServiceId.toLowerCase().trim();
    const serviceMatched = BOOKING_SERVICES.some(
      (s) => s.id === cleanServiceId || s.name.toLowerCase() === cleanServiceId
    );
    if (!serviceMatched) return false;

    // Check duration validity
    const rawDuration = b.durationMinutes ?? b.duration_minutes ?? b.duration;
    if (rawDuration === undefined || rawDuration === null) return false;
    const numDuration = Number(rawDuration);
    if (!validDurations.includes(numDuration)) return false;

    return true;
  });

  if (eligible.length === 0) return null;

  // Sort newest first by scheduled_start or scheduledStart or lesson_date or created_at or createdAt
  eligible.sort((a, b) => {
    const timeA = new Date(
      a.scheduledStart || a.scheduled_start || a.lesson_date || a.createdAt || a.created_at || 0
    ).getTime();
    const timeB = new Date(
      b.scheduledStart || b.scheduled_start || b.lesson_date || b.createdAt || b.created_at || 0
    ).getTime();
    return timeB - timeA;
  });

  return eligible[0];
}

/**
 * Formats the summary text for the last booking reuse section:
 * "[lesson/service] · [level if available] · [duration]"
 */
export function formatLastBookingSummary(
  booking: any,
  profile?: any
): {
  serviceTitle: string;
  levelText?: string;
  durationText: string;
  summaryText: string;
} {
  if (!booking) {
    return {
      serviceTitle: 'Lesson',
      durationText: '45 mins',
      summaryText: 'Lesson · 45 mins'
    };
  }

  const rawServiceId = booking.serviceId || booking.service_id;
  const srv = BOOKING_SERVICES.find(
    (s) => s.id === rawServiceId || s.name.toLowerCase() === String(rawServiceId).toLowerCase()
  );
  const serviceTitle = srv?.name || booking.serviceTitle || booking.services?.title || 'Lesson';

  const rawLevel =
    booking.currentLevel ||
    booking.current_level ||
    booking.childLevel ||
    booking.child_level ||
    profile?.currentLevel ||
    profile?.current_level;

  let levelText: string | undefined;
  if (rawLevel && typeof rawLevel === 'string' && rawLevel.trim().length > 0) {
    const clean = rawLevel.trim().toLowerCase();
    levelText = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  const rawDuration = booking.durationMinutes ?? booking.duration_minutes ?? booking.duration ?? 45;
  const durationText = `${rawDuration} mins`;

  const parts = [serviceTitle, levelText, durationText].filter(Boolean);
  const summaryText = parts.join(' · ');

  return {
    serviceTitle,
    levelText,
    durationText,
    summaryText
  };
}

/**
 * Pure mapping of previous eligible booking to BookingFormData,
 * advancing user directly to Step 5 (Schedule / Date & Time).
 */
export function mapLastBookingToBookingFormData(
  lastBooking: any,
  profile: any,
  canBookTrial: boolean
): {
  initialData: Partial<BookingFormData>;
  matchedServiceId: string;
  initialMode: BookingMode;
  initialStep: number;
} {
  const rawServiceId = lastBooking.serviceId || lastBooking.service_id;
  const srv = BOOKING_SERVICES.find(
    (s) => s.id === rawServiceId || s.name.toLowerCase() === String(rawServiceId).toLowerCase()
  );
  const matchedServiceId = srv?.id || 'quran-reading';

  const rawDuration = lastBooking.durationMinutes ?? lastBooking.duration_minutes ?? lastBooking.duration;
  const duration = ([30, 45, 60].includes(Number(rawDuration)) ? Number(rawDuration) : 45) as LessonDuration;

  const lastType = lastBooking.bookingType || lastBooking.booking_type;
  const initialMode: BookingMode = canBookTrial && lastType === 'trial' ? 'trial' : 'regular';

  // Determine audience: child vs adult
  const isChild = Boolean(
    lastBooking.parentName ||
      lastBooking.parent_name ||
      profile?.bookingPreference === 'child' ||
      profile?.learnerType === 'child' ||
      (profile?.guardian && (profile.guardian.parentName || profile.guardian.parentEmail))
  );
  const audience = isChild ? 'child' : 'adult';

  const mappedLevel: ProficiencyLevel =
    profile?.currentLevel === 'beginner' ||
    profile?.currentLevel === 'elementary' ||
    profile?.currentLevel === 'intermediate' ||
    profile?.currentLevel === 'advanced'
      ? profile.currentLevel
      : 'beginner';

  let studentName = '';
  let email = '';
  let whatsapp = '';
  let childName = '';
  let childLevel: ProficiencyLevel = mappedLevel;
  let parentName = '';
  let parentEmail = '';
  let parentWhatsapp = '';
  let parentNotes = '';
  let notes = '';
  
  let repeatStudentId = lastBooking.studentId || lastBooking.student_id;

  if (isChild) {
    if (profile?.linkedChildren && profile.linkedChildren.length > 0) {
      const child = profile.linkedChildren.find((c: any) => c.id === repeatStudentId);
      if (child) {
        childName = child.name || '';
        childLevel =
          child.current_level === 'beginner' ||
          child.current_level === 'elementary' ||
          child.current_level === 'intermediate' ||
          child.current_level === 'advanced'
            ? child.current_level
            : (child.currentLevel || mappedLevel);
      } else {
        // Child no longer linked or unknown identity, clear selection
        repeatStudentId = '';
        childName = lastBooking.contactName || lastBooking.contact_name || '';
      }
    } else {
      // No linked children available
      repeatStudentId = profile?.id || '';
      childName = lastBooking.contactName || lastBooking.contact_name || '';
    }

    parentName = lastBooking.parentName || lastBooking.parent_name || profile?.name || '';
    parentEmail = lastBooking.contactEmail || lastBooking.contact_email || profile?.email || '';
    parentWhatsapp = lastBooking.contactWhatsapp || lastBooking.contact_whatsapp || profile?.whatsapp || '';
    parentNotes = lastBooking.notes || profile?.learningNeeds || '';
  } else {
    repeatStudentId = profile?.id || '';
    studentName = lastBooking.contactName || lastBooking.contact_name || profile?.name || '';
    email = lastBooking.contactEmail || lastBooking.contact_email || profile?.email || '';
    whatsapp = lastBooking.contactWhatsapp || lastBooking.contact_whatsapp || profile?.whatsapp || '';
    notes = lastBooking.notes || profile?.learningNeeds || '';
  }

  const goal =
    lastBooking.goal ||
    (srv?.suggestedGoals && srv.suggestedGoals[0]) ||
    profile?.learningGoal ||
    'Personalized study with Ustadh Mahmoud';

  const timezone =
    lastBooking.studentTimezone ||
    lastBooking.student_timezone ||
    profile?.timezone ||
    'America/New_York';

  const initialData: Partial<BookingFormData> = {
    serviceId: matchedServiceId,
    mode: initialMode,
    duration,
    audience,
    studentName,
    email,
    whatsapp,
    currentLevel: mappedLevel,
    notes,
    childName,
    childLevel,
    parentName,
    parentEmail,
    parentWhatsapp,
    parentNotes,
    goal,
    customGoalText: lastBooking.customGoalText || '',
    timezone,
    studentId: repeatStudentId,
    date: '',
    timeSlot: null
  };

  return {
    initialData,
    matchedServiceId,
    initialMode,
    initialStep: 5 // Step 5 is StepDateTime (schedule/time-selection)
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

  const pref = profile.bookingPreference || profile.booking_preference;
  const isBookingForChild = pref === 'child' || (isChildAccount && pref !== 'self');
  const audience = isBookingForChild ? 'child' : 'adult';

  const hasLinkedChildren = Array.isArray(profile.linkedChildren) && profile.linkedChildren.length > 0;
  
  // Only default to a child if there is exactly one
  const defaultChild = (hasLinkedChildren && profile.linkedChildren.length === 1) ? profile.linkedChildren[0] : null;

  let childName = '';
  let childLevel: ProficiencyLevel = mappedLevel;
  let parentName = '';
  let parentEmail = '';
  let parentWhatsapp = '';
  let parentNotes = '';

  if (isBookingForChild) {
    if (defaultChild) {
      childName = defaultChild.name || '';
      childLevel =
        defaultChild.currentLevel === 'beginner' ||
        defaultChild.currentLevel === 'elementary' ||
        defaultChild.currentLevel === 'intermediate' ||
        defaultChild.currentLevel === 'advanced'
          ? defaultChild.currentLevel
          : 'beginner';
      parentName = profile.name || '';
      parentEmail = profile.email || '';
      parentWhatsapp = profile.whatsapp || '';
      parentNotes = profile.learningNeeds || '';
    } else if (hasLinkedChildren && profile.linkedChildren.length > 1) {
      // Multiple linked children: Do not pre-fill child identity, force selection
      childName = '';
      parentName = profile.name || '';
      parentEmail = profile.email || '';
      parentWhatsapp = profile.whatsapp || '';
      parentNotes = profile.learningNeeds || '';
    } else if (isChildAccount) {
      childName = profile.name || '';
      childLevel = mappedLevel;
      parentName = profile.guardian?.parentName || '';
      parentEmail = profile.guardian?.parentEmail || profile.email || '';
      parentWhatsapp =
        profile.guardian?.parentWhatsapp || profile.guardian?.parentPhone || profile.whatsapp || '';
      parentNotes = profile.learningNeeds || '';
    }
  }

  const initialData: Partial<BookingFormData> = {
    serviceId: matchedServiceId,
    mode: initialMode,
    audience,
    studentName: profile.name || '',
    email: profile.email || '',
    whatsapp: profile.whatsapp || '',
    currentLevel: mappedLevel,
    notes: profile.learningNeeds || '',
    goal: profile.learningGoal || '',
    childName,
    childLevel,
    parentName,
    parentEmail,
    parentWhatsapp,
    parentNotes,
    timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    studentId: (isBookingForChild && defaultChild) ? defaultChild.id : ((isBookingForChild && hasLinkedChildren && profile.linkedChildren.length > 1) ? '' : profile.id)
  };

  return {
    initialData,
    matchedServiceId,
    initialMode
  };
}

export default function StudentBookingPage({ profile: initialProfile, session: propSession }: StudentBookingPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Checking your student session…
        </p>
      </div>
    );
  }

  // Authentication Required Gate: No session means no access to authenticated booking
  if (!accessToken) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Sign in to continue
        </h2>
        <p className="text-sm text-muted-foreground">
          Your student account is required to access the authenticated lesson booking portal.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/student"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-subtle text-foreground hover:bg-border/40 transition-colors"
          >
            ← Return to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (profileLoading || (bookingsLoading && bookings === null)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading your lesson options…
        </p>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Unable to load student profile
        </h2>
        <p className="text-sm text-muted-foreground">
          {profileError || 'Please ensure you are signed in to your student account before booking.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/student"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-subtle text-foreground hover:bg-border/40 transition-colors"
          >
            ← Return to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground transition-colors cursor-pointer"
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
  const { initialData: standardInitialData, matchedServiceId: standardServiceId, initialMode: standardMode } =
    mapStudentProfileToBookingInitialData(profile, canBookTrial);

  // Identify last eligible booking for repeat workflow
  const lastEligibleBooking = findLastEligibleBooking(bookings);
  const lastBookingSummary = lastEligibleBooking
    ? formatLastBookingSummary(lastEligibleBooking, profile)
    : null;

  // Local state for reuse interaction
  const [reuseDismissed, setReuseDismissed] = useState<boolean>(false);
  const [isReusing, setIsReusing] = useState<boolean>(false);
  const [flowKey, setFlowKey] = useState<number>(0);
  const [flowStep, setFlowStep] = useState<number>(1);
  const [activeConfig, setActiveConfig] = useState<{
    initialData: Partial<BookingFormData>;
    matchedServiceId: string;
    initialMode: BookingMode;
  } | null>(null);

  const handleReuseLastBooking = useCallback(() => {
    if (!lastEligibleBooking) return;
    const reused = mapLastBookingToBookingFormData(lastEligibleBooking, profile, canBookTrial);
    setActiveConfig({
      initialData: reused.initialData,
      matchedServiceId: reused.matchedServiceId,
      initialMode: reused.initialMode
    });
    setFlowStep(5);
    setIsReusing(true);
    setFlowKey((k) => k + 1);
  }, [lastEligibleBooking, profile, canBookTrial]);

  const handleDismissReuse = () => {
    setReuseDismissed(true);
    setIsReusing(false);
    setActiveConfig(null);
    setFlowStep(1);
    setFlowKey((k) => k + 1);
    if (searchParams.get('repeat') === 'true') {
      navigate('/student/book', { replace: true });
    }
  };

  const handleResetToNewBooking = () => {
    setIsReusing(false);
    setActiveConfig(null);
    setFlowStep(1);
    setFlowKey((k) => k + 1);
    if (searchParams.get('repeat') === 'true') {
      navigate('/student/book', { replace: true });
    }
  };

  // Deep-linking: auto-trigger repeat workflow if requested via query param (?repeat=true) or location state ({ repeat: true })
  const autoTriggeredRepeatRef = useRef(false);
  useEffect(() => {
    if (autoTriggeredRepeatRef.current) return;
    const wantsRepeat = searchParams.get('repeat') === 'true' || (location.state as any)?.repeat === true;
    if (wantsRepeat && lastEligibleBooking && !reuseDismissed && !isReusing) {
      autoTriggeredRepeatRef.current = true;
      handleReuseLastBooking();
    }
  }, [searchParams, location.state, lastEligibleBooking, reuseDismissed, isReusing, handleReuseLastBooking]);

  // Support direct service parameter if not in active reuse mode (e.g. /student/book?service=tajweed)
  const requestedServiceId = searchParams.get('service');
  const matchedQueryServiceId = requestedServiceId && BOOKING_SERVICES.some((s) => s.id === requestedServiceId)
    ? requestedServiceId
    : standardServiceId;

  const currentInitialData = activeConfig ? activeConfig.initialData : standardInitialData;
  const currentServiceId = activeConfig ? activeConfig.matchedServiceId : matchedQueryServiceId;
  const currentMode = activeConfig ? activeConfig.initialMode : standardMode;

  return (
    <div className="space-y-6">
      {/* Top Header & Context Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <StudentPageBack
            to="/student"
            label="Return to Student Portal"
            labelAr="العودة لبوابة الطالب"
            className="mb-1.5"
          />
          <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
            Book a Lesson
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Choose your lesson, confirm your preferences, and schedule your next 1-on-1 session.
          </p>
        </div>

        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-surface border border-border shadow-xs self-start sm:self-auto">
          <div className="p-1 rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-semibold text-foreground leading-tight truncate max-w-[160px] sm:max-w-[200px]">
              {profile.name || profile.email}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {profile.bookingPreference === 'child' ? 'Booking for Child' : 'Linked Student Account'}
            </div>
          </div>
        </div>
      </div>

      {lastEligibleBooking && lastBookingSummary && !reuseDismissed && !isReusing && !requestedServiceId && (
        <div className="rounded-2xl border border-border/60 bg-surface-subtle p-4 shadow-xs">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Booking context</span>
          </div>
          <div className="mt-2 text-sm font-medium text-foreground">
            {lastBookingSummary.summaryText}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Reuse this recent lesson as a starting point or choose a fresh lesson from the form below.
          </p>
        </div>
      )}

      {/* Bookings Verification Warning / Retry (if /api/student/bookings failed) */}
      {bookingsError && (
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-warning">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-warning shrink-0" />
            <span>
              {bookingsError} Free trial booking is unavailable until history is verified.
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchBookings(accessToken)}
            disabled={bookingsLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning hover:bg-warning/90 text-primary-foreground font-medium self-start sm:self-auto transition-colors cursor-pointer disabled:opacity-50"
          >
            {bookingsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Retry Verification</span>
          </button>
        </div>
      )}

      {/*
        BOOKING ENTRY POINT:
        Case A: First-time booking / New booking from scratch -> Render BookingFlow directly.
        Case B: Repeat booking when an eligible completed lesson exists -> Show the "Book another lesson"
                choice first BEFORE the detailed form.
      */}
      {lastEligibleBooking && lastBookingSummary && !reuseDismissed && !isReusing && !requestedServiceId ? (
        <div
          id="repeat-last-booking-card"
          className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-foreground">
                Book another lesson
              </h2>
              <p className="text-xs text-muted-foreground">
                Continue from your last completed lesson?
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-1.5 text-xs">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Previous lesson details
            </div>
            <div className="font-semibold text-sm text-foreground">
              {lastBookingSummary.summaryText}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Subject, level, and learner preferences will be carried forward automatically.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="btn-reuse-last-booking"
              onClick={handleReuseLastBooking}
              className="w-full p-4 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-xs transition-all shadow-xs flex flex-col items-start gap-1 cursor-pointer text-start"
            >
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <RotateCcw className="w-4 h-4" />
                <span>Book with the same details</span>
              </div>
              <span className="text-[11px] opacity-90 leading-tight">
                Uses your last lesson’s subject, level, and preferences. You will choose a new date and time.
              </span>
            </button>

            <button
              type="button"
              id="btn-dismiss-reuse-booking"
              onClick={handleDismissReuse}
              className="w-full p-4 rounded-2xl bg-surface border border-border text-foreground hover:bg-surface-subtle font-medium text-xs transition-all shadow-xs flex flex-col items-start gap-1 cursor-pointer text-start"
            >
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Make a new booking</span>
              </div>
              <span className="text-[11px] text-muted-foreground leading-tight">
                Start fresh and choose lesson details again.
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Detailed Booking Flow Container */
        <div className="space-y-4">
          {/* Active reuse feedback banner */}
          {isReusing && lastBookingSummary && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-primary flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Reusing details from your last lesson: <strong>{lastBookingSummary.summaryText}</strong>. Choose your date &amp; time below, or edit any details.
                </span>
              </div>
              <button
                type="button"
                id="btn-reset-reuse-booking"
                onClick={handleResetToNewBooking}
                className="text-xs font-medium underline hover:text-foreground cursor-pointer self-start sm:self-auto"
              >
                Start fresh instead
              </button>
            </div>
          )}

          {/* Dismissed subtle helper: available if user changed their mind */}
          {lastEligibleBooking && lastBookingSummary && reuseDismissed && !isReusing && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <button
                type="button"
                id="btn-reopen-reuse-booking"
                onClick={handleReuseLastBooking}
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reuse last lesson details ({lastBookingSummary.summaryText})</span>
              </button>
            </div>
          )}

          <BookingFlow
            key={flowKey}
            initialServiceId={currentServiceId}
            initialMode={currentMode}
            initialData={currentInitialData}
            initialStep={flowStep}
            trialDisabled={!canBookTrial}
            trialDisabledReason={trialDisabledReason}
            cardClassName="w-full bg-surface text-foreground p-5 sm:p-8 rounded-3xl border border-border shadow-xs"
            doneLabel="Done & Return to Student Portal"
            onDone={() => navigate('/student')}
            onClose={() => navigate('/student')}
            lang="en"
            isModalView={false}
            linkedChildren={profile?.linkedChildren || []}
            isAuthenticatedStudent={true}
            bookingPreference={profile?.bookingPreference || 'self'}
            canBookForChild={Boolean(profile?.canBookForChild && Array.isArray(profile?.linkedChildren) && profile.linkedChildren.length > 0)}
            studentName={profile?.name}
            studentEmail={profile?.email}
            teacherId={profile?.assignedTeacherId || profile?.assigned_teacher_id}
          />
        </div>
      )}
    </div>
  );
}
