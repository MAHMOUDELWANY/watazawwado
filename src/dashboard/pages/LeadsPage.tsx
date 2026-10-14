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
import { DashboardLead, LeadStatus } from '../types';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { useT } from '../../lib/language';

const STAGE_CONFIG: Record<LeadStatus, { label: string; labelAr: string; color: string }> = {
  visitor: {
    label: 'Visitor',
    labelAr: 'زائر',
    color: 'glass-surface text-muted-foreground border border-border-subtle'
  },
  lead: {
    label: 'New Lead',
    labelAr: 'مهتم جديد',
    color: 'bg-secondary/30 text-primary border border-secondary/50'
  },
  contacted: {
    label: 'Contacted',
    labelAr: 'اتواصلنا معاه',
    color: 'bg-accent/15 text-accent border border-accent/25'
  },
  trial_booked: {
    label: 'Trial Booked',
    labelAr: 'حجز تجربة',
    color: 'bg-warning/15 text-warning-foreground border border-warning/30'
  },
  trial_completed: {
    label: 'Trial Completed',
    labelAr: 'التجربة تمت',
    color: 'bg-secondary/30 text-accent border border-secondary/60'
  },
  potential_student: {
    label: 'Potential Student',
    labelAr: 'ممكن يكمل',
    color: 'bg-accent/10 text-accent border border-accent/25'
  },
  active_student: {
    label: 'Active Student',
    labelAr: 'طالب نشط',
    color: 'bg-success/15 text-success border border-success/30'
  },
  returning_student: {
    label: 'Returning Student',
    labelAr: 'طالب راجع',
    color: 'bg-secondary/30 text-primary border border-primary/25'
  },
  lost: {
    label: 'Lost / Postponed',
    labelAr: 'مش مكمل / أجّل',
    color: 'glass-surface text-muted-foreground border border-border-subtle'
  }
};

type FilterCategory = 'all' | 'followup' | 'new' | 'contacted' | 'trials' | 'potential' | 'active' | 'lost';

export default function LeadsPage() {
  const { t, isAr } = useT();
  const locale = isAr ? 'ar' : 'en';
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
      setError(err.message || t("Interested students couldn't be loaded.", 'تعذر تحميل المهتمين.'));
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
            <h1 className="text-2xl font-display font-bold text-foreground">
              {t('Interested students', 'المهتمين')}
            </h1>
          </div>
          <p className="text-sm sm:text-sm text-muted-foreground mt-1">
            {t('Follow people from their first question to their trial and regular lessons.', 'تابع المهتمين من أول سؤال لحد التجربة والحصص المنتظمة.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] text-muted-foreground">
              {t('Cairo', 'القاهرة')}: {lastRefreshed.setLocale(locale).toFormat('hh:mm a')}
            </span>
          )}
          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border-none text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t('Refresh', 'تحديث')}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl glass-card border-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              {t('New', 'جداد')}
            </span>
            <UserPlus className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {newLeadsCount}
            </span>
            <span className="text-sm text-muted-foreground">{t('to contact', 'محتاجين تواصل')}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              {t('In trial', 'في التجربة')}
            </span>
            <Sparkles className="w-4 h-4 text-warning" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {trialCount}
            </span>
            <span className="text-sm text-muted-foreground">{t('booked or done', 'محجوزة أو تمت')}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              {t('Might continue', 'ممكن يكملوا')}
            </span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {pipelineSummary.potential_student || 0}
            </span>
            <span className="text-sm text-muted-foreground">{t('plan sent', 'اتبعت لهم خطة')}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card border-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              {t('Studying', 'بيدرسوا')}
            </span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {activeCount}
            </span>
            <span className="text-sm text-muted-foreground">{t('regular students', 'طلاب منتظمين')}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass-surface border border-border-subtle overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'all'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('All', 'الكل')} ({leads.length})
          </button>
          {followupCount > 0 && (
            <button
              onClick={() => setFilterCategory('followup')}
              className={`px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterCategory === 'followup'
                  ? 'bg-warning text-warning-foreground shadow-2xs'
                  : 'bg-warning/15 text-warning-foreground hover:bg-warning/25'
              }`}
            >
              <Clock className="w-3 h-3" />
              {t('Follow up', 'متابعة')} ({followupCount})
            </button>
          )}
          <button
            onClick={() => setFilterCategory('new')}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'new'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('New', 'جداد')} ({newLeadsCount})
          </button>
          <button
            onClick={() => setFilterCategory('contacted')}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'contacted'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Contacted', 'اتواصلنا')} ({pipelineSummary.contacted || 0})
          </button>
          <button
            onClick={() => setFilterCategory('trials')}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'trials'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Trials', 'تجارب')} ({trialCount})
          </button>
          <button
            onClick={() => setFilterCategory('potential')}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'potential'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Might continue', 'ممكن يكملوا')} ({pipelineSummary.potential_student || 0})
          </button>
          <button
            onClick={() => setFilterCategory('active')}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === 'active'
                ? 'glass-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Studying', 'بيدرسوا')} ({activeCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            aria-label={t('Search', 'بحث')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search name, email, phone…', 'دوّر بالاسم أو الإيميل أو الرقم…')}
            className="w-full ps-9 pe-4 py-1.5 rounded-xl border border-border glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Leads List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          {t('Loading…', 'جارٍ التحميل…')}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-card border-none">
          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-display font-medium text-base text-foreground">
            {t('Nobody here yet', 'مفيش حد هنا لسه')}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            {t('New questions and sign-ups from the website show up here automatically.', 'الأسئلة والتسجيلات الجديدة من الموقع بتظهر هنا تلقائياً.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const leadWhatsappUrl = buildContextualWhatsAppUrl(
              lead.whatsapp,
              `As-salamu alaykum ${lead.name},\n\nFollowing up on your question about ${lead.service_interest_name || 'lessons'}. How can we help?`
            );
            const cairoCreated = lead.created_at
              ? DateTime.fromISO(lead.created_at).setZone('Africa/Cairo').setLocale(locale).toFormat('MMM d, yyyy')
              : null;

            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="p-4 sm:p-5 rounded-2xl glass-card border-none hover:border-accent/40 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      STAGE_CONFIG[lead.status]?.label ? STAGE_CONFIG[lead.status]?.color : 'glass-surface text-foreground'
                    }`}>
                      {(isAr ? STAGE_CONFIG[lead.status]?.labelAr : STAGE_CONFIG[lead.status]?.label) || lead.status}
                    </span>

                    {lead.needs_followup && (
                      <span className="text-[13px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning-foreground border border-warning/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{t('Follow up', 'متابعة')}: {lead.followup_reason}</span>
                      </span>
                    )}

                    {lead.learner_type === 'child' && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-warning/10 text-warning-foreground border border-warning/20">
                        {t('Child', 'طفل')}
                      </span>
                    )}

                    {lead.source && (
                      <span className="text-[13px] font-mono text-muted-foreground px-1.5 py-0.5 rounded glass-surface border border-border-subtle">
                        {lead.source}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-display font-medium text-base text-foreground truncate">
                      {lead.name}
                      {lead.parent_name && (
                        <span className="text-sm font-normal text-muted-foreground ms-2">
                          ({t('Parent', 'ولي الأمر')}: <span className="text-foreground">{lead.parent_name}</span>)
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {t('Interested in', 'مهتم بـ')}: <span className="font-medium text-foreground">{lead.service_interest_name || t('General question', 'سؤال عام')}</span>
                      {lead.email && <span> • {lead.email}</span>}
                    </p>
                  </div>

                  {/* Goal & Trial summary */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    {cairoCreated && (
                      <span>{t('Asked on', 'سأل يوم')}: {cairoCreated}</span>
                    )}
                    {lead.trial_booking ? (
                      <span className="text-primary font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{t('Trial', 'تجربة')}: {lead.trial_booking.status || t('booked', 'محجوزة')} ({lead.trial_booking.reference_code})</span>
                      </span>
                    ) : (
                      <span className="opacity-60">{t('No trial yet', 'لسه ما حجزش تجربة')}</span>
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
                        title={t('WhatsApp', 'واتساب')}
                        aria-label={t('WhatsApp', 'واتساب')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors"
                        title={t('Email', 'إيميل')}
                        aria-label={t('Email', 'إيميل')}
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary/30 hover:bg-secondary/40 text-accent text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <span>{t('Open', 'افتح')}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
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
