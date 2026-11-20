-- ====================================================================
-- Migration: quran-models accepts any file type
-- File: supabase/migrations/20261122000002_quran_models_any_type.sql
--
-- Purpose:
-- 1. allowed_mime_types = NULL (any type) on the quran-models bucket (20261122000001). The upload script sends JSON,
--    text and ONNX parts, and a client may add a charset to a text type, which an exact list would refuse. Only the
--    service role writes to this bucket, so a type list protects nothing. Apply right after 20261122000001.
-- ====================================================================

UPDATE storage.buckets SET allowed_mime_types = NULL WHERE id = 'quran-models';
