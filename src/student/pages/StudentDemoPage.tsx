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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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
      navigate('/get-started');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-16">
      {/* 1. Clear Demo Header Banner (Requirement: Make the Demo status clear in the UI) */}
      <div className="bg-warning/10 border-b border-warning/30 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-warning">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
            </span>
            <span className="font-semibold">Interactive Demo Mode:</span>
            <span>Exploring as Guest with sample data. No real bookings or accounts are created.</span>
          </div>

          <button
            onClick={handleOpenSignup}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
              <span>Sample Student Dashboard</span>
              <span>•</span>
              <span>Personal 1-on-1 Mentorship</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {perspective === 'adult' ? 'Welcome back, Zayd!' : 'Welcome, Tariq (Parent View)'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {perspective === 'adult'
                ? 'Your next session with Ustadh Mahmoud is prepared below.'
                : "Tracking progress, attendance, and teacher feedback for your child, Zayd (Age 10)."}
            </p>
          </div>

          {/* Perspective Switcher */}
          <div className="flex items-center p-1.5 rounded-2xl bg-surface-subtle border border-border self-start md:self-auto">
            <button
              onClick={() => setPerspective('adult')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                perspective === 'adult'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Adult Learner View</span>
            </button>
            <button
              onClick={() => setPerspective('parent')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                perspective === 'parent'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
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
          <div className="lg:col-span-2 bg-gradient-to-br from-primary/10 via-surface to-surface border border-primary/30 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                <Clock className="w-3.5 h-3.5" />
                Upcoming Live Lesson
              </span>
              <span className="text-xs text-muted-foreground">
                Confirmed • 1-on-1 Zoom
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
              Quran Memorization & Tajweed Rules
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Focus: Surah Al-Mulk (Verses 1–12) & Pronunciation of Throat Letters (Halqiyyah)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 pt-4 border-t border-border/60 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground block mb-0.5">Date & Time</span>
                <span className="font-semibold text-foreground">Saturday, 10:00 AM (EST)</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Duration</span>
                <span className="font-semibold text-foreground">45 Minutes</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Instructor</span>
                <span className="font-semibold text-foreground">Ustadh Mahmoud (Egypt)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setZoomModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all shadow-xs cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Join Zoom Classroom (Demo Preview)</span>
              </button>

              <button
                onClick={() => setBookingDemoModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface-subtle text-foreground text-sm font-medium transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-primary" />
                <span>Try Booking Experience</span>
              </button>
            </div>
          </div>

          {/* Teacher Direct Note / Parent Report Card */}
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                <FileText className="w-4 h-4" />
                <span>{perspective === 'adult' ? "Teacher's Personal Notes" : 'Weekly Parent Summary'}</span>
              </div>
              <h4 className="font-serif font-bold text-base text-foreground mb-2">
                Feedback from Last Lesson
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic bg-surface-subtle p-3.5 rounded-2xl border border-border/60">
                {perspective === 'adult'
                  ? '"Excellent improvement on letter Ayn (ع) and Qalqalah bounce today. Spend 10 minutes reviewing verses 5-10 before our Saturday session."'
                  : '"Zayd showed wonderful focus today! He memorized 4 new verses and was very enthusiastic. Attendance: 100% on time."'}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Assigned: Surah Al-Mulk v.1-10</span>
              <span className="text-primary font-medium">Status: In Progress</span>
            </div>
          </div>
        </div>

        {/* Middle Row: Learning Goals & Progress Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Goals */}
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h4 className="font-serif font-bold text-lg text-foreground">
                  Target Learning Goals
                </h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                2 Active Goals
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-foreground">Fluent Recitation: Juz Amma</span>
                  <span className="text-primary">75% Complete</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-3/4" />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Surahs mastered: An-Nas to Al-Fajr
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-subtle border border-border">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-foreground">Tajweed: Noon Sakinah & Tanween Rules</span>
                  <span className="text-primary">90% Mastered</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-[90%]" />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Passed oral evaluation on Idgham & Ikhfa
                </div>
              </div>
            </div>
          </div>

          {/* Past Sessions History */}
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <h4 className="font-serif font-bold text-lg text-foreground">
                  Recent Completed Lessons
                </h4>
              </div>
              <span className="text-xs text-muted-foreground">
                2 of 4 Lessons this month
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-foreground">
                      Lesson 2: Tajweed & Surah An-Naba
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last Saturday • 45 min • Attended
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-success">Completed</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-foreground">
                      Lesson 1: Level Assessment & Free Trial
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Two weeks ago • 30 min • Attended
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-success">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action: Convert to Real Account */}
        <div className="bg-primary rounded-3xl p-8 sm:p-10 text-primary-foreground shadow-xs text-center sm:text-start flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-foreground/20 text-primary-foreground mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Personal Learning
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-primary-foreground">
              Ready to start your real learning journey?
            </h3>
            <p className="mt-2 text-sm text-primary-foreground/90 leading-relaxed">
              Create your free student account in 30 seconds to lock in your preferred lesson time and experience 1-on-1 personalized mentorship with Ustadh Mahmoud.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleOpenSignup}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-surface text-primary hover:bg-surface-subtle font-semibold text-sm shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2"
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
              className="relative w-full max-w-lg bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-foreground"
            >
              <button
                onClick={() => setZoomModalOpen(false)}
                className="absolute top-5 end-5 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Video className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-serif font-bold mb-2">
                1-on-1 Zoom Classroom Experience
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
                In the live system, clicking this button launches Ustadh Mahmoud's dedicated 1-on-1 Zoom classroom directly. Here is what makes the experience authentic:
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-foreground mb-6">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>High-definition Quranic texts displayed on screen with visual color Tajweed.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Live audio pronunciation correction with mouth articulation diagrams.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Dedicated one-on-one attention without peer distraction or noisy classrooms.</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => setZoomModalOpen(false)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Close Preview
                </button>

                <button
                  onClick={() => {
                    setZoomModalOpen(false);
                    handleOpenSignup();
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors shadow-xs cursor-pointer"
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
              className="relative w-full max-w-lg bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-foreground"
            >
              <button
                onClick={() => setBookingDemoModalOpen(false)}
                className="absolute top-5 end-5 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Simulated Booking Experience</span>
              </div>

              {!demoBookingSuccess ? (
                <>
                  <h3 className="text-xl font-serif font-bold mb-1">
                    Try The 6-Step Guided Booking Flow
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    This simulation demonstrates how seamlessly real students pick their subjects and times.
                  </p>

                  <div className="space-y-4 text-xs sm:text-sm mb-6">
                    <div>
                      <label className="block font-semibold mb-1">1. Choose Subject</label>
                      <select
                        value={demoSelectedSubject}
                        onChange={(e) => setDemoSelectedSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-subtle text-foreground"
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
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">3. Time Slot (Cairo & Student Zone)</label>
                      <div className="p-3 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                        <span>{demoSelectedTime}</span>
                        <span className="text-xs text-primary font-semibold">Available</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setBookingDemoModalOpen(false)}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoBookingSuccess(true)}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      Complete Demo Simulation
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2">
                    You've Seen How Simple It Is
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                    You've just walked through the same simple booking experience used to arrange your lessons with Ustadh Mahmoud.
                  </p>

                  <div className="p-5 rounded-2xl bg-surface-subtle border border-border text-left text-xs mb-6">
                    <h4 className="font-semibold text-base mb-2 text-foreground">Ready for the real experience?</h4>
                    <p className="text-muted-foreground leading-relaxed mb-0">
                      Create your free student account to book an actual lesson, keep your bookings connected to your profile, receive your lesson details, and continue your learning journey.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setBookingDemoModalOpen(false);
                        setDemoBookingSuccess(false);
                        handleOpenSignup();
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <span>Create Free Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => navigate('/')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Return to Homepage
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
