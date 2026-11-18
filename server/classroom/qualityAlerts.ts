import type { LessonQualityRow } from '../../src/types/database.js';
import { notifySuperAdmins } from '../notifications/inbox.js';

/**
 * Classroom Task 11: connection quality per lesson and side, and the super admin alert when a teacher's connection
 * failed in QUALITY_ALERT.lessons lessons within QUALITY_ALERT.days days (spec §4, editable here).
 */
export const QUALITY_ALERT = { lessons: 3, days: 14 };
export const QUALITY_ALERT_KIND = 'classroom_quality_alert';
const DAY_MS = 86_400_000;

type QualityNumbers = Pick<LessonQualityRow, 'min_height' | 'degraded_seconds' | 'audio_only_seconds' | 'reconnects'>;

/** Audio-only for 60 s or more, video under 360p for 180 s or more of the degraded time, or 3 reconnects. */
export function lessonFailedForSide(q: QualityNumbers): boolean {
  return q.audio_only_seconds >= 60
    || (q.min_height != null && q.min_height < 360 && q.degraded_seconds >= 180)
    || q.reconnects >= 3;
}

/** Teacher side only: enough failed lessons whose record was last written in the trailing window. */
export function shouldAlert(rows: Array<QualityNumbers & Pick<LessonQualityRow, 'side' | 'updated_at'>>, now: number): boolean {
  const from = now - QUALITY_ALERT.days * DAY_MS;
  const failed = rows.filter((r) => {
    const at = Date.parse(r.updated_at);
    return r.side === 'teacher' && at >= from && at <= now && lessonFailedForSide(r);
  });
  return failed.length >= QUALITY_ALERT.lessons;
}

const alertLink = (teacherId: string) => `/dashboard/teachers?connection=${teacherId}`;

/**
 * Runs after each teacher-side quality write. Notifies the super admins at most once per teacher per window: the
 * latest alert notice (kind + per-teacher link) inside the window blocks a repeat. Returns true when it notified.
 */
export async function alertTeacherIfNeeded(client: any, teacherId: string, now: number): Promise<boolean> {
  const from = new Date(now - QUALITY_ALERT.days * DAY_MS).toISOString();
  const { data: lessons, error } = await client.from('bookings').select('id').eq('teacher_id', teacherId).gte('scheduled_start', from);
  if (error) throw new Error(`bookings: ${error.message}`);
  const ids = (lessons || []).map((b: any) => b.id);
  if (ids.length < QUALITY_ALERT.lessons) return false;
  const { data: rows, error: qErr } = await client.from('lesson_quality')
    .select('side, min_height, degraded_seconds, audio_only_seconds, reconnects, updated_at').in('booking_id', ids).eq('side', 'teacher');
  if (qErr) throw new Error(`lesson_quality: ${qErr.message}`);
  if (!shouldAlert(rows || [], now)) return false;

  const { data: last, error: nErr } = await client.from('user_notifications').select('id')
    .eq('kind', QUALITY_ALERT_KIND).eq('link', alertLink(teacherId)).gte('created_at', from).limit(1).maybeSingle();
  if (nErr) throw new Error(`user_notifications: ${nErr.message}`);
  if (last) return false;

  await notifySuperAdmins(client, {
    kind: QUALITY_ALERT_KIND,
    title: { en: "A teacher's connection keeps failing", ar: 'اتصال معلم بيقع كتير' },
    body: {
      en: `This teacher's connection failed in ${QUALITY_ALERT.lessons} or more lessons in the last ${QUALITY_ALERT.days} days. The Connection view on the Teachers page has each lesson's numbers.`,
      ar: `اتصال المعلم ده وقع في ${QUALITY_ALERT.lessons} حصص أو أكتر في آخر ${QUALITY_ALERT.days} يوم. أرقام كل حصة في "الاتصال" في صفحة المعلمين.`,
    },
    link: alertLink(teacherId),
  });
  return true;
}
