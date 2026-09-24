import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

export const APPROVED_TEACHER_EMAILS = [
  'mhmwdlwany4222@gmail.com',
  'mahmoudelwany98@gmail.com'
];

export interface TeacherAuthVerificationResult {
  isTeacher: boolean;
  role?: 'teacher' | 'super_admin' | null;
  isInactive?: boolean;
  error?: string;
}

export async function verifyServerTeacherStatus(token?: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('/api/dashboard/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(
      data?.user?.isTeacher ||
      data?.user?.role === 'teacher' ||
      data?.user?.role === 'super_admin' ||
      data?.role === 'teacher'
    );
  } catch {
    return false;
  }
}

export async function checkServerTeacherAuthDetails(token?: string | null): Promise<TeacherAuthVerificationResult> {
  if (!token) return { isTeacher: false };
  try {
    const res = await fetch('/api/dashboard/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      const rawRole = data?.user?.role || data?.role;
      const role: 'teacher' | 'super_admin' = rawRole === 'super_admin' ? 'super_admin' : 'teacher';
      const isTeacher = Boolean(
        data?.user?.isTeacher ||
        rawRole === 'teacher' ||
        rawRole === 'super_admin'
      );
      return { isTeacher, role };
    }
    const data = await res.json().catch(() => null);
    if (res.status === 403) {
      if (data?.diagnosticStage === 'TEACHER_INACTIVE' || data?.error?.toLowerCase().includes('inactive')) {
        return { isTeacher: false, isInactive: true, error: 'Teacher account is inactive.' };
      }
      return { isTeacher: false, error: data?.error || 'Account is not authorized for the teacher workspace.' };
    }
    return { isTeacher: false, error: data?.error || 'Authentication verification failed.' };
  } catch {
    return { isTeacher: false, error: 'Network error verifying teacher authorization.' };
  }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isTeacherAuthenticated: boolean;
  userRole: 'teacher' | 'student' | null;
  teacherRole: 'teacher' | 'super_admin' | null;
  signIn: (email: string, password: string, requiredRole?: 'teacher' | 'student') => Promise<{ success: boolean; role?: 'teacher' | 'super_admin' | 'student' | null; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const TeacherAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [teacherRole, setTeacherRole] = useState<'teacher' | 'super_admin' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();
  const isProduction = Boolean((import.meta as any).env?.PROD);

  // Helper to determine role for UX navigation via authoritative server state. 
  // Security is strictly enforced server-side.
  const resolveRole = async (currSession: Session | null): Promise<'teacher' | 'student' | null> => {
    if (!currSession?.user?.email) return null;
    const token = currSession.access_token;
    if (!token) return 'student';

    // Allow dev token in non-production
    if (!isProduction && (token === 'dev-teacher-token' || token === 'dev-super-admin-token')) {
      return 'teacher';
    }

    try {
      const isTeacher = await verifyServerTeacherStatus(token);
      if (isTeacher) return 'teacher';
      return 'student';
    } catch {
      // Safe fallback in non-production offline environments only
      if (!isProduction && APPROVED_TEACHER_EMAILS.includes(currSession.user.email.toLowerCase().trim())) {
        return 'teacher';
      }
      return 'student';
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      if (isProduction) {
        console.error('[Security] Production environment detected without Supabase configuration.');
        setLoading(false);
        return;
      }
      const mockTeacher = null;
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
        setTeacherRole('teacher');
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        const role = await resolveRole(session);
        setUserRole(role);
        if (role === 'teacher') {
          const details = await checkServerTeacherAuthDetails(session.access_token);
          setTeacherRole(details.role || 'teacher');
        } else {
          setTeacherRole(null);
        }
      } else {
        setUserRole(null);
        setTeacherRole(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        const role = await resolveRole(session);
        setUserRole(role);
        if (role === 'teacher') {
          const details = await checkServerTeacherAuthDetails(session.access_token);
          setTeacherRole(details.role || 'teacher');
        } else {
          setTeacherRole(null);
        }
      } else {
        setUserRole(null);
        setTeacherRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured, isProduction]);

  const signIn = async (
    email: string, 
    password: string, 
    requiredRole?: 'teacher' | 'student'
  ): Promise<{ success: boolean; role?: 'teacher' | 'super_admin' | 'student' | null; error?: string }> => {
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
      
      const isTeacherEmail = normalizedEmail.includes('teacher') || APPROVED_TEACHER_EMAILS.includes(normalizedEmail);

      if (isTeacherEmail) {
        if (requiredRole === 'student') {
          return {
            success: false,
            role: 'teacher',
            error: 'This is a Teaching Staff account. Teaching staff must sign in through the Staff Login portal.'
          };
        }
        const assignedRole: 'teacher' | 'super_admin' = normalizedEmail === 'mahmoudelwany98@gmail.com' ? 'super_admin' : 'teacher';
        setUser({
          id: assignedRole === 'super_admin' ? 'teacher-admin-001' : 'teacher-mahmoud-001',
          email: normalizedEmail,
          app_metadata: {},
          user_metadata: { name: 'Ustadh Mahmoud' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any);
        setUserRole('teacher');
        setTeacherRole(assignedRole);
        return { success: true, role: assignedRole };
      } else {
        if (requiredRole === 'teacher') {
          return {
            success: false,
            role: 'student',
            error: 'This portal is reserved for teaching staff. Please use the Student Portal to access your learner account.'
          };
        }
        setUser({
          id: 'student-mock-001',
          email: normalizedEmail,
          app_metadata: {},
          user_metadata: { name: 'Mock Student' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any);
        setUserRole('student');
        setTeacherRole(null);
        return { success: true, role: 'student' };
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

      // Check authoritative server teacher status
      const teacherDetails = await checkServerTeacherAuthDetails(data.session?.access_token);

      if (requiredRole === 'teacher') {
        if (teacherDetails.isInactive) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setUserRole(null);
          setTeacherRole(null);
          return {
            success: false,
            role: null,
            error: 'Your teacher account is currently inactive. Please contact the administrator.'
          };
        }

        if (!teacherDetails.isTeacher) {
          // In non-production fallback
          if (!isProduction && APPROVED_TEACHER_EMAILS.includes(normalizedEmail)) {
            // allow in dev fallback
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setUserRole(null);
            setTeacherRole(null);
            return {
              success: false,
              role: 'student',
              error: 'This portal is reserved for teaching staff. Please use the Student Portal to access your learner account.'
            };
          }
        }
      }

      if (requiredRole === 'student') {
        if (teacherDetails.isTeacher || (!isProduction && APPROVED_TEACHER_EMAILS.includes(normalizedEmail))) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setUserRole(null);
          setTeacherRole(null);
          return {
            success: false,
            role: 'teacher',
            error: 'This is a Teaching Staff account. Teaching staff must sign in through the Staff Login portal.'
          };
        }
      }

      setUser(data.user);
      setSession(data.session);
      const role = await resolveRole(data.session);
      setUserRole(role);
      const currentTeacherRole = teacherDetails.isTeacher 
        ? (teacherDetails.role || (normalizedEmail === 'mahmoudelwany98@gmail.com' ? 'super_admin' : 'teacher')) 
        : null;
      setTeacherRole(currentTeacherRole);
      return { success: true, role: currentTeacherRole || role };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected authentication error occurred.' };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password || !name) {
      return { success: false, error: 'Please provide name, email, and password.' };
    }
    const normalizedEmail = email.toLowerCase().trim();

    if (!isConfigured) {
      return { success: false, error: 'Authentication is unavailable.' };
    }
    if (APPROVED_TEACHER_EMAILS.includes(normalizedEmail)) {
      return { success: false, error: 'Teacher registration is not permitted.' };
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/student`
        : undefined;

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email) return { success: false, error: 'Please enter your email.' };
    if (!isConfigured) return { success: false, error: 'Authentication is unavailable.' };

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/#reset-password`
        : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: redirectUrl
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
    if (!isConfigured) return { success: false, error: 'Authentication is unavailable.' };

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setSession(null);
    setUserRole(null);
    setTeacherRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isTeacherAuthenticated: userRole === 'teacher',
        userRole,
        teacherRole,
        signIn,
        signUp,
        resetPassword,
        updatePassword,
        signOut,
        isConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useTeacherAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useTeacherAuth must be used within an AuthProvider');
  }
  return context;
};
