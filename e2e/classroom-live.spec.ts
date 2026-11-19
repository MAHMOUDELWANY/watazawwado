/**
 * Live classroom scenarios: real Cloudflare Realtime, the real database and the project's QA accounts, two (or more)
 * browser contexts with Chromium's fake camera and mic. Not part of the default run:
 *   QA_PROJECT=p5 QA_CLASSROOM=1 QA_BASE_URL=http://127.0.0.1:3005 npx playwright test --project=classroom
 * Needs the server with CLASSROOM_MODE=on and `npx tsx scripts/qa/create-accounts.ts p5`. Screenshots go to
 * docs/classroom/shots/e2e-<name>.png. Report: docs/classroom/TEST-REPORT.md.
 */
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { mintSession, qaEmail, STORAGE_KEY, storageValue, type QaRole } from '../scripts/qa/lib.js';
import { cancelClassroomBooking, createClassroomBooking, deleteClassroomBooking, type ClassroomBooking } from '../scripts/qa/classroom-booking.js';
import { db, QA_PROJECT } from './helpers.js';

test.describe.configure({ mode: 'serial' });
test.setTimeout(240_000);

const SHOTS = 'docs/classroom/shots';
const sessions = new Map<string, string>();
const made: string[] = [];

type Who = { role: QaRole; n?: number; lang?: 'en' | 'ar'; viewport?: { width: number; height: number } };
type Seat = { ctx: BrowserContext; page: Page };

async function booking(opts: Parameters<typeof createClassroomBooking>[1] = {}): Promise<ClassroomBooking> {
  const b = await createClassroomBooking(QA_PROJECT, opts);
  made.push(b.id);
  return b;
}

/** A signed-in context with a recorder of every RTCPeerConnection (for getStats in the checks). */
async function open(browser: Browser, who: Who): Promise<Seat> {
  const email = qaEmail(QA_PROJECT, who.role, who.n ?? 1);
  if (!sessions.has(email)) sessions.set(email, storageValue(await mintSession(email)));
  const lang = who.lang ?? 'en';
  const ctx = await browser.newContext({
    permissions: ['camera', 'microphone'],
    viewport: who.viewport ?? { width: 1440, height: 900 },
    locale: lang,
    ...(who.viewport && who.viewport.width < 500 ? { isMobile: true, hasTouch: true } : {}),
  });
  await ctx.addInitScript(([key, value, l]) => {
    window.localStorage.setItem(key, value);
    window.localStorage.setItem('watazawwado_lang', l);
    document.cookie = `watazawwado_lang=${l}; path=/`;
    document.cookie = `watazawwado_lang_chosen=${l}; path=/`;
    const Native = window.RTCPeerConnection;
    const pcs: RTCPeerConnection[] = [];
    (window as any).__pcs = pcs;
    (window as any).RTCPeerConnection = function (...args: any[]) {
      const pc = new (Native as any)(...args);
      pcs.push(pc);
      return pc;
    };
    (window as any).RTCPeerConnection.prototype = Native.prototype;
    Object.setPrototypeOf((window as any).RTCPeerConnection, Native);
  }, [STORAGE_KEY, sessions.get(email)!, lang]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`[${who.role}] pageerror`, e.message));
  return { ctx, page };
}

function roomPath(role: QaRole, id: string, observe = false) {
  const base = role === 'teacher' || role === 'admin' ? '/dashboard/room/' : '/student/room/';
  return `${base}${id}${observe ? '?observe=1' : ''}`;
}

/** Opens the room and presses Join (or Join quietly). */
async function join(seat: Seat, role: QaRole, id: string, opts: { observe?: boolean; lang?: 'en' | 'ar' } = {}) {
  await seat.page.goto(roomPath(role, id, opts.observe));
  const name = opts.lang === 'ar' ? /ادخل الحصة|ادخل بهدوء/ : /Join the lesson|Join quietly/;
  await seat.page.getByRole('button', { name }).first().click({ timeout: 60_000 });
  await expect(seat.page.getByRole('navigation', { name: opts.lang === 'ar' ? 'أدوات الحصة' : 'Lesson controls' })).toBeVisible({ timeout: 60_000 });
}

/** Received media in this page: inbound bytes per kind, and whether a remote video and audio element play. */
async function media(page: Page) {
  return page.evaluate(async () => {
    const pcs: RTCPeerConnection[] = ((window as any).__pcs || []).filter((p: RTCPeerConnection) => p.connectionState !== 'closed');
    let video = 0, audio = 0, frameHeight = 0, framesDecoded = 0;
    for (const pc of pcs) {
      (await pc.getStats()).forEach((s: any) => {
        if (s.type !== 'inbound-rtp') return;
        if (s.kind === 'video') { video += s.bytesReceived || 0; framesDecoded += s.framesDecoded || 0; frameHeight = Math.max(frameHeight, s.frameHeight || 0); }
        if (s.kind === 'audio') audio += s.bytesReceived || 0;
      });
    }
    const remote = new Set(pcs.flatMap((pc) => pc.getReceivers().map((r) => r.track?.id)));
    const els = [...document.querySelectorAll('video, audio')] as HTMLMediaElement[];
    const tracksOf = (el: HTMLMediaElement) => ((el.srcObject as MediaStream | null)?.getTracks() || []);
    const remoteVideo = els.filter((el) => el.tagName === 'VIDEO' && tracksOf(el).some((t) => t.kind === 'video' && remote.has(t.id)));
    const remoteAudio = els.filter((el) => tracksOf(el).some((t) => t.kind === 'audio' && t.readyState === 'live' && remote.has(t.id)));
    return {
      video, audio, frameHeight, framesDecoded, pcs: pcs.length,
      remoteVideoReady: remoteVideo.some((v) => v.readyState >= 2),
      remoteVideoHeights: remoteVideo.map((v) => (v as HTMLVideoElement).videoHeight),
      remoteAudio: remoteAudio.length,
    };
  });
}

/** Remote video plays and its bytes keep growing. */
async function expectFlowing(page: Page, label: string) {
  await expect.poll(async () => (await media(page)).remoteVideoReady, { message: `${label}: remote video ready`, timeout: 60_000, intervals: [1000] }).toBe(true);
  const a = await media(page);
  await page.waitForTimeout(3000);
  const b = await media(page);
  expect(b.video, `${label}: video bytes grow`).toBeGreaterThan(a.video);
  expect(b.audio, `${label}: audio bytes grow`).toBeGreaterThan(a.audio);
  return b;
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/e2e-${name}.png` });

test.afterAll(async () => {
  for (const id of made) await deleteClassroomBooking(QA_PROJECT, id).catch((e) => console.log('cleanup', id, e.message));
});

test('1. teacher and adult learner join and see each other', async ({ browser }) => {
  const b = await booking({ offsetMin: 2 });
  const teacher = await open(browser, { role: 'teacher' });
  const learner = await open(browser, { role: 'student' });
  await join(teacher, 'teacher', b.id);
  await join(learner, 'student', b.id);
  const tm = await expectFlowing(teacher.page, 'teacher');
  const lm = await expectFlowing(learner.page, 'learner');
  expect(tm.remoteAudio, 'teacher has the learner audio').toBeGreaterThan(0);
  expect(lm.remoteAudio, 'learner has the teacher audio').toBeGreaterThan(0);
  console.log('scenario 1 media', JSON.stringify({ tm, lm }));
  await shot(teacher.page, '01-teacher');
  await shot(learner.page, '01-learner');
  await teacher.ctx.close();
  await learner.ctx.close();
});
