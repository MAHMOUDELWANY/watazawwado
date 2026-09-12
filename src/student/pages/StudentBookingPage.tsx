import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { BookingFlow } from '../../components/booking/BookingFlow';
import { BOOKING_SERVICES } from '../../booking/mockData';
import { BookingFormData, BookingMode, ProficiencyLevel } from '../../booking/types';

interface StudentBookingPageProps {
  profile?: any;
}

export default function StudentBookingPage({ profile: initialProfile }: StudentBookingPageProps) {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialProfile);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStudentData() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Load profile if not provided
        let currentProf = initialProfile;
        if (!currentProf) {
          const profRes = await fetch('/api/student/me', { headers });
          if (!profRes.ok) {
            throw new Error('Failed to load student profile.');
          }
          currentProf = await profRes.json();
          if (isMounted) setProfile(currentProf);
        }

        // Load bookings to inspect trial usage
        try {
          const bookRes = await fetch('/api/student/bookings', { headers });
          if (bookRes.ok) {
            const bookData = await bookRes.json();
            if (isMounted && Array.isArray(bookData)) {
              setBookings(bookData);
            }
          }
        } catch {
          // Graceful fallback: non-blocking
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Unable to prepare booking page.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStudentData();

    return () => {
      isMounted = false;
    };
  }, [initialProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#8FAE9B]" />
        <p className="text-sm font-medium text-[#7A827B] dark:text-[#A69FA8]">
          Preparing your student booking details...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-[#30332F] dark:text-[#F8F6F0]">
          Unable to load student profile
        </h2>
        <p className="text-sm text-[#7A827B] dark:text-[#A69FA8]">
          {error || 'Please ensure you are signed in to your student account before booking.'}
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

  // Determine trial eligibility from existing bookings
  const hasUsedTrial = bookings.some(
    (b) => (b.booking_type === 'trial' || b.bookingType === 'trial') && b.status !== 'cancelled'
  );
  const canBookTrial = !hasUsedTrial;
  const initialMode: BookingMode = canBookTrial ? 'trial' : 'regular';
  const trialDisabledReason = 'You have already scheduled or completed your complimentary trial lesson.';

  // Map serviceId from learningInterest
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

  // Map audience and profile details
  const isChildAccount = Boolean(
    profile.guardian && (profile.guardian.parentName || profile.guardian.relationship)
  );

  const mappedLevel: ProficiencyLevel =
    profile.currentLevel === 'beginner' ||
    profile.currentLevel === 'elementary' ||
    profile.currentLevel === 'intermediate' ||
    profile.currentLevel === 'advanced'
      ? profile.currentLevel
      : 'beginner';

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
