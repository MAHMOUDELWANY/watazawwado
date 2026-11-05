import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, Wallet, BookOpen, Video, ShieldCheck, Mic, Languages, Wifi, HeartHandshake, Mail } from 'lucide-react';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PageHero } from '../PublicDesignSystem';
import { Card } from '../../ui/Card';

// "What you get" restates the teacher agreement (src/pages/StaffAgreementPage.tsx); change it there first.
const OFFER = [
  {
    icon: Clock,
    en: ['Your own hours', 'You open the weekly hours you can really teach, and families book from them.'],
    ar: ['مواعيدك أنت', 'تفتح الساعات التي تستطيع التدريس فيها فعلًا كل أسبوع، وتحجز منها الأسر.'],
  },
  {
    icon: Wallet,
    en: ['A fixed hourly rate, every month', 'Agreed in writing, in your own currency, sent between the 1st and the 5th of the next month with a payslip.'],
    ar: ['أجر ثابت للساعة، كل شهر', 'متفق عليه كتابةً وبعملتك، ويصلك بين اليوم 1 و5 من الشهر التالي مع إيصال.'],
  },
  {
    icon: BookOpen,
    en: ['A curriculum ready for you', 'Our own lessons for the Zad Path, Quran and the languages, so you spend your time teaching.'],
    ar: ['منهج جاهز', 'دروسنا في مسار الأثر والقرآن واللغات جاهزة، فوقتك يروح في التدريس.'],
  },
  {
    icon: Video,
    en: ['One dashboard for everything', 'Your lessons, Zoom links, notes, homework and your month so far, in one place.'],
    ar: ['لوحة واحدة لكل شيء', 'حصصك وروابط Zoom والملاحظات والواجبات وحساب شهرك، كلها في مكان واحد.'],
  },
] as const;

// Owner may change these; they are the standard we hire for, not a promise to families.
const LOOKING_FOR = [
  {
    icon: Mic,
    en: ['Strong in what you teach', 'Correct recitation and Tajweed for Quran teachers; an ijazah is a plus. Clear, correct Arabic or English for language teachers.'],
    ar: ['متمكّن من مادتك', 'تلاوة وتجويد صحيحين لمعلم القرآن، والإجازة ميزة إضافية. وعربي أو إنجليزي واضح وسليم لمعلم اللغة.'],
  },
  {
    icon: Languages,
    en: ['At ease with families in the West', 'Enough English to explain to a child born abroad, and to talk to their parents.'],
    ar: ['مرتاح مع الأسر في الغرب', 'إنجليزية كافية لتشرح لطفل وُلد في الخارج، وتتحدث مع أهله.'],
  },
  {
    icon: HeartHandshake,
    en: ['Patient, one-on-one', 'Experience teaching children or adults on their own, with a calm, balanced and moderate manner.'],
    ar: ['صبور في التعليم الفردي', 'خبرة في تعليم الأطفال أو الكبار فردي، بأسلوب هادي ومتوازن ومعتدل.'],
  },
  {
    icon: Wifi,
    en: ['A quiet place to teach', 'A stable internet connection, a camera and a headset, and a quiet room.'],
    ar: ['مكان هادئ للتدريس', 'إنترنت ثابت، وكاميرا وسماعة، وغرفة هادئة.'],
  },
  {
    icon: Clock,
    en: ['On time, every time', 'You start each lesson on time and write a short note after it.'],
    ar: ['في الميعاد دايمًا', 'بتبدأ كل حصة في ميعادها، وبتكتب ملاحظة قصيرة بعدها.'],
  },
  {
    icon: ShieldCheck,
    en: ['Safe with children', 'You follow our child-safety rules: no recording, and talk stays on our platform.'],
    ar: ['أمين مع الأطفال', 'تلتزم بقواعد أمان الأطفال عندنا: لا تسجيل، والحديث كله على منصتنا.'],
  },
] as const;

const STEPS = [
  {
    en: ['Write to us', 'Your CV, what you teach, a short recording of your recitation or of you explaining a lesson, and the hours you could teach.'],
    ar: ['أرسل إلينا', 'السيرة الذاتية، والمواد التي تدرّسها، وتسجيلًا قصيرًا لتلاوتك أو لك وأنت تشرح درسًا، والساعات التي تستطيع التدريس فيها.'],
  },
  {
    en: ['A short interview', 'A video call with our team to get to know you and how you teach.'],
    ar: ['مقابلة قصيرة', 'مكالمة فيديو مع فريقنا نتعرّف فيها عليك وعلى طريقتك في التدريس.'],
  },
  {
    en: ['A sample lesson', 'You teach a short lesson to one of our team, as you would to a student.'],
    ar: ['حصة تجريبية', 'بتدرّس حصة قصيرة لحد من فريقنا، زي ما هتدرّس لطالب.'],
  },
  {
    en: ['Welcome to the team', 'We agree your rate in writing, open your dashboard, and you set your hours.'],
    ar: ['أهلًا بيك في الفريق', 'بنتفق على أجرك كتابةً، ونفتحلك لوحتك، وإنت تحدد ساعاتك.'],
  },
] as const;

const HR = 'hr@watazawwado.academy';

export function CareersPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const mail = `mailto:${HR}?subject=${encodeURIComponent(isEn ? 'Teaching at Watazawwado' : 'التدريس في وتزودوا')}`;

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-16">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-14">
          <PageHero
            title={isEn ? <>Teach <span className="text-ribbon">with us</span></> : <>درّس <span className="text-ribbon">معانا</span></>}
            intro={isEn
              ? 'We are a team of male and female teachers giving one-on-one lessons to Muslim families in the West: Quran, the Zad Path, Arabic and English. If teaching one student well matters to you, we would like to meet you.'
              : 'نحن فريق من المعلمين والمعلمات نقدّم حصصًا فردية لأسر مسلمة في الغرب: القرآن، ومسار الأثر، والعربية، والإنجليزية. إن كان يهمّك أن تعلّم طالبًا واحدًا كما ينبغي، يسعدنا أن نتعرّف عليك.'}
          />

          <section aria-labelledby="careers-offer" className="space-y-5">
            <h2 id="careers-offer" className="editorial-heading font-editorial text-2xl sm:text-3xl text-foreground">
              {isEn ? 'What you get' : 'ماذا تجد معنا'}
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {OFFER.map(({ icon: Icon, en, ar }) => (
                <li key={en[0]}>
                  <Card className="h-full p-5 space-y-2">
                    <span className="w-9 h-9 rounded-xl bg-[#087D91]/10 flex items-center justify-center text-[#087D91] dark:text-[#12A4BC]">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-bold text-foreground">{isEn ? en[0] : ar[0]}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{isEn ? en[1] : ar[1]}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="careers-who" className="space-y-5">
            <h2 id="careers-who" className="editorial-heading font-editorial text-2xl sm:text-3xl text-foreground">
              {isEn ? 'Who we are looking for' : 'المعلم الذي نبحث عنه'}
            </h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              {LOOKING_FOR.map(({ icon: Icon, en, ar }) => (
                <li key={en[0]} className="flex gap-3">
                  <Icon className="w-5 h-5 mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
                  <div>
                    <h3 className="font-bold text-foreground">{isEn ? en[0] : ar[0]}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{isEn ? en[1] : ar[1]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="careers-steps" className="space-y-5">
            <h2 id="careers-steps" className="editorial-heading font-editorial text-2xl sm:text-3xl text-foreground">
              {isEn ? 'How joining works' : 'خطوات الانضمام'}
            </h2>
            <ol className="relative grid gap-6 md:grid-cols-4 md:gap-4">
              {STEPS.map(({ en, ar }, i) => (
                <li key={en[0]} className="relative flex gap-4 md:block">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold tabular-nums">
                    {i + 1}
                  </span>
                  <div className="md:mt-3">
                    <h3 className="font-bold text-foreground">{isEn ? en[0] : ar[0]}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{isEn ? en[1] : ar[1]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="band-espresso relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-12 text-center">
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold">{isEn ? 'Ready to start?' : 'جاهز تبدأ؟'}</h2>
            <p className="mt-3 text-[#FAF7F2]/80 leading-relaxed max-w-lg mx-auto">
              {isEn ? 'Send your application to our hiring team. We read every message.' : 'ابعت طلبك لفريق التوظيف عندنا. وبنقرا كل رسالة.'}
            </p>
            <a href={mail} className="liquid-cta mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span dir="ltr">{HR}</span>
            </a>
          </div>
        </div>
      </PublicSection>
    </main>
  );
}
