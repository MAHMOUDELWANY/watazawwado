import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Lock, UserCheck, EyeOff } from 'lucide-react';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PageHero } from '../PublicDesignSystem';
import { Card } from '../../ui/Card';
import { AchievementEmblem } from '../../../student/components/achievements/AchievementEmblems';

/**
 * Public page about our community (owner 2026-10-29). The community itself is closed: the Hall of Honor and the class
 * board live inside the accounts of signed-in families and students. This page only describes it, with a labelled
 * example and no learner names. Plan: docs/superpowers/plans/2026-10-29-community-honor.md.
 */

const PARTS = [
  {
    emblem: 'juz' as const,
    en: ['Hall of Honor', 'When a student memorizes a juz or a long surah, or finishes a level or a book, we celebrate it with the whole academy.'],
    ar: ['لوحة الشرف', 'لما طالب يحفظ جزء أو سورة طويلة، أو يخلّص مستوى أو كتاب، بنحتفل بيه مع الأكاديمية كلها.']
  },
  {
    emblem: 'rhythm-12' as const,
    en: ['Class board', 'Learners with the same teacher and of the same age see each other’s effort: lessons this month and weeks in a row. There are no ranks or scores.'],
    ar: ['لوحة الحلقة', 'طلاب نفس المعلم ونفس السن بيشوفوا مجهود بعض: حصص الشهر والأسابيع ورا بعض. مفيش ترتيب ولا درجات.']
  }
] as const;

const PROMISES = [
  {
    icon: Lock,
    en: ['Members only', 'Only families and students of the academy see it, from inside their account. Search engines and visitors see nothing.'],
    ar: ['للأعضاء بس', 'بيشوفه أسر وطلاب الأكاديمية بس، من جوه حساباتهم. محركات البحث والزوار مش بيشوفوا حاجة.']
  },
  {
    icon: UserCheck,
    en: ['The family decides', 'Nothing about a child is shown until a parent agrees. Adult learners decide for themselves. You choose the name, and you can take it down any time.'],
    ar: ['القرار للأسرة', 'مفيش حاجة عن طفل بتظهر قبل ما ولي الأمر يوافق، والطالب الكبير بيقرر لنفسه. أنتم بتختاروا الاسم، وتقدروا تشيلوه في أي وقت.']
  },
  {
    icon: EyeOff,
    en: ['A name and the achievement', 'No photos, countries or ages. Just the name you choose and what was achieved.'],
    ar: ['اسم وإنجاز بس', 'من غير صور ولا بلد ولا سن. الاسم اللي تختاروه والإنجاز بس.']
  }
] as const;

export function CommunityPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const pick = (p: readonly [string, string] | readonly string[]) => p as readonly string[];

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-16">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">
          <PageHero
            title={isEn ? <>Our <span className="text-ribbon">community</span></> : <><span className="text-ribbon">مجتمع</span> وتزودوا</>}
            intro={isEn
              ? 'A closed circle for our families and students, inside your account once you join.'
              : 'دايرة مقفولة لأسرنا وطلابنا، بتلاقيها جوه حسابك أول ما تنضم لنا.'}
          />

          <ul className="grid sm:grid-cols-2 gap-4">
            {PARTS.map((part) => {
              const [title, body] = pick(isEn ? part.en : part.ar);
              return (
                <li key={part.emblem}>
                  <Card className="h-full p-5 sm:p-6 grid gap-3 justify-items-start">
                    <AchievementEmblem id={part.emblem} className="w-14 h-14" />
                    <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{body}</p>
                  </Card>
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="community-example" className="grid gap-3 justify-items-center">
            <h2 id="community-example" className="sr-only">{isEn ? 'What an entry looks like' : 'شكل الإنجاز في اللوحة'}</h2>
            <Card className="w-full max-w-md p-5 flex gap-4 items-start">
              <AchievementEmblem id="juz" className="w-14 h-14 shrink-0" />
              <div className="min-w-0 grid gap-1">
                <span className="justify-self-start inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[#E5A93C]/20 text-[#7A4E09] dark:text-[#F6D58E]">
                  {isEn ? 'EXAMPLE' : 'مثال'}
                </span>
                <p className="font-display text-lg font-bold text-foreground">{isEn ? 'The name the family chooses' : 'الاسم اللي الأسرة تختاره'}</p>
                <p className="text-foreground">{isEn ? 'Memorized Juz ʿAmma' : 'حفظ جزء عمّ'}</p>
              </div>
            </Card>
            <p className="text-xs text-muted-foreground">{isEn ? 'How an entry looks inside the account.' : 'كده بيظهر الإنجاز جوه الحساب.'}</p>
          </section>

          <ul className="grid sm:grid-cols-3 gap-4">
            {PROMISES.map(({ icon: Icon, en, ar }) => {
              const [title, body] = pick(isEn ? en : ar);
              return (
                <li key={title} className="rounded-2xl border border-border bg-surface/70 p-5 grid gap-2">
                  <Icon className="w-5 h-5 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                  <h3 className="font-display font-bold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </li>
              );
            })}
          </ul>

          <div className="grid gap-3 justify-items-center text-center">
            <p className="text-foreground font-display text-lg">{isEn ? 'Families who learn with us find it in their account.' : 'الأسر اللي بتتعلم معانا بتلاقيه في حسابها.'}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/get-started" className="btn-primary-material rounded-xl text-white font-bold shadow-md inline-flex items-center justify-center h-11 px-5 text-sm focus-ring">
                {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
              </Link>
              <Link to="/student?auth=login" className="inline-flex items-center justify-center h-11 px-5 text-sm rounded-xl font-semibold border border-teal-600/40 text-teal-800 dark:text-teal-200 hover:bg-teal-500/10 focus-ring">
                {isEn ? 'I have an account' : 'عندي حساب'}
              </Link>
            </div>
            <Link to="/safety" className="text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground">
              {isEn ? 'How we keep children safe' : 'إزاي بنحافظ على أمان الأطفال'}
            </Link>
          </div>
        </div>
      </PublicSection>
    </main>
  );
}
