import React, { useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, MarginNote } from '../PublicDesignSystem';
import { FileText, CalendarClock, RotateCcw, Wallet } from 'lucide-react';

// Keep in sync with TERMS_VERSION in api/index.ts: bookings store the version the student accepted.
const TERMS_VERSION_LABEL = { en: 'Version 2026-10-15 · Last updated 15 October 2026', ar: 'إصدار 2026-10-15 · آخر تحديث 15 أكتوبر 2026' };

type Section = { id: string; en: { title: string; items: string[] }; ar: { title: string; items: string[] } };

// RULES.md §2–§5 are the source of every rule below. Change them together.
const SECTIONS: Section[] = [
  {
    id: 'agreement',
    en: { title: 'Agreement', items: [
      'Watazawwado is an online platform for private 1-on-1 lessons in Quran, Tajweed, Islamic studies, Arabic and English. By creating an account, booking a lesson or buying a package, you agree to these terms.',
      'Before every booking or package purchase you confirm that you have read and accepted these terms. We keep a record of the version you accepted and when.',
      'If you book for a child, you are responsible for the booking, the payment and the child’s use of the platform.',
    ] },
    ar: { title: 'الموافقة على الشروط', items: [
      'منصة وتزودوا منصة إلكترونية لدروس فردية خاصة في القرآن والتجويد والعلوم الشرعية واللغة العربية والإنجليزية. بإنشاء حساب أو حجز درس أو شراء باقة، فأنت توافق على هذه الشروط.',
      'قبل كل حجز أو شراء باقة تؤكد أنك قرأت هذه الشروط ووافقت عليها، ونحتفظ بسجل لإصدار الشروط الذي وافقت عليه وتاريخ الموافقة.',
      'إذا حجزت لطفل، فأنت المسؤول عن الحجز والدفع واستخدام الطفل للمنصة.',
    ] },
  },
  {
    id: 'accounts',
    en: { title: 'Accounts', items: [
      'Every booking, including the free trial, needs a signed-in account. Please give accurate details and keep your password private.',
      'We may suspend an account that is used to abuse free trials, to disrespect a teacher, or for payments that are reversed after a lesson was delivered.',
    ] },
    ar: { title: 'الحسابات', items: [
      'كل حجز، بما فيه الدرس التجريبي المجاني، يحتاج حساباً مسجلاً. يرجى إدخال بيانات صحيحة والحفاظ على سرية كلمة المرور.',
      'يحق لنا إيقاف الحساب المستخدم في إساءة استخدام الدروس التجريبية، أو الإساءة لمعلم، أو في مدفوعات يتم استرجاعها بعد تقديم الدرس.',
    ] },
  },
  {
    id: 'lessons',
    en: { title: 'Lessons and teachers', items: [
      'Lessons are live and online (usually on Zoom). The joining link is sent after the booking is confirmed.',
      'Each student has an assigned teacher. Parents can ask to change the teacher at any time; the change applies to new bookings.',
      'Lessons start and end on time. If the student joins late, the lesson still ends at its scheduled time.',
    ] },
    ar: { title: 'الدروس والمعلمون', items: [
      'الدروس مباشرة عبر الإنترنت (غالباً على Zoom)، ويصلك رابط الدخول بعد تأكيد الحجز.',
      'لكل طالب معلم مخصص، ويمكن لولي الأمر طلب تغيير المعلم في أي وقت، ويطبق التغيير على الحجوزات الجديدة.',
      'تبدأ الدروس وتنتهي في موعدها. إذا تأخر الطالب، ينتهي الدرس في موعده المحدد.',
    ] },
  },
  {
    id: 'prices',
    en: { title: 'Prices and payment', items: [
      'Standard prices per 60 minutes: $9 for Quran, Tajweed and Islamic studies, and from $13 for Arabic and English. Shorter lessons cost the same rate per minute (for example 30 minutes = half the hourly price).',
      'Advanced, specialized or intensive learning may cost more. That price is set by the teacher after an assessment and is always shown to you before you pay.',
      'Lessons are paid in advance. A booking is confirmed only after the payment succeeds. While you pay, the time is held for about 35 minutes; if payment is not completed, the time is released.',
      'Payments are processed by trusted providers (such as Stripe and PayPal). We never see or store your card details.',
      '“Pay later” is a courtesy offered only to regular students with at least 12 paid lessons, and each request needs our approval.',
    ] },
    ar: { title: 'الأسعار والدفع', items: [
      'الأسعار الأساسية لكل 60 دقيقة: 9 دولار للقرآن والتجويد والعلوم الشرعية، ومن 13 دولار للغة العربية والإنجليزية. الحصص الأقصر بنفس السعر للدقيقة (مثلاً 30 دقيقة = نصف سعر الساعة).',
      'التعليم المتقدم أو المتخصص أو المكثف قد يكون سعره أعلى، ويحدده المعلم بعد تقييم الطالب، ويظهر لك دائماً قبل الدفع.',
      'الدفع مقدماً، ولا يتأكد الحجز إلا بعد نجاح الدفع. أثناء الدفع نحجز لك الموعد حوالي 35 دقيقة، وإذا لم يكتمل الدفع يُتاح الموعد لغيرك.',
      'تتم المدفوعات عبر جهات موثوقة (مثل Stripe وPayPal)، ولا نرى بيانات بطاقتك ولا نخزنها.',
      'خيار "ادفع لاحقاً" ميزة نقدمها فقط للطلاب المنتظمين الذين دفعوا 12 درساً على الأقل، وكل طلب يحتاج موافقتنا.',
    ] },
  },
  {
    id: 'trial',
    en: { title: 'Free trial', items: [
      'Each new student gets one free trial lesson (30 minutes by default, up to 45 minutes).',
      'A free trial can be rescheduled once, up to 1 hour before it starts, and cancelled up to 1 hour before it starts.',
      'If a trial is cancelled or missed, a new one can be booked after 48 hours. After 5 cancelled or missed trials, the account can no longer book free trials (paid lessons stay open).',
    ] },
    ar: { title: 'الدرس التجريبي المجاني', items: [
      'لكل طالب جديد درس تجريبي مجاني واحد (30 دقيقة عادة، وبحد أقصى 45 دقيقة).',
      'يمكن تغيير موعد الدرس التجريبي مرة واحدة حتى ساعة قبل بدايته، ويمكن إلغاؤه حتى ساعة قبل بدايته.',
      'إذا أُلغي الدرس التجريبي أو لم يحضر الطالب، يمكن حجز درس جديد بعد 48 ساعة. بعد 5 دروس تجريبية ملغاة أو غير محضورة، لا يمكن للحساب حجز دروس تجريبية مجانية (مع بقاء الدروس المدفوعة متاحة).',
    ] },
  },
  {
    id: 'packages',
    en: { title: 'Packages and family care', items: [
      'Packages are prepaid lessons at a lower price per lesson. They are not a subscription and nothing renews automatically.',
      'A package is for one subject group ($9 group or $13 group) and one lesson length (30, 45 or 60 minutes). Its lessons can be booked any time.',
      'A package credit is used when a lesson is completed (or missed without cancelling in time), not when it is booked.',
      'Family care: a package for a second (or third…) child on the same account gets an extra 5% off.',
      'Unused package lessons are not refunded automatically. If your situation changes, contact us and the platform owner will review it fairly, case by case.',
    ] },
    ar: { title: 'الباقات ورعاية الأسرة', items: [
      'الباقات دروس مدفوعة مقدماً بسعر أقل للدرس، وليست اشتراكاً، ولا يتجدد أي شيء تلقائياً.',
      'كل باقة لمجموعة مواد واحدة (مجموعة 9 دولار أو مجموعة 13 دولار) ولمدة حصة واحدة (30 أو 45 أو 60 دقيقة)، ويمكن حجز دروسها في أي وقت.',
      'يُخصم رصيد الباقة عند إتمام الدرس (أو عند عدم الحضور بدون إلغاء في الوقت المسموح)، وليس عند الحجز.',
      'رعاية الأسرة: الباقة للطفل الثاني (أو الثالث…) في نفس الحساب عليها خصم إضافي 5%.',
      'لا تُسترد دروس الباقة غير المستخدمة تلقائياً. إذا تغيرت ظروفك، تواصل معنا وسيراجع صاحب المنصة طلبك بعدل حسب كل حالة.',
    ] },
  },
  {
    id: 'cancellation',
    en: { title: 'Cancelling and rescheduling', items: [
      'Cancel up to 3 hours before the lesson: a paid lesson comes back to you as a lesson credit you can book any time; a package lesson keeps its credit.',
      'Reschedule up to 1 hour before the lesson, by yourself, from your student account.',
      'Inside the last hour before the lesson nothing can be changed. A lesson that is missed, or not changed in time, counts as taken and is not refunded or credited.',
      'Real emergencies: message us on WhatsApp. The platform owner may, as a goodwill gesture and at their sole discretion, move the lesson. This is not a right and does not change the rules above.',
      'If we cancel, the teacher misses the lesson, or a technical problem on our side stops it, you choose: a free new time, a lesson credit, or a refund. This never counts toward the refund limit below.',
    ] },
    ar: { title: 'الإلغاء وتغيير الموعد', items: [
      'الإلغاء حتى 3 ساعات قبل الدرس: الدرس المدفوع يعود لك كرصيد حصة تحجزه في أي وقت، ودرس الباقة يحتفظ برصيده.',
      'تغيير الموعد حتى ساعة قبل الدرس، بنفسك من حساب الطالب.',
      'خلال الساعة الأخيرة قبل الدرس لا يمكن تغيير أي شيء. الدرس الذي لم تحضره أو لم تغيّره في الوقت المسموح يُحتسب كدرس تم، ولا يُسترد ولا يعود كرصيد.',
      'الظروف الطارئة فعلاً: تواصل معنا عبر واتساب. يجوز لصاحب المنصة، كمراعاة وحسب تقديره وحده، تغيير موعد الدرس. هذا ليس حقاً مكتسباً ولا يغير القواعد السابقة.',
      'إذا ألغينا نحن، أو غاب المعلم، أو منعت مشكلة تقنية من جهتنا الدرس، تختار أنت: موعداً جديداً مجاناً، أو رصيد حصة، أو استرداد المبلغ، ولا يُحتسب ذلك أبداً من حد الاسترداد التالي.',
    ] },
  },
  {
    id: 'refunds',
    en: { title: 'Refunds', items: [
      'Instead of keeping a lesson credit from a lesson you cancelled in time, you can ask for your money back with the “I prefer a refund” button on the Packages page. It opens WhatsApp with a ready message.',
      'Refunds are limited to 3 lessons per account. After that, cancelled lessons still come back as lesson credits, but they are not refundable.',
      'We send the refund within 14 days of your request. Please send us the account or payment method where you want to receive it; we can’t send it before we have it.',
      'A refund is for the amount you paid for that lesson. Your bank or payment provider may charge its own fees.',
      'Lessons that were taken, missed, or cancelled too late are not refundable.',
      'Nothing in these terms limits any rights you have under the consumer laws that apply to you.',
    ] },
    ar: { title: 'الاسترداد', items: [
      'بدلاً من الاحتفاظ برصيد حصة ألغيتها في الوقت المسموح، يمكنك طلب استرداد المبلغ من زر "عايز استرداد بدل الرصيد" في صفحة الباقات، فيفتح لك واتساب برسالة جاهزة.',
      'الاسترداد محدود بـ 3 دروس لكل حساب. بعد ذلك تعود الدروس الملغاة كرصيد حصة، لكنها غير قابلة للاسترداد.',
      'نرسل المبلغ خلال 14 يوماً من طلبك. يرجى إرسال الحساب أو وسيلة الدفع التي تريد الاستلام عليها، ولا نستطيع الإرسال قبل وصولها.',
      'المبلغ المسترد هو ما دفعته لهذا الدرس، وقد يخصم البنك أو مزود الدفع رسومه الخاصة.',
      'الدروس التي تمت أو لم تحضرها أو أُلغيت متأخراً غير قابلة للاسترداد.',
      'لا يوجد في هذه الشروط ما يقيّد أي حقوق تمنحها لك قوانين حماية المستهلك المطبقة عليك.',
    ] },
  },
  {
    id: 'conduct',
    en: { title: 'Respect and safety', items: [
      'Teachers and students treat each other with respect. A teacher may end a lesson if a student is abusive; that lesson counts as taken.',
      'Learning results depend on practice and commitment, so we can’t guarantee a specific result in a specific time.',
      'Our responsibility for any lesson is limited to the amount paid for that lesson, except where the law does not allow this limit.',
    ] },
    ar: { title: 'الاحترام والأمان', items: [
      'يتعامل المعلمون والطلاب باحترام متبادل، ويحق للمعلم إنهاء الدرس عند الإساءة، ويُحتسب الدرس كدرس تم.',
      'نتائج التعلم تعتمد على الممارسة والالتزام، لذلك لا نضمن نتيجة محددة في مدة محددة.',
      'مسؤوليتنا عن أي درس محدودة بالمبلغ المدفوع لهذا الدرس، إلا إذا كان القانون لا يسمح بهذا الحد.',
    ] },
  },
  {
    id: 'law',
    en: { title: 'Disputes and governing law', items: [
      'If something goes wrong, please contact us first; we will always try to find a fair solution quickly.',
      'These terms are governed by the laws of Poland, and the courts of Poland have jurisdiction.',
      'If you are a consumer, you keep the protection of the mandatory laws of the country where you live, and you may also bring a claim before the courts there. EU residents can also use the European Online Dispute Resolution platform.',
    ] },
    ar: { title: 'النزاعات والقانون المطبّق', items: [
      'لو حصلت أي مشكلة، تواصل معنا الأول؛ دايماً هنحاول نوصل لحل عادل بسرعة.',
      'تخضع هذه الشروط لقوانين جمهورية بولندا، وتختص محاكم بولندا بنظر أي نزاع.',
      'إذا كنت مستهلكاً، تظل محتفظاً بالحماية التي تمنحها لك القوانين الإلزامية في بلد إقامتك، ويحق لك أيضاً رفع دعواك أمام محاكمه. ويمكن لسكان الاتحاد الأوروبي كذلك استخدام منصة الاتحاد الأوروبي لتسوية النزاعات عبر الإنترنت.',
    ] },
  },
  {
    id: 'changes',
    en: { title: 'Changes to these terms', items: [
      'We may update these terms. The version and date are shown at the top. A booking or package follows the version you accepted when you made it.',
      'For important changes we will tell you on the website or by email before they apply to new bookings.',
    ] },
    ar: { title: 'تعديل الشروط', items: [
      'قد نحدّث هذه الشروط، ويظهر رقم الإصدار والتاريخ أعلى الصفحة. كل حجز أو باقة يخضع للإصدار الذي وافقت عليه وقت الحجز أو الشراء.',
      'في التغييرات المهمة سنخبرك على الموقع أو بالبريد الإلكتروني قبل تطبيقها على الحجوزات الجديدة.',
    ] },
  },
];

export function TermsPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  // Links like /terms#refunds (from WhatsApp messages and the booking flow) open at that section.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  const glance = [
    { icon: RotateCcw, en: ['Cancel up to 3 hours before', 'Your paid lesson comes back as a lesson credit.'], ar: ['الإلغاء حتى 3 ساعات قبل الدرس', 'الدرس المدفوع يرجع لك كرصيد حصة.'] },
    { icon: CalendarClock, en: ['Move up to 1 hour before', 'Change the time yourself from your account.'], ar: ['تغيير الموعد حتى ساعة قبل الدرس', 'غيّر الموعد بنفسك من حسابك.'] },
    { icon: Wallet, en: ['Refund within 14 days', 'For up to 3 cancelled lessons per account.'], ar: ['استرداد خلال 14 يوماً', 'لحد 3 دروس ملغاة لكل حساب.'] },
  ];

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <MarginNote className="mx-auto flex items-center justify-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isEn ? 'Terms & Conditions' : 'الشروط والأحكام'}</span>
            </MarginNote>
            <h1 className="font-editorial text-4xl sm:text-5xl text-foreground font-bold">
              {isEn ? 'Terms of Service' : 'شروط الخدمة والاستخدام'}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? 'Clear, fair rules for bookings, payments, cancellations and refunds, so you always know where you stand.'
                : 'قواعد واضحة وعادلة للحجز والدفع والإلغاء والاسترداد، علشان تكون دايماً عارف حقوقك.'}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold">
              {isEn ? TERMS_VERSION_LABEL.en : TERMS_VERSION_LABEL.ar}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {glance.map(({ icon: Icon, en, ar }) => (
              <div key={en[0]} className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-foreground text-sm">{isEn ? en[0] : ar[0]}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{isEn ? en[1] : ar[1]}</p>
              </div>
            ))}
          </div>

          <div className="space-y-10 text-foreground leading-relaxed">
            {SECTIONS.map((section, i) => {
              const content = isEn ? section.en : section.ar;
              return (
                <section key={section.id} id={section.id} className="space-y-4 scroll-mt-28">
                  <EditorialHeading eyebrow={isEn ? `Section ${i + 1}` : `القسم ${i + 1}`} noAccent>
                    {`${i + 1}. ${content.title}`}
                  </EditorialHeading>
                  <ul className="list-disc ps-6 space-y-2 text-sm sm:text-base text-muted-foreground">
                    {content.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              );
            })}

            <section id="contact" className="space-y-4 scroll-mt-28">
              <EditorialHeading eyebrow={isEn ? 'Contact' : 'التواصل'} noAccent>
                {isEn ? `${SECTIONS.length + 1}. Contact us` : `${SECTIONS.length + 1}. تواصل معنا`}
              </EditorialHeading>
              <div className="glass-card p-6 rounded-2xl border border-border/80 text-sm sm:text-base space-y-2 text-muted-foreground">
                <p>{isEn ? 'Questions about these terms? We are happy to help:' : 'عندك سؤال عن الشروط؟ يسعدنا نساعدك:'}</p>
                <p className="font-semibold text-foreground">Email: support@watazawwado.academy / mahmoudelwany98@gmail.com</p>
                <p className="font-semibold text-foreground" dir="ltr">WhatsApp: +48508157886</p>
                <p>
                  {isEn ? 'See also our ' : 'اطلع أيضاً على '}
                  <Link to="/privacy" className="underline text-primary font-semibold">{isEn ? 'Privacy Policy' : 'سياسة الخصوصية'}</Link>.
                </p>
              </div>
            </section>
          </div>

          <div className="text-center pt-8 border-t border-border/50">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-subtle hover:bg-surface-warm dark:hover:bg-surface-subtle/80 text-foreground text-sm font-semibold transition-colors"
            >
              <span>{isEn ? '← Back to Home' : '← العودة للصفحة الرئيسية'}</span>
            </Link>
          </div>
        </div>
      </PublicSection>
    </main>
  );
}
