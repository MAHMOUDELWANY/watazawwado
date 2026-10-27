import { isPasswordLeaked, LEAKED_PASSWORD_MESSAGE } from './pwnedPassword';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { syncChosenLanguage } from './language';

/** Set when someone logs out; the dashboard gate reads it (see wasJustSignedOut). */
const SIGNED_OUT_KEY = 'wz_signed_out_at';
/** True for a few seconds after a log-out in this tab. */
export function wasJustSignedOut(now = Date.now()): boolean {
  try {
    const at = Number(sessionStorage.getItem(SIGNED_OUT_KEY) || 0);
    return at > 0 && now - at < 15000;
  } catch {
    return false;
  }
}

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

/**
 * Authoritative token helper that verifies and auto-refreshes expired Supabase session tokens
 * before critical authenticated API requests (e.g. /api/student/me, /api/student/bookings).
 */
export async function getFreshAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;

    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt && (expiresAt - now < 120)) {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr && refreshed?.session?.access_token) {
        return refreshed.session.access_token;
      }
    }
    return session.access_token;
  } catch (err) {
    console.warn('[auth] Failed to retrieve fresh access token:', err);
    return null;
  }
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

/** What the sign-up form records about the account (stored in the auth user's metadata). */
export interface SignupDetails {
  accountType: 'self' | 'family';
  /** Family accounts: the guardian's age (18+, checked before the account is created). */
  guardianAge?: number;
  /** Personal accounts: the learner confirmed they are 18 or over. */
  confirmedAdult?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isTeacherAuthenticated: boolean;
  userRole: 'teacher' | 'student' | null;
  teacherRole: 'teacher' | 'super_admin' | null;
  signIn: (email: string, password: string, requiredRole?: 'teacher' | 'student') => Promise<{ success: boolean; role?: 'teacher' | 'super_admin' | 'student' | null; error?: string }>;
  signUp: (email: string, password: string, name: string, extra?: SignupDetails) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, token: string, type?: 'signup' | 'recovery' | 'magiclink' | 'email') => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string, type?: 'signup' | 'magiclink' | 'recovery' | 'email') => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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
  const resolvedUserIdRef = useRef<string | null>(null);
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
      resolvedUserIdRef.current = session?.user?.id ?? null;
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
      if (_event === 'SIGNED_IN') void syncChosenLanguage();
      setSession(session);
      // Supabase fires SIGNED_IN / TOKEN_REFRESHED again when the tab regains focus. Same user:
      // keep the user object and role as they are, or every page remounts and loses its state.
      const sameUser = Boolean(session?.user?.id && session.user.id === resolvedUserIdRef.current);
      if (sameUser && _event !== 'USER_UPDATED') {
        return;
      }
      resolvedUserIdRef.current = session?.user?.id ?? null;
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
            error: 'This is a Teaching Staff account. Teaching staff must sign in through the Staff Login page.'
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
            error: 'This area is reserved for teaching staff. Please use the Learning Home to access your student account.'
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
              error: 'This area is reserved for teaching staff. Please use the Learning Home to access your student account.'
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
            error: 'This is a Teaching Staff account. Teaching staff must sign in through the Staff Login page.'
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

  const signUp = async (email: string, password: string, name: string, extra?: SignupDetails): Promise<{ success: boolean; error?: string }> => {
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
    if (await isPasswordLeaked(password)) {
      return { success: false, error: LEAKED_PASSWORD_MESSAGE };
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/student`
        : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
            ...(extra ? {
              account_type: extra.accountType,
              ...(extra.accountType === 'family' ? { guardian_age: extra.guardianAge } : { confirmed_adult: Boolean(extra.confirmedAdult) })
            } : {})
          }
        }
      });
      if (error) return { success: false, error: error.message };

      // In Supabase, when an email is already registered, data.user is returned with empty identities [] and no error
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          success: false,
          error: 'هذا البريد الإلكتروني مسجل بالفعل في المنصة. يرجى تسجيل الدخول مباشرة أو استعادة كلمة المرور.'
        };
      }

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
    if (await isPasswordLeaked(newPassword)) return { success: false, error: LEAKED_PASSWORD_MESSAGE };

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'magiclink' | 'email' = 'signup'): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) return { success: false, error: 'Authentication is unavailable.' };
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resendOtp = async (email: string, type: 'signup' | 'magiclink' | 'recovery' | 'email' = 'signup'): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) return { success: false, error: 'Authentication is unavailable.' };
    try {
      const { error } = await supabase.auth.resend({
        type: type as any,
        email: email.toLowerCase().trim()
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) return { success: false, error: 'Authentication is unavailable.' };
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/student`
        : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to initiate Google sign in.' };
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

    // Drop any in-progress booking (contact details, management token) so the next user on this tab can't see it.
    try {
      sessionStorage.removeItem('watazawwado_pending_booking_state');
      // Lets the teacher dashboard send a person who just logged out to the shared sign-in door, not the staff login.
      sessionStorage.setItem(SIGNED_OUT_KEY, String(Date.now()));
    } catch {}
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
        verifyOtp,
        resendOtp,
        resetPassword,
        updatePassword,
        signInWithGoogle,
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
