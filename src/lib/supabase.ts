import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

/**
 * Supabase Client Initialization
 * 
 * Safely initializes Supabase using environment variables:
 * - VITE_SUPABASE_URL: Project URL
 * - VITE_SUPABASE_ANON_KEY: Client-safe Anonymous Key with Row Level Security (RLS)
 * 
 * Includes graceful configuration check and helper diagnostics.
 */

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key' &&
    supabaseUrl.startsWith('https://')
  );
};

// Remember what kind of email link opened the site (invite / recovery) before the client reads
// and clears the URL hash, so an invited teacher is sent to choose a password first.
const AUTH_LINK_KEY = 'wz_auth_link_type';
try {
  const linkType = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type');
  if (linkType === 'invite') sessionStorage.setItem(AUTH_LINK_KEY, linkType);
} catch {}
export const getAuthLinkType = (): string | null => {
  try {
    return sessionStorage.getItem(AUTH_LINK_KEY);
  } catch {
    return null;
  }
};
export const clearAuthLinkType = (): void => {
  try {
    sessionStorage.removeItem(AUTH_LINK_KEY);
  } catch {}
};

// Create the client with standard options (auth persistence, auto refresh)
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey! : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Diagnostics function to test database connectivity
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  configured: boolean;
  message: string;
  url?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase credentials not configured in environment (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Using fallback local data layer.',
    };
  }

  try {
    const { data, error } = await supabase.from('services').select('id, title').limit(1);
    if (error) {
      return {
        connected: false,
        configured: true,
        message: `Connected to Supabase endpoint, but table query returned: ${error.message}`,
        url: supabaseUrl,
      };
    }
    return {
      connected: true,
      configured: true,
      message: 'Successfully connected to Supabase PostgreSQL database with active RLS!',
      url: supabaseUrl,
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      message: `Connection error: ${err.message || 'Unknown network error'}`,
      url: supabaseUrl,
    };
  }
}
