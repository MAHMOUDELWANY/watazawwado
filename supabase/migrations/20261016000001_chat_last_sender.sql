-- ====================================================================
-- Migration: Chat thread last sender
-- File: supabase/migrations/20261016000001_chat_last_sender.sql
--
-- Purpose:
-- 1. chat_threads.last_sender_role lets the API show unread threads without scanning messages.
-- ====================================================================

ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS last_sender_role text;
