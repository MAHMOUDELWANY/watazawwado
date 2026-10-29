import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { DateTime } from 'luxon';
import {
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Compass,
  Clock,
  RefreshCw,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { BrandLoader } from '../../components/ui/BrandLoader';
import type { SubjectLevel } from '../../components/onboarding/subjects';
import type { LearnerMilestoneKind } from '../../types/database';
import { useActiveLearner } from '../activeLearner';
import type { IslamicSeason } from '../../lib/islamicSeason';
import { useProgressAchievements } from '../components/achievements/useProgressAchievements';
import { AchievementsShelf } from '../components/achievements/AchievementsShelf';
import { LessonTimeline } from '../components/progress/LessonTimeline';
import { ProgressCalm } from '../components/progress/ProgressCalm';
import { ProgressRoad } from '../components/progress/ProgressRoad';
import { rhythmText } from '../components/progress/progressShared';

export interface StudentProgressPageProps {
  lang?: 'en' | 'ar';
  initialData?: ProgressApiResponse | null;
}

export interface ProgressSubjectMeta {
  id: string;
  glyph: string;
  en: string;
  ar: string;
  spineEn: string;
  spineAr: string;
  familyKey: string;
  familyColor: string;
  familyEn: string;
  familyAr: string;
}

export interface ProgressMilestoneItem {
  id: string;
  student_id: string;
  subject: string;
  kind: LearnerMilestoneKind;
  title_ar: string;
  title_en: string;
  reached_at: string;
  lesson_session_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProgressFamilySummaryItem {
  id: string;
  student_id: string;
  session_id: string | null;
  family_summary: string | null;
  achievements: any | null;
  homework: string | null;
  next_steps: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgressPlacementItem {
  id: string;
  serviceId: string;
  status: string;
  selfLevel: string | null;
  suggestedLevel: string | null;
  adminLevel: string | null;
  effectiveLevel: string;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface ProgressNextLessonItem {
  id: string;
  serviceId: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  durationMinutes: number;
  status: string;
  teacherName: string | null;
  zoomJoinUrl: string | null;
}

export interface SubjectProgressModel {
  subject: string;
  subjectMeta: ProgressSubjectMeta;
  currentLevel: SubjectLevel;
  currentLevelIndex: number;
  levels: SubjectLevel[];
  lessonsAttended: { total: number; thisMonth: number };
  weeklyRhythm: { current: number; longest: number };
  milestones: ProgressMilestoneItem[];
  familySummaries: ProgressFamilySummaryItem[];
  placementResult: ProgressPlacementItem | null;
  nextBookedLesson: ProgressNextLessonItem | null;
}

export interface ProgressLearnerSummary {
  id: string;
  name: string;
  learnerType: string;
  isPrimary?: boolean;
}

export interface FamilyChildOverviewCard {
  id: string;
  name: string;
  learnerType: string;
  assignedTeacherName: string | null;
  subject: string;
  subjectMeta: ProgressSubjectMeta;
  currentLevel: SubjectLevel;
  currentLevelIndex: number;
  totalLevels: number;
  weeklyRhythm: { current: number; longest: number };
  lessonsAttended: { total: number; thisMonth: number };
  nextBookedLesson: ProgressNextLessonItem | null;
  newestMilestone: ProgressMilestoneItem | null;
}

export interface ProgressApiResponse {
  learner: {
    id: string;
    name: string;
    learnerType: string;
    currentLevel: string;
    learningInterest: string;
    timezone: string;
    assignedTeacherName: string | null;
    age?: number | null;
    gender?: string | null;
  } | null;
  learners: ProgressLearnerSummary[];
  /** PR-04: drives the seasonal line of a celebration. */
  currentIslamicSeason?: IslamicSeason;
  isGuardianAccount?: boolean;
  childrenOverview?: FamilyChildOverviewCard[];
  overall: {
    lessonsAttended: { total: number; thisMonth: number };
    weeklyRhythm: { current: number; longest: number };
    milestonesCount: number;
    nextBookedLesson: ProgressNextLessonItem | null;
  };
  subjects: SubjectProgressModel[];
}

export const LAST_OPENED_CHILD_STORAGE_KEY = 'watazawwado_progress_last_child_id';

export function getRememberedChildId(): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const val = window.localStorage.getItem(LAST_OPENED_CHILD_STORAGE_KEY);
    return val && val.trim() ? val.trim() : null;
  } catch {
    return null;
  }
}

export function setRememberedChildId(childId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const trimmed = (childId || '').trim();
    if (trimmed) {
      window.localStorage.setItem(LAST_OPENED_CHILD_STORAGE_KEY, trimmed);
    }
  } catch {
    // Ignore storage quota or SSR errors
  }
}

// ============================================================================
// Custom SVG Emblems in Watazawwado's 96x96 House Style (DoorEmblems.tsx)
// ============================================================================

const GOLD = '#E5A93C';
const GOLD_HI = '#F6D58E';
const GOLD_LO = '#B9782A';
const TEAL = '#087D91';
const TEAL_HI = '#14A3B8';
const PAPER = '#FAF7F2';
const PAPER_SHADE = '#E9DCC6';
const INK = '#8B4935';
const FLAME = '#FFF4D6';

function useSvgIds(...names: string[]) {
  const raw = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return Object.fromEntries(names.map((n) => [n, `${n}-${raw}`])) as Record<string, string>;
}

/**
 * Our weekly rhythm motif: a warm fanoos lantern paired with a growing date-palm frond.
 * Never uses a fire emoji. When resting (current === 0), the lantern glows softly like twilight.
 */
export function RhythmLanternEmblem({
  active = true,
  isChild = false,
  className = 'w-16 h-16',
}: {
  active?: boolean;
  isChild?: boolean;
  className?: string;
}) {
  const id = useSvgIds('gold', 'glass', 'palm');
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <defs>
        <linearGradient id={id.gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_HI} />
          <stop offset="55%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_LO} />
        </linearGradient>
        <linearGradient id={id.glass} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={active ? '#FFF3C4' : '#E9DCC6'} />
          <stop offset="100%" stopColor={active ? '#F2B24C' : '#C7B69B'} />
        </linearGradient>
        <linearGradient id={id.palm} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={TEAL} />
          <stop offset="100%" stopColor={TEAL_HI} />
        </linearGradient>
      </defs>

      {/* Ambient halo */}
      <circle
        className={active ? 'emblem-glow' : undefined}
        cx="48"
        cy="50"
        r="34"
        fill={active ? GOLD : TEAL}
        fillOpacity={active ? '0.24' : '0.12'}
      />

      {/* Date-palm frond gently arcing beside the lantern */}
      <path
        d="M24 78 C22 58 26 38 37 24"
        stroke={`url(#${id.palm})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M25 66 C18 63 15 58 14 53 M26 55 C19 51 16 46 16 41 M29 44 C23 40 21 35 22 30 M33 34 C29 30 28 25 30 20"
        stroke={`url(#${id.palm})`}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Lantern ring & chain */}
      <circle cx="52" cy="12" r="3" stroke={`url(#${id.gold})`} strokeWidth="1.8" />
      <path d="M52 15 V20" stroke={`url(#${id.gold})`} strokeWidth="1.8" />

      {/* Lantern dome */}
      <path
        d="M40 31 C40 23 46 19 52 19 C58 19 64 23 64 31 Z"
        fill={`url(#${id.gold})`}
      />
      <rect x="37" y="30" width="30" height="4.5" rx="1.5" fill={GOLD} />

      {/* Lantern glass body */}
      <path
        d="M38 34.5 H66 L70 55 L62 72 H42 L34 55 Z"
        fill={`url(#${id.glass})`}
        stroke={`url(#${id.gold})`}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Inner light source */}
      {active ? (
        <>
          <circle className="emblem-glow" cx="52" cy="51" r="11" fill="#FFFFFF" fillOpacity="0.5" />
          <g className="emblem-flicker">
            <path
              d="M52 40 C55.5 44.5 57.5 47.5 57.5 50.5 A5.5 5.5 0 0 1 46.5 50.5 C46.5 47.5 48.5 44.5 52 40 Z"
              fill="#F2A93B"
            />
            <path
              d="M52 45 C53.8 47.3 54.8 48.8 54.8 50.2 A2.8 2.8 0 0 1 49.2 50.2 C49.2 48.8 50.2 47.3 52 45 Z"
              fill={FLAME}
            />
          </g>
        </>
      ) : (
        <circle cx="52" cy="52" r="5" fill={GOLD_HI} fillOpacity="0.55" />
      )}

      {/* Lattice ribs */}
      <g stroke={GOLD_LO} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7">
        <path d="M46 35 L43 55 L47 72 M58 35 L61 55 L57 72 M34.5 55 H69.5" />
      </g>

      {/* Lantern base */}
      <rect x="41" y="72" width="22" height="5" rx="1.5" fill={`url(#${id.gold})`} />
      <path d="M46 77 H58 L52 84 Z" fill={GOLD_LO} />

      {/* Extra stars for children's warmer view */}
      {isChild && (
        <g className="emblem-twinkle">
          <path
            d="M78 22 L79.4 25.6 L83 27 L79.4 28.4 L78 32 L76.6 28.4 L73 27 L76.6 25.6 Z"
            fill={GOLD_HI}
          />
          <circle cx="20" cy="22" r="2" fill={GOLD_HI} />
        </g>
      )}
    </svg>
  );
}

/**
 * Milestone Emblem 1: 8-point Khatam Star (Rub el Hizb) for surah_completed, juz_completed, level_completed.
 */
export function KhatamStarMilestoneEmblem({ className = 'w-11 h-11' }: { className?: string }) {
  const id = useSvgIds('gold', 'teal');
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false" fill="none">
      <defs>
        <linearGradient id={id.gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_HI} />
          <stop offset="55%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_LO} />
        </linearGradient>
        <linearGradient id={id.teal} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={TEAL_HI} />
          <stop offset="100%" stopColor={TEAL} />
        </linearGradient>
      </defs>
      <circle className="emblem-glow" cx="48" cy="48" r="34" fill={GOLD} fillOpacity="0.22" />
      <g fill={`url(#${id.gold})`} stroke={GOLD_LO} strokeWidth="1.2" strokeLinejoin="round">
        <rect x="24" y="24" width="48" height="48" rx="4" />
        <rect x="24" y="24" width="48" height="48" rx="4" transform="rotate(45 48 48)" />
      </g>
      <circle cx="48" cy="48" r="15" fill={`url(#${id.teal})`} stroke={PAPER} strokeWidth="1.5" />
      <circle cx="48" cy="48" r="5.5" fill={FLAME} />
    </svg>
  );
}

/**
 * Milestone Emblem 2: Open Mushaf on a rehal stand for first_lesson and reading milestones.
 */
export function OpenMushafMilestoneEmblem({ className = 'w-11 h-11' }: { className?: string }) {
  const id = useSvgIds('gold');
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false" fill="none">
      <defs>
        <linearGradient id={id.gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_HI} />
          <stop offset="55%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_LO} />
        </linearGradient>
      </defs>
      <circle className="emblem-glow" cx="48" cy="44" r="30" fill={GOLD} fillOpacity="0.22" />
      <g stroke={`url(#${id.gold})`} strokeWidth="5" strokeLinecap="round">
        <path d="M30 82 L62 50" />
        <path d="M66 82 L34 50" />
      </g>
      <path
        d="M48 60 C40 54 27 52 15 54 V32 C27 30 40 32 48 38 C56 32 69 30 81 32 V54 C69 52 56 54 48 60 Z"
        fill="#7A1E1A"
        stroke={GOLD}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M48 57 C40 51 28 49 18 51 V30 C28 28 40 30 48 36 Z" fill={PAPER} />
      <path d="M48 57 C56 51 68 49 78 51 V30 C68 28 56 30 48 36 Z" fill={PAPER_SHADE} />
      <path d="M48 36 V57" stroke="#CDBB9C" strokeWidth="1.2" />
      <path
        className="emblem-twinkle"
        d="M48 14 L49.8 19.2 L55 21 L49.8 22.8 L48 28 L46.2 22.8 L41 21 L46.2 19.2 Z"
        fill={GOLD_HI}
      />
    </svg>
  );
}

/**
 * Milestone Emblem 3: Mihrab Arch with hanging sanctuary lamp for streak_4w, streak_12w, custom.
 */
export function MihrabArchMilestoneEmblem({ className = 'w-11 h-11' }: { className?: string }) {
  const id = useSvgIds('gold', 'arch');
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false" fill="none">
      <defs>
        <linearGradient id={id.gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_HI} />
          <stop offset="55%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_LO} />
        </linearGradient>
        <linearGradient id={id.arch} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#054A57" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <path
        d="M22 84 V46 C22 28 35 17 48 13 C61 17 74 28 74 46 V84 Z"
        fill={`url(#${id.arch})`}
        stroke={`url(#${id.gold})`}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M48 15 V34" stroke={GOLD_HI} strokeWidth="1.6" />
      <circle className="emblem-glow" cx="48" cy="42" r="12" fill={GOLD} fillOpacity="0.4" />
      <path
        className="emblem-flicker"
        d="M42 34 H54 L57 44 L52 51 H44 L39 44 Z"
        fill={GOLD_HI}
        stroke={GOLD_LO}
        strokeWidth="1"
      />
      <path d="M18 84 H78" stroke={`url(#${id.gold})`} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function MilestoneEmblemByKind({
  kind,
  className = 'w-11 h-11',
}: {
  kind: LearnerMilestoneKind | string;
  className?: string;
}) {
  if (kind === 'book_completed' || kind === 'surah_memorized') {
    return <OpenMushafMilestoneEmblem className={className} />;
  }
  if (kind === 'rule_mastered' || kind === 'custom') {
    return <MihrabArchMilestoneEmblem className={className} />;
  }
  return <KhatamStarMilestoneEmblem className={className} />;
}

// ============================================================================
// Demo / Preview Fixtures for Dev Verification (?preview=active | ?preview=child)
// ============================================================================

/**
 * Dev-only fixtures — tree-shaken out of production builds.
 * Loaded lazily inside the component to avoid top-level await.
 */
function loadDevFixtures(): Promise<Record<string, ProgressApiResponse>> {
  if ((import.meta as any).env?.DEV) {
    return import('./StudentProgressPage.fixtures').then((m) => m.DEV_PREVIEW_DATA);
  }
  return Promise.resolve({});
}

function formatMilestoneKindLabel(kind: LearnerMilestoneKind | string, isAr: boolean): string {
  switch (kind) {
    case 'surah_memorized':
      return isAr ? 'إتمام سورة' : 'Surah Memorized';
    case 'juz_completed':
      return isAr ? 'إتمام جزء' : 'Juz Completed';
    case 'level_completed':
      return isAr ? 'إتمام مستوى' : 'Stage Completed';
    case 'rule_mastered':
      return isAr ? 'إتقان حكم' : 'Rule Mastered';
    case 'book_completed':
      return isAr ? 'إتمام كتاب' : 'Book Completed';
    default:
      return isAr ? 'وسام تميز' : 'Milestone';
  }
}

function formatAchievementsList(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          return String(item.title || item.label || item.name || '').trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [raw.trim()];
  }
  return [];
}

export default function StudentProgressPage({
  lang = 'ar',
  initialData = null,
}: StudentProgressPageProps) {
  const isAr = lang === 'ar';
  const prefersReducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedLearnerId = searchParams.get('learnerId') || '';
  const [rememberedChildId, setRememberedChildIdState] = useState<string | null>(() =>
    getRememberedChildId()
  );
  const isDevEnv = Boolean((import.meta as any).env?.DEV);
  const previewMode = isDevEnv ? searchParams.get('preview') : null;

  // Load dev fixtures async (tree-shaken in production)
  const [devFixtures, setDevFixtures] = useState<Record<string, ProgressApiResponse>>({});
  useEffect(() => {
    if (isDevEnv && previewMode) {
      loadDevFixtures().then(setDevFixtures);
    }
  }, [isDevEnv, previewMode]);

  const [data, setData] = useState<ProgressApiResponse | null>(
    initialData || null
  );
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const currentLevelRef = useRef<HTMLDivElement | null>(null);
  const learningPathSectionRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef<string>('');

  // PA-01: the header's child switcher and this page share one choice.
  const { activeId, setActiveId } = useActiveLearner();

  // Persist requestedLearnerId to localStorage when present
  useEffect(() => {
    if (requestedLearnerId) {
      setRememberedChildId(requestedLearnerId);
      setRememberedChildIdState(requestedLearnerId);
      setActiveId(requestedLearnerId);
    }
  }, [requestedLearnerId]);

  // A change in the header switcher reloads this page for that learner ("Whole family" = the default view).
  const lastActiveRef = useRef(activeId);
  useEffect(() => {
    if (lastActiveRef.current === activeId) return;
    lastActiveRef.current = activeId;
    if ((activeId || '') === requestedLearnerId) return;
    const nextParams = new URLSearchParams(searchParams);
    if (activeId) nextParams.set('learnerId', activeId);
    else nextParams.delete('learnerId');
    setSearchParams(nextParams, { replace: true });
  }, [activeId]);

  const fetchProgress = useCallback(async () => {
    const effectiveLearnerId = requestedLearnerId || getRememberedChildId() || '';

    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }
    // Dev preview: wait for the fixtures instead of calling the API (its failure would race the preview data).
    if (previewMode && !devFixtures[previewMode]) return;
    if (previewMode && devFixtures[previewMode]) {
      setError(null);
      const basePreview = devFixtures[previewMode];
      if (effectiveLearnerId && basePreview.childrenOverview?.length) {
        const matchedChild = basePreview.childrenOverview.find((c) => c.id === effectiveLearnerId);
        if (matchedChild) {
          setData({
            ...basePreview,
            learner: {
              id: matchedChild.id,
              name: matchedChild.name,
              learnerType: matchedChild.learnerType,
              currentLevel: matchedChild.currentLevel.id,
              learningInterest: matchedChild.subject,
              timezone: basePreview.learner?.timezone || 'Europe/London',
              assignedTeacherName: matchedChild.assignedTeacherName,
            },
            overall: {
              lessonsAttended: matchedChild.lessonsAttended,
              weeklyRhythm: matchedChild.weeklyRhythm,
              milestonesCount: matchedChild.newestMilestone ? 1 : 0,
              nextBookedLesson: matchedChild.nextBookedLesson,
            },
          });
          setLoading(false);
          return;
        }
      }
      setData(basePreview);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const query = effectiveLearnerId
        ? `?learnerId=${encodeURIComponent(effectiveLearnerId)}`
        : '';
      const response = await authedJson<ProgressApiResponse>(`/api/student/progress${query}`);
      setData(response);
      if (response?.learner?.id && response?.isGuardianAccount) {
        setRememberedChildId(response.learner.id);
        setRememberedChildIdState(response.learner.id);
      }
    } catch (err: any) {
      console.error('[StudentProgressPage] Failed to load progress:', err);
      // A remembered child the family can no longer read: forget it so the next load falls back to the default learner
      if (err?.status === 403) {
        try { window.localStorage.removeItem(LAST_OPENED_CHILD_STORAGE_KEY); } catch { /* storage blocked */ }
      }
      setError(
        isAr
          ? 'تعذر تحميل مسيرتك التعليمية الآن. يرجى المحاولة مرة أخرى.'
          : 'Unable to load your learning path right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [initialData, previewMode, devFixtures, requestedLearnerId, isAr]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Keep selectedSubjectId synced with available subjects
  useEffect(() => {
    if (!data?.subjects?.length) {
      setSelectedSubjectId('');
      return;
    }
    const exists = data.subjects.some((s) => s.subject === selectedSubjectId);
    if (!exists) {
      setSelectedSubjectId(data.subjects[0].subject);
    }
  }, [data, selectedSubjectId]);

  const activeSubject = useMemo<SubjectProgressModel | null>(() => {
    if (!data?.subjects?.length) return null;
    return (
      data.subjects.find((s) => s.subject === selectedSubjectId) || data.subjects[0] || null
    );
  }, [data, selectedSubjectId]);

  // Scroll the current level node into view once the path renders or subject changes
  useEffect(() => {
    if (loading || !activeSubject) return;
    const scrollKey = `${data?.learner?.id || 'self'}:${activeSubject.subject}:${activeSubject.currentLevelIndex}`;
    if (hasAutoScrolledRef.current === scrollKey) return;
    hasAutoScrolledRef.current = scrollKey;

    const timer = window.setTimeout(() => {
      if (currentLevelRef.current && typeof currentLevelRef.current.scrollIntoView === 'function') {
        currentLevelRef.current.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'center',
        });
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [loading, activeSubject, data?.learner?.id, prefersReducedMotion]);

  const handleScrollToCurrentLevel = () => {
    if (currentLevelRef.current && typeof currentLevelRef.current.scrollIntoView === 'function') {
      currentLevelRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  };

  const handleSelectLearner = (newLearnerId: string, scrollToPath = false) => {
    setRememberedChildId(newLearnerId);
    setRememberedChildIdState(newLearnerId);
    lastActiveRef.current = newLearnerId;
    setActiveId(newLearnerId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('learnerId', newLearnerId);
    setSearchParams(nextParams);

    if (scrollToPath && learningPathSectionRef.current && typeof learningPathSectionRef.current.scrollIntoView === 'function') {
      window.setTimeout(() => {
        learningPathSectionRef.current?.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }, 120);
    }
  };

  // PR-04: achievements shelf and the one-time celebration (hooks stay above the early returns).
  const achievements = useProgressAchievements(data, isAr);

  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 24 };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16">
        <BrandLoader
          size="md"
          text={isAr ? 'نجهز مسيرتك التعليمية...' : 'Preparing your learning path...'}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-8 rounded-[1.75rem] p-1.5 bg-black/[0.04] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
        <div className="rounded-[1.4rem] bg-card p-6 sm:p-8 text-center space-y-4">
          <p className="text-base font-medium text-foreground">
            {error || (isAr ? 'تعذر تحميل المسار التعليمي' : 'Could not load learning path')}
          </p>
          <button
            type="button"
            onClick={fetchProgress}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isAr ? 'إعادة المحاولة' : 'Try again'}</span>
          </button>
        </div>
      </div>
    );
  }

  const learner = data.learner;
  const isChildLearner = learner?.learnerType === 'child';
  const overall = data.overall;
  const isNewLearner = overall.lessonsAttended.total === 0;
  const rhythmCurrent = overall.weeklyRhythm.current;
  const rhythmLongest = overall.weeklyRhythm.longest;
  const viewerTz = learner?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Format date in learner/viewer timezone
  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '';
    const dt = DateTime.fromISO(iso).setZone(viewerTz);
    if (!dt.isValid) return '';
    return dt.setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_MED);
  };

  const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return '';
    const dt = DateTime.fromISO(iso).setZone(viewerTz);
    if (!dt.isValid) return '';
    return dt
      .setLocale(isAr ? 'ar' : 'en')
      .toLocaleString({ month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const childrenOverview = data.childrenOverview || [];
  const showFamilyOverview = Boolean(data.isGuardianAccount && childrenOverview.length > 0);
  const learnerName = learner?.name?.split(' ')[0] || (isAr ? 'الطالب' : 'Learner');
  const isSelf = !data.isGuardianAccount || Boolean(data.learners.find((l) => l.id === learner?.id)?.isPrimary);

  return (
    <div
      className="space-y-5 sm:space-y-6 pb-12"
      data-testid="student-progress-page"
      data-learner-mode={isChildLearner ? 'child' : 'adult'}
    >
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{isAr ? 'مسيرتي' : 'My progress'}</h1>

      {/* PR-07: a guardian sees every child at a glance; tapping one opens that child's progress. */}
      {showFamilyOverview && (
        <section data-testid="parent-family-overview" aria-label={isAr ? 'أبناؤك في نظرة واحدة' : 'All children at a glance'} className="grid gap-2 sm:grid-cols-2">
          {childrenOverview.map((child) => {
            const selected = child.id === learner?.id;
            return (
              <button
                key={child.id}
                type="button"
                data-testid={`family-child-card-${child.id}`}
                onClick={() => handleSelectLearner(child.id, true)}
                aria-pressed={selected}
                className={`text-start rounded-2xl border p-4 grid gap-2 min-h-11 cursor-pointer focus-ring ${selected ? 'border-teal bg-teal/5' : 'border-border bg-surface hover:border-teal/50'}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground" data-testid={`family-child-name-${child.id}`}>{child.name}</span>
                  <span className="text-xs font-semibold text-teal" data-testid={`family-child-subject-${child.id}`}>{isAr ? child.subjectMeta.ar : child.subjectMeta.en}</span>
                </span>
                <span className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, child.totalLevels)}, minmax(0, 1fr))` }} data-testid={`family-child-level-${child.id}`}>
                  {Array.from({ length: Math.max(1, child.totalLevels) }, (_, i) => (
                    <span key={i} className={`h-1.5 rounded-full ${i < child.currentLevelIndex ? 'bg-teal' : i === child.currentLevelIndex ? 'bg-teal/40' : 'bg-border'}`} />
                  ))}
                </span>
                <span className="text-xs text-muted-foreground" data-testid={`family-child-rhythm-${child.id}`}>
                  {isAr ? child.currentLevel.ar : child.currentLevel.en} · {rhythmText(child.weeklyRhythm.current, child.weeklyRhythm.longest, isAr)}
                </span>
                {child.newestMilestone && (
                  <span className="text-xs font-semibold text-foreground" data-testid={`family-child-milestone-${child.id}`}>
                    {isAr ? 'آخر محطة: ' : 'Latest milestone: '}{isAr ? child.newestMilestone.title_ar : child.newestMilestone.title_en}
                  </span>
                )}
              </button>
            );
          })}
        </section>
      )}

      {/* An account with more than one learner (a parent and their children) picks whose progress to show. */}
      {data.learners && data.learners.length > 1 && !showFamilyOverview && (
        <div ref={learningPathSectionRef} className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" role="navigation" aria-label={isAr ? 'اختيار المتعلم' : 'Select learner'}>
          {data.learners.map((item) => {
            const isSelected = item.id === learner?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectLearner(item.id)}
                aria-pressed={isSelected}
                className={`min-h-11 px-4 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer focus-ring ${isSelected ? 'bg-teal text-white' : 'bg-surface text-foreground border border-border'}`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {isNewLearner ? (
        <section data-testid="new-learner-empty-state" className="rounded-3xl bg-surface border border-border p-6 sm:p-8 grid gap-4 justify-items-center text-center">
          <OpenMushafMilestoneEmblem className="w-14 h-14" />
          <div className="grid gap-1.5 max-w-md">
            <h2 className="font-display text-xl font-bold text-foreground">
              {isChildLearner
                ? (isAr ? `طريق ${learnerName} بيبدأ من أول حصة` : `${learnerName}'s road starts with the first lesson`)
                : (isAr ? 'مسيرتك بتبدأ من أول حصة' : 'Your progress starts with the first lesson')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'بعد كل حصة هيظهر هنا المستوى، والمحطات، وكلمة المعلم.' : 'After each lesson you will see the level, milestones and a note from the teacher here.'}
            </p>
          </div>
          <Link to="/student/book" data-testid="empty-state-book-cta" className="flex items-center justify-center w-full sm:w-auto min-h-12 px-6 rounded-2xl bg-[#0A2E35] text-white font-semibold focus-ring">
            {isAr ? 'احجز أول حصة' : 'Book your first lesson'}
          </Link>
        </section>
      ) : (
        <>
          {data.subjects.length > 1 && (
            <div data-testid="subject-switcher" role="tablist" aria-label={isAr ? 'المادة' : 'Subject'} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {data.subjects.map((s) => {
                const active = s.subject === activeSubject?.subject;
                return (
                  <button
                    key={s.subject}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedSubjectId(s.subject)}
                    className={`min-h-11 px-4 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer focus-ring ${active ? 'bg-[#0A2E35] text-white' : 'bg-surface text-foreground border border-border'}`}
                  >
                    {isAr ? s.subjectMeta.ar : s.subjectMeta.en}
                  </button>
                );
              })}
            </div>
          )}
          {activeSubject && (isChildLearner
            ? <ProgressRoad subject={activeSubject} learnerName={learnerName} tz={viewerTz} isAr={isAr} />
            : <ProgressCalm subject={activeSubject} learnerName={learnerName} isSelf={isSelf} tz={viewerTz} isAr={isAr} />)}
        </>
      )}

      {data.learner && !isNewLearner && (
        <Link
          to={`/student/progress/report?learnerId=${encodeURIComponent(data.learner.id)}`}
          className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle focus-ring"
          data-testid="monthly-report-link"
        >
          {isAr ? 'تقرير الشهر' : 'Monthly report'}
        </Link>
      )}
      {data.learner && !isNewLearner && (
        <LessonTimeline learnerId={data.learner.id} isAr={isAr} timezone={viewerTz} />
      )}
      {data.learner && achievements.shelf.length > 0 && (
        <AchievementsShelf items={achievements.shelf} isAr={isAr} highlight={achievements.highlight} />
      )}
      {achievements.celebration}
    </div>
  );
}
