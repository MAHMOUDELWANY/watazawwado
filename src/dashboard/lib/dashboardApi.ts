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

// ----------------------------------------------------------------------------
// Task 0.55.4-A: Temporary, Safe Teacher Auth Diagnostic State
// NEVER stores or exposes tokens, secrets, or credential payloads.
// ----------------------------------------------------------------------------
export interface EndpointDiagnostic {
  endpoint: string;
  httpStatus: number | null;
  diagnosticStage: string | null;
  sessionExists: boolean;
  accessTokenExists: boolean;
  authorizationHeaderAttached: boolean;
  projectConsistency: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
  timestamp: string;
}

export interface TeacherAuthDiagnosticState {
  sessionExists: boolean;
  accessTokenExists: boolean;
  authorizationHeaderAttached: boolean;
  frontendConfigured: boolean;
  projectConsistency: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
  endpoints: Record<string, EndpointDiagnostic>;
  lastCheckTime: string | null;
}

const diagnosticState: TeacherAuthDiagnosticState = {
  sessionExists: false,
  accessTokenExists: false,
  authorizationHeaderAttached: false,
  frontendConfigured: false,
  projectConsistency: 'UNKNOWN',
  endpoints: {},
  lastCheckTime: null,
};

const diagnosticListeners = new Set<(state: TeacherAuthDiagnosticState) => void>();

function notifyDiagnosticListeners() {
  const snapshot = getTeacherAuthDiagnosticState();
  diagnosticListeners.forEach(listener => {
    try {
      listener(snapshot);
    } catch (err) {
      console.warn('[dashboardApi] Error in diagnostic listener:', err);
    }
  });
}

export function getTeacherAuthDiagnosticState(): TeacherAuthDiagnosticState {
  return {
    ...diagnosticState,
    frontendConfigured: isSupabaseConfigured(),
    endpoints: { ...diagnosticState.endpoints }
  };
}

export function subscribeTeacherAuthDiagnostic(
  listener: (state: TeacherAuthDiagnosticState) => void
): () => void {
  diagnosticListeners.add(listener);
  listener(getTeacherAuthDiagnosticState());
  return () => diagnosticListeners.delete(listener);
}

export function isTeacherAuthDiagnosticEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const envFlag = Boolean((import.meta as any).env?.VITE_TEACHER_AUTH_DIAGNOSTIC === 'true');
  const searchFlag = Boolean(window.location?.search?.includes('diagnostic=true'));
  const sessionFlag = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('teacher_auth_diagnostic') === 'true';
  return envFlag || searchFlag || sessionFlag;
}

function extractClientProjectRef(): string | null {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL;
  if (!url || typeof url !== 'string') return null;
  try {
    const hostname = new URL(url.trim()).hostname.toLowerCase();
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[1] === 'supabase' && parts[2] === 'co') {
      return parts[0];
    }
  } catch {}
  return null;
}

function recordDiagnosticResult(endpoint: string, result: EndpointDiagnostic) {
  diagnosticState.endpoints[endpoint] = result;
  diagnosticState.sessionExists = result.sessionExists;
  diagnosticState.accessTokenExists = result.accessTokenExists;
  diagnosticState.authorizationHeaderAttached = result.authorizationHeaderAttached;
  if (result.projectConsistency !== 'UNKNOWN') {
    diagnosticState.projectConsistency = result.projectConsistency;
  }
  diagnosticState.lastCheckTime = result.timestamp;
  notifyDiagnosticListeners();
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
  let sessionExists = false;
  let accessTokenExists = false;

  if (isSupabaseConfigured()) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        sessionExists = true;
        accessTokenExists = Boolean(session.access_token);
        // Proactively refresh token if expired or close to expiry (within 30s)
        const nowSec = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at - nowSec < 30) {
          try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            token = refreshData.session?.access_token || session.access_token;
          } catch {
            token = session.access_token;
          }
        } else {
          token = session.access_token;
        }
      }
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

  // Attach safe non-secret project ref header for consistency check
  const clientRef = extractClientProjectRef();
  if (clientRef) {
    headers.set('x-client-project-ref', clientRef);
  }

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    recordDiagnosticResult(endpoint, {
      endpoint,
      httpStatus: null,
      diagnosticStage: 'NETWORK_ERROR',
      sessionExists,
      accessTokenExists,
      authorizationHeaderAttached: Boolean(token),
      projectConsistency: 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
    throw netErr;
  }

  const diagStage = response.headers.get('x-auth-diagnostic-stage') || null;
  const projConsistency = (response.headers.get('x-project-consistency') as any) || 'UNKNOWN';

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // response body was not valid JSON
    }

    const effectiveStage = diagStage || errorData.diagnosticStage || (response.status === 401 ? 'UNAUTHORIZED' : `HTTP_${response.status}`);
    recordDiagnosticResult(endpoint, {
      endpoint,
      httpStatus: response.status,
      diagnosticStage: effectiveStage,
      sessionExists,
      accessTokenExists,
      authorizationHeaderAttached: Boolean(token),
      projectConsistency: projConsistency,
      timestamp: new Date().toISOString()
    });

    const message = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    throw new DashboardApiError(message, response.status, errorData);
  }

  recordDiagnosticResult(endpoint, {
    endpoint,
    httpStatus: response.status,
    diagnosticStage: diagStage || 'AUTHORIZED',
    sessionExists,
    accessTokenExists,
    authorizationHeaderAttached: Boolean(token),
    projectConsistency: projConsistency,
    timestamp: new Date().toISOString()
  });

  return response.json();
}

/**
 * Explicit trigger for tablet-based diagnostic check.
 * Probes the target endpoints sequentially without modifying any state.
 */
export async function runTeacherAuthDiagnosticCheck(): Promise<TeacherAuthDiagnosticState> {
  const isConfigured = isSupabaseConfigured();
  let sessionExists = false;
  let accessTokenExists = false;

  if (isConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      sessionExists = Boolean(session);
      accessTokenExists = Boolean(session?.access_token);
    } catch {}
  }

  diagnosticState.sessionExists = sessionExists;
  diagnosticState.accessTokenExists = accessTokenExists;
  diagnosticState.frontendConfigured = isConfigured;

  // Probe the observed affected endpoints and diagnostic endpoint
  await dashboardFetch('/api/dashboard/today').catch(() => {});
  await dashboardFetch('/api/integrations/status').catch(() => {});
  await dashboardFetch('/api/teacher-auth-diagnostic').catch(() => {});

  diagnosticState.lastCheckTime = new Date().toISOString();
  notifyDiagnosticListeners();

  return getTeacherAuthDiagnosticState();
}
