import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { 
  getTeacherAuthDiagnosticState, 
  subscribeTeacherAuthDiagnostic, 
  runTeacherAuthDiagnosticCheck, 
  isTeacherAuthDiagnosticEnabled,
  TeacherAuthDiagnosticState 
} from '../lib/dashboardApi';

export function TeacherAuthDiagnosticPanel() {
  const [enabled, setEnabled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [diagnostic, setDiagnostic] = useState<TeacherAuthDiagnosticState>(getTeacherAuthDiagnosticState());

  useEffect(() => {
    const isEn = isTeacherAuthDiagnosticEnabled();
    setEnabled(isEn);
    if (!isEn) return;

    const unsubscribe = subscribeTeacherAuthDiagnostic((state) => {
      setDiagnostic(state);
    });

    // Run initial probe on mount when enabled
    runTeacherAuthDiagnosticCheck().catch(() => {});

    return () => {
      unsubscribe();
    };
  }, []);

  if (!enabled) {
    return null;
  }

  const handleRunCheck = async () => {
    setRunning(true);
    try {
      await runTeacherAuthDiagnosticCheck();
    } finally {
      setRunning(false);
    }
  };

  const handleCopySummary = () => {
    const today = diagnostic.endpoints['/api/dashboard/today'];
    const integrations = diagnostic.endpoints['/api/integrations/status'];
    const diagEndpoint = diagnostic.endpoints['/api/teacher-auth-diagnostic'];

    const summaryText = [
      '=== WATAZAWWADO TEACHER AUTH DIAGNOSTIC ===',
      `Timestamp: ${diagnostic.lastCheckTime || 'N/A'}`,
      `Frontend Configured: ${diagnostic.frontendConfigured ? 'YES' : 'NO'}`,
      `Session Exists: ${diagnostic.sessionExists ? 'YES' : 'NO'}`,
      `Access Token Exists: ${diagnostic.accessTokenExists ? 'YES' : 'NO'}`,
      `Authorization Header Attached: ${diagnostic.authorizationHeaderAttached ? 'YES' : 'NO'}`,
      `Supabase Project Consistency: ${diagnostic.projectConsistency}`,
      '--- Endpoints ---',
      `/api/dashboard/today: ${today?.httpStatus ?? 'untested'} [${today?.diagnosticStage || 'none'}]`,
      `/api/integrations/status: ${integrations?.httpStatus ?? 'untested'} [${integrations?.diagnosticStage || 'none'}]`,
      `/api/teacher-auth-diagnostic: ${diagEndpoint?.httpStatus ?? 'untested'} [${diagEndpoint?.diagnosticStage || 'none'}]`,
      '==========================================='
    ].join('\n');

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const todayEndpoint = diagnostic.endpoints['/api/dashboard/today'];
  const integrationsEndpoint = diagnostic.endpoints['/api/integrations/status'];

  const getStageExplanation = (stage: string | null | undefined): string => {
    if (!stage) return 'No requests recorded yet. Click "Run Diagnostic Check" to probe endpoints.';
    switch (stage) {
      case 'AUTHORIZED':
        return 'Healthy: Authentication and teacher authorization successfully verified on the server.';
      case 'NO_AUTH_HEADER':
        return 'Failure: The Authorization header was missing from the server request.';
      case 'DEV_TOKEN_REJECTED_PROD':
        return 'Failure: Development bypass token was rejected because NODE_ENV is production.';
      case 'INVALID_BEARER_FORMAT':
        return 'Failure: Authorization header was not formatted as "Bearer <token>".';
      case 'SUPABASE_CONFIG_MISSING':
        return 'Configuration Failure: Backend environment is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.';
      case 'SUPABASE_TOKEN_REJECTED':
        return 'Supabase Token Rejection: Token reached backend, but supabaseAdmin.auth.getUser() rejected it. Check if session is expired or targeting a different project.';
      case 'TEACHER_NOT_FOUND':
        return 'Authorization Failure: Authenticated Supabase user email was not found in the teacher_accounts allowlist.';
      case 'TEACHER_INACTIVE':
        return 'Authorization Failure: Teacher account was found, but is marked inactive in teacher_accounts.';
      case 'NETWORK_ERROR':
        return 'Network Failure: Browser could not reach the backend endpoint.';
      default:
        return `Diagnostic Stage: ${stage}`;
    }
  };

  const primaryStage = todayEndpoint?.diagnosticStage || integrationsEndpoint?.diagnosticStage;

  return (
    <div 
      id="teacher-auth-diagnostic-panel" 
      className="mb-6 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 shadow-lg overflow-hidden transition-all"
    >
      {/* Header bar */}
      <div 
        id="teacher-auth-diagnostic-header" 
        className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-wide text-white">Teacher Auth Observability</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">Task 0.55.4-A</span>
            </div>
            <p className="text-xs text-slate-400">Tablet-ready diagnostic tool for 401 Unauthorized root-cause analysis</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="diagnostic-run-btn"
            type="button"
            onClick={handleRunCheck}
            disabled={running}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Checking...' : 'Run Check'}</span>
          </button>

          <button
            id="diagnostic-copy-btn"
            type="button"
            onClick={handleCopySummary}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            id="diagnostic-toggle-btn"
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            title={collapsed ? 'Expand diagnostic panel' : 'Collapse diagnostic panel'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div id="teacher-auth-diagnostic-body" className="p-4 space-y-4 text-xs">
          {/* Diagnostic indicators grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Session State */}
            <div id="diagnostic-session-card" className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold block mb-1">
                Supabase Session
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {diagnostic.sessionExists ? 'Present' : 'Missing'}
                </span>
                {diagnostic.sessionExists ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Token: {diagnostic.accessTokenExists ? 'Available' : 'None'}
              </p>
            </div>

            {/* 2. Header State */}
            <div id="diagnostic-header-card" className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold block mb-1">
                Authorization Header
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {diagnostic.authorizationHeaderAttached ? 'Attached' : 'Not Attached'}
                </span>
                {diagnostic.authorizationHeaderAttached ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Format: Bearer &lt;token&gt;
              </p>
            </div>

            {/* 3. Project Consistency */}
            <div id="diagnostic-project-card" className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold block mb-1">
                Supabase Project Ref
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {diagnostic.projectConsistency}
                </span>
                {diagnostic.projectConsistency === 'MATCH' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : diagnostic.projectConsistency === 'MISMATCH' ? (
                  <XCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Client ↔ Backend alignment
              </p>
            </div>

            {/* 4. Primary Endpoint Classification */}
            <div id="diagnostic-classification-card" className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold block mb-1">
                Primary Stage
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-emerald-300 truncate max-w-[150px]" title={primaryStage || 'None'}>
                  {primaryStage || 'None'}
                </span>
                {primaryStage === 'AUTHORIZED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Status: {todayEndpoint?.httpStatus ? `${todayEndpoint.httpStatus}` : 'Untested'}
              </p>
            </div>
          </div>

          {/* Detailed Endpoint Probes Table */}
          <div id="diagnostic-probes-table" className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/40">
            <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700/50 font-medium text-slate-300">
              Endpoint Verification Results
            </div>
            <div className="divide-y divide-slate-700/40 font-mono text-[11px]">
              {['/api/dashboard/today', '/api/integrations/status', '/api/teacher-auth-diagnostic'].map((ep) => {
                const res = diagnostic.endpoints[ep];
                return (
                  <div key={ep} className="px-3 py-2 flex items-center justify-between hover:bg-slate-700/20">
                    <span className="text-slate-300">{ep}</span>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        res?.httpStatus === 200 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : res?.httpStatus === 401 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : res?.httpStatus 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {res?.httpStatus ? `HTTP ${res.httpStatus}` : 'PENDING'}
                      </span>
                      <span className="text-slate-400 min-w-[120px] text-right">
                        {res?.diagnosticStage || '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Root-cause interpretation */}
          <div id="diagnostic-interpretation-box" className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-lg">
            <div className="flex items-start space-x-2">
              <Activity className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block mb-0.5">Root Cause Diagnosis</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {getStageExplanation(primaryStage)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
