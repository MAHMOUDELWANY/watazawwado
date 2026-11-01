import { SURAHS, quranLink } from './surahs';

export interface HomeworkItem {
  id: string;
  student_id: string;
  booking_id: string | null;
  subject: string | null;
  kind: 'recite' | 'review' | 'task';
  surah: number | null;
  ayah_from: number | null;
  ayah_to: number | null;
  body: string | null;
  done_at: string | null;
  review: 'mastered' | 'needs_review' | null;
  reviewed_at: string | null;
  carried_from: string | null;
  created_at: string;
}

/** The line a family or teacher reads for one task, and where it opens. */
export function homeworkLine(hw: HomeworkItem, isAr: boolean): { title: string; note: string | null; href: string | null; external: boolean } {
  if (hw.kind === 'recite' && hw.surah) {
    const s = SURAHS.find((x) => x.n === hw.surah);
    const name = s ? (isAr ? `سورة ${s.ar}` : `Surah ${s.en}`) : '';
    const n = (v: number | null) => (isAr ? Number(v).toLocaleString('ar-EG') : String(v));
    const range = hw.ayah_from === hw.ayah_to
      ? (isAr ? `آية ${n(hw.ayah_from)}` : `ayah ${hw.ayah_from}`)
      : (isAr ? `من آية ${n(hw.ayah_from)} لـ ${n(hw.ayah_to)}` : `ayat ${hw.ayah_from}-${hw.ayah_to}`);
    return { title: `${name}${isAr ? '، ' : ', '}${range}`, note: hw.body, href: quranLink(hw.surah, hw.ayah_from, hw.ayah_to), external: true };
  }
  if (hw.kind === 'review') return { title: hw.body || '', note: null, href: '/student/curriculum', external: false };
  return { title: hw.body || '', note: null, href: null, external: false };
}
