import express from 'express';
import { canFamilyReadLearner, isUuid } from './progress.js';

/**
 * NX-01: today's review. Every ayat range the teacher marked "mastered" in homework becomes a card; the learner recites
 * it from memory and says how it went. Smooth moves the card to a longer gap, a few slips keeps the gap, needing the
 * mushaf starts it again tomorrow. At most DAILY_CARDS a day (about five minutes). No streaks: a missed day just
 * leaves the cards due.
 */
type Middleware = (req: any, res: any, next: any) => any;

export const INTERVAL_DAYS = [1, 3, 7, 14, 30, 60];
export const DAILY_CARDS = 5;
export type Grade = 'smooth' | 'slips' | 'mushaf';
const GRADES: Grade[] = ['smooth', 'slips', 'mushaf'];
const CARD_COLUMNS = 'id, student_id, surah, ayah_from, ayah_to, box, due_on, last_grade, last_reviewed_at, reviews';

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The next box and due date after a grade, counted from the day of the review. */
export function schedule(box: number, grade: Grade, today: string): { box: number; due_on: string } {
  const next = grade === 'smooth' ? Math.min(box + 1, INTERVAL_DAYS.length - 1) : grade === 'slips' ? box : 0;
  return { box: next, due_on: addDays(today, INTERVAL_DAYS[next]) };
}

/** Today as a calendar day. A family-local day would need the account time zone; a UTC day is close enough here. */
const todayUtc = () => new Date().toISOString().slice(0, 10);

/** Cards for mastered recitations that have none yet; the first review is the day after the teacher's "mastered". */
async function syncCards(client: any, ids: string[]) {
  const { data: mastered } = await client.from('lesson_homework').select('id, student_id, surah, ayah_from, ayah_to, reviewed_at')
    .in('student_id', ids).eq('kind', 'recite').eq('review', 'mastered').limit(500);
  if (!mastered?.length) return;
  const { data: existing } = await client.from('review_cards').select('homework_id').in('homework_id', mastered.map((h: any) => h.id));
  const have = new Set((existing || []).map((c: any) => c.homework_id));
  const rows = mastered.filter((h: any) => !have.has(h.id) && h.surah && h.ayah_from && h.ayah_to).map((h: any) => ({
    student_id: h.student_id, homework_id: h.id, surah: h.surah, ayah_from: h.ayah_from, ayah_to: h.ayah_to,
    due_on: addDays(String(h.reviewed_at || new Date().toISOString()).slice(0, 10), INTERVAL_DAYS[0]),
  }));
  if (!rows.length) return;
  // A parallel request may have made the same card: the unique homework_id makes the second insert a no-op.
  const { error } = await client.from('review_cards').upsert(rows, { onConflict: 'homework_id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export function registerReviewRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
}) {
  // Family: today's due cards of the account's learners (oldest first), and when the next one is due.
  app.get('/api/student/review', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const requested = typeof req.query?.learnerId === 'string' ? req.query.learnerId.trim() : '';
      if (requested && !canFamilyReadLearner(learners, requested)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const ids = requested ? [requested] : learners.map((l) => l.id).filter(Boolean);
      if (!ids.length) return res.json({ due: [], total: 0, nextDue: null });
      await syncCards(client, ids);
      const today = todayUtc();
      const [{ data: due }, { count: total }, { data: next }] = await Promise.all([
        client.from('review_cards').select(CARD_COLUMNS).in('student_id', ids).lte('due_on', today)
          .order('due_on', { ascending: true }).order('created_at', { ascending: true }).limit(DAILY_CARDS),
        client.from('review_cards').select('id', { count: 'exact', head: true }).in('student_id', ids),
        client.from('review_cards').select('due_on').in('student_id', ids).gt('due_on', today).order('due_on', { ascending: true }).limit(1),
      ]);
      const names = new Map(learners.map((l) => [l.id, l.name]));
      return res.json({
        due: (due || []).map((c: any) => ({ ...c, learnerName: ids.length > 1 ? names.get(c.student_id) || null : null })),
        total: total || 0,
        nextDue: next?.[0]?.due_on || null,
      });
    } catch (err: any) {
      console.error('[GET student review]', err?.message || err);
      return res.status(500).json({ error: 'Could not load the review.' });
    }
  });

  // Family: grade one card after reciting it.
  app.post('/api/student/review/:id', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const id = String(req.params.id || '');
    const grade = req.body?.grade;
    if (!isUuid(id)) return res.status(400).json({ error: 'Valid card id is required.' });
    if (!GRADES.includes(grade)) return res.status(400).json({ error: 'Grade must be smooth, slips or mushaf.' });
    try {
      const { data: card } = await client.from('review_cards').select('id, student_id, box, due_on, reviews').eq('id', id).maybeSingle();
      const learners = await deps.getLearners(client, req);
      if (!card || !canFamilyReadLearner(learners, card.student_id)) return res.status(404).json({ error: 'Card not found.' });
      const today = todayUtc();
      if (card.due_on > today) return res.status(409).json({ error: 'This card is not due yet.' });
      const next = schedule(card.box, grade, today);
      // Only from the state we read: a double tap cannot move the card twice.
      const { data: updated, error } = await client.from('review_cards')
        .update({ ...next, last_grade: grade, last_reviewed_at: new Date().toISOString(), reviews: Math.min((card.reviews || 0) + 1, 32000) })
        .eq('id', id).eq('due_on', card.due_on).eq('box', card.box).select(CARD_COLUMNS).maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) return res.status(409).json({ error: 'This card was already reviewed.' });
      return res.json({ card: updated });
    } catch (err: any) {
      console.error('[POST student review]', err?.message || err);
      return res.status(500).json({ error: 'Could not save.' });
    }
  });
}
