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
import { BASE, call, db, QA_PROJECT, tokenFor } from './helpers.js';

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

// ---- 2-6 and 8 share one lesson: teacher-1 with the adult learner -------------------------------------------------
let pair: { b: ClassroomBooking; teacher: Seat; learner: Seat } | null = null;
async function ensurePair(browser: Browser) {
  if (pair) return pair;
  const b = await booking({ offsetMin: 2 });
  const teacher = await open(browser, { role: 'teacher' });
  const learner = await open(browser, { role: 'student' });
  await join(teacher, 'teacher', b.id);
  await join(learner, 'student', b.id);
  await expectFlowing(teacher.page, 'teacher');
  pair = { b, teacher, learner };
  return pair;
}
const radio = (p: Page, name: string) => p.getByRole('radio', { name, exact: true });
const tab = (p: Page, name: string) => p.getByRole('tab', { name, exact: true });

/** The pixels of the board's drawing canvas (excalidraw draws the scene there). */
const boardPixels = (p: Page) => p.evaluate(() => {
  const c = document.querySelector('canvas.excalidraw__canvas.static') as HTMLCanvasElement | null;
  if (!c) return '';
  const d = c.toDataURL();
  let h = 0;
  for (let i = 0; i < d.length; i += 7) h = (h * 31 + d.charCodeAt(i)) | 0;
  return `${d.length}:${h}`;
});
const setVisibility = (p: Page, state: 'hidden' | 'visible') => p.evaluate((s) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
  document.dispatchEvent(new Event('visibilitychange'));
}, state);

test('2. curriculum sync, layout switch, PDF upload, board drawing, pointer', async ({ browser }) => {
  const { teacher, learner } = await ensurePair(browser);
  const T = teacher.page, L = learner.page;
  // Layout: content -> the learner leaves the conversation view and follows the slides.
  await radio(T, 'Lesson content').click();
  await expect(L.locator('[data-room-page]')).toBeVisible({ timeout: 30_000 });
  // The series opening plays on both screens; the teacher's skip closes it on the learner's too.
  const skip = T.getByRole('button', { name: /^Skip/ });
  if (await skip.waitFor({ timeout: 8000 }).then(() => true, () => false)) {
    await expect(L.getByRole('button', { name: /^Skip/ }), 'the learner sees the opening too').toBeVisible({ timeout: 15_000 });
    await skip.click();
    await expect(L.getByRole('button', { name: /^Skip/ })).toHaveCount(0, { timeout: 15_000 });
  }
  // The learner only watches: no slide controls on the learner's player.
  await expect(L.getByTitle('Next (→ or Space)')).toHaveCount(0);
  const before = await L.locator('[data-room-page]').getAttribute('data-room-page');
  const next = T.getByTitle('Next (→ or Space)');
  await next.click();
  await next.click();
  await expect.poll(() => L.locator('[data-room-page]').getAttribute('data-room-page'), { timeout: 15_000 }).not.toBe(before);
  await shot(L, '02-learner-slides');
  // Pointer: the teacher moves over the content box; the learner sees the teacher's named pointer.
  const box = (await T.locator('.room-paper').boundingBox())!;
  for (let i = 0; i < 6; i++) await T.mouse.move(box.x + 100 + i * 30, box.y + 120 + i * 10);
  await expect(L.locator('.room-paper').getByText('QA Ustadh P5', { exact: true })).toBeVisible({ timeout: 10_000 });
  // Board: the teacher draws a rectangle; the learner's board canvas changes.
  await tab(T, 'Board').click();
  await expect(L.locator('.excalidraw')).toBeVisible({ timeout: 30_000 });
  await expect(T.locator('canvas.excalidraw__canvas.interactive')).toBeVisible({ timeout: 30_000 });
  await L.waitForTimeout(1500);
  const blank = await boardPixels(L);
  const canvas = (await T.locator('canvas.excalidraw__canvas.interactive').boundingBox())!;
  const cx = canvas.x + canvas.width / 2, cy = canvas.y + canvas.height / 2;
  await T.locator('.excalidraw').getByTitle(/^Rectangle/).click();
  await T.mouse.move(cx - 120, cy - 80);
  await T.mouse.down();
  await T.mouse.move(cx + 120, cy + 80, { steps: 8 });
  await T.mouse.up();
  await expect.poll(() => boardPixels(L), { message: 'learner board shows the drawing', timeout: 15_000 }).not.toBe(blank);
  await shot(L, '02-learner-board');
  // File: the teacher adds a two-page PDF; the learner sees it, then page 2.
  await tab(T, 'File').click();
  await T.locator('input[type=file]').setInputFiles('e2e/fixtures/classroom-two-pages.pdf');
  await expect(L.getByLabel(/Page 1 of 2/)).toBeVisible({ timeout: 45_000 });
  await T.getByRole('button', { name: 'Next page' }).click();
  await expect(L.getByLabel(/Page 2 of 2/)).toBeVisible({ timeout: 15_000 });
  await shot(T, '02-teacher-pdf');
  await shot(L, '02-learner-pdf');
});

test('3. teacher shares the screen, the learner sees it, then it stops', async ({ browser }) => {
  const { teacher, learner } = await ensurePair(browser);
  const T = teacher.page, L = learner.page;
  await T.getByRole('button', { name: 'Share screen' }).click();
  await T.getByRole('button', { name: 'Choose what to share' }).click();
  await expect(T.getByText("You're sharing")).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => L.evaluate(() => [...document.querySelectorAll('video')].some((v) => v.readyState >= 2 && v.videoWidth > 700)),
    { message: 'learner plays the screen track', timeout: 30_000 }).toBe(true);
  await shot(L, '03-learner-screen');
  await T.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(T.getByText("You're sharing")).toHaveCount(0);
  await expect(L.getByLabel(/Page 2 of 2/)).toBeVisible({ timeout: 15_000 });
});

test('4. focus warning reaches the teacher, who turns it off', async ({ browser }) => {
  const { teacher, learner } = await ensurePair(browser);
  const T = teacher.page, L = learner.page;
  await setVisibility(L, 'hidden');
  // Two notice slots exist (wide screens and phones); one is hidden by CSS.
  const away = T.getByText('Not on the lesson screen').filter({ visible: true });
  await expect(away).toBeVisible({ timeout: 20_000 });
  await shot(T, '04-teacher-focus');
  await T.getByRole('button', { name: 'I asked them to; stop warning' }).filter({ visible: true }).click();
  await expect(away).toHaveCount(0);
  await setVisibility(L, 'visible');
  // Warning off: the learner gets no "welcome back" nag either.
  await L.waitForTimeout(1500);
  await expect(L.getByText('Welcome back. Your teacher is waiting for you.').filter({ visible: true })).toHaveCount(0);
});

test('5. the learner reloads mid-lesson: same pane and page, video back, rejoin counted', async ({ browser }) => {
  const { b, teacher, learner } = await ensurePair(browser);
  await learner.page.reload();
  await learner.page.getByRole('button', { name: 'Join the lesson' }).click({ timeout: 60_000 });
  await expect(learner.page.getByLabel(/Page 2 of 2/)).toBeVisible({ timeout: 45_000 });
  await expectFlowing(learner.page, 'learner after reload');
  await expectFlowing(teacher.page, 'teacher after learner reload');
  const { data } = await db.from('lesson_attendance_events').select('event, role').eq('booking_id', b.id).eq('event', 'room_joined');
  expect((data || []).filter((e) => e.role === 'student').length, 'two learner joins').toBeGreaterThanOrEqual(2);
  await shot(learner.page, '05-learner-rejoined');
});

test('6. a second learner device takes over; the teacher keeps video', async ({ browser }) => {
  const { b, teacher, learner } = await ensurePair(browser);
  const second = await open(browser, { role: 'student' });
  await join(second, 'student', b.id);
  await expect(learner.page.getByText('This lesson is open on another device')).toBeVisible({ timeout: 45_000 });
  await expectFlowing(second.page, 'second device');
  await teacher.page.waitForTimeout(5000);
  await expectFlowing(teacher.page, 'teacher after takeover');
  await shot(learner.page, '06-old-device');
  await learner.ctx.close();
  pair!.learner = second;
});

test('8. the teacher ends the lesson; the learner cannot come back; attendance is held', async ({ browser }) => {
  const { b, teacher, learner } = await ensurePair(browser);
  await teacher.page.getByRole('navigation', { name: 'Lesson controls' }).getByRole('button', { name: 'End lesson' }).click();
  await teacher.page.getByRole('dialog').getByRole('button', { name: 'End lesson' }).click();
  await expect(teacher.page).toHaveURL(/\/dashboard(?!\/room)/, { timeout: 30_000 });
  await expect(learner.page.getByText('The lesson has ended')).toBeVisible({ timeout: 45_000 });
  await shot(learner.page, '08-learner-ended');
  const again = await call(await tokenFor('student'), 'GET', `/api/student/classroom/${b.id}/enter`);
  expect(again.status).toBe(423);
  const att = await call(await tokenFor('teacher'), 'GET', `/api/dashboard/bookings/${b.id}/attendance`);
  console.log('scenario 8 attendance', JSON.stringify(att.json?.summary));
  expect(att.json?.summary?.joins?.teacher).toBeGreaterThanOrEqual(1);
  expect(att.json?.summary?.togetherMinutes).toBeGreaterThanOrEqual(0);
  await teacher.ctx.close();
  await learner.ctx.close();
  pair = null;
});

test('7. late teacher: the reason gate after End lesson, then the admin sees it', async ({ browser }) => {
  const b = await booking({ offsetMin: -3 });
  const teacher = await open(browser, { role: 'teacher' });
  const learner = await open(browser, { role: 'student' });
  await join(learner, 'student', b.id);
  await join(teacher, 'teacher', b.id);
  await expectFlowing(teacher.page, 'late teacher');
  const T = teacher.page;
  await T.getByRole('navigation', { name: 'Lesson controls' }).getByRole('button', { name: 'End lesson' }).click();
  await T.getByRole('dialog').getByRole('button', { name: 'End lesson' }).click();
  await expect(T).toHaveURL(/\/dashboard(?!\/room)/, { timeout: 30_000 });
  // The gate may come from the next dashboard load; reload once if it is not up yet.
  const gate = T.getByRole('dialog').filter({ hasText: 'What happened?' });
  if (!(await gate.isVisible({ timeout: 15_000 }).catch(() => false))) await T.reload();
  await expect(gate).toBeVisible({ timeout: 30_000 });
  await T.keyboard.press('Escape');
  await expect(gate, 'Escape does not dismiss the gate').toBeVisible();
  const box = gate.getByRole('textbox');
  await box.fill('late');
  await expect(gate.getByRole('button', { name: 'Send' })).toBeDisabled();
  const short = await call(await tokenFor('teacher'), 'POST', `/api/dashboard/late-reasons/${b.id}`, { reason: 'late' });
  expect(short.status, 'server refuses a short reason').toBe(400);
  await shot(T, '07-late-gate');
  await box.fill('QA: the power went out at home for a few minutes.');
  await gate.getByRole('button', { name: 'Send' }).click();
  await expect(gate).toHaveCount(0, { timeout: 15_000 });
  const admin = await open(browser, { role: 'admin' });
  await admin.page.goto('/dashboard/late-reasons');
  await expect(admin.page.getByText('QA: the power went out at home for a few minutes.')).toBeVisible({ timeout: 30_000 });
  await shot(admin.page, '07-admin-late-reasons');
  for (const s of [teacher, learner, admin]) await s.ctx.close();
});

test('9. guardian observer: the teacher sees the chip, the child view does not, the observer cannot publish', async ({ browser }) => {
  const b = await booking({ offsetMin: 2, learner: 'kid' });
  const teacher = await open(browser, { role: 'teacher', n: 2 });
  const kid = await open(browser, { role: 'parent' });
  const guardian = await open(browser, { role: 'parent' });
  await join(teacher, 'teacher', b.id);
  await join(kid, 'parent', b.id);
  await join(guardian, 'parent', b.id, { observe: true });
  await expect(teacher.page.getByText('Guardian watching')).toBeVisible({ timeout: 45_000 });
  await expectFlowing(guardian.page, 'guardian');
  await kid.page.waitForTimeout(2000);
  await expect(kid.page.getByText('Guardian watching')).toHaveCount(0);
  const senders = await guardian.page.evaluate(() => ((window as any).__pcs as RTCPeerConnection[]).flatMap((pc) => pc.getSenders()).filter((s) => s.track).length);
  expect(senders, 'observer sends no media').toBe(0);
  // The server refuses a publish from an observer ticket.
  const entry = await call(await tokenFor('parent'), 'GET', `/api/student/classroom/${b.id}/enter?observe=1`);
  expect(entry.json?.role).toBe('guardian_observer');
  const res = await fetch(`${BASE}/api/classroom/${b.id}/rtc/session`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-room-ticket': entry.json.ticket } });
  const { sessionId } = await res.json();
  const pub = await fetch(`${BASE}/api/classroom/${b.id}/rtc/tracks`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-room-ticket': entry.json.ticket },
    body: JSON.stringify({ sessionId, sdp: 'v=0', tracks: [{ location: 'local', mid: '0', trackName: 'teacher-video' }] }),
  });
  expect(pub.status, 'observer publish refused').toBe(403);
  await shot(teacher.page, '09-teacher-guardian-chip');
  await shot(kid.page, '09-kid-view');
  for (const s of [teacher, kid, guardian]) await s.ctx.close();
});

test('10. super admin observer: notes autosave into admin_observations', async ({ browser }) => {
  const b = await booking({ offsetMin: 2 });
  const teacher = await open(browser, { role: 'teacher' });
  const admin = await open(browser, { role: 'admin' });
  await join(teacher, 'teacher', b.id);
  await join(admin, 'admin', b.id, { observe: true });
  await expectFlowing(admin.page, 'admin observer');
  await expect(teacher.page.getByText('Guardian watching')).toHaveCount(0);
  const notes = admin.page.getByRole('textbox').first();
  if (!(await notes.isVisible().catch(() => false))) await admin.page.getByRole('button', { name: /notes/i }).first().click();
  await admin.page.getByRole('textbox').first().fill('QA observer note: clear audio, good pace.');
  await expect.poll(async () => (await db.from('admin_observations').select('notes').eq('booking_id', b.id)).data?.[0]?.notes,
    { timeout: 20_000 }).toBe('QA observer note: clear audio, good pace.');
  await shot(admin.page, '10-admin-observer');
  for (const s of [teacher, admin]) await s.ctx.close();
});

test('11. Zoom fallback: media blocked for the teacher records an incident and offers Zoom', async ({ browser }) => {
  const b = await booking({ offsetMin: 2 });
  await db.from('bookings').update({ zoom_meeting_link: 'https://zoom.us/j/00000000000', sync_metadata: { zoomStartUrl: 'https://zoom.us/s/00000000000' } }).eq('id', b.id);
  const teacher = await open(browser, { role: 'teacher' });
  await teacher.page.route('**/api/classroom/*/rtc/**', (r) => r.abort());
  await join(teacher, 'teacher', b.id).catch(() => { /* the room may fail before the bar shows */ });
  await expect.poll(async () => (await db.from('classroom_incidents').select('kind, side').eq('booking_id', b.id)).data?.length || 0,
    { message: 'incident recorded', timeout: 45_000 }).toBeGreaterThan(0);
  const { data: inc } = await db.from('classroom_incidents').select('kind, side').eq('booking_id', b.id);
  console.log('scenario 11 incidents', JSON.stringify(inc));
  await expect(teacher.page.getByRole('link', { name: 'Continue on Zoom' }).first()).toBeVisible({ timeout: 30_000 });
  await shot(teacher.page, '11-teacher-fallback');
  // The super admins are told (here the QA admin; the purge removes the notices naming QA people).
  const admin = (await db.from('profiles').select('id').eq('email', qaEmail(QA_PROJECT, 'admin')).single()).data!.id;
  const { data: notes } = await db.from('user_notifications').select('title_en').eq('recipient_user_id', admin).eq('kind', 'classroom_incident');
  expect((notes || []).some((n) => /Zoom was offered/.test(n.title_en))).toBe(true);
  // Without any Zoom link the notice is the urgent one.
  const bare = await booking({ offsetMin: 2, learner: 'kid' });
  const entry = await call(await tokenFor('parent'), 'GET', `/api/student/classroom/${bare.id}/enter`);
  const r = await fetch(`${BASE}/api/classroom/${bare.id}/incident`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-room-ticket': entry.json.ticket }, body: JSON.stringify({ kind: 'connect_timeout', detail: {} }) });
  expect((await r.json()).fallback).toBeNull();
  const { data: urgent } = await db.from('user_notifications').select('title_en').eq('recipient_user_id', admin).eq('kind', 'classroom_incident');
  expect((urgent || []).some((n) => /^Urgent/.test(n.title_en))).toBe(true);
  await teacher.ctx.close();
});

test('12. weak learner uplink: capped learner senders reach the teacher, video keeps flowing, then recovers', async ({ browser }) => {
  const b = await booking({ offsetMin: 2 });
  const teacher = await open(browser, { role: 'teacher' });
  const learner = await open(browser, { role: 'student' });
  await join(teacher, 'teacher', b.id);
  await join(learner, 'student', b.id);
  await expectFlowing(teacher.page, 'teacher');
  // DevTools network throttling does not touch WebRTC media, so the weak line is the learner's senders capped hard.
  const cdp = await learner.ctx.newCDPSession(learner.page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 300_000 / 8, uploadThroughput: 300_000 / 8 });
  const cap = (bps: number | null) => learner.page.evaluate(async (max) => {
    for (const pc of (window as any).__pcs as RTCPeerConnection[]) {
      for (const s of pc.getSenders()) {
        if (!s.track) continue;
        const p = s.getParameters();
        (p.encodings || []).forEach((e: any) => { if (max == null) delete e.maxBitrate; else e.maxBitrate = s.track!.kind === 'audio' ? 24_000 : max; });
        await s.setParameters(p).catch(() => {});
      }
    }
  }, bps);
  // Received video kbps over 4 s at the teacher.
  const rate = async () => { const x = await media(teacher.page); await teacher.page.waitForTimeout(4000); const y = await media(teacher.page); return { kbps: Math.round((y.video - x.video) * 8 / 4000), height: y.frameHeight }; };
  const before = await rate();
  await cap(40_000);
  await teacher.page.waitForTimeout(8000);
  const capped = await rate();
  const notices = await teacher.page.getByRole('status').filter({ visible: true }).allInnerTexts();
  const badge = await teacher.page.locator('header').first().innerText();
  console.log('scenario 12', JSON.stringify({ before, capped, notices, badge }));
  expect(capped.kbps, 'the cap reaches the teacher').toBeLessThan(before.kbps);
  await expectFlowing(teacher.page, 'teacher under the cap');
  await shot(teacher.page, '12-teacher-weak');
  await cap(null);
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await expect.poll(async () => (await rate()).kbps, { message: 'bitrate recovers', timeout: 60_000, intervals: [1000] }).toBeGreaterThan(capped.kbps * 2);
  for (const s of [teacher, learner]) await s.ctx.close();
});

test('13. window edges: too early is refused; a cancelled lesson closes the open room', async ({ browser }) => {
  const early = await booking({ offsetMin: 20 });
  const r = await call(await tokenFor('student'), 'GET', `/api/student/classroom/${early.id}/enter`);
  expect(r.status).toBe(423);
  const learner = await open(browser, { role: 'student' });
  await learner.page.goto(roomPath('student', early.id));
  await expect(learner.page.getByRole('alert')).toContainText(/not open/i, { timeout: 30_000 });
  await shot(learner.page, '13-too-early');
  const b = await booking({ offsetMin: 2 });
  await join(learner, 'student', b.id);
  await cancelClassroomBooking(QA_PROJECT, b.id);
  const t0 = Date.now();
  await expect(learner.page.getByText('This lesson was cancelled')).toBeVisible({ timeout: 45_000 });
  console.log('scenario 13 cancelled shown after ms', Date.now() - t0);
  await shot(learner.page, '13-cancelled');
  await learner.ctx.close();
});

test('14. Arabic, phone size: the learner room in RTL at 375x812', async ({ browser }) => {
  const b = await booking({ offsetMin: 2 });
  const teacher = await open(browser, { role: 'teacher' });
  const learner = await open(browser, { role: 'student', lang: 'ar', viewport: { width: 375, height: 812 } });
  await learner.page.goto(roomPath('student', b.id));
  await shot(learner.page, '14-phone-ar-waiting');
  await learner.page.getByRole('button', { name: 'ادخل الحصة' }).click({ timeout: 60_000 });
  await join(teacher, 'teacher', b.id);
  await expectFlowing(learner.page, 'phone learner');
  expect(await learner.page.evaluate(() => document.documentElement.dir)).toBe('rtl');
  const overflow = await learner.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'no sideways scroll').toBeLessThanOrEqual(0);
  await shot(learner.page, '14-phone-ar-room');
  await radio(teacher.page, 'Lesson content').click();
  await expect(learner.page.locator('[data-room-page]')).toBeVisible({ timeout: 30_000 });
  await shot(learner.page, '14-phone-ar-content');
  for (const s of [teacher, learner]) await s.ctx.close();
});
