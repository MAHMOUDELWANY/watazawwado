import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { BookOpen, LogOut, User, Menu, X, Sparkles, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useTeacherAuth } from '../lib/auth';
import StudentHomePage from './pages/StudentHomePage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentOnboardingPage from './pages/StudentOnboardingPage';
import StudentDemoPage from './pages/StudentDemoPage';
import { StudentAuthModal } from '../components/StudentAuthModal';

export default function StudentApp() {
  const { user, session, isTeacherAuthenticated, userRole, signOut } = useTeacherAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();

  // If user navigated to /student/demo, always allow direct demo access without requiring authentication
  if (location.pathname.startsWith('/student/demo')) {
    return <StudentDemoPage onOpenSignupModal={() => setAuthModalOpen(true)} />;
  }

  // If a teacher lands here, redirect to the teacher dashboard
  if (isTeacherAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Load student profile when authenticated
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (!user || userRole !== 'student') {
        if (isMounted) setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        const token = session?.access_token || localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/student/me', { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    loadProfile();
    return () => { isMounted = false; };
  }, [user, userRole, session]);

  // If not authenticated, provide choices: Sign In, Create Account, or Explore as Guest Demo
  if (!user || userRole !== 'student') {
    return (
      <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#1E1923] flex items-center justify-center p-6 text-[#30332F] dark:text-[#F8F6F0]">
        <div className="max-w-md w-full bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-8 sm:p-10 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#8FAE9B]/15 text-[#6F907D] dark:text-[#8FAE9B] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">Student Portal Access</h1>
          <p className="text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA] mb-6 leading-relaxed">
            Sign in to view your scheduled 1-on-1 lessons, join your Zoom classroom, or review teacher feedback.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#6F907D] hover:bg-[#557161] text-white rounded-xl transition-all font-medium text-sm shadow-xs cursor-pointer"
            >
              <span>Sign In / Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/student/demo"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FAF8F5] dark:bg-[#2D2635] hover:bg-[#F2EFE9] dark:hover:bg-[#382F42] text-[#30332F] dark:text-[#F8F6F0] border border-[#E2DDD5] dark:border-[#473D50] rounded-xl transition-all font-medium text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Explore as Guest (Interactive Demo)</span>
            </Link>

            <div className="pt-4 border-t border-[#E2DDD5] dark:border-[#3E3545] text-xs text-[#7A827B]">
              <Link to="/" className="hover:underline">
                ← Back to Ustadh Mahmoud Homepage
              </Link>
            </div>
          </div>
        </div>

        <StudentAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  // Profile is loading
  if (loadingProfile && !profile) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#1E1923] flex items-center justify-center text-[#6F907D] dark:text-[#8FAE9B]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Onboarding Gate: If onboarding is not completed, lock dashboard until onboarding is completed
  const needsOnboarding = profile && profile.onboardingCompleted === false;
  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#1E1923] text-[#30332F] dark:text-[#F8F6F0]">
        <StudentOnboardingPage
          currentProfile={profile}
          onCompleted={(updated) => {
            setProfile((prev: any) => ({ ...prev, ...updated, onboardingCompleted: true }));
          }}
        />
      </div>
    );
  }

  const navItems = [
    { name: 'Home & Schedule', path: '/student', icon: BookOpen },
    { name: 'Profile & Goals', path: '/student/profile', icon: User },
    { name: 'Interactive Demo', path: '/student/demo', icon: Sparkles },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#1E1923] text-[#30332F] dark:text-[#F8F6F0] font-sans flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#251F2C] border-r border-[#E2DDD5] dark:border-[#3E3545] 
          flex flex-col transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#E2DDD5]/60 dark:border-[#3E3545]/60">
          <Link to="/student" className="font-serif font-bold text-lg text-[#6F907D] dark:text-[#8FAE9B] flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <span>Student Portal</span>
          </Link>
          <button onClick={toggleSidebar} className="md:hidden text-[#7A827B] hover:text-[#30332F] dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex items-center gap-3 border-b border-[#E2DDD5]/40 dark:border-[#3E3545]/40">
          <div className="w-10 h-10 rounded-full bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B] flex items-center justify-center font-bold text-sm shrink-0">
            {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-[#30332F] dark:text-[#F8F6F0]">
              {profile?.name || user.email?.split('@')[0] || 'Student'}
            </div>
            <div className="text-xs text-[#7A827B] dark:text-[#A69FA8] truncate capitalize">
              {profile?.learnerType || 'Learner'} • {profile?.currentLevel || 'Beginner'}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-[#8FAE9B]/15 text-[#557161] dark:text-[#A8C9B4] font-semibold' 
                    : 'text-[#626A64] dark:text-[#D5D0CA] hover:bg-[#F8F6F0] dark:hover:bg-[#2D2635] hover:text-[#30332F] dark:hover:text-[#F8F6F0]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#6F907D] dark:text-[#8FAE9B]' : 'opacity-70'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <a
            href="/#book"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#6F907D] dark:text-[#8FAE9B] hover:bg-[#8FAE9B]/10 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Book New Lesson</span>
          </a>
        </nav>

        <div className="p-4 border-t border-[#E2DDD5]/60 dark:border-[#3E3545]/60 space-y-2">
          <Link
            to="/"
            className="block px-3.5 py-2 text-xs font-medium text-[#7A827B] hover:text-[#30332F] dark:hover:text-white transition-colors"
          >
            ← Public Homepage
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 bg-white dark:bg-[#251F2C] border-b border-[#E2DDD5] dark:border-[#3E3545]">
          <span className="font-serif font-bold text-[#6F907D] dark:text-[#8FAE9B]">Student Portal</span>
          <button onClick={toggleSidebar} className="p-2 -mr-2 text-[#7A827B] hover:text-[#30332F] dark:hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/" element={<StudentHomePage />} />
              <Route path="/profile" element={<StudentProfilePage />} />
              <Route path="/onboarding" element={
                <StudentOnboardingPage
                  currentProfile={profile}
                  onCompleted={(updated) => {
                    setProfile((prev: any) => ({ ...prev, ...updated, onboardingCompleted: true }));
                  }}
                />
              } />
              <Route path="/demo" element={<StudentDemoPage onOpenSignupModal={() => setAuthModalOpen(true)} />} />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      <StudentAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
