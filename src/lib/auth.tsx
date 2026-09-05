import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

const APPROVED_TEACHER_EMAILS = [
  'mhmwdlwany4222@gmail.com',
  'mahmoudelwany98@gmail.com'
];

interface TeacherAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isTeacherAuthenticated: boolean;
  userRole: 'teacher' | 'student' | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const TeacherAuthContext = createContext<TeacherAuthContextType | undefined>(undefined);

export const TeacherAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();
  const isProduction = Boolean((import.meta as any).env?.PROD);

  // Helper to determine role for UX navigation. 
  // Security is strictly enforced server-side.
  const resolveUxRole = (email?: string): 'teacher' | 'student' | null => {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    if (APPROVED_TEACHER_EMAILS.includes(normalizedEmail)) {
      return 'teacher';
    }
    return 'student';
  };

  useEffect(() => {
    if (!isConfigured) {
      if (isProduction) {
        console.error('[Security] Production environment detected without Supabase configuration.');
        setLoading(false);
        return;
      }
      const mockTeacher = sessionStorage.getItem('mahmoud_teacher_authenticated');
      if (mockTeacher === 'true') {
        const mockEmail = 'mhmwdlwany4222@gmail.com';
        setUser({
          id: 'teacher-mahmoud-001',
          email: mockEmail,
          app_metadata: {},
          user_metadata: { name: 'Ustadh Mahmoud' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any);
        setUserRole('teacher');
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(resolveUxRole(session?.user?.email));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(resolveUxRole(session?.user?.email));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured, isProduction]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isConfigured) {
      if (isProduction) {
        return {
          success: false,
          error: 'Authentication is unavailable: Supabase credentials are not configured in this production environment.',
        };
      }
      console.warn('[Development] Authenticating with local development mock.');
      
      // Strict exact match for local dev mock
      if (APPROVED_TEACHER_EMAILS.includes(normalizedEmail)) {
        sessionStorage.setItem('mahmoud_teacher_authenticated', 'true');
        setUser({
          id: 'teacher-mahmoud-001',
          email: normalizedEmail,
          app_metadata: {},
          user_metadata: { name: 'Ustadh Mahmoud' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any);
        setUserRole('teacher');
        return { success: true };
      } else {
        // Mock student login
        sessionStorage.setItem('student_authenticated', 'true');
        setUser({
          id: 'student-mock-001',
          email: normalizedEmail,
          app_metadata: {},
          user_metadata: { name: 'Mock Student' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any);
        setUserRole('student');
        return { success: true };
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      setUserRole(resolveUxRole(data.user?.email));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected authentication error occurred.' };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem('mahmoud_teacher_authenticated');
    sessionStorage.removeItem('student_authenticated');
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return (
    <TeacherAuthContext.Provider
      value={{
        user,
        session,
        loading,
        isTeacherAuthenticated: userRole === 'teacher',
        userRole,
        signIn,
        signOut,
        isConfigured,
      }}
    >
      {children}
    </TeacherAuthContext.Provider>
  );
};

export const useTeacherAuth = () => {
  const context = useContext(TeacherAuthContext);
  if (!context) {
    throw new Error('useTeacherAuth must be used within a TeacherAuthProvider');
  }
  return context;
};
