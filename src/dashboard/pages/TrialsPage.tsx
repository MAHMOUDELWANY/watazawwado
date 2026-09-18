import React, { useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import {
  Sparkles,
  Calendar,
  Clock,
  Video,
  User,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronRight,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { DashboardTrial } from '../types';
import { TrialDetailModal } from '../components/TrialDetailModal';
import { dashboardFetch } from '../lib/dashboardApi';

export default function TrialsPage() {
  const { session } = useTeacherAuth();
  const [upcomingTrials, setUpcomingTrials] = useState<DashboardTrial[]>([]);
  const [recentTrials, setRecentTrials] = useState<DashboardTrial[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recent' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<DashboardTrial | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<DateTime | null>(null);

  const fetchTrials = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardFetch('/api/dashboard/trials');
      setUpcomingTrials(data.upcoming_trials || []);
      setRecentTrials(data.recent_trials || []);
      setLastRefreshed(DateTime.now().setZone('Africa/Cairo'));
    } catch (err: any) {
      setError(err.message || 'Error loading trials.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrials();
  }, [fetchTrials]);

  const allTrials = [...upcomingTrials, ...recentTrials];

  const displayedTrials = (() => {
    let list: DashboardTrial[] = [];
    if (activeTab === 'upcoming') list = upcomingTrials;
    else if (activeTab === 'recent') list = recentTrials;
    else list = allTrials;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(t =>
      (t.learner_name && t.learner_name.toLowerCase().includes(q)) ||
      (t.parent_name && t.parent_name.toLowerCase().includes(q)) ||
      (t.contact_email && t.contact_email.toLowerCase().includes(q)) ||
      (t.reference_code && t.reference_code.toLowerCase().includes(q)) ||
      (t.service_name && t.service_name.toLowerCase().includes(q))
    );
  })();

  const completedCount = allTrials.filter(t => t.status === 'completed' || Boolean(t.assessment)).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Trial Sessions
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
              Free Trial Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Evaluate prospective learners, record mini-lesson observations, and recommend personalized learning plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] text-muted-foreground">
              Cairo: {lastRefreshed.toFormat('hh:mm a')}
            </span>
          )}
          <button
            onClick={() => fetchTrials(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-medium text-foreground hover:bg-surface-subtle transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary' : 'opacity-70'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Upcoming Trials
            </span>
            <Sparkles className="w-4 h-4 text-warning" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {upcomingTrials.length}
            </span>
            <span className="text-xs text-muted-foreground">scheduled</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Completed & Evaluated
            </span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {completedCount}
            </span>
            <span className="text-xs text-muted-foreground">attended</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Total Inquired Trials
            </span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {allTrials.length}
            </span>
            <span className="text-xs text-muted-foreground">all-time</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border w-fit shadow-2xs">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle'
            }`}
          >
            Upcoming Trials ({upcomingTrials.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'recent'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle'
            }`}
          >
            Recent & Completed ({recentTrials.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle'
            }`}
          >
            All Trials ({allTrials.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, email, ref..."
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-1.5 rounded-xl border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trials List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          Loading trial sessions...
        </div>
      ) : displayedTrials.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border shadow-2xs">
          <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-60" />
          <h3 className="font-serif font-medium text-base text-foreground">
            {activeTab === 'upcoming' ? 'No Upcoming Trials' : 'No Trial Records Found'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            {activeTab === 'upcoming'
              ? 'When international students request a free trial lesson, they will appear here with Zoom readiness and assessment tools.'
              : 'Trial sessions and evaluations will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedTrials.map((trial) => {
            const startUtc = trial.scheduled_start ? DateTime.fromISO(trial.scheduled_start) : null;
            const startCairo = startUtc ? startUtc.setZone('Africa/Cairo') : null;
            let startStudent: DateTime | null = null;
            try {
              if (startUtc && trial.student_timezone && trial.student_timezone !== 'Africa/Cairo') {
                startStudent = startUtc.setZone(trial.student_timezone);
              }
            } catch (e) {
              startStudent = null;
            }

            const isAssessed = Boolean(trial.assessment?.current_level || trial.assessment?.learning_plan_summary);

            return (
              <div
                key={trial.id}
                onClick={() => setSelectedTrial(trial)}
                className="p-4 sm:p-5 rounded-2xl bg-surface border border-border hover:border-primary/60 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary">
                      {trial.reference_code}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-warning/15 text-warning-foreground border border-warning/30">
                      Free Trial (30m)
                    </span>
                    {trial.status ? (
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        trial.status === 'completed'
                          ? 'bg-success/15 text-success border border-success/30'
                          : trial.status === 'cancelled'
                          ? 'bg-destructive/15 text-destructive border border-destructive/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {trial.status}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-subtle text-muted-foreground border border-border-subtle">
                        Status unavailable
                      </span>
                    )}

                    {isAssessed ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-success/10 text-success border border-success/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Plan Evaluated</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-subtle text-muted-foreground border border-border-subtle">
                        Assessment Pending
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-medium text-base text-foreground truncate">
                      {trial.learner_name || 'Anonymous Student'}
                      {trial.parent_name && (
                        <span className="text-xs font-normal text-muted-foreground ms-2">
                          (Parent: {trial.parent_name})
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      Service: <span className="font-medium text-foreground">{trial.service_name}</span>
                      {trial.contact_email && <span> • {trial.contact_email}</span>}
                    </p>
                  </div>

                  {/* Cairo & Student Local Time */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>
                        Cairo: {startCairo ? startCairo.toFormat('EEE, MMM d • hh:mm a') : (trial.cairo_time_display || 'Time not set')}
                      </span>
                    </div>

                    {startStudent && (
                      <span className="text-muted-foreground">
                        (Student: {startStudent.toFormat('hh:mm a')} • {trial.student_timezone})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                  <div className="flex items-center gap-2">
                    {trial.zoom_host_url ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                        <Video className="w-3.5 h-3.5" />
                        <span>Zoom Ready</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Video className="w-3.5 h-3.5" />
                        <span>No Zoom Link</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrial(trial);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors cursor-pointer border border-primary/20"
                  >
                    <span>{isAssessed ? 'View & Edit Plan' : 'Assess & Plan'}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trial Detail & Assessment Modal */}
      {selectedTrial && (
        <TrialDetailModal
          trial={selectedTrial}
          onClose={() => setSelectedTrial(null)}
          onAssessmentSaved={() => {
            fetchTrials(false);
          }}
        />
      )}
    </div>
  );
}
