import React from 'react';
import { GraduationCap, Award, Clock, Languages, Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { tagLabel } from '../../lib/teacherBadges';

export interface TeacherProfileData {
  id: string;
  nameAr: string;
  nameEn: string;
  gender?: 'male' | 'female';
  photo?: string | null;
  bio?: string | null;
  about?: string | null;
  badges?: string[];
  profile?: { studies?: string | null; credentials?: string[]; experienceYears?: number | null; languages?: string[] } | null;
}

/**
 * "About this teacher" (owner review 2026-11-10): everything a family needs before choosing, in a popup so they never
 * leave the onboarding journey. The teacher writes it in Settings; empty parts are simply left out.
 */
export function TeacherProfileModal({ teacher, isOpen, onClose, onChoose, selected, isAr }: {
  teacher: TeacherProfileData | null;
  isOpen: boolean;
  onClose: () => void;
  onChoose?: () => void;
  selected?: boolean;
  isAr: boolean;
}) {
  if (!teacher) return null;
  const name = isAr ? teacher.nameAr : teacher.nameEn;
  const p = teacher.profile || {};
  const about = (teacher.about || teacher.bio || '').trim();
  const years = typeof p.experienceYears === 'number' ? p.experienceYears : null;
  const rows: Array<{ Icon: typeof GraduationCap; label: string; body: React.ReactNode }> = [];
  if (p.studies) rows.push({ Icon: GraduationCap, label: isAr ? 'الدراسة' : 'Studies', body: p.studies });
  if (p.credentials?.length) {
    rows.push({
      Icon: Award,
      label: isAr ? 'الشهادات والإجازات' : 'Certificates and ijazahs',
      body: <ul className="list-disc ps-5 space-y-0.5">{p.credentials.map((c) => <li key={c}>{c}</li>)}</ul>
    });
  }
  if (years !== null) {
    rows.push({
      Icon: Clock,
      label: isAr ? 'الخبرة' : 'Experience',
      body: years === 0 ? (isAr ? 'أقل من سنة' : 'Less than a year') : isAr ? `${years} ${years <= 10 && years > 2 ? 'سنين' : 'سنة'} في التدريس` : `${years} year${years === 1 ? '' : 's'} of teaching`
    });
  }
  if (p.languages?.length) rows.push({ Icon: Languages, label: isAr ? 'بيشرح بـ' : 'Explains in', body: p.languages.join(isAr ? '، ' : ', ') });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      layerClassName="z-[60]"
      title={isAr ? `تعرّف على ${name}` : `Meet ${name}`}
      footer={onChoose ? (
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end w-full">
          <Button variant="ghost" onClick={onClose}>{isAr ? 'رجوع' : 'Back'}</Button>
          <Button onClick={() => { onChoose(); onClose(); }} disabled={selected}>
            {selected ? (isAr ? 'ده معلمك المختار' : 'Your chosen teacher') : (isAr ? 'اختار المعلم ده' : 'Choose this teacher')}
          </Button>
        </div>
      ) : undefined}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          {teacher.photo
            ? <img src={teacher.photo} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0" />
            : <span className="w-20 h-20 rounded-2xl grid place-items-center shrink-0 bg-primary/10 text-primary font-display text-3xl font-bold" aria-hidden="true">{name.trim().split(/\s+/).pop()?.[0] || '؟'}</span>}
          <div className="min-w-0">
            <p className="font-display text-xl font-bold text-foreground">{name}</p>
            {teacher.badges && teacher.badges.length > 0 && (
              <span className="flex flex-wrap gap-1 mt-1.5" aria-label={isAr ? 'رأي الأسر' : 'What families say'}>
                {teacher.badges.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gold/15 text-foreground">
                    <Star className="w-3 h-3 fill-gold text-gold" aria-hidden="true" />{tagLabel(b, isAr)}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {about && <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{about}</p>}

        {rows.length > 0 && (
          <dl className="space-y-3">
            {rows.map(({ Icon, label, body }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <Icon className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 text-sm">
                  <dt className="font-semibold text-foreground">{label}</dt>
                  <dd className="text-muted-foreground mt-0.5">{body}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}

        {!about && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {isAr ? 'بنجهز نبذة كاملة عن المعلم. ولو عندك أي سؤال عنه، فريقنا هيرد عليك من «الرسائل».' : "We're preparing this teacher's full introduction. Any question about them, our team will answer under Messages."}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {isAr ? 'تقدر تغيّر المعلم بعدين من حسابك في أي وقت، وفريقنا بيرتب النقل.' : 'You can ask to change teacher later from your account; our team arranges the move.'}
        </p>
      </div>
    </Modal>
  );
}
