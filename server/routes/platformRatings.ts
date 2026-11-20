import express from 'express';
import { SUBJECTS } from '../../src/curriculum/catalog.js';
import { buildStudentMap, type ReportRow } from '../curriculum/reports.js';

/**
 * Platform rating (owner, 2026-11-20): after a learner completes a curriculum part (a unit in the track's MAP) and when
 * they finish a whole track, a short survey: 0-10 "would you recommend us", what you like most, what to improve.
 * Not blocking; shown once per milestone (answered or dismissed). There is no stored "part complete" flag, so it is
 * derived from the teacher reports: a part is complete when the reports cover every page of its last lesson
 * (buildStudentMap's `complete`); the track when its last part is. Only milestones reached in the last RECENT_DAYS
 * are offered, so a long-time learner is not handed a backlog of surveys. The family account answers.
 */
export const RECENT_DAYS = 30;
const REPORT_COLS = 'student_id, subject, lesson_number, from_page, to_page, strengths, to_reinforce, note, game_result, created_at';
const MILESTONE_RE = /^(part:[a-z0-9-]{1,40}:[0-9]{1,3}|track:[a-z0-9-]{1,40})$/;

export type Milestone = { key: string; kind: 'part' | 'track'; subject: string; title: string; titleAr: string; trackTitle: string; trackTitleAr: string; at: string };

/** Every part and track milestone the reports show as complete (the last part shows as the track only). */
export function milestonesOf(reports: ReportRow[]): Milestone[] {
  const out: Milestone[] = [];
  for (const progress of buildStudentMap(reports)) {
    const track = SUBJECTS.find((s) => s.id === progress.id)!;
    const parts = track.parts.length ? track.parts : [{ title: track.title, titleAr: track.titleAr, from: 1 }];
    parts.forEach((part, i) => {
      const last = i + 1 < parts.length ? parts[i + 1].from - 1 : track.plan.length;
      const lesson = progress.lessons[last - 1];
      if (!lesson?.complete || !lesson.lastReportAt) return;
      const isTrack = i === parts.length - 1;
      out.push({
        key: isTrack ? `track:${track.id}` : `part:${track.id}:${i + 1}`, kind: isTrack ? 'track' : 'part', subject: track.id,
        title: isTrack ? track.title : part.title, titleAr: isTrack ? track.titleAr : part.titleAr,
        trackTitle: track.title, trackTitleAr: track.titleAr, at: lesson.lastReportAt,
      });
    });
  }
  return out;
}

/** The newest recent milestone of one learner that has no answer or dismissal yet. */
export function nextMilestone(reports: ReportRow[], done: Set<string>, nowMs: number): Milestone | null {
  const since = nowMs - RECENT_DAYS * 86_400_000;
  return milestonesOf(reports).filter((m) => Date.parse(m.at) >= since && !done.has(m.key)).sort((a, b) => b.at.localeCompare(a.at))[0] || null;
}

export function parseSurvey(body: any): { recommend: number | null; liked: string | null; improve: string | null; dismissed: boolean } | { error: string } {
  if (body?.dismissed === true) return { recommend: null, liked: null, improve: null, dismissed: true };
  const recommend = Number(body?.recommend);
  if (body?.recommend == null || !Number.isInteger(recommend) || recommend < 0 || recommend > 10) return { error: 'Choose a number from 0 to 10.' };
  const text = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const liked = text(body?.liked);
  const improve = text(body?.improve);
  if ((liked?.length || 0) > 1000 || (improve?.length || 0) > 1000) return { error: 'Please keep each answer under 1000 characters.' };
  return { recommend, liked, improve, dismissed: false };
}

/** Net promoter score: % of 9-10 minus % of 0-6, whole number. */
export const npsOf = (scores: number[]) => (scores.length ? Math.round(((scores.filter((s) => s >= 9).length - scores.filter((s) => s <= 6).length) / scores.length) * 100) : null);

type Middleware = (req: any, res: any, next: any) => any;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function registerPlatformRatingRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  const db = (res: any) => {
    const c = deps.getClient();
    if (!c) res.status(503).json({ error: 'Database service unavailable.' });
    return c;
  };
  /** Per learner: the pending milestone, if any. */
  const pendingFor = async (client: any, learnerIds: string[]) => {
    const [{ data: reports, error }, { data: rows, error: rErr }] = await Promise.all([
      client.from('curriculum_lesson_reports').select(REPORT_COLS).in('student_id', learnerIds).order('created_at', { ascending: true }).limit(3000),
      client.from('platform_ratings').select('student_id, milestone').in('student_id', learnerIds),
    ]);
    if (error || rErr) throw new Error((error || rErr).message);
    return learnerIds.map((id) => ({
      learnerId: id,
      milestone: nextMilestone((reports || []).filter((r: any) => r.student_id === id), new Set((rows || []).filter((r: any) => r.student_id === id).map((r: any) => r.milestone)), now()),
    })).filter((p) => p.milestone);
  };

  app.get('/api/student/platform-survey/pending', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    if (req.childDevice) return res.json({ pending: null });
    try {
      const learners = await deps.getLearners(client, req);
      const requested = typeof req.query?.learnerId === 'string' ? req.query.learnerId.trim() : '';
      if (requested && !learners.some((l) => l.id === requested)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const ids = requested ? [requested] : learners.map((l) => l.id);
      if (!ids.length) return res.json({ pending: null });
      const first = (await pendingFor(client, ids))[0];
      if (!first) return res.json({ pending: null });
      const m = first.milestone!;
      res.json({ pending: { learnerId: first.learnerId, learnerName: learners.find((l) => l.id === first.learnerId)?.name || null, milestone: m.key, kind: m.kind, title: m.title, titleAr: m.titleAr, trackTitle: m.trackTitle, trackTitleAr: m.trackTitleAr } });
    } catch (err) {
      console.error('[GET platform-survey/pending]', err);
      res.status(500).json({ error: 'Could not check this.' });
    }
  });

  app.post('/api/student/platform-survey', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const userId = req.studentUser?.auth_id;
    if (!userId || !UUID_RE.test(userId)) return res.status(401).json({ error: 'Please sign in again.' });
    if (req.childDevice) return res.status(403).json({ error: 'A parent answers this from the family account.' });
    const learnerId = String(req.body?.learnerId || '');
    const milestone = String(req.body?.milestone || '');
    if (!MILESTONE_RE.test(milestone)) return res.status(400).json({ error: 'Unknown milestone.' });
    const parsed = parseSurvey(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    try {
      const learners = await deps.getLearners(client, req);
      if (!learners.some((l) => l.id === learnerId)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const [mine] = await pendingFor(client, [learnerId]);
      if (mine?.milestone?.key !== milestone) return res.status(409).json({ error: 'There is nothing to answer here now.' });
      const { error } = await client.from('platform_ratings').insert({ student_id: learnerId, submitted_by: userId, milestone, ...parsed });
      if (error?.code === '23505') return res.status(409).json({ error: 'This was already answered.' });
      if (error) throw new Error(error.message);
      res.status(201).json({ saved: true });
    } catch (err) {
      console.error('[POST platform-survey]', err);
      res.status(500).json({ error: 'Could not save your answers.' });
    }
  });

  app.get('/api/dashboard/admin/platform-ratings', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data, error } = await client.from('platform_ratings').select('student_id, milestone, recommend, liked, improve, dismissed, created_at')
        .order('created_at', { ascending: false }).limit(1000);
      if (error) throw new Error(error.message);
      const answered = (data || []).filter((r: any) => !r.dismissed);
      const scores = answered.map((r: any) => Number(r.recommend));
      const ids = [...new Set(answered.map((r: any) => r.student_id))].slice(0, 300);
      const { data: students } = ids.length ? await client.from('students').select('id, name').in('id', ids) : { data: [] as any[] };
      const names = new Map((students || []).map((s: any) => [s.id, s.name]));
      const label = (key: string) => {
        const [kind, subject, n] = key.split(':');
        const track = SUBJECTS.find((s) => s.id === subject);
        const part = kind === 'part' ? track?.parts[Number(n) - 1] : null;
        return { title: part ? part.title : track?.title || subject, titleAr: part ? part.titleAr : track?.titleAr || subject, kind };
      };
      res.json({
        count: answered.length, dismissed: (data || []).length - answered.length,
        average: scores.length ? Math.round((scores.reduce((a: number, s: number) => a + s, 0) / scores.length) * 10) / 10 : null,
        nps: npsOf(scores),
        items: answered.slice(0, 200).map((r: any) => ({ learnerName: names.get(r.student_id) || null, ...label(r.milestone), recommend: r.recommend, liked: r.liked, improve: r.improve, createdAt: r.created_at })),
      });
    } catch (err) {
      console.error('[GET admin/platform-ratings]', err);
      res.status(500).json({ error: 'Could not load the survey answers.' });
    }
  });
}
