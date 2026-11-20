/**
 * The learner's mistake bank (classroom BUILD-LIST 2.10): every "said X → correct Y" the teacher logs in the room
 * lands in `learner_mistakes`, one bank per learner. The daily review (NX-01) shows the open ones to the family and
 * the homework writer (NX-02) and the room's warm-up read them too. Server only (service role).
 */
export type Correction = { id: string; said: string; correct: string; note?: string };
export type Mistake = { id: string; said: string; correct: string; note: string | null; created_at: string };

/** How many open corrections the review, homework and warm-up read at most. */
export const RECENT_MISTAKES = 20;

/**
 * Saves the room's corrections for this lesson. The client may send a batch twice (a retried flush), so a correction
 * is keyed by (booking, its id in the room) and a repeat changes nothing.
 */
export async function recordCorrections(client: any, at: { bookingId: string; studentId: string | null; teacherId: string | null; subject?: string | null }, items: Correction[]): Promise<number> {
  if (!at.studentId || !items.length) return 0;
  const rows = items.map((c) => ({
    student_id: at.studentId,
    booking_id: at.bookingId,
    teacher_id: at.teacherId,
    client_id: c.id,
    said: c.said.trim().slice(0, 300),
    correct: c.correct.trim().slice(0, 300),
    note: c.note?.trim() ? c.note.trim().slice(0, 500) : null,
    subject: at.subject ?? null,
  })).filter((r) => r.said && r.correct);
  if (!rows.length) return 0;
  const { error } = await client.from('learner_mistakes').upsert(rows, { onConflict: 'booking_id,client_id', ignoreDuplicates: true });
  if (error) throw new Error(`learner_mistakes: ${error.message}`);
  return rows.length;
}

/** The newest open corrections of these learners (resolved ones are left out). */
export async function recentMistakes(client: any, studentIds: string[], limit = RECENT_MISTAKES): Promise<Array<Mistake & { student_id: string }>> {
  if (!studentIds.length) return [];
  const { data, error } = await client.from('learner_mistakes').select('id, student_id, said, correct, note, created_at')
    .in('student_id', studentIds).is('resolved_at', null).order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`learner_mistakes: ${error.message}`);
  return data || [];
}

/** The family marks a correction as learned in the review; only a learner on their account. */
export async function resolveMistake(client: any, id: string, studentIds: string[], nowIso: string): Promise<boolean> {
  const { data, error } = await client.from('learner_mistakes').select('id, student_id').eq('id', id).maybeSingle();
  if (error) throw new Error(`learner_mistakes: ${error.message}`);
  if (!data || !studentIds.includes(data.student_id)) return false;
  const { error: upErr } = await client.from('learner_mistakes').update({ resolved_at: nowIso }).eq('id', id);
  if (upErr) throw new Error(`learner_mistakes: ${upErr.message}`);
  return true;
}
