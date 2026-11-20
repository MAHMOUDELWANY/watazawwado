-- ====================================================================
-- Migration: Our own copy of the Quran word-check model
-- File: supabase/migrations/20261122000001_quran_models_bucket.sql
--
-- Purpose:
-- 1. quran-models: a public bucket holding the Apache-2.0 ONNX files of whisper-base-ar-quran (Tarteel AI) that the
--    learner's browser loads for the word check (docs/classroom/QURAN-DETECTOR.md). Public read, because the browser
--    fetches the files directly; only the service role writes (scripts/quran/upload-model.ts). Files over 45 MB are
--    stored in parts (free-plan upload limit is 50 MB), listed in manifest.json.
-- ====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('quran-models', 'quran-models', true, 52428800, ARRAY['application/octet-stream', 'application/json', 'text/plain'])
ON CONFLICT (id) DO NOTHING;
