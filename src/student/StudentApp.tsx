import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { BookOpen, LogOut, User, Menu, X } from 'lucide-react';
import { useTeacherAuth } from '../lib/auth';
import StudentHomePage from './pages/StudentHomePage';

export default function StudentApp() {
  const { user, isTeacherAuthenticated, signOut } = useTeacherAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // If a teacher somehow lands here, it's okay to let them see it or they can navigate to their dashboard.
  // The requirements say: "Teacher attempting /student: may be redirected to /dashboard".
  // Let's redirect them to dashboard if they are a teacher.
  // We can infer teacher status from isTeacherAuthenticated which is based on our AuthContext.
  if (isTeacherAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated at all, redirect to home.
  // Note: Since this app uses Supabase Auth, we check `user` existence.
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] dark:bg-[#1E1923] flex items-center justify-center p-6 text-[#362E3B] dark:text-[#F5E6D3]">
        <div className="max-w-md w-full bg-white dark:bg-[#2A2431] rounded-2xl p-8 shadow-sm text-center">
          <BookOpen className="w-12 h-12 text-sage-600 dark:text-sage-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Student Access Required</h1>
          <p className="text-sm opacity-80 mb-6">You must be logged in to view your learning dashboard.</p>
          <Link
            to="/#student-login"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl transition-colors font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Home', path: '/student', icon: BookOpen },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-[#F5E6D3] dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] font-sans flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#FAF8F5] dark:bg-[#251F2C] border-r border-[#D5D0CA] dark:border-[#3E3545] 
          flex flex-col transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#D5D0CA]/50 dark:border-[#3E3545]/50">
          <span className="font-serif font-bold text-lg text-[#8FAE9B]">Student Portal</span>
          <button onClick={toggleSidebar} className="md:hidden opacity-60 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex items-center gap-3 border-b border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
          <div className="w-10 h-10 rounded-full bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B] flex items-center justify-center font-bold text-sm">
            {user.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user.email?.split('@')[0] || 'Student'}</div>
            <div className="text-xs opacity-60 truncate">Learner</div>
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
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-[#8FAE9B]/15 text-[#6F907D] dark:text-[#8FAE9B]' 
                    : 'text-[#362E3B]/70 dark:text-[#F5E6D3]/70 hover:bg-[#8FAE9B]/5 hover:text-[#362E3B] dark:hover:text-[#F5E6D3]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-60'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#D5D0CA]/50 dark:border-[#3E3545]/50">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 bg-[#FAF8F5] dark:bg-[#251F2C] border-b border-[#D5D0CA] dark:border-[#3E3545]">
          <span className="font-serif font-bold text-[#8FAE9B]">Student Portal</span>
          <button onClick={toggleSidebar} className="p-2 -mr-2 opacity-60 hover:opacity-100">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <Routes>
              <Route path="/" element={<StudentHomePage />} />
              <Route path="*" element={
                <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                  <BookOpen className="w-10 h-10 text-[#8FAE9B] mb-4 opacity-80" />
                  <h3 className="text-base font-medium mb-1">Module Coming Soon</h3>
                  <p className="text-sm opacity-60">This area of the student portal is under development.</p>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
