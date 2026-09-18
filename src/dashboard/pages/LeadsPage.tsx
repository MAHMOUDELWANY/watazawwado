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
    color: 'bg-surface-subtle text-muted-foreground border border-border-subtle'
  },
  lead: {
    label: 'New Lead',
    color: 'bg-primary/10 text-primary border border-primary/20'
  },
  contacted: {
    label: 'Contacted',
    color: 'bg-accent/15 text-accent border border-accent/25'
  },
  trial_booked: {
    label: 'Trial Booked',
    color: 'bg-warning/15 text-warning-foreground border border-warning/30'
  },
  trial_completed: {
    label: 'Trial Completed',
    color: 'bg-primary/15 text-primary border border-primary/30'
  },
  potential_student: {
    label: 'Potential Student',
    color: 'bg-accent/10 text-accent border border-accent/25'
  },
  active_student: {
    label: 'Active Student',
    color: 'bg-success/15 text-success border border-success/30'
  },
  returning_student: {
    label: 'Returning Student',
    color: 'bg-primary/10 text-primary border border-primary/25'
  },
  lost: {
    label: 'Lost / Postponed',
    color: 'bg-surface-subtle text-muted-foreground border border-border-subtle'
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
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Leads Pipeline
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
              Student Acquisition
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track inquiries from initial contact through trial booking and long-term student enrollment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] text-muted-foreground">
              Cairo: {lastRefreshed.toFormat('hh:mm a')}
            </span>
          )}
          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-medium text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              New Inquiries
            </span>
            <UserPlus className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {newLeadsCount}
            </span>
            <span className="text-xs text-muted-foreground">needs outreach</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              In Trial Phase
            </span>
            <Sparkles className="w-4 h-4 text-warning" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {trialCount}
            </span>
            <span className="text-xs text-muted-foreground">trial booked/done</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Potential Students
            </span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {pipelineSummary.potential_student || 0}
            </span>
            <span className="text-xs text-muted-foreground">plan proposed</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Active Enrolled
            </span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {activeCount}
            </span>
            <span className="text-xs text-muted-foreground">regular learners</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border-subtle overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({leads.length})
          </button>
          {followupCount > 0 && (
            <button
              onClick={() => setFilterCategory('followup')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterCategory === 'followup'
                  ? 'bg-warning text-warning-foreground shadow-2xs'
                  : 'bg-warning/15 text-warning-foreground hover:bg-warning/25'
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
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            New ({newLeadsCount})
          </button>
          <button
            onClick={() => setFilterCategory('contacted')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'contacted'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Contacted ({pipelineSummary.contacted || 0})
          </button>
          <button
            onClick={() => setFilterCategory('trials')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'trials'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Trials ({trialCount})
          </button>
          <button
            onClick={() => setFilterCategory('potential')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'potential'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Potential ({pipelineSummary.potential_student || 0})
          </button>
          <button
            onClick={() => setFilterCategory('active')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'active'
                ? 'bg-surface text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active ({activeCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lead, email, phone..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

      {/* Leads List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          Loading leads pipeline...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border">
          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-serif font-medium text-base text-foreground">
            No Leads in This Stage
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
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
                className="p-4 sm:p-5 rounded-2xl bg-surface border border-border hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      STAGE_CONFIG[lead.status]?.label ? STAGE_CONFIG[lead.status]?.color : 'bg-surface-subtle text-foreground'
                    }`}>
                      {STAGE_CONFIG[lead.status]?.label || lead.status}
                    </span>

                    {lead.needs_followup && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning-foreground border border-warning/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Follow-up: {lead.followup_reason}</span>
                      </span>
                    )}

                    {lead.learner_type === 'child' && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-warning/10 text-warning-foreground border border-warning/20">
                        Child Learner
                      </span>
                    )}

                    {lead.source && (
                      <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-surface-subtle border border-border-subtle">
                        {lead.source}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-medium text-base text-foreground truncate">
                      {lead.name}
                      {lead.parent_name && (
                        <span className="text-xs font-normal text-muted-foreground ms-2">
                          (Parent: <span className="text-foreground">{lead.parent_name}</span>)
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      Interest: <span className="font-medium text-foreground">{lead.service_interest_name || 'General Inquiry'}</span>
                      {lead.email && <span> • {lead.email}</span>}
                    </p>
                  </div>

                  {/* Goal & Trial summary */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {cairoCreated && (
                      <span>Inquired: {cairoCreated}</span>
                    )}
                    {lead.trial_booking ? (
                      <span className="text-primary font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Trial: {lead.trial_booking.status || 'Booked'} ({lead.trial_booking.reference_code})</span>
                      </span>
                    ) : (
                      <span className="opacity-60">No trial booked yet</span>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {leadWhatsappUrl && (
                      <a
                        href={leadWhatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors"
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer"
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
