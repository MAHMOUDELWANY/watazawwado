import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  User, 
  Users, 
  Target, 
  Clock, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  HelpCircle,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentOnboardingPageProps {
  currentProfile?: any;
  onCompleted?: (profile: any) => void;
  onOpenBookingModal?: () => void;
}

const SERVICES_OPTIONS = [
  { id: 'quran-reading', label: 'Quran Reading (Noorani Qaida / Foundation)' },
  { id: 'quran-memorization', label: 'Quran Memorization (Hifz)' },
  { id: 'tajweed', label: 'Tajweed Rules & Accurate Pronunciation' },
  { id: 'islamic-studies', label: 'Islamic Studies & Daily Fiqh' },
  { id: 'modern-standard-arabic', label: 'Modern Standard Arabic (Fusha)' },
  { id: 'egyptian-arabic', label: 'Egyptian Colloquial Arabic (Ammiya)' },
  { id: 'english', label: 'English Language Support' },
];

const LEVEL_OPTIONS = [
  { id: 'beginner', title: 'Complete Beginner', desc: 'Starting from alphabet, basic sounds, or no prior background' },
  { id: 'elementary', title: 'Elementary', desc: 'Can identify letters/words; developing basic fluency' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Can read Quran or converse with some hesitation' },
  { id: 'advanced', title: 'Advanced', desc: 'Fluent; polishing Tajweed rules, memorization, or advanced Arabic' },
];

export default function StudentOnboardingPage({
  currentProfile,
  onCompleted,
  onOpenBookingModal
}: StudentOnboardingPageProps) {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [learnerType, setLearnerType] = useState<'adult' | 'child'>(currentProfile?.learnerType || 'adult');
  const [studentName, setStudentName] = useState(currentProfile?.name || '');
  const [parentName, setParentName] = useState(currentProfile?.guardian?.parentName || '');
  const [parentWhatsapp, setParentWhatsapp] = useState(currentProfile?.guardian?.parentWhatsapp || '');
  
  const [learningInterest, setLearningInterest] = useState(currentProfile?.learningInterest || 'quran-reading');
  const [currentLevel, setCurrentLevel] = useState(currentProfile?.currentLevel || 'beginner');
  
  const [learningGoal, setLearningGoal] = useState(currentProfile?.learningGoal || '');
  const [learningNeeds, setLearningNeeds] = useState(currentProfile?.learningNeeds || '');
  const [whatsapp, setWhatsapp] = useState(currentProfile?.whatsapp || '');
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || currentProfile?.timezone || 'UTC';
    } catch {
      return currentProfile?.timezone || 'UTC';
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!studentName.trim() || studentName.trim().length < 2) {
      setError('Please provide the learner full name (at least 2 characters).');
      setStep(1);
      return;
    }

    if (learnerType === 'child' && (!parentName.trim() || parentName.trim().length < 2)) {
      setError('Parent / Guardian name is required for child learners.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine token from localStorage or session
      const token = localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/student/onboarding', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: studentName.trim(),
          learnerType,
          parentName: learnerType === 'child' ? parentName.trim() : null,
          parentWhatsapp: learnerType === 'child' ? parentWhatsapp.trim() : null,
          learningInterest,
          currentLevel,
          learningGoal: learningGoal.trim(),
          learningNeeds: learningNeeds.trim(),
          timezone,
          whatsapp: whatsapp.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete onboarding. Please try again.');
      }

      setCompletedSuccess(true);
      if (onCompleted) {
        onCompleted(data.profile);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-8 sm:p-12 shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#30332F] dark:text-[#F8F6F0]">
            Welcome, {studentName}!
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#626A64] dark:text-[#D5D0CA] max-w-lg mx-auto leading-relaxed">
            Your personalized learning profile is set up. Ustadh Mahmoud has received your background and goals to prepare your curriculum.
          </p>

          <div className="mt-8 pt-8 border-t border-[#E2DDD5] dark:border-[#3E3545] flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (onOpenBookingModal) {
                  onOpenBookingModal();
                } else {
                  navigate('/student/book');
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#6F907D] hover:bg-[#557161] text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Your 1-on-1 Free Trial</span>
            </button>

            <button
              onClick={() => navigate('/student')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-[#2D2635] border border-[#E2DDD5] dark:border-[#473D50] hover:bg-[#F8F6F0] dark:hover:bg-[#342D3D] text-[#30332F] dark:text-[#F8F6F0] font-medium text-sm transition-all cursor-pointer"
            >
              <span>Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#8FAE9B]/15 text-[#557161] dark:text-[#A8C9B4] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Personalized Onboarding
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#30332F] dark:text-[#F8F6F0]">
          Set Up Your Learning Profile
        </h1>
        <p className="mt-2 text-sm text-[#626A64] dark:text-[#D5D0CA]">
          This takes 2 minutes and helps Ustadh Mahmoud adapt each lesson specifically to your pace and goals.
        </p>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-10 bg-[#6F907D] dark:bg-[#8FAE9B]'
                  : s < step
                  ? 'w-6 bg-[#6F907D]/50'
                  : 'w-6 bg-[#E2DDD5] dark:bg-[#3E3545]'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-8 shadow-sm">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-3">
                Who is taking the lessons?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLearnerType('adult')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    learnerType === 'adult'
                      ? 'border-[#6F907D] bg-[#8FAE9B]/10 dark:bg-[#8FAE9B]/15 text-[#30332F] dark:text-[#F8F6F0]'
                      : 'border-[#E2DDD5] dark:border-[#3E3545] hover:border-[#8FAE9B] text-[#626A64] dark:text-[#D5D0CA]'
                  }`}
                >
                  <User className="w-5 h-5 text-[#6F907D] dark:text-[#8FAE9B] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm">Adult Learner</div>
                    <div className="text-xs opacity-75 mt-0.5">I am learning for myself</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLearnerType('child')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    learnerType === 'child'
                      ? 'border-[#6F907D] bg-[#8FAE9B]/10 dark:bg-[#8FAE9B]/15 text-[#30332F] dark:text-[#F8F6F0]'
                      : 'border-[#E2DDD5] dark:border-[#3E3545] hover:border-[#8FAE9B] text-[#626A64] dark:text-[#D5D0CA]'
                  }`}
                >
                  <Users className="w-5 h-5 text-[#6F907D] dark:text-[#8FAE9B] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm">Child / Youth</div>
                    <div className="text-xs opacity-75 mt-0.5">I am enrolling my child</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                {learnerType === 'child' ? "Child's Full Name" : 'Your Full Name'}
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Zayd Rahman"
                className="w-full px-4 py-3 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FBF9F5] dark:bg-[#2D2635] text-[#30332F] dark:text-[#F8F6F0] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B] text-sm"
              />
            </div>

            {learnerType === 'child' && (
              <div className="p-4 rounded-2xl bg-[#F8F6F0] dark:bg-[#2D2635]/60 border border-[#E2DDD5] dark:border-[#3E3545] space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6F907D] dark:text-[#8FAE9B]">
                  Parent / Guardian Information
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#30332F] dark:text-[#F8F6F0] mb-1">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Tariq Rahman"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2DDD5] dark:border-[#3E3545] bg-white dark:bg-[#251F2C] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#30332F] dark:text-[#F8F6F0] mb-1">
                    Parent WhatsApp (for lesson updates)
                  </label>
                  <input
                    type="tel"
                    value={parentWhatsapp}
                    onChange={(e) => setParentWhatsapp(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2DDD5] dark:border-[#3E3545] bg-white dark:bg-[#251F2C] text-sm"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!studentName.trim()) {
                    setError('Please enter the learner full name.');
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6F907D] hover:bg-[#557161] text-white font-medium text-sm transition-all cursor-pointer"
              >
                <span>Continue: Subject & Level</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-2">
                Primary Subject of Interest
              </label>
              <select
                value={learningInterest}
                onChange={(e) => setLearningInterest(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FBF9F5] dark:bg-[#2D2635] text-[#30332F] dark:text-[#F8F6F0] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B] text-sm"
              >
                {SERVICES_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-2.5">
                Current Level Assessment
              </label>
              <div className="space-y-2.5">
                {LEVEL_OPTIONS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setCurrentLevel(lvl.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      currentLevel === lvl.id
                        ? 'border-[#6F907D] bg-[#8FAE9B]/10 dark:bg-[#8FAE9B]/15 text-[#30332F] dark:text-[#F8F6F0]'
                        : 'border-[#E2DDD5] dark:border-[#3E3545] hover:border-[#8FAE9B] text-[#626A64] dark:text-[#D5D0CA]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{lvl.title}</div>
                      <div className="text-xs opacity-75 mt-0.5">{lvl.desc}</div>
                    </div>
                    {currentLevel === lvl.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#6F907D] dark:text-[#8FAE9B] shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-[#7A827B] hover:text-[#30332F] dark:hover:text-white transition-colors"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6F907D] hover:bg-[#557161] text-white font-medium text-sm transition-all cursor-pointer"
              >
                <span>Continue: Goals & Contact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                What is your main goal for this journey?
              </label>
              <input
                type="text"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder="e.g. Read Surah Al-Baqarah fluently with Tajweed, or memorize Juz Amma"
                className="w-full px-4 py-3 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FBF9F5] dark:bg-[#2D2635] text-[#30332F] dark:text-[#F8F6F0] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                  Your Timezone (IANA)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#8FAE9B] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FBF9F5] dark:bg-[#2D2635] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                  WhatsApp / Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8FAE9B] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FBF9F5] dark:bg-[#2D2635] text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
                Any specific notes or learning needs for Ustadh Mahmoud? (Optional)
              </label>
              <textarea
                rows={2}
                value={learningNeeds}
                onChange={(e) => setLearningNeeds(e.target.value)}
                placeholder="e.g. Prefers visual mnemonics, needs patience with pronunciation, scheduling preferences..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FBF9F5] dark:bg-[#2D2635] text-sm"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-medium text-[#7A827B] hover:text-[#30332F] dark:hover:text-white transition-colors"
              >
                Back
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#6F907D] hover:bg-[#557161] text-white font-medium text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Onboarding</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
