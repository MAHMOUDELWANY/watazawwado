import React, { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  RefreshCw, 
  MessageSquare,
  ShieldAlert,
  Compass,
  Award,
  Calendar as CalendarIcon,
  DollarSign
} from 'lucide-react';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { DashboardAnalytics } from '../types';

type DateRange = 'all_time' | 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom';

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardAnalytics & { payments?: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<DateTime | null>(null);
  
  const [dateRange, setDateRange] = useState<DateRange>('all_time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchAnalytics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let url = '/api/dashboard/analytics';
      if (dateRange !== 'all_time') {
        url += `?range=${dateRange}`;
        if (dateRange === 'custom' && customStart && customEnd) {
          url += `&start_date=${customStart}&end_date=${customEnd}`;
        }
      }
      const res = await dashboardFetch(url);
      setData(res);
      setLastRefreshed(DateTime.now().setZone('Africa/Cairo'));
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    if (dateRange === 'custom' && (!customStart || !customEnd)) {
      return;
    }
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-10 h-10 border-3 border-[#8FAE9B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#362E3B]/70 dark:text-[#D5D0CA]">Calculating metrics...</p>
      </div>
    );
  }

  const funnel = data?.funnel;
  const rates = funnel?.rates;
  const payments = data?.payments;

  const funnelStages = [
    {
      label: 'New Inquiries',
      count: funnel?.new_inquiries || 0,
      description: 'Website visitors & forms submitted',
      color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
      barColor: 'bg-stone-400'
    },
    {
      label: 'Trial Booked',
      count: funnel?.trials_booked || 0,
      description: 'Scheduled 30-min evaluation sessions',
      color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      barColor: 'bg-indigo-500'
    },
    {
      label: 'Trial Completed',
      count: funnel?.trials_completed || 0,
      description: 'Completed level assessment & sample lesson',
      color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
      barColor: 'bg-teal-600'
    },
    {
      label: 'Active Students',
      count: funnel?.active_students || 0,
      description: 'Enrolled in ongoing 1-on-1 teaching cycles',
      color: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      barColor: 'bg-emerald-600'
    }
  ];

  const maxStageCount = Math.max(...funnelStages.map(s => s.count), 1);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              Operational Analytics
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B] font-medium">
              Real-time
            </span>
          </div>
          <p className="text-sm text-[#362E3B]/70 dark:text-[#D5D0CA] mt-1">
            Tracking learner progression, engagement, and operational metrics.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="px-3 py-1.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] focus:ring-2 focus:ring-[#8FAE9B]/30 outline-none"
            >
              <option value="all_time">All Time</option>
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-xl border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-white dark:bg-[#2A2431] text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] hover:bg-stone-50 dark:hover:bg-[#3E3545]/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          {lastRefreshed && (
            <span className="text-[11px] text-[#362E3B]/50 dark:text-[#D5D0CA]/50 font-mono">
              Updated {lastRefreshed.toFormat('HH:mm:ss')} Cairo
            </span>
          )}
        </div>
      </div>

      {dateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-wider text-stone-500 mb-1 font-medium">Start Date</label>
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-sm outline-none focus:border-[#8FAE9B]"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-wider text-stone-500 mb-1 font-medium">End Date</label>
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#D5D0CA]/60 dark:border-[#3E3545] bg-transparent text-sm outline-none focus:border-[#8FAE9B]"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Lead → Trial
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              {rates?.lead_to_trial_rate !== null && rates?.lead_to_trial_rate !== undefined ? `${rates.lead_to_trial_rate}%` : 'N/A'}
            </span>
          </div>
          <p className="text-[11px] text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
            {rates?.lead_to_trial_rate === null ? 'No leads in date range' : 'Leads booking a trial'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Trial → Student
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
              {rates?.trial_to_student_rate !== null && rates?.trial_to_student_rate !== undefined ? `${rates.trial_to_student_rate}%` : 'N/A'}
            </span>
          </div>
          <p className="text-[11px] text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
            {rates?.trial_to_student_rate === null ? 'No completed trials in date range' : 'Trials converting to active'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Total Active
            </span>
            <div className="w-8 h-8 rounded-full bg-[#8FAE9B]/20 flex items-center justify-center text-[#6F907D] dark:text-[#8FAE9B]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#6F907D] dark:text-[#8FAE9B]">
              {data?.total_students_enrolled || 0}
            </span>
          </div>
          <p className="text-[11px] text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
            Current active students
          </p>
        </div>
        
        <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Bookings
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-amber-700 dark:text-amber-400">
              {data?.total_bookings_count || 0}
            </span>
          </div>
          <p className="text-[11px] text-[#362E3B]/70 dark:text-[#D5D0CA]/70">
            Lessons in period
          </p>
        </div>
      </div>

      {/* Visual Pipeline Funnel & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
                Learner Lifecycle Stages
              </h2>
              <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]">
                Volume distribution across the lifecycle transition states.
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              {funnel?.total_leads || 0} Leads
            </span>
          </div>

          <div className="space-y-4">
            {funnelStages.map((stage, idx) => {
              const percentageOfTotal = (funnel?.total_leads || 0) > 0
                ? Math.round((stage.count / (funnel?.total_leads || 1)) * 100)
                : 0;
              const barWidth = Math.max(8, Math.round((stage.count / maxStageCount) * 100));

              return (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-stone-400 font-medium">0{idx + 1}</span>
                      <span className="font-medium text-[#362E3B] dark:text-[#F5E6D3]">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#362E3B] dark:text-[#F5E6D3]">{stage.count}</span>
                      <span className="text-[11px] text-stone-400">({percentageOfTotal}%)</span>
                    </div>
                  </div>

                  <div className="h-3 w-full rounded-full bg-stone-100 dark:bg-stone-800/80 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${stage.barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment Operational Status */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#6F907D] dark:text-[#8FAE9B]" />
              <h2 className="text-base font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
                Payment Operational Status
              </h2>
            </div>
            <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]">
              Activity overview of payment records created in the selected period.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 text-center">
                <span className="block text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">{payments?.confirmed_count || 0}</span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-500 font-medium">Confirmed</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 text-center">
                <span className="block text-2xl font-serif font-bold text-amber-700 dark:text-amber-400">{payments?.pending_count || 0}</span>
                <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-500 font-medium">Pending</span>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/40 text-center">
                <span className="block text-2xl font-serif font-bold text-rose-700 dark:text-rose-400">{payments?.rejected_count || 0}</span>
                <span className="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-500 font-medium">Rejected</span>
              </div>
            </div>
          </div>
          
          {/* Service Demand Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#6F907D] dark:text-[#8FAE9B]" />
              <h2 className="text-base font-serif font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
                Service Demand
              </h2>
            </div>
            
            <div className="space-y-3 pt-2">
              {Object.entries(data?.services_distribution || {}).length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center">No service inquiries in period.</p>
              ) : (
                Object.entries(data?.services_distribution || {}).map(([serviceName, countVal]) => {
                  const count = Number(countVal) || 0;
                  const total = funnel?.total_leads || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={serviceName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#362E3B] dark:text-[#F5E6D3] font-medium">{serviceName}</span>
                        <span className="text-stone-500 font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#8FAE9B]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
