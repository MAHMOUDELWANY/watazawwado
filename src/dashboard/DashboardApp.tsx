import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useTeacherAuth } from '../lib/auth';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Video, 
  BookOpen, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Sparkles,
  UserPlus,
  TrendingUp
} from 'lucide-react';
import TodayPage from './pages/TodayPage';
import UpcomingPage from './pages/UpcomingPage';
import TrialsPage from './pages/TrialsPage';
import LeadsPage from './pages/LeadsPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import BookingsPage from './pages/BookingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import { TeacherAuthDiagnosticPanel } from './components/TeacherAuthDiagnosticPanel';
import { Language } from '../booking/types';

export function DashboardApp() {
  const { isTeacherAuthenticated, user, signOut } = useTeacherAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const [lang, setLang] = useState<Language>('en');

  // If not authenticated, we should show a message or redirect.
  // Wait, the TeacherAuthModal handles login on the landing page via hash #teacher.
  // We can just render a simple forbidden state with a link back to login if they bypassed it.
  if (!isTeacherAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] dark:bg-[#1E1923] flex items-center justify-center p-6 text-[#362E3B] dark:text-[#F5E6D3]">
        <div className="max-w-md w-full bg-white dark:bg-[#2A2431] rounded-2xl p-8 shadow-sm text-center">
          <ShieldCheckIcon className="w-12 h-12 text-sage-600 dark:text-sage-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Teacher Access Required</h1>
          <p className="text-sm opacity-80 mb-6">You must be logged in as a teacher to view the dashboard.</p>
          <Link to="/staff/login" className="inline-flex items-center justify-center px-6 py-2.5 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl transition-colors font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Today', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upcoming', path: '/dashboard/upcoming', icon: Calendar },
    { name: 'Trials', path: '/dashboard/trials', icon: Sparkles },
    { name: 'Leads', path: '/dashboard/leads', icon: UserPlus },
    { name: 'Students', path: '/dashboard/students', icon: Users },
    { name: 'Bookings', path: '/dashboard/bookings', icon: BookOpen },
    { name: 'Analytics', path: '/dashboard/analytics', icon: TrendingUp },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-[#F5E6D3] dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] font-sans flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#2A2431] border-r border-[#D5D0CA]/30 dark:border-[#3E3545]/30
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
          <Link to="/" className="text-lg font-semibold tracking-tight text-[#6F907D] dark:text-[#8FAE9B]">
            Watazawwado Workspace
          </Link>
          <button onClick={toggleMobileMenu} className="md:hidden opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-[#EAF0EB] text-[#6F907D] dark:bg-[#8FAE9B]/10 dark:text-[#8FAE9B]' 
                    : 'text-[#362E3B]/70 dark:text-[#F5E6D3]/70 hover:bg-[#F8F6F0] dark:hover:bg-[#3E3545]/30'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-[#F8F6F0] dark:bg-[#1E1923]">
            <div className="w-8 h-8 rounded-full bg-[#D8C49A]/30 flex items-center justify-center text-[#6F907D] font-medium text-sm">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.name || 'Mahmoud'}</p>
              <p className="text-[10px] opacity-70 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 bg-white dark:bg-[#2A2431] border-b border-[#D5D0CA]/30 dark:border-[#3E3545]/30 md:hidden">
          <button onClick={toggleMobileMenu} className="p-2 -ml-2 opacity-70 hover:opacity-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-[#6F907D] dark:text-[#8FAE9B]">Watazawwado Workspace</span>
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <TeacherAuthDiagnosticPanel />
            <Routes>
              <Route path="/" element={<TodayPage />} />
              <Route path="/upcoming" element={<UpcomingPage />} />
              <Route path="/trials" element={<TrialsPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

function ShieldCheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
