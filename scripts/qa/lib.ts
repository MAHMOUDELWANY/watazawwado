/**
 * Shared helpers for the QA scripts (docs/testing/RULES.md). Never prints secret values.
 *
 * Env: the worktree has no .env, so this loads the main checkout's `.env` (wins) and `.env.vercel` (fills the gaps),
 * the same files and order as the `qa-p1`...`qa-p5` launch entries.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

export const PROJECT_REF = 'fmwxqyroyxgigvpahpri';
export const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;
export const QA_BASE_EMAIL = 'mahmoudelwany98';
export const QA_DOMAIN = 'gmail.com';

/** Directories that may hold the env files: this checkout, then the main checkout above `.claude/worktrees/<name>`. */
function envDirs(): string[] {
  const here = process.cwd();
  const dirs = [here];
  const marker = `${path.sep}.claude${path.sep}worktrees${path.sep}`;
  const i = here.indexOf(marker);
  if (i >= 0) dirs.push(here.slice(0, i));
  return dirs;
}

/** Loads `.env` then `.env.vercel` into process.env without overriding what is already set. */
export function loadEnv(): void {
  const merged: Record<string, string> = {};
  // Later files lose: .env beats .env.vercel (its Stripe/Supabase keys are the local test ones).
  for (const name of ['.env.vercel', '.env']) {
    const file = envDirs().map(d => path.join(d, name)).find(f => fs.existsSync(f));
    if (file) Object.assign(merged, parseEnv(fs.readFileSync(file, 'utf8')));
  }
  for (const [k, v] of Object.entries(merged)) if (process.env[k] === undefined && v !== '') process.env[k] = v;
  // Never let a pulled production env switch a local script into production mode.
  if (process.env.VERCEL_ENV === 'production') process.env.VERCEL_ENV = 'development';
}

export function supabaseUrl(): string {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  if (!url) throw new Error('SUPABASE_URL is missing. Is the main checkout .env present?');
  if (!url.includes(PROJECT_REF)) throw new Error('SUPABASE_URL is not the Watazawwado project.');
  return url;
}

export function adminClient(): SupabaseClient {
  loadEnv();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing.');
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function anonClient(): SupabaseClient {
  loadEnv();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!key) throw new Error('VITE_SUPABASE_ANON_KEY is missing (it comes from .env.vercel).');
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Port per project (RULES.md): p1 3001 ... p5 3005. PORT or QA_BASE_URL override it. */
export function baseUrl(project?: string): string {
  if (process.env.QA_BASE_URL) return process.env.QA_BASE_URL.replace(/\/$/, '');
  const n = project?.match(/^p(\d)$/)?.[1];
  const port = process.env.PORT || (n ? String(3000 + Number(n)) : '3001');
  return `http://localhost:${port}`;
}

export const QA_ROLES = ['student', 'parent', 'teacher', 'admin'] as const;
export type QaRole = typeof QA_ROLES[number];

export function qaEmail(project: string, role: QaRole, n = 1): string {
  return `${QA_BASE_EMAIL}+qa-${project}-${role}-${n}@${QA_DOMAIN}`.toLowerCase();
}

/** True only for QA accounts (the purge and every destructive step check this). */
export function isQaEmail(email: string | null | undefined): boolean {
  return /\+qa-[a-z0-9]+-/i.test(String(email || ''));
}

export function assertProject(project: string | undefined, allowAll = false): string {
  if (allowAll && project === 'all') return 'all';
  if (!project || !/^p\d$/.test(project)) throw new Error(`Project must be p1...p9${allowAll ? ' or all' : ''}.`);
  return project;
}

/** Every auth user (paged). */
export async function listAllUsers(admin: SupabaseClient) {
  const users: any[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

export async function findUserByEmail(admin: SupabaseClient, email: string) {
  const clean = email.toLowerCase().trim();
  return (await listAllUsers(admin)).find(u => (u.email || '').toLowerCase() === clean) || null;
}

/**
 * A real Supabase session for a QA account, minted server-side: an admin magic link (no email is sent) verified
 * with the anon client. No password is ever typed. Refuses any non-QA email.
 */
export async function mintSession(email: string): Promise<Session> {
  if (!isQaEmail(email)) throw new Error(`Refusing to mint a session for a non-QA email: ${email}`);
  const admin = adminClient();
  // A newer link voids an older one, so two parallel workers minting for the same account can collide: retry.
  for (let attempt = 1; ; attempt++) {
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    if (error || !data?.properties?.hashed_token) throw new Error(`generateLink failed for ${email}: ${error?.message || 'no token'}`);
    const { data: verified, error: verifyErr } = await anonClient().auth.verifyOtp({ token_hash: data.properties.hashed_token, type: 'magiclink' });
    if (!verifyErr && verified.session) return verified.session;
    if (attempt >= 5) throw new Error(`verifyOtp failed for ${email}: ${verifyErr?.message || 'no session'}`);
    await new Promise(r => setTimeout(r, 300 + Math.random() * 1200));
  }
}

/** The value supabase-js keeps in localStorage under STORAGE_KEY. */
export function storageValue(session: Session): string {
  return JSON.stringify(session);
}

export async function api(base: string, token: string, method: string, route: string, body?: unknown) {
  const res = await fetch(`${base}${route}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json };
}

export function isMain(metaUrl: string): boolean {
  return !!process.argv[1] && fileURLToPath(metaUrl) === path.resolve(process.argv[1]);
}
