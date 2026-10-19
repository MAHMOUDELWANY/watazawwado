import React, { useState, useEffect } from 'react';
import {
  Lock,
  Sparkles,
  BookOpen,
  Award,
  Plus,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import type { StudentNote, StudentMilestoneItem } from '../types';

export type SubjectQuickMode = 'memorization' | 'tajweed' | 'reading' | 'general';

export interface AchievementChip {
  ar: string;
  en: string;
  kind?: string;
}

export const SURAH_QUICK_OPTIONS: Array<{ ar: string; en: string }> = [
  { ar: 'الفاتحة', en: 'Al-Fatihah' },
  { ar: 'البقرة', en: 'Al-Baqarah' },
  { ar: 'آل عمران', en: 'Ali Imran' },
  { ar: 'الكهف', en: 'Al-Kahf' },
  { ar: 'مريم', en: 'Maryam' },
  { ar: 'يس', en: 'Ya-Sin' },
  { ar: 'الرحمن', en: 'Ar-Rahman' },
  { ar: 'الواقعة', en: "Al-Waqi'ah" },
  { ar: 'الملك', en: 'Al-Mulk' },
  { ar: 'القلم', en: 'Al-Qalam' },
  { ar: 'المزمل', en: 'Al-Muzzammil' },
  { ar: 'المدثر', en: 'Al-Muddaththir' },
  { ar: 'النبأ', en: 'An-Naba' },
  { ar: 'النازعات', en: "An-Nazi'at" },
  { ar: 'عبس', en: 'Abasa' },
  { ar: 'الأعلى', en: "Al-A'la" },
  { ar: 'الغاشية', en: 'Al-Ghashiyah' },
  { ar: 'الفجر', en: 'Al-Fajr' },
  { ar: 'الضحى', en: 'Ad-Duha' },
  { ar: 'الشرح', en: 'Ash-Sharh' },
  { ar: 'التين', en: 'At-Tin' },
  { ar: 'العلق', en: 'Al-Alaq' },
  { ar: 'القدر', en: 'Al-Qadr' },
  { ar: 'الإخلاص والمعوذتين', en: 'Al-Ikhlas, Al-Falaq & An-Nas' },
];

export const TAJWEED_RULE_CHIPS: AchievementChip[] = [
  { ar: 'أحكام النون الساكنة والتنوين', en: 'Noon Sakinah & Tanween', kind: 'tajweed_rule' },
  { ar: 'أحكام الميم الساكنة', en: 'Meem Sakinah rules', kind: 'tajweed_rule' },
  { ar: 'مخارج الحروف', en: 'Articulation points (Makharij)', kind: 'tajweed_rule' },
  { ar: 'صفات الحروف', en: 'Letter characteristics (Sifat)', kind: 'tajweed_rule' },
  { ar: 'أحكام المدود', en: 'Madd (elongation) rules', kind: 'tajweed_rule' },
  { ar: 'القلقلة والغنة', en: 'Qalqalah & Ghunnah', kind: 'tajweed_rule' },
  { ar: 'أحكام الراء واللام', en: 'Rules of Raa & Laam', kind: 'tajweed_rule' },
  { ar: 'الوقف والابتداء', en: 'Stopping & starting (Waqf)', kind: 'tajweed_rule' },
];

export const READING_STAGE_CHIPS: AchievementChip[] = [
  { ar: 'الحروف الهجائية وأشكالها', en: 'Arabic letters & forms', kind: 'reading_stage' },
  { ar: 'الحركات الثلاث (الفتح والكسر والضم)', en: 'Short vowels (Harakat)', kind: 'reading_stage' },
  { ar: 'التنوين', en: 'Tanween', kind: 'reading_stage' },
  { ar: 'السكون والهمزة', en: 'Sukoon & Hamzah', kind: 'reading_stage' },
  { ar: 'حروف المد الثلاثة', en: 'Long vowels (Madd letters)', kind: 'reading_stage' },
  { ar: 'الشدة مع الحركات', en: 'Shaddah with vowels', kind: 'reading_stage' },
  { ar: 'تهجئة الكلمات المتصلة', en: 'Spelling connected words', kind: 'reading_stage' },
  { ar: 'تلاوة من المصحف', en: 'Mushaf page reading', kind: 'reading_stage' },
];

export const MEMORIZATION_BONUS_CHIPS: AchievementChip[] = [
  { ar: 'تثبيت الحفظ الجديد بإتقان', en: 'New memorization consolidated', kind: 'memorization' },
  { ar: 'مراجعة متقنة للماضي', en: 'Solid revision of past surahs', kind: 'memorization' },
  { ar: 'ربط الآيات بسلاسة', en: 'Smooth connection between ayahs', kind: 'memorization' },
];

export const MILESTONE_KIND_OPTIONS: Array<{
  kind: StudentMilestoneItem['kind'];
  ar: string;
  en: string;
  defaultAr: string;
  defaultEn: string;
}> = [
  {
    kind: 'surah_memorized',
    ar: 'إتمام حفظ سورة',
    en: 'Surah memorized',
    defaultAr: 'إتمام حفظ سورة الملك',
    defaultEn: 'Memorized Surah Al-Mulk',
  },
  {
    kind: 'rule_mastered',
    ar: 'إتقان حكم تجويد',
    en: 'Tajweed rule mastered',
    defaultAr: 'إتقان أحكام النون الساكنة والتنوين',
    defaultEn: 'Mastered Noon Sakinah & Tanween',
  },
  {
    kind: 'level_completed',
    ar: 'إتمام مرحلة / مستوى',
    en: 'Level completed',
    defaultAr: 'إتمام المرحلة الحالية بنجاح',
    defaultEn: 'Completed current stage',
  },
  {
    kind: 'juz_completed',
    ar: 'إتمام جزء كامل',
    en: 'Juz completed',
    defaultAr: 'إتمام حفظ جزء عمّ',
    defaultEn: 'Completed Juz Amma',
  },
  {
    kind: 'book_completed',
    ar: 'إتمام كتاب / متن',
    en: 'Book completed',
    defaultAr: 'إتمام القاعدة النورانية',
    defaultEn: 'Completed Noorani Qaidah',
  },
  {
    kind: 'custom',
    ar: 'وسام مخصص',
    en: 'Custom milestone',
    defaultAr: 'إنجاز متميز في المسيرة التعليمية',
    defaultEn: 'Special learning milestone reached',
  },
];

export function detectSubjectQuickMode(rawSubject?: string | null): {
  mode: SubjectQuickMode;
  subjectSlug: string;
} {
  const s = (rawSubject || '').toLowerCase();
  if (s.includes('memor') || s.includes('hifz') || s.includes('حفظ') || s.includes('مراجعة')) {
    return { mode: 'memorization', subjectSlug: 'quran-memorization' };
  }
  if (s.includes('tajweed') || s.includes('تجويد')) {
    return { mode: 'tajweed', subjectSlug: 'tajweed' };
  }
  if (s.includes('zad') || s.includes('زاد')) {
    return { mode: 'general', subjectSlug: 'zad-essentials' };
  }
  if (s.includes('fusha') || s.includes('standard-arabic') || s.includes('عربي')) {
    return { mode: 'general', subjectSlug: 'modern-standard-arabic' };
  }
  return { mode: 'reading', subjectSlug: 'quran-reading' };
}

export interface PostLessonSummaryEditorProps {
  studentId: string;
  studentName?: string | null;
  bookingId?: string | null;
  subjectHint?: string | null;
  compact?: boolean;
  /**
   * When true, submitting this editor only prepares values for the parent (e.g. inside "Mark completed"),
   * or when false (default), saves directly via POST `/api/dashboard/students/:id/post-lesson-summary`.
   */
  onSaved?: (result: { note?: StudentNote | null; milestone?: StudentMilestoneItem | null }) => void;
}

export function PostLessonSummaryEditor({
  studentId,
  studentName,
  bookingId,
  subjectHint,
  compact = false,
  onSaved,
}: PostLessonSummaryEditorProps) {
  const { t, isAr } = useT();
  const detected = detectSubjectQuickMode(subjectHint);

  const [quickMode, setQuickMode] = useState<SubjectQuickMode>(
    detected.mode === 'general' ? 'memorization' : detected.mode
  );
  const [subjectSlug, setSubjectSlug] = useState<string>(detected.subjectSlug);

  useEffect(() => {
    const next = detectSubjectQuickMode(subjectHint);
    setQuickMode(next.mode === 'general' ? 'memorization' : next.mode);
    setSubjectSlug(next.subjectSlug);
  }, [subjectHint]);

  // Fields
  const [privateNotes, setPrivateNotes] = useState('');
  const [familySummary, setFamilySummary] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [achievements, setAchievements] = useState<AchievementChip[]>([]);

  // Memorization quick-pickers
  const [selectedSurah, setSelectedSurah] = useState<string>(SURAH_QUICK_OPTIONS[8].ar); // Al-Mulk
  const [fromAyah, setFromAyah] = useState<string>('1');
  const [toAyah, setToAyah] = useState<string>('15');

  // Reading quick-pickers
  const [selectedReadingStage, setSelectedReadingStage] = useState<AchievementChip>(
    READING_STAGE_CHIPS[0]
  );
  const [readingPage, setReadingPage] = useState<string>('');

  // Custom Tajweed / achievement input
  const [customRuleText, setCustomRuleText] = useState<string>('');

  // Milestone toggle & fields
  const [markMilestone, setMarkMilestone] = useState(false);
  const [milestoneKind, setMilestoneKind] = useState<StudentMilestoneItem['kind']>('surah_memorized');
  const [milestoneTitleAr, setMilestoneTitleAr] = useState('إتمام حفظ سورة الملك');
  const [milestoneTitleEn, setMilestoneTitleEn] = useState('Memorized Surah Al-Mulk');

  // Submission state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleAchievementChip = (chip: AchievementChip) => {
    setAchievements((prev) => {
      const exists = prev.some((c) => c.ar === chip.ar && c.en === chip.en);
      if (exists) {
        return prev.filter((c) => !(c.ar === chip.ar && c.en === chip.en));
      }
      return [...prev, chip];
    });
  };

  const handleAddMemorizationRange = () => {
    const surahObj =
      SURAH_QUICK_OPTIONS.find((s) => s.ar === selectedSurah || s.en === selectedSurah) || {
        ar: selectedSurah.trim() || 'الملك',
        en: selectedSurah.trim() || 'Al-Mulk',
      };
    const f = fromAyah.trim();
    const to = toAyah.trim();
    const rangeAr = f && to ? ` (الآيات ${f}–${to})` : f ? ` (من آية ${f})` : '';
    const rangeEn = f && to ? ` (Ayahs ${f}–${to})` : f ? ` (from Ayah ${f})` : '';

    const chip: AchievementChip = {
      ar: `سورة ${surahObj.ar}${rangeAr}`,
      en: `Surah ${surahObj.en}${rangeEn}`,
      kind: 'memorization',
    };
    setAchievements((prev) => {
      if (prev.some((c) => c.ar === chip.ar)) return prev;
      return [...prev, chip];
    });

    // Also update milestone preset if surah_memorized is selected
    if (milestoneKind === 'surah_memorized') {
      setMilestoneTitleAr(`إتمام حفظ سورة ${surahObj.ar}`);
      setMilestoneTitleEn(`Memorized Surah ${surahObj.en}`);
    }
  };

  const handleAddReadingStageOrPage = () => {
    const stage = selectedReadingStage;
    const p = readingPage.trim();
    const chip: AchievementChip = p
      ? {
          ar: `${stage.ar} — صفحة ${p}`,
          en: `${stage.en} — Page ${p}`,
          kind: 'reading_stage',
        }
      : stage;

    setAchievements((prev) => {
      if (prev.some((c) => c.ar === chip.ar)) return prev;
      return [...prev, chip];
    });
    setReadingPage('');
  };

  const handleAddCustomRule = () => {
    const trimmed = customRuleText.trim();
    if (!trimmed) return;
    const chip: AchievementChip = {
      ar: trimmed,
      en: trimmed,
      kind: quickMode === 'tajweed' ? 'tajweed_rule' : 'custom',
    };
    setAchievements((prev) => {
      if (prev.some((c) => c.ar === chip.ar)) return prev;
      return [...prev, chip];
    });
    setCustomRuleText('');
  };

  const handleSelectMilestoneKind = (kind: StudentMilestoneItem['kind']) => {
    setMilestoneKind(kind);
    const preset = MILESTONE_KIND_OPTIONS.find((m) => m.kind === kind);
    if (!preset) return;

    if (kind === 'surah_memorized') {
      const surahObj =
        SURAH_QUICK_OPTIONS.find((s) => s.ar === selectedSurah || s.en === selectedSurah) ||
        SURAH_QUICK_OPTIONS[8];
      setMilestoneTitleAr(`إتمام حفظ سورة ${surahObj.ar}`);
      setMilestoneTitleEn(`Memorized Surah ${surahObj.en}`);
    } else if (kind === 'rule_mastered') {
      const firstTajweed = achievements.find((a) => a.kind === 'tajweed_rule') || TAJWEED_RULE_CHIPS[0];
      setMilestoneTitleAr(`إتقان ${firstTajweed.ar}`);
      setMilestoneTitleEn(`Mastered ${firstTajweed.en}`);
    } else {
      setMilestoneTitleAr(preset.defaultAr);
      setMilestoneTitleEn(preset.defaultEn);
    }
  };

  const applyQuickFamilyStarter = (arText: string, enText: string) => {
    const chosen = isAr ? arText : enText;
    setFamilySummary((prev) => (prev.trim() ? `${prev.trim()} ${chosen}` : chosen));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const hasPrivate = privateNotes.trim().length > 0;
    const hasFamily = familySummary.trim().length > 0;
    const hasAch = achievements.length > 0;
    const hasNext = nextSteps.trim().length > 0;

    if (!hasPrivate && !hasFamily && !hasAch && !hasNext && !markMilestone) {
      setErrorMsg(
        t(
          'Add a family summary, private note, achievement, or milestone first.',
          'اكتب ملخص للأسرة أو ملاحظة خاصة أو اختار إنجاز أو وسام الأول.'
        )
      );
      return;
    }

    if (markMilestone && (!milestoneTitleAr.trim() || !milestoneTitleEn.trim())) {
      setErrorMsg(
        t(
          'Please enter both the Arabic and English milestone titles.',
          'اكتب عنوان الوسام بالعربي وبالإنجليزي.'
        )
      );
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        booking_id: bookingId || undefined,
        private_notes: privateNotes.trim(),
        family_summary: familySummary.trim() || null,
        next_steps: nextSteps.trim() || null,
        achievements: achievements.length > 0 ? achievements : null,
      };

      if (markMilestone) {
        payload.milestone = {
          subject: subjectSlug,
          kind: milestoneKind,
          title_ar: milestoneTitleAr.trim(),
          title_en: milestoneTitleEn.trim(),
        };
      }

      const res = await dashboardFetch(
        `/api/dashboard/students/${studentId}/post-lesson-summary`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setSuccessMsg(
        markMilestone
          ? t(
              'Lesson summary and milestone saved to the student path.',
              'تم حفظ ملخص الحصة والوسام في مسيرة الطالب.'
            )
          : t('Lesson summary and notes saved.', 'تم حفظ ملخص الحصة والملاحظات.')
      );

      setPrivateNotes('');
      setFamilySummary('');
      setNextSteps('');
      setAchievements([]);
      setMarkMilestone(false);

      if (onSaved) {
        onSaved({ note: res?.note ?? null, milestone: res?.milestone ?? null });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || t("Couldn't save the lesson summary.", 'تعذر حفظ ملخص الحصة.'));
    } finally {
      setSaving(false);
    }
  };

  const nameDisplay = studentName || t('the student', 'الطالب');

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="post-lesson-summary-form"
      className={`space-y-4 rounded-2xl border border-border glass-surface ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      {/* Header + 30-second speed badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent shrink-0" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('After-lesson summary & milestones', 'ملخص ما بعد الحصة والأوسمة')}
          </h3>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary/40 text-primary border border-secondary/60">
          {t('Quick 30-sec log', 'تسجيل سريع في 30 ثانية')}
        </span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-2.5 rounded-xl bg-destructive/15 text-destructive text-xs border border-destructive/30 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-2.5 rounded-xl bg-success/15 text-success text-xs border border-success/30 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Subject Quick-Pick Achievements */}
      <div className="space-y-2.5 p-3.5 rounded-xl glass-card border border-border-subtle">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            {t('Quick-pick achievements for this lesson', 'إنجازات الحصة السريعة (حسب المادة)')}
          </span>

          {/* Subject mode tabs: Memorization / Tajweed / Reading */}
          <div
            className="inline-flex items-center rounded-lg bg-secondary/25 p-0.5 border border-border-subtle"
            role="tablist"
            aria-label={t('Subject achievement mode', 'نوع المادة')}
          >
            {(
              [
                ['memorization', 'quran-memorization', t('Memorization', 'الحفظ')],
                ['tajweed', 'tajweed', t('Tajweed', 'التجويد')],
                ['reading', 'quran-reading', t('Reading', 'القراءة')],
              ] as const
            ).map(([modeKey, slug, label]) => {
              const active = quickMode === modeKey;
              return (
                <button
                  key={modeKey}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`quick-mode-${modeKey}`}
                  onClick={() => {
                    setQuickMode(modeKey);
                    setSubjectSlug(slug);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode A: Memorization (Surah + Ayah range) */}
        {quickMode === 'memorization' && (
          <div className="space-y-2.5 pt-1" data-testid="quick-picker-memorization">
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1" htmlFor="plse-surah">
                  {t('Surah', 'السورة')}
                </label>
                <select
                  id="plse-surah"
                  data-testid="memorization-surah-select"
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border glass-card text-foreground"
                >
                  {SURAH_QUICK_OPTIONS.map((s) => (
                    <option key={s.en} value={s.ar}>
                      {isAr ? `سورة ${s.ar}` : `Surah ${s.en} (${s.ar})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1" htmlFor="plse-ayah-from">
                    {t('From ayah', 'من آية')}
                  </label>
                  <input
                    id="plse-ayah-from"
                    data-testid="memorization-ayah-from"
                    type="number"
                    min={1}
                    max={286}
                    value={fromAyah}
                    onChange={(e) => setFromAyah(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border glass-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1" htmlFor="plse-ayah-to">
                    {t('To ayah', 'إلى آية')}
                  </label>
                  <input
                    id="plse-ayah-to"
                    data-testid="memorization-ayah-to"
                    type="number"
                    min={1}
                    max={286}
                    value={toAyah}
                    onChange={(e) => setToAyah(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border glass-card text-foreground"
                  />
                </div>
              </div>
              <button
                type="button"
                data-testid="add-memorization-achievement"
                onClick={handleAddMemorizationRange}
                className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add range', 'أضف الآيات')}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {MEMORIZATION_BONUS_CHIPS.map((chip) => {
                const selected = achievements.some((a) => a.ar === chip.ar);
                return (
                  <button
                    key={chip.en}
                    type="button"
                    onClick={() => toggleAchievementChip(chip)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'glass-surface text-muted-foreground border-border-subtle hover:text-foreground'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    <span>{isAr ? chip.ar : chip.en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode B: Tajweed (Rule quick-picks) */}
        {quickMode === 'tajweed' && (
          <div className="space-y-2.5 pt-1" data-testid="quick-picker-tajweed">
            <div className="flex flex-wrap gap-1.5">
              {TAJWEED_RULE_CHIPS.map((chip) => {
                const selected = achievements.some((a) => a.ar === chip.ar);
                return (
                  <button
                    key={chip.en}
                    type="button"
                    data-testid="tajweed-rule-chip"
                    onClick={() => toggleAchievementChip(chip)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'glass-surface text-muted-foreground border-border-subtle hover:text-foreground'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    <span>{isAr ? chip.ar : chip.en}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customRuleText}
                onChange={(e) => setCustomRuleText(e.target.value)}
                placeholder={t('Or type a specific rule…', 'أو اكتب حكم تجويد محدد…')}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-border glass-card text-foreground"
              />
              <button
                type="button"
                onClick={handleAddCustomRule}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-secondary/40 text-foreground hover:bg-secondary/60 cursor-pointer"
              >
                {t('Add', 'أضف')}
              </button>
            </div>
          </div>
        )}

        {/* Mode C: Reading (Stage + Page) */}
        {quickMode === 'reading' && (
          <div className="space-y-2.5 pt-1" data-testid="quick-picker-reading">
            <div className="flex flex-wrap gap-1.5">
              {READING_STAGE_CHIPS.map((chip) => {
                const selected =
                  selectedReadingStage.ar === chip.ar ||
                  achievements.some((a) => a.ar === chip.ar);
                return (
                  <button
                    key={chip.en}
                    type="button"
                    data-testid="reading-stage-chip"
                    onClick={() => {
                      setSelectedReadingStage(chip);
                      toggleAchievementChip(chip);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                      achievements.some((a) => a.ar === chip.ar)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : selected
                          ? 'bg-secondary/40 text-foreground border-primary/40'
                          : 'glass-surface text-muted-foreground border-border-subtle hover:text-foreground'
                    }`}
                  >
                    {achievements.some((a) => a.ar === chip.ar) && <Check className="w-3 h-3" />}
                    <span>{isAr ? chip.ar : chip.en}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                data-testid="reading-page-input"
                value={readingPage}
                onChange={(e) => setReadingPage(e.target.value)}
                placeholder={t('Page number (e.g. 14)', 'رقم الصفحة (مثلاً: 14)')}
                className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs rounded-lg border border-border glass-card text-foreground"
              />
              <button
                type="button"
                data-testid="add-reading-achievement"
                onClick={handleAddReadingStageOrPage}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add stage + page', 'أضف المرحلة والصفحة')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected Achievement Chips */}
        {achievements.length > 0 && (
          <div
            className="pt-2 border-t border-border-subtle flex flex-wrap items-center gap-1.5"
            data-testid="selected-achievements-list"
          >
            {achievements.map((chip, idx) => (
              <span
                key={`${chip.ar}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
              >
                <span>{isAr ? chip.ar : chip.en}</span>
                <button
                  type="button"
                  onClick={() =>
                    setAchievements((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="hover:text-destructive cursor-pointer"
                  aria-label={t('Remove', 'إزالة')}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. "For the family" summary */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label
            htmlFor="plse-family-summary"
            className="text-xs font-semibold text-foreground flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('For the family (summary)', 'ملخص للأسرة (يظهر في صفحة مسيرة الطالب)')}</span>
          </label>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
            {t('Shared with student & family', 'مشترك مع الطالب والأسرة')}
          </span>
        </div>

        {/* One-tap warm starter phrases */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {[
            {
              ar: `ما شاء الله، أدّى ${nameDisplay} اليوم حصة ممتازة وهادئة مع تركيز واضح.`,
              en: `Masha'Allah, ${nameDisplay} had a calm, focused lesson today with steady progress.`,
              chipAr: '+ إشادة هادئة',
              chipEn: '+ Warm praise',
            },
            {
              ar: 'أتقن مخارج الحروف المطلوبة وتلا الآيات بتأنٍّ وخشوع.',
              en: 'Practiced the articulation points carefully and recited the ayahs with composure.',
              chipAr: '+ إتقان التلاوة',
              chipEn: '+ Recitation mastery',
            },
            {
              ar: 'ثبّتنا المحفوظ الجديد وربطناه بالمراجعة السابقة بنجاح.',
              en: 'Consolidated the new memorization and connected it smoothly with past revision.',
              chipAr: '+ تثبيت ومراجعة',
              chipEn: '+ Hifz & revision',
            },
          ].map((starter) => (
            <button
              key={starter.chipEn}
              type="button"
              onClick={() => applyQuickFamilyStarter(starter.ar, starter.en)}
              className="px-2 py-0.5 rounded-md text-[11px] glass-card border border-border-subtle text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isAr ? starter.chipAr : starter.chipEn}
            </button>
          ))}
        </div>

        <textarea
          id="plse-family-summary"
          data-testid="family-summary-input"
          rows={2}
          value={familySummary}
          onChange={(e) => setFamilySummary(e.target.value)}
          placeholder={t(
            'Write 1–2 warm sentences for the family about what was covered today…',
            'اكتب جملة أو جملتين للأسرة عن ما تم إنجازه في حصة اليوم…'
          )}
          className="w-full px-3 py-2 text-sm rounded-xl border border-border glass-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 3. Next steps / homework (shared) */}
      <div>
        <label
          htmlFor="plse-next-steps"
          className="block text-[11px] font-medium text-muted-foreground mb-1"
        >
          {t('Next step / practice at home (optional)', 'الخطوة القادمة / التدريب في البيت (اختياري)')}
        </label>
        <input
          id="plse-next-steps"
          data-testid="next-steps-input"
          type="text"
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          placeholder={t(
            'e.g. Listen to Surah Al-Mulk 1–15 twice before next lesson',
            'مثلاً: الاستماع إلى سورة الملك ١–١٥ مرتين قبل الحصة القادمة'
          )}
          className="w-full px-3 py-1.5 text-xs rounded-xl border border-border glass-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 4. Private notes — explicitly labelled "only you and the admin" */}
      <div className="space-y-1.5 pt-2 border-t border-border-subtle">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label
            htmlFor="plse-private-notes"
            data-testid="private-notes-label"
            className="text-xs font-semibold text-foreground flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-warning" />
            <span>{t('Private notes', 'ملاحظات خاصة')}</span>
          </label>
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-medium">
            {t('Only you and the admin', 'لك وللمدير فقط')}
          </span>
        </div>
        <textarea
          id="plse-private-notes"
          data-testid="private-notes-input"
          rows={2}
          value={privateNotes}
          onChange={(e) => setPrivateNotes(e.target.value)}
          placeholder={t(
            'Internal teaching notes — the student and family never see this…',
            'ملاحظاتك الخاصة عن الحصة — لا تظهر للطالب أو الأسرة أبداً…'
          )}
          className="w-full px-3 py-2 text-sm rounded-xl border border-border glass-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 5. Mark a milestone */}
      <div className="pt-2 border-t border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            data-testid="toggle-mark-milestone"
            aria-pressed={markMilestone}
            onClick={() => setMarkMilestone((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              markMilestone
                ? 'bg-[#E5A93C]/20 text-foreground border-[#E5A93C]'
                : 'glass-card text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <Award className="w-4 h-4 text-[#E5A93C]" />
            <span>{t('Mark a milestone', 'تسجيل وسام إنجاز (Milestone)')}</span>
            {markMilestone && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
        </div>

        {markMilestone && (
          <div
            className="p-3.5 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 space-y-3"
            data-testid="milestone-editor-panel"
          >
            <div className="flex flex-wrap gap-1.5">
              {MILESTONE_KIND_OPTIONS.map((opt) => {
                const active = milestoneKind === opt.kind;
                return (
                  <button
                    key={opt.kind}
                    type="button"
                    data-testid={`milestone-kind-${opt.kind}`}
                    onClick={() => handleSelectMilestoneKind(opt.kind)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'glass-card text-muted-foreground border-border-subtle hover:text-foreground'
                    }`}
                  >
                    {isAr ? opt.ar : opt.en}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1" htmlFor="plse-ms-ar">
                  {t('Milestone title (Arabic)', 'عنوان الوسام (بالعربية)')}
                </label>
                <input
                  id="plse-ms-ar"
                  data-testid="milestone-title-ar"
                  type="text"
                  dir="rtl"
                  value={milestoneTitleAr}
                  onChange={(e) => setMilestoneTitleAr(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border glass-card text-foreground"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1" htmlFor="plse-ms-en">
                  {t('Milestone title (English)', 'عنوان الوسام (بالإنجليزية)')}
                </label>
                <input
                  id="plse-ms-en"
                  data-testid="milestone-title-en"
                  type="text"
                  dir="ltr"
                  value={milestoneTitleEn}
                  onChange={(e) => setMilestoneTitleEn(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border glass-card text-foreground"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          data-testid="save-post-lesson-summary"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {saving
              ? t('Saving…', 'جارٍ الحفظ…')
              : markMilestone
                ? t('Save summary & milestone', 'حفظ الملخص والوسام')
                : t('Save lesson summary', 'حفظ ملخص الحصة')}
          </span>
        </button>
      </div>
    </form>
  );
}
