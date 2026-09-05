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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              Trial Sessions
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-medium">
              Free Trial Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#362E3B]/70 dark:text-[#D5D0CA] mt-1">
            Evaluate prospective learners, record mini-lesson observations, and recommend personalized learning plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] text-[#362E3B]/60 dark:text-[#D5D0CA]/60">
              Cairo: {lastRefreshed.toFormat('hh:mm a')}
            </span>
          )}
          <button
            onClick={() => fetchTrials(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Upcoming Trials
            </span>
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {upcomingTrials.length}
            </span>
            <span className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60">scheduled</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Completed & Evaluated
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#6F907D] dark:text-[#8FAE9B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {completedCount}
            </span>
            <span className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60">attended</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Total Inquired Trials
            </span>
            <Calendar className="w-4 h-4 text-[#8FAE9B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {allTrials.length}
            </span>
            <span className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60">all-time</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/50 dark:bg-stone-800/40 w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            Upcoming Trials ({upcomingTrials.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'recent'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            Recent & Completed ({recentTrials.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            All Trials ({allTrials.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, email, ref..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trials List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500 animate-pulse">
          Loading trial sessions...
        </div>
      ) : displayedTrials.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
          <Sparkles className="w-8 h-8 mx-auto text-stone-400 mb-2" />
          <h3 className="font-serif font-medium text-base text-[#362E3B] dark:text-[#F5E6D3]">
            {activeTab === 'upcoming' ? 'No Upcoming Trials' : 'No Trial Records Found'}
          </h3>
          <p className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60 max-w-sm mx-auto mt-1">
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
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 hover:border-[#8FAE9B]/60 dark:hover:border-[#8FAE9B]/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#8FAE9B]/15 text-[#6F907D] dark:text-[#8FAE9B]">
                      {trial.reference_code}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      Free Trial (30m)
                    </span>
                    {trial.status ? (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        trial.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : trial.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {trial.status.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                        Status unavailable
                      </span>
                    )}

                    {isAssessed ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Plan Evaluated</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                        Assessment Pending
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-medium text-base text-[#362E3B] dark:text-[#F5E6D3] truncate">
                      {trial.learner_name || 'Anonymous Student'}
                      {trial.parent_name && (
                        <span className="text-xs font-normal text-[#6F907D] dark:text-[#8FAE9B] ml-2">
                          (Parent: {trial.parent_name})
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA] truncate">
                      Service: <span className="font-medium text-[#362E3B] dark:text-white">{trial.service_name}</span>
                      {trial.contact_email && <span> • {trial.contact_email}</span>}
                    </p>
                  </div>

                  {/* Cairo & Student Local Time */}
                  <div className="flex items-center gap-4 text-xs text-[#362E3B]/75 dark:text-[#D5D0CA]/80 flex-wrap">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#6F907D]" />
                      <span>
                        Cairo: {startCairo ? startCairo.toFormat('EEE, MMM d • hh:mm a') : (trial.cairo_time_display || 'Time not set')}
                      </span>
                    </div>

                    {startStudent && (
                      <span className="text-stone-500 dark:text-stone-400">
                        (Student: {startStudent.toFormat('hh:mm a')} • {trial.student_timezone})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    {trial.zoom_host_url ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                        <Video className="w-3.5 h-3.5" />
                        <span>Zoom Ready</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-stone-400">
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#6F907D]/15 hover:bg-[#6F907D]/25 text-[#6F907D] dark:text-[#8FAE9B] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>{isAssessed ? 'View & Edit Plan' : 'Assess & Plan'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
