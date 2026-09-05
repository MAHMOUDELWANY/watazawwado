import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export class DashboardApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'DashboardApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Centralized authenticated API helper for dashboard requests.
 * 
 * Rules:
 * 1. Obtains the current Supabase session/access token.
 * 2. Attaches Authorization: Bearer <token> when a valid session exists.
 * 3. NEVER sends 'dev-teacher-token' in production environments.
 * 4. In local development only (non-production), provides fallback dev auth if mock-authenticated.
 * 5. Throws structured DashboardApiError for 401/403/500 responses.
 */
export async function dashboardFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isProd = Boolean((import.meta as any).env?.PROD);
  let token: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    } catch (err) {
      console.warn('[dashboardFetch] Failed to retrieve Supabase session:', err);
    }
  }

  // Local development fallback: ONLY if not in production and mock authenticated in sessionStorage
  if (!token && !isProd) {
    const isMockTeacher = typeof window !== 'undefined' && 
      sessionStorage.getItem('mahmoud_teacher_authenticated') === 'true';
    if (isMockTeacher) {
      token = 'dev-teacher-token';
    }
  }

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // response body was not valid JSON
    }

    const message = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    throw new DashboardApiError(message, response.status, errorData);
  }

  return response.json();
}
