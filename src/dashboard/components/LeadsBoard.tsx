import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { ALLOWED_LEAD_TRANSITIONS, VALID_LEAD_STATUSES, type ValidLeadStatus } from '../../../server/leadTransitions';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import type { DashboardLead } from '../types';
import { Select } from '../../components/ui/Select';
import { sourceLabel } from '../../lib/leadSource';

type StageLabels = Record<string, { label: string; labelAr: string }>;

/** Statuses a lead may move to from `from` (never itself). The server checks the same map. */
export function nextStages(from: string): ValidLeadStatus[] {
  return (ALLOWED_LEAD_TRANSITIONS[from as ValidLeadStatus] || []).filter((s) => s !== from);
}

/**
 * CRM-02: the lead statuses as columns. Drag a card, or use its "Move to" menu (keyboard and phones), only along
 * allowed transitions. Days in stage = days since the lead row last changed.
 */
export function LeadsBoard({
  leads,
  stages,
  onMoved,
  onOpen
}: {
  leads: DashboardLead[];
  stages: StageLabels;
  onMoved: () => void;
  onOpen: (lead: DashboardLead) => void;
}) {
  const { t, isAr } = useT();
  const [dragged, setDragged] = useState<DashboardLead | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const label = (s: string) => (isAr ? stages[s]?.labelAr : stages[s]?.label) || s;

  const move = async (lead: DashboardLead, to: string) => {
    if (to === lead.status || !nextStages(lead.status).includes(to as ValidLeadStatus)) return;
    setBusyId(lead.id);
    setMessage(null);
    try {
      await dashboardFetch(`/api/dashboard/leads/${lead.id}`, { method: 'PATCH', body: JSON.stringify({ status: to }) });
      onMoved();
    } catch (err: any) {
      setMessage(err?.message || t("Couldn't move it. Please try again.", 'تعذر النقل، حاول تاني.'));
    } finally {
      setBusyId(null);
    }
  };

  const days = (iso?: string | null) => (iso ? Math.max(0, Math.floor(-DateTime.fromISO(iso).diffNow('days').days)) : null);

  return (
    <div className="space-y-2">
      {message && <div role="status" className="p-3 rounded-xl text-sm text-foreground bg-warning/10">{message}</div>}
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x">
        {VALID_LEAD_STATUSES.map((stage) => {
          const column = leads.filter((l) => l.status === stage);
          const canDrop = Boolean(dragged && nextStages(dragged.status).includes(stage));
          return (
            <section
              key={stage}
              aria-label={label(stage)}
              onDragOver={(e) => { if (canDrop) e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); if (dragged && canDrop) move(dragged, stage); setDragged(null); }}
              className={`snap-start shrink-0 w-64 rounded-2xl border p-2.5 space-y-2 transition-colors ${
                canDrop ? 'border-primary bg-primary/5' : dragged ? 'border-border-subtle opacity-60' : 'border-border-subtle glass-surface'
              }`}
            >
              <h3 className="flex items-center justify-between text-sm font-semibold text-foreground px-1">
                <span>{label(stage)}</span>
                <span className="text-xs text-muted-foreground">{column.length}</span>
              </h3>
              {column.map((lead) => {
                const d = days(lead.updated_at || lead.created_at);
                const options = nextStages(lead.status);
                return (
                  <div
                    key={lead.id}
                    draggable={options.length > 0 && busyId !== lead.id}
                    onDragStart={() => setDragged(lead)}
                    onDragEnd={() => setDragged(null)}
                    className={`rounded-xl glass-card border border-border p-2.5 space-y-1.5 ${busyId === lead.id ? 'opacity-50' : 'cursor-grab'}`}
                  >
                    <button type="button" onClick={() => onOpen(lead)} className="block w-full text-start text-sm font-semibold text-foreground hover:underline cursor-pointer">
                      {lead.name}
                    </button>
                    {sourceLabel(lead.acquisition?.lead_source, lead.acquisition?.heard_about) && (
                      <div className="text-xs text-accent"><bdi>{sourceLabel(lead.acquisition?.lead_source, lead.acquisition?.heard_about)}</bdi></div>
                    )}
                    {d !== null && (
                      <div className="text-xs text-muted-foreground">
                        {d === 0 ? t('changed today', 'اتغير النهارده') : t(`${d} days in this stage`, `${d} يوم في المرحلة دي`)}
                      </div>
                    )}
                    {options.length > 0 && (
                      <Select
                        aria-label={t(`Move ${lead.name} to`, `نقل ${lead.name} إلى`)}
                        value=""
                        disabled={busyId === lead.id}
                        onChange={(e) => move(lead, e.target.value)}
                        className="h-9 text-xs"
                      >
                        <option value="">{t('Move to…', 'انقل إلى…')}</option>
                        {options.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                      </Select>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
