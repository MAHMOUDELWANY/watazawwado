import React, { useEffect, useState } from 'react';
import { BookOpen, UserCircle, Target, Book, Sparkles } from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';

export default function StudentHomePage() {
  const { user } = useTeacherAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // In a real app, we would fetch the user's profile and check `onboarding_completed`.
  // For the Phase 5A foundation, we'll simulate the check.
  useEffect(() => {
    // Simulated check - normally we would query the backend
    const checkOnboarding = async () => {
      // Show onboarding prompt randomly for demonstration of the foundation
      // Or we can just default to showing it if we haven't dismissed it
      const hasDismissed = localStorage.getItem('onboarding_dismissed');
      if (!hasDismissed) {
        setShowOnboarding(true);
      }
    };
    checkOnboarding();
  }, []);

  const dismissOnboarding = () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
          Welcome back
        </h1>
        <p className="text-sm opacity-70 mt-1">
          Continue your learning journey with Ustadh Mahmoud
        </p>
      </header>

      {showOnboarding && (
        <div className="bg-gradient-to-br from-[#8FAE9B]/10 to-[#DDE8E0]/10 dark:from-[#8FAE9B]/5 dark:to-[#6F907D]/5 border border-[#8FAE9B]/20 dark:border-[#8FAE9B]/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <button 
              onClick={dismissOnboarding}
              className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
            >
              Skip for now
            </button>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#362E3B] dark:text-[#F5E6D3] mb-1">
                Complete your learning profile
              </h3>
              <p className="text-sm opacity-70 mb-4 max-w-xl">
                Tell us a little bit about yourself and your learning goals to help personalize your experience.
              </p>
              
              <button 
                onClick={() => {
                  alert('Onboarding flow would open here.');
                  dismissOnboarding();
                }}
                className="px-5 py-2.5 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Start Onboarding
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Next Lesson</h3>
          </div>
          
          <div className="text-center py-6">
            <p className="text-sm opacity-60 mb-4">Your learning journey will appear here after your first booking.</p>
            <a 
              href="/#booking"
              className="inline-flex px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Book a Lesson
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#362E3B] dark:text-[#F5E6D3]">Current Path</h3>
          </div>
          
          <div className="text-center py-6">
            <p className="text-sm opacity-60 mb-2">No learning path assigned yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
