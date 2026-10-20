import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PortraitFrame, PublicButton, PageHero } from '../PublicDesignSystem';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';
import { ValueCard, PORTALS } from '../ValueCard';
import { FirstStepEmblem, ShelterEmblem, SameTeacherEmblem, ConversationEmblem } from '../illustrations/ValueEmblems';

type L = { en: string; ar: string };

// The academy speaks as "we"; teachers are introduced as part of it (owner, 2026-10-16).
const TEACHERS: Array<{ src: string; name: L; badge: L; bio: L[]; mirror?: boolean }> = [
  {
    src: '/ustadh-mahmoud.jpg',
    name: { en: 'Ustadh Mahmoud', ar: 'الأستاذ محمود' },
    badge: { en: 'Balanced, moderate teaching', ar: 'علم وسطي معتدل' },
    bio: [
      {
        en: 'Ustadh Mahmoud teaches Quran, Tajweed, Arabic and Islamic studies at Watazawwado. For more than three years he has taught students one-on-one in Canada, the US, the UK and Australia.',
        ar: 'الأستاذ محمود بيدرّس القرآن والتجويد والعربية والعلوم الشرعية في وتزودوا. وبقاله أكتر من ٣ سنين بيدرّس طلاب بشكل فردي في كندا وأمريكا وبريطانيا وأستراليا.'
      },
      {
        en: 'His fluent English helps him explain pronunciation and grammar clearly to students who grew up abroad.',
        ar: 'وإنجليزيته القوية بتساعده يشرح النطق والقواعد بوضوح للطلاب اللي اتربوا برّه.'
      }
    ]
  },
  {
    src: '/ustadha-afnan.jpg',
    name: { en: 'Ustadha Afnan', ar: 'الأستاذة أفنان' },
    badge: { en: 'Wide teaching experience', ar: 'خبرة كبيرة في التدريس' },
    mirror: true,
    bio: [
      {
        en: 'Ustadha Afnan teaches Quran, Tajweed, Arabic, Islamic studies and English at Watazawwado, with wide experience in teaching. Her English (C1) helps her explain clearly to students who grew up abroad.',
        ar: 'الأستاذة أفنان بتدرّس القرآن والتجويد والعربية والعلوم الشرعية والإنجليزية في وتزودوا، وعندها خبرة كبيرة في التدريس. وإنجليزيتها (C1) بتساعدها تشرح بوضوح للطلاب اللي اتربوا برّه.'
      },
      {
        en: 'Families who prefer a female teacher can choose her when they set up their learning profile.',
        ar: 'واللي بيفضّلوا معلّمة يقدروا يختاروها وهم بيعملوا ملفهم التعليمي.'
      }
    ]
  }
];

const PHILOSOPHY: Array<{ emblem: React.ComponentType<{ className?: string }>; title: L; text: L }> = [
  {
    emblem: FirstStepEmblem,
    title: { en: 'We start where you are', ar: 'نبدأ من مستواك الحقيقي' },
    text: {
      en: 'Nobody is behind. Whether you cannot read a letter yet or your memorization has gone rusty, we begin without judgement and build a firm base.',
      ar: 'مفيش حد متأخر. سواء لسه مبتقراش حرف، أو حفظك القديم محتاج مراجعة، بنبدأ من غير أحكام ونبني أساس متين.'
    }
  },
  {
    emblem: ShelterEmblem,
    title: { en: 'A safe place to make mistakes', ar: 'مكان آمن تغلط فيه' },
    text: {
      en: 'Reciting or speaking a new language can feel shy. Lessons are calm and patient, and every correction comes with kindness.',
      ar: 'التلاوة أو الكلام بلغة جديدة ممكن يكسف. الحصص هادية وصبورة، وكل تصحيح بييجي بلطف.'
    }
  },
  {
    emblem: SameTeacherEmblem,
    title: { en: 'One teacher, lesson after lesson', ar: 'نفس المعلم، حصة بعد حصة' },
    text: {
      en: 'You learn with the same teacher, who knows how you learn, where you struggle and how to encourage you.',
      ar: 'بتتعلم مع نفس المعلم، اللي فاهم طريقتك، وعارف بتتعب فين، وإزاي يشجعك.'
    }
  },
  {
    emblem: ConversationEmblem,
    title: { en: 'Close to you, with nobody in between', ar: 'قريبين منك، من غير وسطاء' },
    text: {
      en: 'You are not a ticket number. Ask your teacher in the chat on the site between lessons, or reach us on WhatsApp.',
      ar: 'إنت مش رقم. اسأل معلمك في المحادثة على الموقع بين الحصص، أو كلّمنا على واتساب.'
    }
  }
];

export function AboutPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const t = (l: L) => (isEn ? l.en : l.ar);

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-16">
      <PublicSection>
        <div className="max-w-5xl mx-auto space-y-16 lg:space-y-20">

          <PageHero
            title={isEn ? <>An academy built <span className="text-ribbon">to leave a mark.</span></> : <>أكاديمية اتبنت <span className="text-ribbon">عشان تسيب أثر.</span></>}
            intro={isEn
              ? 'Watazawwado is an online academy for Quran, Tajweed, Islamic studies, Arabic and English. One-on-one lessons, a teacher who knows you by name, and learning that stays with you.'
              : 'وتزودوا أكاديمية أونلاين للقرآن والتجويد والعلوم الشرعية والعربية والإنجليزية. حصص فردية، ومعلم يعرفك باسمك، وعلم يفضل معاك.'}
          />

          {/* Why we exist */}
          <section aria-labelledby="mission-title" className="glass-2 rounded-[var(--r-5)] px-6 py-10 sm:px-12 text-center max-w-3xl mx-auto">
            <h2 id="mission-title" className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
              {isEn ? 'Why we exist' : 'ليه إحنا هنا'}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {isEn
                ? 'Our name comes from a verse: “take provision, and the best provision is God-consciousness.” We want every lesson to be provision that stays with you and your family, long after the screen closes.'
                : 'اسمنا من آية: ﴿وتزودوا فإن خير الزاد التقوى﴾. وعايزين كل حصة تبقى زاد يفضل معاك ومع أهل بيتك، بعد ما الشاشة تتقفل بكتير.'}
            </p>
            <p className="mt-4 text-base text-foreground/85 leading-relaxed">
              {isEn
                ? "We teach Islam the balanced, moderate way, far from any extremism, following Ahl al-Sunnah wal-Jama'ah, with an Azhari foundation in Aqeedah."
                : 'وبنعلّم الدين بوسطية واعتدال، بعيد عن أي تطرف، على منهج أهل السنة والجماعة، وبتأسيس أزهري في العقيدة.'}
            </p>
          </section>

          {/* The teachers */}
          <section aria-labelledby="teachers-title" className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 id="teachers-title" className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
                {isEn ? 'The teachers' : 'المعلمين'}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {isEn
                  ? 'The academy is growing. Every teacher is chosen with care and teaches in the same spirit.'
                  : 'الأكاديمية بتكبر، وكل معلم بيتختار بعناية وبيدرّس بنفس الروح.'}
              </p>
            </div>

            {TEACHERS.map((teacher) => (
              <article key={teacher.src} className="grid md:grid-cols-12 gap-10 md:gap-12 items-center">
                <div className={`md:col-span-5 relative ${teacher.mirror ? 'md:order-2' : ''}`}>
                  <div className="absolute -inset-4 bg-gradient-to-tr from-teal-500/20 via-primary/10 to-terracotta/20 rounded-3xl -z-10 blur-xl" aria-hidden="true" />
                  <PortraitFrame src={teacher.src} alt={t(teacher.name)} className="w-full max-w-sm mx-auto md:mx-0 shadow-xl" />
                  <p className={`absolute -bottom-5 ${teacher.mirror ? 'start-4' : 'end-4'} glass-2 rounded-full px-4 py-2 text-xs font-bold text-[var(--teal)] hidden sm:flex items-center gap-1.5`}>
                    <span className="w-2 h-2 rounded-full bg-[var(--teal)]" aria-hidden="true" />
                    {t(teacher.badge)}
                  </p>
                </div>
                <div className={`md:col-span-7 space-y-4 ${teacher.mirror ? 'md:order-1' : ''}`}>
                  <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-foreground">{t(teacher.name)}</h3>
                  {teacher.bio.map((p) => (
                    <p key={p.en} className="text-muted-foreground leading-relaxed">{t(p)}</p>
                  ))}
                </div>
              </article>
            ))}
          </section>

          {/* How we teach */}
          <section aria-labelledby="philosophy-title" className="space-y-8">
            <h2 id="philosophy-title" className="font-editorial text-3xl sm:text-4xl font-bold text-foreground text-center">
              {isEn ? 'Teaching philosophy' : 'فلسفة التدريس'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PHILOSOPHY.map((item, i) => (
                <ValueCard
                  key={item.title.en}
                  index={i}
                  emblem={item.emblem}
                  portal={PORTALS[(i + 1) % PORTALS.length]}
                  title={t(item.title)}
                  text={t(item.text)}
                />
              ))}
            </div>
          </section>

          <section className="band-deep relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 lg:py-16 text-center">
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold leading-tight">
              {isEn ? 'Come and meet us.' : 'تعالى نتعرّف.'}
            </h2>
            <p className="mt-3 text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-[#FAF7F2]/80">
              {isEn
                ? 'A free 30-minute lesson is the best way to feel how we teach.'
                : 'حصة مجانية ٣٠ دقيقة هي أحسن طريقة تحس بيها بطريقتنا في التدريس.'}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
                {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
              </PublicButton>
              <a
                href={buildWhatsAppUrl(isEn ? 'Assalamu alaikum, I read about Watazawwado and would like to ask about starting lessons.' : 'السلام عليكم، قريت عن وتزودوا وحابب أسأل عن بداية الحصص.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold bg-[#25D366] text-[#07361F] hover:bg-[#20BD5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05363F] focus-visible:ring-[#25D366]"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Talk to us on WhatsApp' : 'كلّمنا على واتساب'}</span>
              </a>
            </div>
            <p className="mt-6 text-sm text-[#FAF7F2]/75 flex flex-wrap justify-center gap-x-5 gap-y-2">
              <Link to="/how-it-works" className="underline hover:text-[#FAF7F2]">{isEn ? 'How it works' : 'كيف نعمل'}</Link>
              <Link to="/learning" className="underline hover:text-[#FAF7F2]">{isEn ? 'The subjects' : 'المواد'}</Link>
              <Link to="/pricing" className="underline hover:text-[#FAF7F2]">{isEn ? 'Prices' : 'الأسعار'}</Link>
            </p>
          </section>

        </div>
      </PublicSection>
    </main>
  );
}
