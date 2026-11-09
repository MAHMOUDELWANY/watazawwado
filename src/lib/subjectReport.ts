/**
 * Owner review 2026-11-09: the after-lesson report speaks the lesson's own subject and the learner's own audience.
 * A Zad or Seerah lesson never gets surahs and tajweed chips, and an adult learner never gets "a summary for the
 * family". Rules for who we talk to: docs/design/ACCOUNT-VOICE.md.
 */

export type SubjectFamily = 'memorization' | 'tajweed' | 'reading' | 'zad' | 'seerah' | 'fusha' | 'egyptian' | 'english' | 'general';

/** Who the report's message goes to: a child's parent, a teen and their family, or the adult learner. */
export type Audience = 'child' | 'teen' | 'adult';

type L = { en: string; ar: string };

export interface SubjectReportProfile {
  family: SubjectFamily;
  /** Slug saved with the note (normalizeSubjectSlug on the server). */
  slug: string;
  name: L;
  /** Curriculum group in src/curriculum/catalog.ts, when the subject has one. */
  curriculumGroup: string | null;
  /** One-tap "what went well today" chips for this subject. */
  skills: L[];
  milestones: Array<{ kind: 'surah_memorized' | 'rule_mastered' | 'level_completed' | 'juz_completed' | 'book_completed' | 'custom'; label: L; title: L }>;
}

export function subjectFamily(raw?: string | null): SubjectFamily {
  const s = (raw || '').toLowerCase();
  if (/memor|hifz|revision|حفظ|مراجعة/.test(s)) return 'memorization';
  if (/tajweed|تجويد/.test(s)) return 'tajweed';
  if (/zad|زاد|aqeedah|fiqh|islamic/.test(s)) return 'zad';
  if (/seerah|sira|سيرة|سيره/.test(s)) return 'seerah';
  if (/fusha|standard-arabic|فصحى|فصحي/.test(s)) return 'fusha';
  if (/egypt|ammiya|عامية|مصري/.test(s)) return 'egyptian';
  if (/english|إنجليزي|انجليزي/.test(s)) return 'english';
  if (/quran-reading|reading|literacy|foundations|قراءة|قرائية/.test(s)) return 'reading';
  return 'general';
}

const P: Record<SubjectFamily, Omit<SubjectReportProfile, 'family'>> = {
  memorization: {
    slug: 'quran-memorization', name: { en: 'Quran memorization', ar: 'حفظ القرآن ومراجعته' }, curriculumGroup: null,
    skills: [
      { en: 'New portion memorized well', ar: 'حفظ الجديد كويس' },
      { en: 'Solid revision of older surahs', ar: 'مراجعة القديم ثابتة' },
      { en: 'Smooth link between ayat', ar: 'ربط الآيات سلس' },
      { en: 'Clear, careful recitation', ar: 'تلاوة واضحة ومتأنية' },
    ],
    milestones: [
      { kind: 'surah_memorized', label: { en: 'Surah memorized', ar: 'ختم حفظ سورة' }, title: { en: 'Memorized a full surah', ar: 'ختم حفظ سورة كاملة' } },
      { kind: 'juz_completed', label: { en: 'Juz completed', ar: 'ختم جزء' }, title: { en: 'Completed a full juz', ar: 'ختم حفظ جزء كامل' } },
      { kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } },
    ],
  },
  tajweed: {
    slug: 'tajweed', name: { en: 'Tajweed', ar: 'التجويد' }, curriculumGroup: 'quran',
    skills: [
      { en: 'Applied the rule in recitation', ar: 'طبّق الحكم في التلاوة' },
      { en: 'Explained the rule in their own words', ar: 'شرح الحكم بكلامه' },
      { en: 'Spotted the rule in the Mushaf', ar: 'طلّع الحكم من المصحف' },
      { en: 'Makharij getting cleaner', ar: 'المخارج بقت أوضح' },
    ],
    milestones: [
      { kind: 'rule_mastered', label: { en: 'Rule mastered', ar: 'أتقن حكم' }, title: { en: 'Mastered a tajweed rule', ar: 'أتقن حكم تجويد' } },
      { kind: 'level_completed', label: { en: 'Level finished', ar: 'خلّص مستوى' }, title: { en: 'Finished a tajweed level', ar: 'خلّص مستوى في التجويد' } },
      { kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } },
    ],
  },
  reading: {
    slug: 'quran-reading', name: { en: 'Quran reading', ar: 'القراءة' }, curriculumGroup: 'quran',
    skills: [
      { en: 'Reads the new letters and marks', ar: 'بيقرا الحروف والحركات الجديدة' },
      { en: 'Joins words more smoothly', ar: 'بيوصل الكلمات بسلاسة أكتر' },
      { en: 'Read from the Mushaf on their own', ar: 'قرا من المصحف لوحده' },
      { en: 'Fewer stops and guesses', ar: 'وقفات وتخمين أقل' },
    ],
    milestones: [
      { kind: 'level_completed', label: { en: 'Level finished', ar: 'خلّص مستوى' }, title: { en: 'Finished a reading level', ar: 'خلّص مستوى في القراءة' } },
      { kind: 'book_completed', label: { en: 'Book finished', ar: 'خلّص كتاب' }, title: { en: 'Finished the reading book', ar: 'خلّص كتاب القراءة' } },
      { kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } },
    ],
  },
  zad: {
    slug: 'zad-essentials', name: { en: 'Zad Essentials', ar: 'أول الزاد' }, curriculumGroup: 'zad-essentials',
    skills: [
      { en: 'Understood the main idea', ar: 'فهم فكرة الدرس' },
      { en: 'Asked thoughtful questions', ar: 'سأل أسئلة عميقة' },
      { en: 'Linked it to their own day', ar: 'ربطه بيومه وحياته' },
      { en: 'Took on the lesson’s promise', ar: 'أخد عهد الدرس على نفسه' },
      { en: 'Explained it back in their own words', ar: 'شرحه تاني بكلامه' },
    ],
    milestones: [
      { kind: 'level_completed', label: { en: 'Part finished', ar: 'خلّص جزء من المسار' }, title: { en: 'Finished a part of Zad Essentials', ar: 'خلّص جزء من أول الزاد' } },
      { kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } },
    ],
  },
  seerah: {
    slug: 'seerah', name: { en: 'Seerah', ar: 'السيرة' }, curriculumGroup: 'seerah',
    skills: [
      { en: 'Told the story back in order', ar: 'حكى القصة بالترتيب' },
      { en: 'Caught the lesson behind the story', ar: 'وصل للعبرة من القصة' },
      { en: 'Linked it to today', ar: 'ربطها بحياتنا النهارده' },
      { en: 'Remembered names and places', ar: 'افتكر الأسماء والأماكن' },
    ],
    milestones: [
      { kind: 'level_completed', label: { en: 'Part finished', ar: 'خلّص جزء من السيرة' }, title: { en: 'Finished a part of the Seerah', ar: 'خلّص جزء من السيرة' } },
      { kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } },
    ],
  },
  fusha: {
    slug: 'modern-standard-arabic', name: { en: 'Fusha Arabic', ar: 'الفصحى' }, curriculumGroup: 'fusha',
    skills: [
      { en: 'Used the new words in sentences', ar: 'استخدم الكلمات الجديدة في جمل' },
      { en: 'Got the new pattern right', ar: 'طبّق القاعدة الجديدة صح' },
      { en: 'Spoke more than before', ar: 'اتكلم أكتر من الأول' },
      { en: 'Understood the story by ear', ar: 'فهم القصة بالسمع' },
    ],
    milestones: [
      { kind: 'level_completed', label: { en: 'Level finished', ar: 'خلّص مستوى' }, title: { en: 'Finished a Fusha level', ar: 'خلّص مستوى في الفصحى' } },
      { kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } },
    ],
  },
  egyptian: {
    slug: 'egyptian-arabic', name: { en: 'Egyptian Arabic', ar: 'العامية المصرية' }, curriculumGroup: 'egyptian',
    skills: [
      { en: 'Said the new phrases naturally', ar: 'قال الجمل الجديدة بطبيعية' },
      { en: 'Sounds more Egyptian', ar: 'النطق بقى مصري أكتر' },
      { en: 'Kept a short chat going', ar: 'كمّل دردشة قصيرة' },
      { en: 'Understood at normal speed', ar: 'فهم بالسرعة العادية' },
    ],
    milestones: [
      { kind: 'level_completed', label: { en: 'Level finished', ar: 'خلّص مستوى' }, title: { en: 'Finished an Egyptian Arabic level', ar: 'خلّص مستوى في المصري' } },
      { kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } },
    ],
  },
  english: {
    slug: 'english', name: { en: 'English', ar: 'الإنجليزي' }, curriculumGroup: 'english',
    skills: [
      { en: 'Read the new sounds and words', ar: 'قرا الأصوات والكلمات الجديدة' },
      { en: 'Spoke in full sentences', ar: 'اتكلم بجمل كاملة' },
      { en: 'Used today’s words', ar: 'استخدم كلمات النهارده' },
      { en: 'More confident speaking', ar: 'ثقته في الكلام زادت' },
    ],
    milestones: [
      { kind: 'level_completed', label: { en: 'Level finished', ar: 'خلّص مستوى' }, title: { en: 'Finished an English level', ar: 'خلّص مستوى في الإنجليزي' } },
      { kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } },
    ],
  },
  general: {
    slug: 'general', name: { en: 'Lesson', ar: 'الحصة' }, curriculumGroup: null,
    skills: [
      { en: 'Focused the whole lesson', ar: 'كان مركز طول الحصة' },
      { en: 'Understood today’s idea', ar: 'فهم فكرة النهارده' },
      { en: 'Asked good questions', ar: 'سأل أسئلة حلوة' },
    ],
    milestones: [{ kind: 'custom', label: { en: 'Something special', ar: 'إنجاز مميز' }, title: { en: 'A special step forward', ar: 'خطوة مميزة لقدام' } }],
  },
};

export function reportProfile(subject?: string | null): SubjectReportProfile {
  const family = subjectFamily(subject);
  return { family, ...P[family] };
}

/** Kids 6–11 talk through the parent, teens 12–17 to themselves with the family reading along, adults 18+ directly. */
export function audienceOf(age?: number | null, learnerType?: string | null): Audience {
  const a = Number(age);
  if (Number.isFinite(a) && a > 0) return a < 12 ? 'child' : a < 18 ? 'teen' : 'adult';
  return learnerType === 'child' ? 'child' : 'adult';
}

/** What the teacher's message is called, and who reads it. */
export function messageLabel(audience: Audience, name: string): { title: L; hint: L } {
  if (audience === 'child') return {
    title: { en: `A note to ${name}'s parent`, ar: `رسالة لولي أمر ${name}` },
    hint: { en: 'The parent reads this on their account.', ar: 'ولي الأمر بيقراها في حسابه.' },
  };
  if (audience === 'teen') return {
    title: { en: `A note to ${name}`, ar: `رسالة لـ${name}` },
    hint: { en: 'Written to the student; their family can read it too.', ar: 'مكتوبة للطالب، وأسرته بتشوفها كمان.' },
  };
  return {
    title: { en: `A note to ${name}`, ar: `رسالة لـ${name}` },
    hint: { en: 'Only the student reads this.', ar: 'الطالب بس اللي بيقراها.' },
  };
}

/** One-tap openings for the message, per subject and audience. {name} is the learner's first name. */
export function messageStarters(family: SubjectFamily, audience: Audience, name: string): Array<{ chip: L; text: L }> {
  const you = audience === 'adult' || audience === 'teen';
  const praise = you
    ? { chip: { en: '+ Warm praise', ar: '+ تشجيع' }, text: { en: `Masha'Allah ${name}, a focused lesson today. Keep this going.`, ar: `ما شاء الله يا ${name}، حصة النهارده كانت مركزة. كمّل كده.` } }
    : { chip: { en: '+ Warm praise', ar: '+ تشجيع' }, text: { en: `Masha'Allah, ${name} was focused and engaged today.`, ar: `ما شاء الله، ${name} كان مركز ومتفاعل النهارده.` } };
  const bySubject: Partial<Record<SubjectFamily, Array<{ chip: L; text: L }>>> = {
    zad: [{ chip: { en: '+ Today’s idea', ar: '+ فكرة النهارده' }, text: you
      ? { en: 'Hold on to today’s idea this week and try the lesson’s promise once a day.', ar: 'خلّي فكرة الدرس معاك الأسبوع ده، وجرّب عهد الدرس مرة كل يوم.' }
      : { en: `Ask ${name} at dinner what today’s lesson was about; let them explain it to you.`, ar: `اسأل ${name} على العشا الدرس كان عن إيه، وسيبه يشرحهولك.` } }],
    seerah: [{ chip: { en: '+ Retell the story', ar: '+ احكوا القصة' }, text: you
      ? { en: 'Try telling today’s story to someone at home; it sticks better when you tell it.', ar: 'احكي قصة النهارده لحد في البيت، القصة بتثبت لما تحكيها.' }
      : { en: `Let ${name} tell you today’s story before bed.`, ar: `خلّي ${name} يحكيلك قصة النهارده قبل النوم.` } }],
    memorization: [{ chip: { en: '+ Daily revision', ar: '+ مراجعة يومية' }, text: you
      ? { en: 'Five minutes of revision every day keeps the new part firm.', ar: 'خمس دقايق مراجعة كل يوم بتثبّت الجديد.' }
      : { en: `Please listen to ${name} recite the new part once a day.`, ar: `ياريت تسمعوا من ${name} الجزء الجديد مرة كل يوم.` } }],
    tajweed: [{ chip: { en: '+ Apply the rule', ar: '+ طبّق الحكم' }, text: you
      ? { en: 'Listen for today’s rule whenever you recite this week.', ar: 'خلّي ودنك على حكم النهارده في أي تلاوة الأسبوع ده.' }
      : { en: `Ask ${name} to show you today’s rule in the Mushaf.`, ar: `اطلبوا من ${name} يوريكم حكم النهارده في المصحف.` } }],
    reading: [{ chip: { en: '+ Read a little daily', ar: '+ قراءة يومية' }, text: you
      ? { en: 'A few minutes of reading aloud every day makes the biggest difference.', ar: 'كام دقيقة قراءة بصوت عالي كل يوم بتفرق جدًا.' }
      : { en: `Let ${name} read to you for a few minutes every day.`, ar: `خلّوا ${name} يقرالكم كام دقيقة كل يوم.` } }],
    fusha: [{ chip: { en: '+ Use the words', ar: '+ استخدم الكلمات' }, text: { en: 'Use today’s new words at home this week.', ar: 'استخدموا كلمات النهارده في البيت الأسبوع ده.' } }],
    egyptian: [{ chip: { en: '+ Say it out loud', ar: '+ قولها بصوت عالي' }, text: { en: 'Say today’s phrases out loud a few times this week.', ar: 'قول جمل النهارده بصوت عالي كام مرة الأسبوع ده.' } }],
    english: [{ chip: { en: '+ Practise speaking', ar: '+ اتكلم إنجليزي' }, text: { en: 'Practise today’s words out loud a little every day.', ar: 'اتمرن على كلمات النهارده بصوت عالي شوية كل يوم.' } }],
  };
  return [praise, ...(bySubject[family] || [])];
}
