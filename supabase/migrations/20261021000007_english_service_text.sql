-- ====================================================================
-- Migration: English subject description follows RULES.md §2b
-- File: supabase/migrations/20261021000007_english_service_text.sql
--
-- Purpose:
-- 1. The English row described one teacher's IELTS certificate. RULES.md §2b: English is phonics and reading for
--    children and CEFR A1-C1 from age 12; the academy speaks as a team (§6b). Text only; price and flags unchanged.
-- ====================================================================

UPDATE public.services
SET title = 'English Language',
    arabic_title = 'اللغة الإنجليزية',
    short_description = 'For children: phonics and reading, step by step. From age 12: the CEFR levels A1 to C1, with speaking in every lesson.',
    arabic_description = 'للأطفال: الأصوات والقراءة خطوة بخطوة. ومن سن 12: مستويات A1 لحد C1، مع محادثة في كل درس.',
    updated_at = timezone('utc'::text, now())
WHERE id = 'english';
