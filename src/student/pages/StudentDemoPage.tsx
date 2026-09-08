import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  Video, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Users, 
  User, 
  ArrowRight, 
  FileText, 
  Award, 
  TrendingUp, 
  HelpCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentDemoPageProps {
  onOpenSignupModal?: () => void;
}

export default function StudentDemoPage({ onOpenSignupModal }: StudentDemoPageProps) {
  const navigate = useNavigate();

  const [perspective, setPerspective] = useState<'adult' | 'parent'>('adult');
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [bookingDemoModalOpen, setBookingDemoModalOpen] = useState(false);
  const [bookingDemoStep, setBookingDemoStep] = useState<1 | 2 | 3>(1);
  const [demoSelectedSubject, setDemoSelectedSubject] = useState('Quran Reading & Tajweed');
  const [demoSelectedDuration, setDemoSelectedDuration] = useState('30 min');
  const [demoSelectedTime, setDemoSelectedTime] = useState('Tomorrow, 10:00 AM EST');
  const [demoBookingSuccess, setDemoBookingSuccess] = useState(false);

  const handleOpenSignup = () => {
    if (onOpenSignupModal) {
      onOpenSignupModal();
    } else {
      navigate('/#student-login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#1E1923] text-[#30332F] dark:text-[#F8F6F0] font-sans pb-16">
      {/* 1. Clear Demo Header Banner (Requirement: Make the Demo status clear in the UI) */}
      <div className="bg-gradient-to-r from-amber-500/15 via-[#8FAE9B]/20 to-amber-500/15 border-b border-amber-500/30 dark:border-amber-400/20 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-semibold">Interactive Demo Mode:</span>
            <span>Exploring as Guest with sample data. No real bookings or accounts are created.</span>
          </div>

          <button
            onClick={handleOpenSignup}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6F907D] hover:bg-[#557161] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span>Ready to make it real?</span>
            <span className="underline">Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome & Persona Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6F907D] dark:text-[#8FAE9B] mb-1.5">
              <span>Sample Student Dashboard</span>
              <span>•</span>
              <span>Personal 1-on-1 Mentorship</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#30332F] dark:text-[#F8F6F0]">
              {perspective === 'adult' ? 'Welcome back, Zayd!' : 'Welcome, Tariq (Parent View)'}
            </h1>
            <p className="text-sm text-[#626A64] dark:text-[#D5D0CA] mt-1">
              {perspective === 'adult'
                ? 'Your next session with Ustadh Mahmoud is prepared below.'
                : "Tracking progress, attendance, and teacher feedback for your child, Zayd (Age 10)."}
            </p>
          </div>

          {/* Perspective Switcher */}
          <div className="flex items-center p-1.5 rounded-2xl bg-[#F8F6F0] dark:bg-[#2D2635] border border-[#E2DDD5] dark:border-[#3E3545] self-start md:self-auto">
            <button
              onClick={() => setPerspective('adult')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                perspective === 'adult'
                  ? 'bg-white dark:bg-[#1E1923] text-[#30332F] dark:text-[#F8F6F0] shadow-xs'
                  : 'text-[#626A64] dark:text-[#D5D0CA] hover:text-[#30332F]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Adult Learner View</span>
            </button>
            <button
              onClick={() => setPerspective('parent')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                perspective === 'parent'
                  ? 'bg-white dark:bg-[#1E1923] text-[#30332F] dark:text-[#F8F6F0] shadow-xs'
                  : 'text-[#626A64] dark:text-[#D5D0CA] hover:text-[#30332F]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Parent / Child View</span>
            </button>
          </div>
        </div>

        {/* Top Grid: Upcoming Lesson & Quick Action */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Class Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#8FAE9B]/15 via-white to-white dark:from-[#8FAE9B]/10 dark:via-[#251F2C] dark:to-[#251F2C] border border-[#8FAE9B]/40 dark:border-[#3E3545] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#6F907D] text-white">
                <Clock className="w-3.5 h-3.5" />
                Upcoming Live Lesson
              </span>
              <span className="text-xs text-[#626A64] dark:text-[#D5D0CA]">
                Confirmed • 1-on-1 Zoom
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#30332F] dark:text-[#F8F6F0]">
              Quran Memorization & Tajweed Rules
            </h3>
            <p className="text-sm text-[#626A64] dark:text-[#D5D0CA] mt-1">
              Focus: Surah Al-Mulk (Verses 1–12) & Pronunciation of Throat Letters (Halqiyyah)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 pt-4 border-t border-[#E2DDD5]/60 dark:border-[#3E3545]/60 text-xs sm:text-sm">
              <div>
                <span className="text-[#7A827B] dark:text-[#A69FA8] block mb-0.5">Date & Time</span>
                <span className="font-semibold text-[#30332F] dark:text-[#F8F6F0]">Saturday, 10:00 AM (EST)</span>
              </div>
              <div>
                <span className="text-[#7A827B] dark:text-[#A69FA8] block mb-0.5">Duration</span>
                <span className="font-semibold text-[#30332F] dark:text-[#F8F6F0]">45 Minutes</span>
              </div>
              <div>
                <span className="text-[#7A827B] dark:text-[#A69FA8] block mb-0.5">Instructor</span>
                <span className="font-semibold text-[#30332F] dark:text-[#F8F6F0]">Ustadh Mahmoud (Egypt)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setZoomModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6F907D] hover:bg-[#557161] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Join Zoom Classroom (Demo Preview)</span>
              </button>

              <button
                onClick={() => setBookingDemoModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#2D2635] border border-[#E2DDD5] dark:border-[#473D50] hover:bg-[#F8F6F0] dark:hover:bg-[#342D3D] text-[#30332F] dark:text-[#F8F6F0] text-sm font-medium transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#8FAE9B]" />
                <span>Try Booking Experience</span>
              </button>
            </div>
          </div>

          {/* Teacher Direct Note / Parent Report Card */}
          <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6F907D] dark:text-[#8FAE9B] mb-2">
                <FileText className="w-4 h-4" />
                <span>{perspective === 'adult' ? "Teacher's Personal Notes" : 'Weekly Parent Summary'}</span>
              </div>
              <h4 className="font-serif font-bold text-base text-[#30332F] dark:text-[#F8F6F0] mb-2">
                Feedback from Last Lesson
              </h4>
              <p className="text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA] leading-relaxed italic bg-[#F8F6F0] dark:bg-[#2D2635] p-3.5 rounded-2xl border border-[#E2DDD5]/60 dark:border-[#3E3545]/60">
                {perspective === 'adult'
                  ? '"Excellent improvement on letter Ayn (ع) and Qalqalah bounce today. Spend 10 minutes reviewing verses 5-10 before our Saturday session."'
                  : '"Zayd showed wonderful focus today! He memorized 4 new verses and was very enthusiastic. Attendance: 100% on time."'}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E2DDD5] dark:border-[#3E3545] flex items-center justify-between text-xs text-[#7A827B] dark:text-[#A69FA8]">
              <span>Assigned: Surah Al-Mulk v.1-10</span>
              <span className="text-[#6F907D] dark:text-[#8FAE9B] font-medium">Status: In Progress</span>
            </div>
          </div>
        </div>

        {/* Middle Row: Learning Goals & Progress Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Goals */}
          <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#8FAE9B]" />
                <h4 className="font-serif font-bold text-lg text-[#30332F] dark:text-[#F8F6F0]">
                  Target Learning Goals
                </h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#8FAE9B]/15 text-[#557161] dark:text-[#A8C9B4] font-medium">
                2 Active Goals
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2635] border border-[#E2DDD5]/80 dark:border-[#3E3545]/80">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#30332F] dark:text-[#F8F6F0]">Fluent Recitation: Juz Amma</span>
                  <span className="text-[#6F907D] dark:text-[#8FAE9B]">75% Complete</span>
                </div>
                <div className="w-full bg-[#E2DDD5] dark:bg-[#3E3545] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#6F907D] dark:bg-[#8FAE9B] h-full rounded-full w-3/4" />
                </div>
                <div className="mt-2 text-xs text-[#626A64] dark:text-[#D5D0CA]">
                  Surahs mastered: An-Nas to Al-Fajr
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2635] border border-[#E2DDD5]/80 dark:border-[#3E3545]/80">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#30332F] dark:text-[#F8F6F0]">Tajweed: Noon Sakinah & Tanween Rules</span>
                  <span className="text-[#6F907D] dark:text-[#8FAE9B]">90% Mastered</span>
                </div>
                <div className="w-full bg-[#E2DDD5] dark:bg-[#3E3545] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#6F907D] dark:bg-[#8FAE9B] h-full rounded-full w-[90%]" />
                </div>
                <div className="mt-2 text-xs text-[#626A64] dark:text-[#D5D0CA]">
                  Passed oral evaluation on Idgham & Ikhfa
                </div>
              </div>
            </div>
          </div>

          {/* Past Sessions History */}
          <div className="bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8FAE9B]" />
                <h4 className="font-serif font-bold text-lg text-[#30332F] dark:text-[#F8F6F0]">
                  Recent Completed Lessons
                </h4>
              </div>
              <span className="text-xs text-[#7A827B] dark:text-[#A69FA8]">
                2 of 4 Lessons this month
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-[#E2DDD5] dark:border-[#3E3545] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-[#30332F] dark:text-[#F8F6F0]">
                      Lesson 2: Tajweed & Surah An-Naba
                    </div>
                    <div className="text-xs text-[#7A827B] dark:text-[#A69FA8]">
                      Last Saturday • 45 min • Attended
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#E2DDD5] dark:border-[#3E3545] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-[#30332F] dark:text-[#F8F6F0]">
                      Lesson 1: Level Assessment & Free Trial
                    </div>
                    <div className="text-xs text-[#7A827B] dark:text-[#A69FA8]">
                      Two weeks ago • 30 min • Attended
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action: Convert to Real Account */}
        <div className="bg-gradient-to-r from-[#6F907D] to-[#557161] rounded-3xl p-8 sm:p-10 text-white shadow-md text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Personal Learning
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Ready to start your real learning journey?
            </h3>
            <p className="mt-2 text-sm text-white/90 leading-relaxed">
              Create your free student account in 30 seconds to lock in your preferred lesson time and experience 1-on-1 personalized mentorship with Ustadh Mahmoud.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleOpenSignup}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-[#557161] hover:bg-[#F8F6F0] font-semibold text-sm shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Classroom Preview Modal */}
      <AnimatePresence>
        {zoomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-[#30332F] dark:text-[#F8F6F0]"
            >
              <button
                onClick={() => setZoomModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-[#7A827B] hover:text-[#30332F] dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Video className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-serif font-bold mb-2">
                1-on-1 Zoom Classroom Experience
              </h3>
              <p className="text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA] leading-relaxed mb-5">
                In the live system, clicking this button launches Ustadh Mahmoud's dedicated 1-on-1 Zoom classroom directly. Here is what makes the experience authentic:
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[#30332F] dark:text-[#F8F6F0] mb-6">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#8FAE9B] shrink-0 mt-0.5" />
                  <span>High-definition Quranic texts displayed on screen with visual color Tajweed.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#8FAE9B] shrink-0 mt-0.5" />
                  <span>Live audio pronunciation correction with mouth articulation diagrams.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#8FAE9B] shrink-0 mt-0.5" />
                  <span>Dedicated one-on-one attention without peer distraction or noisy classrooms.</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-[#E2DDD5] dark:border-[#3E3545] flex items-center justify-between">
                <button
                  onClick={() => setZoomModalOpen(false)}
                  className="text-xs font-medium text-[#7A827B] hover:text-[#30332F] dark:hover:text-white"
                >
                  Close Preview
                </button>

                <button
                  onClick={() => {
                    setZoomModalOpen(false);
                    handleOpenSignup();
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#6F907D] text-white text-xs font-semibold hover:bg-[#557161] transition-colors"
                >
                  <span>Register for Real Lessons</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Simulator Modal (Honoring requirement: Guest can understand booking experience without creating production records) */}
      <AnimatePresence>
        {bookingDemoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingDemoModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-[#30332F] dark:text-[#F8F6F0]"
            >
              <button
                onClick={() => setBookingDemoModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-[#7A827B] hover:text-[#30332F] dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Simulated Booking Experience</span>
              </div>

              {!demoBookingSuccess ? (
                <>
                  <h3 className="text-xl font-serif font-bold mb-1">
                    Try The 6-Step Guided Booking Flow
                  </h3>
                  <p className="text-xs text-[#626A64] dark:text-[#D5D0CA] mb-6">
                    This simulation demonstrates how seamlessly real students pick their subjects and times.
                  </p>

                  <div className="space-y-4 text-xs sm:text-sm mb-6">
                    <div>
                      <label className="block font-semibold mb-1">1. Choose Subject</label>
                      <select
                        value={demoSelectedSubject}
                        onChange={(e) => setDemoSelectedSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635]"
                      >
                        <option>Quran Reading & Tajweed</option>
                        <option>Quran Memorization (Hifz)</option>
                        <option>Modern Standard Arabic (Fusha)</option>
                        <option>Egyptian Arabic (Ammiya)</option>
                        <option>Islamic Studies & Daily Fiqh</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">2. Lesson Duration</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['30 min (Trial)', '45 min', '60 min'].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDemoSelectedDuration(d)}
                            className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                              demoSelectedDuration === d
                                ? 'border-[#6F907D] bg-[#8FAE9B]/15 text-[#30332F] dark:text-[#F8F6F0]'
                                : 'border-[#E2DDD5] dark:border-[#3E3545] hover:border-[#8FAE9B]'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">3. Time Slot (Cairo & Student Zone)</label>
                      <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2635] border border-[#E2DDD5] dark:border-[#3E3545] flex items-center justify-between">
                        <span>{demoSelectedTime}</span>
                        <span className="text-xs text-[#6F907D] dark:text-[#8FAE9B] font-semibold">Available</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E2DDD5] dark:border-[#3E3545] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setBookingDemoModalOpen(false)}
                      className="text-xs font-medium text-[#7A827B]"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoBookingSuccess(true)}
                      className="px-6 py-2.5 rounded-xl bg-[#6F907D] hover:bg-[#557161] text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      Complete Demo Simulation
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2">
                    Demo Booking Completed!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA] leading-relaxed mb-6">
                    In the live production system, your time slot is reserved instantly in Ustadh Mahmoud's Google Calendar, your Zoom room is generated, and reminder notifications are scheduled.
                  </p>

                  <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2635] border border-[#E2DDD5] dark:border-[#3E3545] text-left text-xs space-y-1.5 mb-6">
                    <div><strong>Selected:</strong> {demoSelectedSubject}</div>
                    <div><strong>Duration:</strong> {demoSelectedDuration}</div>
                    <div><strong>Simulated Reference:</strong> MHM-DEMO-789</div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setBookingDemoModalOpen(false);
                        setDemoBookingSuccess(false);
                        handleOpenSignup();
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#6F907D] hover:bg-[#557161] text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      Create Real Account Now
                    </button>

                    <button
                      onClick={() => {
                        setBookingDemoModalOpen(false);
                        setDemoBookingSuccess(false);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-[#7A827B] hover:text-[#30332F] dark:hover:text-white"
                    >
                      Close Demo
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
