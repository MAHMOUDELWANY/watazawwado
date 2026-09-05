import React, { useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import {
  UserPlus,
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageCircle,
  Mail,
  ChevronRight,
  Filter,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { DashboardLead, LeadStatus } from '../types';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';

const STAGE_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  visitor: {
    label: 'Visitor',
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
  },
  lead: {
    label: 'New Lead',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  },
  contacted: {
    label: 'Contacted',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  },
  trial_booked: {
    label: 'Trial Booked',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  },
  trial_completed: {
    label: 'Trial Completed',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
  },
  potential_student: {
    label: 'Potential Student',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
  },
  active_student: {
    label: 'Active Student',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  },
  returning_student: {
    label: 'Returning Student',
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
  },
  lost: {
    label: 'Lost / Postponed',
    color: 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
  }
};

type FilterCategory = 'all' | 'followup' | 'new' | 'contacted' | 'trials' | 'potential' | 'active' | 'lost';

export default function LeadsPage() {
  const { session } = useTeacherAuth();
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<Record<string, number>>({});
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<DashboardLead | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<DateTime | null>(null);

  const fetchLeads = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardFetch('/api/dashboard/leads');
      setLeads(data.leads || []);
      setPipelineSummary(data.pipeline_summary || {});
      setLastRefreshed(DateTime.now().setZone('Africa/Cairo'));
    } catch (err: any) {
      setError(err.message || 'Error loading leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = leads.filter((lead) => {
    // Category filter
    let matchesCategory = true;
    if (filterCategory === 'followup') {
      matchesCategory = Boolean(lead.needs_followup);
    } else if (filterCategory === 'new') {
      matchesCategory = lead.status === 'visitor' || lead.status === 'lead';
    } else if (filterCategory === 'contacted') {
      matchesCategory = lead.status === 'contacted';
    } else if (filterCategory === 'trials') {
      matchesCategory = lead.status === 'trial_booked' || lead.status === 'trial_completed';
    } else if (filterCategory === 'potential') {
      matchesCategory = lead.status === 'potential_student';
    } else if (filterCategory === 'active') {
      matchesCategory = lead.status === 'active_student' || lead.status === 'returning_student';
    } else if (filterCategory === 'lost') {
      matchesCategory = lead.status === 'lost';
    }

    if (!matchesCategory) return false;

    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (lead.name && lead.name.toLowerCase().includes(q)) ||
      (lead.parent_name && lead.parent_name.toLowerCase().includes(q)) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.whatsapp && lead.whatsapp.toLowerCase().includes(q)) ||
      (lead.service_interest_name && lead.service_interest_name.toLowerCase().includes(q)) ||
      (lead.notes && lead.notes.toLowerCase().includes(q))
    );
  });

  const trialCount = (pipelineSummary.trial_booked || 0) + (pipelineSummary.trial_completed || 0);
  const newLeadsCount = (pipelineSummary.visitor || 0) + (pipelineSummary.lead || 0);
  const activeCount = (pipelineSummary.active_student || 0) + (pipelineSummary.returning_student || 0);
  const followupCount = leads.filter(l => l.needs_followup).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              Leads Pipeline
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B] font-medium">
              Student Acquisition
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#362E3B]/70 dark:text-[#D5D0CA] mt-1">
            Track inquiries from initial contact through trial booking and long-term student enrollment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] text-[#362E3B]/60 dark:text-[#D5D0CA]/60">
              Cairo: {lastRefreshed.toFormat('hh:mm a')}
            </span>
          )}
          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 text-xs font-medium text-[#362E3B] dark:text-[#F5E6D3] hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              New Inquiries
            </span>
            <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {newLeadsCount}
            </span>
            <span className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60">needs outreach</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              In Trial Phase
            </span>
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {trialCount}
            </span>
            <span className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60">trial booked/done</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Potential Students
            </span>
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {pipelineSummary.potential_student || 0}
            </span>
            <span className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60">plan proposed</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#362E3B]/60 dark:text-[#D5D0CA]/60 font-medium">
              Active Enrolled
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
              {activeCount}
            </span>
            <span className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60">regular learners</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/50 dark:bg-stone-800/40 overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            All ({leads.length})
          </button>
          {followupCount > 0 && (
            <button
              onClick={() => setFilterCategory('followup')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterCategory === 'followup'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <Clock className="w-3 h-3" />
              Follow-up ({followupCount})
            </button>
          )}
          <button
            onClick={() => setFilterCategory('new')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'new'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            New ({newLeadsCount})
          </button>
          <button
            onClick={() => setFilterCategory('contacted')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'contacted'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            Contacted ({pipelineSummary.contacted || 0})
          </button>
          <button
            onClick={() => setFilterCategory('trials')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'trials'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            Trials ({trialCount})
          </button>
          <button
            onClick={() => setFilterCategory('potential')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'potential'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            Potential ({pipelineSummary.potential_student || 0})
          </button>
          <button
            onClick={() => setFilterCategory('active')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'active'
                ? 'bg-white dark:bg-[#2A2431] text-[#362E3B] dark:text-[#F5E6D3] shadow-xs'
                : 'text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:text-[#362E3B]'
            }`}
          >
            Active ({activeCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lead, email, phone..."
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

      {/* Leads List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-500 animate-pulse">
          Loading leads pipeline...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
          <Users className="w-8 h-8 mx-auto text-stone-400 mb-2" />
          <h3 className="font-serif font-medium text-base text-[#362E3B] dark:text-[#F5E6D3]">
            No Leads in This Stage
          </h3>
          <p className="text-xs text-[#362E3B]/60 dark:text-[#D5D0CA]/60 max-w-sm mx-auto mt-1">
            New contact submissions and website booking inquiries will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const leadWhatsappUrl = buildContextualWhatsAppUrl(
              lead.whatsapp,
              `As-salamu alaykum ${lead.name},\n\nThis is Ustadh Mahmoud following up on your inquiry regarding ${lead.service_interest_name || 'lessons'}. How can I assist you?`
            );
            const cairoCreated = lead.created_at
              ? DateTime.fromISO(lead.created_at).setZone('Africa/Cairo').toFormat('MMM d, yyyy')
              : null;

            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 hover:border-[#8FAE9B]/60 dark:hover:border-[#8FAE9B]/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      STAGE_CONFIG[lead.status]?.label ? STAGE_CONFIG[lead.status]?.color : 'bg-stone-100 text-stone-700'
                    }`}>
                      {STAGE_CONFIG[lead.status]?.label || lead.status}
                    </span>

                    {lead.needs_followup && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Follow-up: {lead.followup_reason}</span>
                      </span>
                    )}

                    {lead.learner_type === 'child' && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        Child Learner
                      </span>
                    )}

                    {lead.source && (
                      <span className="text-[10px] font-mono text-stone-500 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
                        {lead.source}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-medium text-base text-[#362E3B] dark:text-[#F5E6D3] truncate">
                      {lead.name}
                      {lead.parent_name && (
                        <span className="text-xs font-normal text-[#6F907D] dark:text-[#8FAE9B] ml-2">
                          (Parent: {lead.parent_name})
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-[#362E3B]/70 dark:text-[#D5D0CA] truncate">
                      Interest: <span className="font-medium text-[#362E3B] dark:text-white">{lead.service_interest_name || 'General Inquiry'}</span>
                      {lead.email && <span> • {lead.email}</span>}
                    </p>
                  </div>

                  {/* Goal & Trial summary */}
                  <div className="flex items-center gap-3 text-xs text-[#362E3B]/70 dark:text-[#D5D0CA]/80 flex-wrap">
                    {cairoCreated && (
                      <span>Inquired: {cairoCreated}</span>
                    )}
                    {lead.trial_booking ? (
                      <span className="text-[#6F907D] dark:text-[#8FAE9B] font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Trial: {lead.trial_booking.status || 'Booked'} ({lead.trial_booking.reference_code})</span>
                      </span>
                    ) : (
                      <span className="text-stone-400">No trial booked yet</span>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {leadWhatsappUrl && (
                      <a
                        href={leadWhatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLead(lead);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#6F907D]/15 hover:bg-[#6F907D]/25 text-[#6F907D] dark:text-[#8FAE9B] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Manage Lead</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={() => {
            fetchLeads(false);
          }}
        />
      )}
    </div>
  );
}
