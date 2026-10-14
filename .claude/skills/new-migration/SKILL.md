---
name: new-migration
description: Create a new Supabase migration for this project with the correct filename, header, RLS, and function-privilege conventions. Use when the user asks to change the database schema, add/alter a table, column, policy, or RPC function, or fix something in an earlier migration.
argument-hint: "<short description of the change>"
---

# New Supabase migration

Existing files in `supabase/migrations/` are immutable — they may already be applied in production, and a hook blocks edits to them. Every schema change, including a fix to an earlier migration, goes in a **new** file.

## 1. Pick the filename

Format: `YYYYMMDDHHMMSS_snake_case_summary.sql`, using today's date. List the folder first; if a file already exists for today, increment the last digits (`...000000`, `...000001`, ...). The new name must sort after every existing one.

## 2. Header

Start the file with the same banner the other migrations use:

```sql
-- ====================================================================
-- Migration: <Title>
-- File: supabase/migrations/<filename>.sql
--
-- Purpose:
-- 1. <what changes and why>
-- ====================================================================
```

## 3. Conventions to follow

- **Idempotent where practical**: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` before `CREATE POLICY`.
- **Timestamps**: `timezone('utc'::text, now())`.
- **New tables**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` plus explicit policies. Never leave a table readable by `anon` unless it is public content.
- **Functions (RPCs)** that touch bookings, payments, packages, or students:
  ```sql
  CREATE OR REPLACE FUNCTION public.fn_name(...)
  RETURNS ... LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$ ... $$;

  REVOKE ALL ON FUNCTION public.fn_name(<arg types>) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.fn_name(<arg types>) FROM anon;
  REVOKE ALL ON FUNCTION public.fn_name(<arg types>) FROM authenticated;
  GRANT EXECUTE ON FUNCTION public.fn_name(<arg types>) TO service_role;
  ```
  Only grant to `anon`/`authenticated` when the function itself checks ownership (like the `*_by_management` token functions).
- **Replacing a function**: copy the latest definition (search all migrations — the newest one wins), then change it. Changing the argument list creates a new overload; `DROP FUNCTION` the old signature explicitly.

## 4. Keep code in sync

- Update `src/types/database.ts` for any new or changed table, column, or enum.
- Search `api/index.ts` and `server/` for callers of any table or RPC you changed (`graphify query` first, then grep).
- If the change touches booking, payment, or package logic, run the related tests in `test/` (`npm run test-only`).

## 5. Applying

Do not apply the migration to the remote database yourself. Tell the user the file is ready and let them apply it (Supabase CLI `supabase db push`, or the SQL editor).
