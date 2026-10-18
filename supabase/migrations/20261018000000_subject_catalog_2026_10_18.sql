-- ====================================================================
-- Migration: Subject catalog of 2026-10-18
-- File: supabase/migrations/20261018000000_subject_catalog_2026_10_18.sql
--
-- Purpose (RULES.md "Subjects", owner decision 2026-10-18):
-- 1. Retire six subjects from booking. Rows are kept (never deleted) so old bookings, packages and reports still
--    resolve their service; the booking API refuses inactive services.
--    - quran-revision            -> merged into quran-memorization ("Memorization & Revision")
--    - arabic-foundations        -> merged into modern-standard-arabic (Fusha, Foundations level)
--    - arabic-conversation       -> merged into modern-standard-arabic (conversation in every level)
--    - islamic-studies, fiqh, aqeedah -> hidden until the Scholar's Path courses are defined by the owner
-- 2. Rename the two subjects that absorbed others. Prices unchanged ($9 / $13 bands, RULES.md §3).
-- ====================================================================

UPDATE public.services
SET is_active = false,
    updated_at = timezone('utc'::text, now())
WHERE id IN ('quran-revision', 'arabic-foundations', 'arabic-conversation', 'islamic-studies', 'fiqh', 'aqeedah');

UPDATE public.services
SET title = 'Quran Memorization & Revision',
    arabic_title = 'الحفظ والمراجعة',
    updated_at = timezone('utc'::text, now())
WHERE id = 'quran-memorization';

UPDATE public.services
SET title = 'Fusha Arabic (Modern Standard Arabic)',
    arabic_title = 'العربية الفصحى',
    updated_at = timezone('utc'::text, now())
WHERE id = 'modern-standard-arabic';
