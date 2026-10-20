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
  } | null;
  learners: ProgressLearnerSummary[];
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

  // Persist requestedLearnerId to localStorage when present
  useEffect(() => {
    if (requestedLearnerId) {
      setRememberedChildId(requestedLearnerId);
      setRememberedChildIdState(requestedLearnerId);
    }
  }, [requestedLearnerId]);

  const fetchProgress = useCallback(async () => {
    const effectiveLearnerId = requestedLearnerId || getRememberedChildId() || '';

    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }
    if (previewMode && devFixtures[previewMode]) {
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

  // Map milestones onto level indices for the active subject
  const subjectLevels = activeSubject?.levels || [];
  const currentIdx = activeSubject?.currentLevelIndex ?? 0;
  const subjectMilestones = activeSubject?.milestones || [];
  const familyColor = activeSubject?.subjectMeta.familyColor || TEAL;

  const getMilestonesForLevelIndex = (idx: number): ProgressMilestoneItem[] => {
    if (!subjectMilestones.length) return [];
    if (subjectLevels.length <= 1) return idx === 0 ? subjectMilestones : [];

    return subjectMilestones.filter((m) => {
      if (m.kind === 'level_completed') {
        const completedTarget = Math.max(0, currentIdx - 1);
        return idx === completedTarget;
      }
      return idx === currentIdx;
    });
  };

  const childrenOverview = data.childrenOverview || [];
  const showFamilyOverview = Boolean(data.isGuardianAccount && childrenOverview.length > 0);

  return (
    <div
      className="space-y-6 sm:space-y-8 pb-12"
      data-testid="student-progress-page"
      data-learner-mode={isChildLearner ? 'child' : 'adult'}
    >
      {/* ====================================================================
          PARENT / GUARDIAN FAMILY VIEW: All children at a glance (PR-07)
          ==================================================================== */}
      {showFamilyOverview && (
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          data-testid="parent-family-overview"
          aria-label={isAr ? 'أبناؤك في نظرة واحدة' : 'All children at a glance'}
          className="rounded-[2rem] p-1.5 bg-gradient-to-b from-[#087D91]/15 via-black/[0.03] to-[#C9973B]/15 dark:from-[#087D91]/20 dark:via-white/[0.04] dark:to-[#C9973B]/20 ring-1 ring-[#C9973B]/25 dark:ring-[#E5A93C]/20"
        >
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#FBF7EF] dark:bg-[#0D161A] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#087D91]/12 text-[#087D91] dark:bg-[#087D91]/25 dark:text-[#14A3B8]">
                  <Sparkles className="w-3 h-3" />
                  <span>{isAr ? 'نظرة العائلة' : 'Family Overview'}</span>
                </div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                  {isAr ? 'أبناؤك في نظرة واحدة' : 'All children at a glance'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isAr
                    ? 'اضغط على بطاقة أي طفل لفتح مساره التعليمي الكامل بالأسفل.'
                    : 'Tap any child’s card to open their full learning path below.'}
                </p>
              </div>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-card border border-border text-muted-foreground">
                {isAr
                  ? `${childrenOverview.length} ${childrenOverview.length === 2 ? 'طفلين' : 'أبناء'}`
                  : `${childrenOverview.length} ${childrenOverview.length === 1 ? 'child' : 'children'}`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {childrenOverview.map((child) => {
                const isSelectedChild = child.id === learner?.id;
                const isRememberedChild = child.id === rememberedChildId;
                return (
                  <button
                    key={child.id}
                    type="button"
                    data-testid={`family-child-card-${child.id}`}
                    data-selected-child={isSelectedChild ? 'true' : 'false'}
                    aria-pressed={isSelectedChild}
                    onClick={() => handleSelectLearner(child.id, true)}
                    className={`group relative w-full text-start rounded-[1.5rem] p-4 sm:p-5 transition-all select-none active:scale-[0.99] flex flex-col justify-between gap-4 ${
                      isSelectedChild
                        ? 'bg-card border-2 border-[#087D91] dark:border-[#14A3B8] shadow-md ring-4 ring-[#087D91]/10'
                        : 'bg-card/85 hover:bg-card border border-border/80 hover:border-[#C9973B]/50 shadow-2xs'
                    }`}
                  >
                    {/* Top row: Child Name + Subject Badge + Active/Remembered Pill */}
                    <div className="space-y-3 w-full">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-10 h-10 rounded-2xl flex items-center justify-center font-serif text-lg font-bold text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: child.subjectMeta.familyColor }}
                            aria-hidden="true"
                          >
                            {child.subjectMeta.glyph}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3
                              className="font-serif text-base sm:text-lg font-bold text-foreground leading-snug"
                              data-testid={`family-child-name-${child.id}`}
                            >
                              {child.name}
                            </h3>
                            <p
                              className="text-xs font-medium text-muted-foreground truncate"
                              data-testid={`family-child-subject-${child.id}`}
                            >
                              {isAr ? child.subjectMeta.ar : child.subjectMeta.en}
                            </p>
                          </div>
                        </div>

                        {(isSelectedChild || isRememberedChild) && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isSelectedChild && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#087D91] text-white">
                                {isAr ? 'معروض الآن' : 'Viewing now'}
                              </span>
                            )}
                            {isRememberedChild && (
                              <span
                                data-testid={`remembered-child-badge-${child.id}`}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C9973B]/15 text-[#8B4935] dark:bg-[#E5A93C]/20 dark:text-[#F6D58E]"
                              >
                                {isAr ? 'آخر مسار فتحته' : 'Last opened'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Current Level & Weekly Rhythm Row */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div
                          className="rounded-xl bg-[#FBF7EF] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] px-3 py-2"
                          data-testid={`family-child-level-${child.id}`}
                        >
                          <div className="text-[10px] font-semibold text-muted-foreground">
                            {isAr ? 'المستوى الحالي' : 'Current stage'}
                          </div>
                          <div className="text-xs font-bold text-foreground truncate mt-0.5">
                            {isAr ? child.currentLevel.ar : child.currentLevel.en}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {isAr
                              ? `المرحلة ${child.currentLevelIndex + 1} من ${child.totalLevels}`
                              : `Stage ${child.currentLevelIndex + 1} of ${child.totalLevels}`}
                          </div>
                        </div>

                        <div
                          className="rounded-xl bg-[#FBF7EF] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] px-3 py-2 flex items-center gap-2"
                          data-testid={`family-child-rhythm-${child.id}`}
                        >
                          <RhythmLanternEmblem
                            active={child.weeklyRhythm.current > 0}
                            isChild={true}
                            className="w-8 h-8 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-muted-foreground">
                              {isAr ? 'الإيقاع الأسبوعي' : 'Weekly rhythm'}
                            </div>
                            <div className="text-xs font-bold text-[#087D91] dark:text-[#14A3B8] truncate mt-0.5 tabular-nums">
                              {child.weeklyRhythm.current > 0
                                ? isAr
                                  ? `${child.weeklyRhythm.current} أسابيع`
                                  : `${child.weeklyRhythm.current}w steady`
                                : isAr
                                  ? 'في استراحة'
                                  : 'Resting'}
                            </div>
                            <div className="text-[10px] text-muted-foreground tabular-nums">
                              {isAr
                                ? `${child.lessonsAttended.total} دروس`
                                : `${child.lessonsAttended.total} lessons`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom section: Next Lesson + Newest Milestone */}
                    <div className="space-y-2 pt-2 border-t border-border/60 w-full">
                      <div
                        className="flex items-center justify-between gap-2 text-xs"
                        data-testid={`family-child-next-lesson-${child.id}`}
                      >
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-[#087D91] shrink-0" />
                          <span>{isAr ? 'الدرس القادم:' : 'Next lesson:'}</span>
                        </span>
                        <span className="font-semibold text-foreground truncate">
                          {child.nextBookedLesson
                            ? formatDateTime(child.nextBookedLesson.scheduledStart)
                            : isAr
                              ? 'غير محجوز بعد'
                              : 'Not scheduled yet'}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-2 rounded-xl bg-[#C9973B]/10 dark:bg-[#E5A93C]/10 border border-[#C9973B]/25 px-2.5 py-2"
                        data-testid={`family-child-milestone-${child.id}`}
                      >
                        <MilestoneEmblemByKind
                          kind={child.newestMilestone?.kind || 'custom'}
                          className="w-7 h-7 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-[#8B4935] dark:text-[#F6D58E]">
                            {isAr ? 'أحدث وسام' : 'Newest milestone'}
                          </div>
                          <div className="text-xs font-semibold text-foreground truncate">
                            {child.newestMilestone
                              ? isAr
                                ? child.newestMilestone.title_ar
                                : child.newestMilestone.title_en
                              : isAr
                                ? 'أول وسام في الطريق بإذن الله'
                                : 'First milestone on the way'}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#087D91] dark:text-[#14A3B8] shrink-0 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
                          {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* Learner Switcher when account has multiple learners (e.g., parent himself + children) */}
      {data.learners && data.learners.length > 1 && (
        <div
          ref={learningPathSectionRef}
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
          role="navigation"
          aria-label={isAr ? 'اختيار المتعلم' : 'Select learner'}
        >
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap pe-1">
            {isAr ? 'المسار الخاص بـ:' : 'Showing path for:'}
          </span>
          {data.learners.map((item) => {
            const isSelected = item.id === learner?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectLearner(item.id)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap select-none active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#087D91] text-white shadow-sm'
                    : 'bg-card text-foreground/80 border border-border hover:border-[#C9973B]/50'
                }`}
                aria-pressed={isSelected}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ====================================================================
          HEADER CARD: Weekly Rhythm (Lantern & Date Palm motif), Praise & Stats
          ==================================================================== */}
      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        aria-label={isAr ? 'ملخص الإيقاع الأسبوعي والحضور' : 'Weekly rhythm and attendance summary'}
        className="rounded-[2rem] p-1.5 bg-gradient-to-b from-[#C9973B]/20 via-black/[0.04] to-[#087D91]/15 dark:from-[#C9973B]/25 dark:via-white/[0.05] dark:to-[#087D91]/20 ring-1 ring-[#C9973B]/25 dark:ring-[#E5A93C]/20 shadow-sm"
      >
        <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#FBF7EF] dark:bg-[#0D161A] px-4 py-5 sm:px-7 sm:py-7">
          {/* Subtle warm radial glow in corner */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -end-20 w-64 h-64 rounded-full opacity-25 dark:opacity-20"
            style={{
              background: 'radial-gradient(circle, #E5A93C 0%, transparent 70%)',
            }}
          />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left / Start: Motif Emblem + Rhythm Copy + Praise Word */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              <div className="shrink-0 rounded-2xl bg-[#087D91]/[0.08] dark:bg-[#087D91]/20 border border-[#C9973B]/30 p-2 sm:p-2.5">
                <RhythmLanternEmblem
                  active={rhythmCurrent > 0}
                  isChild={isChildLearner}
                  className={isChildLearner ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16'}
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C9973B]/15 text-[#8B4935] dark:bg-[#E5A93C]/20 dark:text-[#F6D58E]">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{isAr ? 'زادك الله علمًا ونورًا' : 'May Allah increase you in knowledge'}</span>
                  </span>
                  {learner?.assignedTeacherName && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <UserCheck className="w-3.5 h-3.5 text-[#087D91]" />
                      <span>
                        {isAr
                          ? `مع ${learner.assignedTeacherName}`
                          : `With ${learner.assignedTeacherName}`}
                      </span>
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {rhythmCurrent > 0
                    ? isAr
                      ? `إيقاع أسبوعي مضيء: ${rhythmCurrent} ${rhythmCurrent === 1 ? 'أسبوع' : 'أسابيع'} متتالية`
                      : `${rhythmCurrent}-week steady learning rhythm`
                    : rhythmLongest > 0
                      ? isAr
                        ? 'فانوسك في استراحة هادئة — نكمل خطوتك متى شئت'
                        : 'Your lantern is resting — ready whenever you are'
                      : isAr
                        ? `أهلاً بك يا ${learner?.name || ''} في مسيرتك التعليمية`
                        : `Welcome to your learning path${learner?.name ? `, ${learner.name}` : ''}`}
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {rhythmCurrent > 0
                    ? isAr
                      ? 'كل درس أسبوعي تحضره يبني عادة راسخة ويزيدك قربًا وإتقانًا خطوة بعد خطوة.'
                      : 'Every weekly lesson you attend nurtures a steady habit and deepens your mastery step by step.'
                    : rhythmLongest > 0
                      ? isAr
                        ? 'ما بنيته محفوظ في ميزانك ومسيرتك. درس واحد هذا الأسبوع يعيد إضاءة إيقاعك الأسبوعي بهدوء.'
                        : 'Everything you have built stays with you. One lesson this week gently lights your weekly rhythm again.'
                      : isAr
                        ? 'خطوة هادئة كل أسبوع كافية لتصنع أثرًا يدوم. تابع مراحل مادتك وإنجازاتك من هنا.'
                        : 'One calm step each week builds lasting knowledge. Follow your stages and milestones right here.'}
                </p>
              </div>
            </div>

            {/* Right / End: 3 Tactile Rhythm & Attendance Stat Pills */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div
                className="rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] px-3 py-3 sm:px-4 sm:py-3.5 text-center"
                data-testid="metric-weekly-rhythm"
              >
                <div className="text-lg sm:text-2xl font-bold text-[#087D91] dark:text-[#14A3B8] tabular-nums">
                  {rhythmCurrent}
                </div>
                <div className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
                  {isAr ? 'الإيقاع الحالي (أسابيع)' : 'Current rhythm (wks)'}
                </div>
              </div>

              <div
                className="rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] px-3 py-3 sm:px-4 sm:py-3.5 text-center"
                data-testid="metric-lessons-attended"
              >
                <div className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">
                  {overall.lessonsAttended.total}
                </div>
                <div className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
                  {isAr
                    ? `دروس حضرتها (${overall.lessonsAttended.thisMonth} هذا الشهر)`
                    : `Lessons (${overall.lessonsAttended.thisMonth} this mo)`}
                </div>
              </div>

              <div
                className="rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] px-3 py-3 sm:px-4 sm:py-3.5 text-center"
                data-testid="metric-longest-rhythm"
              >
                <div className="text-lg sm:text-2xl font-bold text-[#C9973B] dark:text-[#F6D58E] tabular-nums">
                  {rhythmLongest}
                </div>
                <div className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
                  {isAr ? 'أطول إيقاع (أسابيع)' : 'Longest rhythm (wks)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ====================================================================
          NEW LEARNER EMPTY STATE: Invites the first lesson warmly
          ==================================================================== */}
      {isNewLearner && (
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          data-testid="new-learner-empty-state"
          aria-label={isAr ? 'ابدأ درسك الأول' : 'Start your first lesson'}
          className="rounded-[1.75rem] p-1.5 bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-[#C9973B]/30"
        >
          <div className="rounded-[calc(1.75rem-0.375rem)] bg-card px-5 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#C9973B]/15 dark:bg-[#E5A93C]/15 flex items-center justify-center">
                <OpenMushafMilestoneEmblem className="w-11 h-11" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                  {isAr
                    ? 'رحلتك تبدأ بالدرس الأول'
                    : 'Your learning path begins with your first lesson'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                  {isAr
                    ? 'اختر موعدك المناسب مع معلمك ليضيء أول وسام على مسارك التعليمي بالأسفل، وتبدأ خطواتك بثبات.'
                    : 'Choose a time that suits your family to unlock your first milestone on the path below and begin at a calm, steady pace.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
              <Link
                to="/student/book"
                data-testid="empty-state-book-cta"
                className="group inline-flex items-center justify-between gap-3 min-h-[44px] w-full sm:w-auto ps-5 pe-2 py-2 rounded-full bg-[#087D91] hover:bg-[#066677] text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
              >
                <span>{isAr ? 'احجز درسك الأول' : 'Book your first lesson'}</span>
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform group-hover:scale-105">
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </span>
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* ====================================================================
          SUBJECT SWITCHER / TABS (when learner has multiple subjects)
          ==================================================================== */}
      {data.subjects.length > 1 && (
        <section aria-label={isAr ? 'المواد الدراسية' : 'Learning subjects'}>
          <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isAr ? 'اختر المادة لعرض مسارها' : 'Select subject path'}
            </h3>
            <span className="text-xs text-muted-foreground">
              {isAr ? `${data.subjects.length} مواد` : `${data.subjects.length} subjects`}
            </span>
          </div>

          <div
            role="tablist"
            aria-label={isAr ? 'مواد المتعلم' : 'Learner subjects'}
            className="flex items-center gap-2.5 overflow-x-auto pb-1.5 no-scrollbar"
            data-testid="subject-switcher"
          >
            {data.subjects.map((subj) => {
              const isSelected = subj.subject === activeSubject?.subject;
              return (
                <button
                  key={subj.subject}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => setSelectedSubjectId(subj.subject)}
                  className={`group flex items-center gap-3 min-h-[48px] px-4 py-2.5 rounded-2xl border text-start transition-all whitespace-nowrap select-none active:scale-[0.98] ${
                    isSelected
                      ? 'bg-card border-[#C9973B] shadow-sm ring-2 ring-[#C9973B]/20'
                      : 'bg-card/60 border-border hover:bg-card hover:border-foreground/20'
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-serif text-base font-bold text-white shrink-0"
                    style={{ backgroundColor: subj.subjectMeta.familyColor }}
                    aria-hidden="true"
                  >
                    {subj.subjectMeta.glyph}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {isAr ? subj.subjectMeta.ar : subj.subjectMeta.en}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {isAr ? subj.currentLevel.ar : subj.currentLevel.en} ·{' '}
                      {isAr
                        ? `${subj.lessonsAttended.total} دروس`
                        : `${subj.lessonsAttended.total} lessons`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ====================================================================
          THE LEARNING PATH (Vertical Map built from the subject's real levels)
          ==================================================================== */}
      {activeSubject && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Main Column: Vertical Learning Path */}
          <div className="lg:col-span-8 rounded-[2rem] p-1.5 bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
            <div className="rounded-[calc(2rem-0.375rem)] bg-card p-4 sm:p-7 space-y-6">
              {/* Subject Path Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-2xl font-bold text-white shadow-sm shrink-0"
                    style={{ backgroundColor: familyColor }}
                    aria-hidden="true"
                  >
                    {activeSubject.subjectMeta.glyph}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold tracking-wide"
                        style={{ color: familyColor }}
                      >
                        {isAr
                          ? activeSubject.subjectMeta.familyAr
                          : activeSubject.subjectMeta.familyEn}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-xs text-muted-foreground">
                        {isAr
                          ? `المرحلة ${currentIdx + 1} من ${subjectLevels.length}`
                          : `Stage ${currentIdx + 1} of ${subjectLevels.length}`}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground truncate">
                      {isAr
                        ? `مسار ${activeSubject.subjectMeta.ar}`
                        : `${activeSubject.subjectMeta.en} Path`}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleScrollToCurrentLevel}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-full text-xs font-semibold bg-[#087D91]/10 text-[#087D91] dark:bg-[#087D91]/20 dark:text-[#14A3B8] hover:bg-[#087D91]/15 transition-colors select-none active:scale-[0.98]"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{isAr ? 'موقعي على المسار' : 'My current stage'}</span>
                </button>
              </div>

              {/* Vertical Learning Map Nodes */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSubject.subject}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={springTransition}
                  className="relative space-y-6 pt-2 pb-4"
                  data-testid="learning-path-nodes"
                >
                  {subjectLevels.map((lvl, index) => {
                    const isCompleted = index < currentIdx;
                    const isCurrent = index === currentIdx;
                    const isFuture = index > currentIdx;
                    const isLast = index === subjectLevels.length - 1;
                    const nodeMilestones = getMilestonesForLevelIndex(index);

                    // Compute visual progress percentage inside the current level card
                    const stageLessonsCount = activeSubject.lessonsAttended.total;
                    const inStageProgressPct = isCurrent
                      ? stageLessonsCount === 0
                        ? 12
                        : Math.min(92, 20 + ((stageLessonsCount * 12) % 75))
                      : isCompleted
                        ? 100
                        : 0;

                    return (
                      <div
                        key={lvl.id}
                        ref={isCurrent ? currentLevelRef : undefined}
                        data-testid={`path-level-${lvl.id}`}
                        data-level-state={
                          isCompleted ? 'completed' : isCurrent ? 'current' : 'future'
                        }
                        data-current-level={isCurrent ? 'true' : undefined}
                        className="relative flex items-stretch gap-3.5 sm:gap-5"
                      >
                        {/* Left/Start Rail: Medallion + Vertical Spine Line */}
                        <div className="relative flex flex-col items-center shrink-0 w-12 sm:w-16">
                          {/* Medallion */}
                          {isCompleted && (
                            <div
                              className="relative z-10 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-gradient-to-b from-[#E5A93C] to-[#B9782A] text-white shadow-md ring-4 ring-[#C9973B]/20"
                              title={isAr ? 'مرحلة مكتملة' : 'Completed stage'}
                            >
                              <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.75]" />
                            </div>
                          )}

                          {isCurrent && (
                            <div className="relative z-10 flex items-center justify-center">
                              <span
                                aria-hidden="true"
                                className="emblem-glow absolute -inset-2 rounded-full opacity-45"
                                style={{ backgroundColor: familyColor }}
                              />
                              <div
                                className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-white shadow-lg ring-4 ring-[#C9973B]/50"
                                style={{ backgroundColor: familyColor }}
                              >
                                <span className="font-serif text-base sm:text-xl font-bold leading-none">
                                  {index + 1}
                                </span>
                                <span className="text-[9px] font-semibold uppercase tracking-wider opacity-90 mt-0.5">
                                  {isAr ? 'الآن' : 'Now'}
                                </span>
                              </div>
                            </div>
                          )}

                          {isFuture && (
                            <div
                              className="relative z-10 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-dashed border-[#C9973B]/45 dark:border-[#E5A93C]/30 bg-background/80 text-muted-foreground font-serif text-sm sm:text-base font-bold"
                              title={isAr ? 'مرحلة قادمة' : 'Upcoming stage'}
                            >
                              {index + 1}
                            </div>
                          )}

                          {/* Connecting Spine to Next Stage */}
                          {!isLast && (
                            <div
                              aria-hidden="true"
                              className={`w-1 flex-1 my-1.5 rounded-full ${
                                isCompleted
                                  ? 'bg-gradient-to-b from-[#C9973B] to-[#087D91]'
                                  : 'border-s-2 border-dashed border-[#C9973B]/35 dark:border-[#E5A93C]/25'
                              }`}
                            />
                          )}
                        </div>

                        {/* Right/End Content: Level Card + Milestones placed on this stage */}
                        <div className="flex-1 min-w-0 pb-2">
                          <div
                            className={`rounded-[1.5rem] transition-all ${
                              isCurrent
                                ? 'p-1 bg-gradient-to-r from-[#087D91]/25 via-[#C9973B]/30 to-[#087D91]/20 shadow-sm'
                                : isCompleted
                                  ? 'border border-[#C9973B]/35 bg-[#FBF7EF]/70 dark:bg-white/[0.03]'
                                  : 'border border-dashed border-border/80 bg-card/40 opacity-85'
                            }`}
                          >
                            <div
                              className={`rounded-[calc(1.5rem-0.25rem)] p-4 sm:p-5 space-y-3.5 ${
                                isCurrent ? 'bg-card' : ''
                              }`}
                            >
                              {/* Stage Title & Status Badge */}
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        isCompleted
                                          ? 'bg-[#C9973B]/20 text-[#8B4935] dark:text-[#F6D58E]'
                                          : isCurrent
                                            ? 'bg-[#087D91] text-white'
                                            : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {isCompleted
                                        ? isAr
                                          ? 'مكتمل بحمد الله'
                                          : 'Completed'
                                        : isCurrent
                                          ? isAr
                                            ? 'مرحلتك الحالية'
                                            : 'Current stage'
                                          : isAr
                                            ? 'المرحلة القادمة'
                                            : 'Upcoming stage'}
                                    </span>

                                    {isCurrent && activeSubject.placementResult && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#C9973B]/15 text-[#8B4935] dark:text-[#F6D58E]">
                                        <Sparkles className="w-3 h-3" />
                                        <span>
                                          {activeSubject.placementResult.status === 'reviewed'
                                            ? isAr
                                              ? 'مؤكد من المعلم'
                                              : 'Teacher verified'
                                            : isAr
                                              ? 'وفق تحديد المستوى'
                                              : 'From placement'}
                                        </span>
                                      </span>
                                    )}
                                  </div>

                                  <h4
                                    className={`font-serif font-bold text-foreground ${
                                      isChildLearner
                                        ? 'text-lg sm:text-xl'
                                        : 'text-base sm:text-lg'
                                    }`}
                                  >
                                    {isAr ? lvl.ar : lvl.en}
                                  </h4>
                                </div>

                                {isCompleted && (
                                  <KhatamStarMilestoneEmblem className="w-8 h-8 shrink-0" />
                                )}
                              </div>

                              {/* Stage Description */}
                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {isAr ? lvl.descAr : lvl.descEn}
                              </p>

                              {/* CURRENT STAGE PROGRESS INSIDE IT */}
                              {isCurrent && (
                                <div
                                  className="rounded-2xl bg-[#FBF7EF] dark:bg-white/[0.04] border border-[#C9973B]/25 p-3.5 sm:p-4 space-y-3"
                                  data-testid="current-level-progress-box"
                                >
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="font-semibold text-foreground">
                                      {isAr
                                        ? 'تقدمك داخل هذه المرحلة'
                                        : 'Your progress in this stage'}
                                    </span>
                                    <span className="font-bold text-[#087D91] dark:text-[#14A3B8] tabular-nums">
                                      {isAr
                                        ? `${activeSubject.lessonsAttended.total} دروس أُنجزت`
                                        : `${activeSubject.lessonsAttended.total} lessons attended`}
                                    </span>
                                  </div>

                                  {/* Glowing Progress Bar inside current medallion card */}
                                  <div
                                    className="h-2.5 w-full rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden"
                                    role="progressbar"
                                    aria-valuenow={inStageProgressPct}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={
                                      isAr ? 'مؤشر التقدم في المرحلة الحالية' : 'Current stage progress'
                                    }
                                  >
                                    <motion.div
                                      initial={prefersReducedMotion ? false : { width: '0%' }}
                                      animate={{ width: `${inStageProgressPct}%` }}
                                      transition={springTransition}
                                      className="h-full rounded-full"
                                      style={{
                                        background: `linear-gradient(90deg, ${familyColor} 0%, ${GOLD} 100%)`,
                                      }}
                                    />
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] sm:text-xs text-muted-foreground">
                                    <span>
                                      {activeSubject.lessonsAttended.thisMonth > 0
                                        ? isAr
                                          ? `${activeSubject.lessonsAttended.thisMonth} دروس هذا الشهر · إيقاع ${activeSubject.weeklyRhythm.current} أسابيع`
                                          : `${activeSubject.lessonsAttended.thisMonth} this month · ${activeSubject.weeklyRhythm.current}w rhythm`
                                        : isAr
                                          ? 'كل حصة مع معلمك تثبّت مهارات هذه المرحلة'
                                          : 'Each session with your teacher builds this stage'}
                                    </span>

                                    {activeSubject.nextBookedLesson ? (
                                      <span className="inline-flex items-center gap-1 font-semibold text-[#087D91] dark:text-[#14A3B8]">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>
                                          {isAr ? 'الدرس القادم: ' : 'Next: '}
                                          {formatDateTime(
                                            activeSubject.nextBookedLesson.scheduledStart
                                          )}
                                        </span>
                                      </span>
                                    ) : (
                                      <Link
                                        to="/student/book"
                                        className="inline-flex items-center gap-1 font-semibold text-[#087D91] dark:text-[#14A3B8] hover:underline"
                                      >
                                        <span>
                                          {isAr ? 'احجز الحصة القادمة' : 'Schedule next lesson'}
                                        </span>
                                        {isAr ? (
                                          <ArrowLeft className="w-3 h-3" />
                                        ) : (
                                          <ArrowRight className="w-3 h-3" />
                                        )}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Milestones placed on the path at this stage */}
                              {nodeMilestones.length > 0 && (
                                <div
                                  className="pt-1 space-y-2"
                                  data-testid={`stage-milestones-${lvl.id}`}
                                >
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B4935] dark:text-[#F6D58E]">
                                    {isAr
                                      ? 'أوسمة محققة على هذا المسار'
                                      : 'Milestones earned along this stage'}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {nodeMilestones.map((ms) => (
                                      <div
                                        key={ms.id}
                                        data-testid="path-milestone-emblem"
                                        className="flex items-center gap-3 rounded-2xl bg-card border border-[#C9973B]/35 px-3 py-2.5 shadow-2xs"
                                      >
                                        <MilestoneEmblemByKind
                                          kind={ms.kind}
                                          className="w-10 h-10 shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[10px] font-bold text-[#087D91] dark:text-[#14A3B8]">
                                            {formatMilestoneKindLabel(ms.kind, isAr)}
                                          </div>
                                          <div className="text-xs font-bold text-foreground truncate">
                                            {isAr ? ms.title_ar : ms.title_en}
                                          </div>
                                          <div className="text-[11px] text-muted-foreground">
                                            {formatDate(ms.reached_at)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Side Column: Next Lesson, Milestones Overview & Teacher Family Summaries */}
          <div className="lg:col-span-4 space-y-6">
            {/* Next Booked Lesson or Quick Schedule Card */}
            <div className="rounded-[1.75rem] p-1.5 bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
              <div className="rounded-[calc(1.75rem-0.375rem)] bg-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'الخطوة القادمة' : 'Next Step'}
                  </span>
                  <Clock className="w-4 h-4 text-[#C9973B]" />
                </div>

                {activeSubject.nextBookedLesson || overall.nextBookedLesson ? (
                  (() => {
                    const nextLesson =
                      activeSubject.nextBookedLesson || overall.nextBookedLesson!;
                    return (
                      <div className="space-y-3">
                        <div className="text-base font-serif font-bold text-foreground">
                          {formatDateTime(nextLesson.scheduledStart)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {nextLesson.teacherName
                            ? isAr
                              ? `حصة فردية مباشرة (${nextLesson.durationMinutes} دقيقة) مع ${nextLesson.teacherName}`
                              : `1-on-1 live lesson (${nextLesson.durationMinutes} min) with ${nextLesson.teacherName}`
                            : isAr
                              ? `حصة فردية مباشرة (${nextLesson.durationMinutes} دقيقة)`
                              : `1-on-1 live lesson (${nextLesson.durationMinutes} min)`}
                        </p>
                        <Link
                          to="/student/lessons"
                          className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full rounded-full bg-[#087D91]/10 text-[#087D91] dark:bg-[#087D91]/20 dark:text-[#14A3B8] text-xs font-bold hover:bg-[#087D91]/15 transition-colors"
                        >
                          <span>{isAr ? 'عرض تفاصيل الدرس' : 'View lesson details'}</span>
                          {isAr ? (
                            <ArrowLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" />
                          )}
                        </Link>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {isAr
                        ? 'لا يوجد درس قادم محجوز حاليًا. احجز موعدك القادم لتحافظ على إيقاعك الأسبوعي.'
                        : 'No upcoming lesson is currently scheduled. Book your next session to keep your weekly rhythm glowing.'}
                    </p>
                    <Link
                      to="/student/book"
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full rounded-full bg-[#087D91] text-white text-xs font-bold hover:bg-[#066677] transition-colors"
                    >
                      <span>{isAr ? 'حجز درس جديد' : 'Book next lesson'}</span>
                      {isAr ? (
                        <ArrowLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Teacher Family Summaries */}
            <div
              className="rounded-[1.75rem] p-1.5 bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
              data-testid="family-summaries-card"
            >
              <div className="rounded-[calc(1.75rem-0.375rem)] bg-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-serif text-base font-bold text-foreground">
                      {isAr ? 'رسائل المعلم للأسرة' : 'Teacher Family Summaries'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {isAr
                        ? 'ملخصات ما تم إنجازه في الدروس الأخيرة'
                        : 'Highlights shared after recent lessons'}
                    </p>
                  </div>
                  <BookOpen className="w-4 h-4 text-[#087D91] shrink-0" />
                </div>

                {activeSubject.familySummaries.length > 0 ? (
                  <div className="space-y-3">
                    {activeSubject.familySummaries.map((note) => {
                      const achievements = formatAchievementsList(note.achievements);
                      return (
                        <article
                          key={note.id}
                          className="rounded-2xl bg-[#FBF7EF]/80 dark:bg-white/[0.03] border border-[#C9973B]/25 p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{formatDate(note.created_at)}</span>
                            <span className="font-semibold text-[#8B4935] dark:text-[#F6D58E]">
                              {isAr ? activeSubject.subjectMeta.ar : activeSubject.subjectMeta.en}
                            </span>
                          </div>

                          {note.family_summary && (
                            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                              {note.family_summary}
                            </p>
                          )}

                          {achievements.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {achievements.map((ach, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#087D91]/10 text-[#087D91] dark:bg-[#087D91]/20 dark:text-[#14A3B8]"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{ach}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {note.next_steps && (
                            <p className="text-[11px] text-muted-foreground border-t border-border/60 pt-2">
                              <strong className="text-foreground">
                                {isAr ? 'الخطوة القادمة: ' : 'Next step: '}
                              </strong>
                              {note.next_steps}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-muted/40 border border-dashed border-border p-4 text-center space-y-1.5">
                    <p className="text-xs font-medium text-foreground">
                      {isAr
                        ? 'ستظهر ملخصات المعلم هنا بعد دروسك'
                        : 'Teacher summaries will appear here after your lessons'}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {isAr
                        ? 'يكتب المعلم عقب كل حصة ملخصًا دافئًا للأسرة يوضح ما تم إتقانه والخطوة التالية.'
                        : 'After each session, your teacher shares a warm note on what was covered and what comes next.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
