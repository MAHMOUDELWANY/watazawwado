import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { Select } from '../components/ui/Select';

/**
 * PA-01: one "which child" choice for the whole family portal. null = all children.
 * Stored under the progress page's key, so the header and the progress page always agree.
 */
export const ACTIVE_LEARNER_STORAGE_KEY = 'watazawwado_progress_last_child_id';

export interface PortalLearner { id: string; name: string }

interface ActiveLearnerState {
  learners: PortalLearner[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

const Ctx = createContext<ActiveLearnerState>({ learners: [], activeId: null, setActiveId: () => {} });

function readStored(): string | null {
  try { return window.localStorage.getItem(ACTIVE_LEARNER_STORAGE_KEY)?.trim() || null; } catch { return null; }
}

/** The learners a family account switches between: the account holder (if they learn too) and each child. */
export function familyLearners(profile: any): PortalLearner[] {
  const children: PortalLearner[] = (Array.isArray(profile?.linkedChildren) ? profile.linkedChildren : [])
    .filter((c: any) => c?.id && c?.name)
    .map((c: any) => ({ id: String(c.id), name: String(c.name) }));
  if (children.length === 0) return [];
  const selfLearns = profile?.id && profile?.bookingPreference !== 'child';
  return selfLearns ? [{ id: String(profile.id), name: String(profile.name || '') }, ...children] : children;
}

export function ActiveLearnerProvider({ profile, children }: { profile: any; children: React.ReactNode }) {
  const learners = useMemo(() => familyLearners(profile), [profile]);
  const [stored, setStored] = useState<string | null>(() => readStored());
  // A stored id that is no longer one of this account's learners means "all".
  const activeId = stored && learners.some((l) => l.id === stored) ? stored : null;

  const setActiveId = useCallback((id: string | null) => {
    setStored(id);
    try {
      if (id) window.localStorage.setItem(ACTIVE_LEARNER_STORAGE_KEY, id);
      else window.localStorage.removeItem(ACTIVE_LEARNER_STORAGE_KEY);
    } catch { /* storage blocked: the choice lasts for this visit */ }
  }, []);

  const value = useMemo(() => ({ learners, activeId, setActiveId }), [learners, activeId, setActiveId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useActiveLearner = () => useContext(Ctx);

/** Header control; renders nothing for an account without children. */
export function ChildSwitcher({ isAr }: { isAr: boolean }) {
  const { learners, activeId, setActiveId } = useActiveLearner();
  if (learners.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 min-w-0" data-tour="child-switcher">
      <Users className="w-4 h-4 text-accent shrink-0 hidden sm:block" aria-hidden="true" />
      <Select
        aria-label={isAr ? 'عرض بيانات' : 'Show'}
        value={activeId || ''}
        onChange={(e) => setActiveId(e.target.value || null)}
        className="h-9 text-xs sm:text-sm max-w-[9.5rem] sm:max-w-[12rem]"
      >
        <option value="">{isAr ? 'كل الأسرة' : 'Whole family'}</option>
        {learners.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </Select>
    </div>
  );
}
