import React, { useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, MarginNote, PageHero } from '../PublicDesignSystem';
import { FileText, CalendarClock, RotateCcw, Wallet } from 'lucide-react';

// Keep in sync with TERMS_VERSION in api/index.ts: bookings store the version the student accepted.
const TERMS_VERSION_LABEL = { en: 'Version 2026-10-20.1, last updated 20 October 2026', ar: 'الإصدار 2026-10-20.1، آخر تحديث 20 أكتوبر 2026' };

// Trader identity (consumer law). The block shows once name and address are filled in.
// Not a registered business: leave ceidg/nip empty. Never publish a PESEL here.
const TRADER = { name: 'Mahmoud Said Elwany Abdelaal', address: 'ul. Stefana Czarnieckiego, Wrocław', ceidg: '', nip: '' };

type Section = { id: string; en: { title: string; items: string[] }; ar: { title: string; items: string[] } };

// RULES.md §2–§5 are the source of every rule below. Change them together.
const SECTIONS: Section[] = [
  {
    id: 'agreement',
    en: { title: 'Agreement', items: [
      'Watazawwado is an online platform for private 1-on-1 lessons in Quran, Tajweed, the Zad Path (our own course in faith and Seerah), Arabic and English. By creating an account, booking a lesson or buying a package, you agree to these terms.',
      'Before every booking or package purchase you confirm that you have read and accepted these terms. We keep a record of the version you accepted and when.',
      'If you book for a child, you are responsible for the booking, the payment and the child’s use of the platform.',
    ] },
    ar: { title: 'الموافقة على الشروط', items: [
      'منصة وتزودوا منصة إلكترونية لدروس فردية خاصة في القرآن والتجويد ومسار الأثر (منهجنا الخاص في أساسيات الدين والسيرة) واللغة العربية والإنجليزية. بإنشاء حساب أو حجز درس أو شراء باقة، فأنت توافق على هذه الشروط.',
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
      'Standard prices per 60 minutes: $9 for Quran, Tajweed and the Zad Path, and from $13 for Arabic (Fusha and Egyptian) and English. Shorter lessons cost the same rate per minute (for example 30 minutes = half the hourly price).',
      'Advanced, specialized or intensive learning may cost more. That price is set by the teacher after an assessment and is always shown to you before you pay.',
      'Lessons are paid in advance. A booking is confirmed only after the payment succeeds. While you pay, the time is held for about 35 minutes; if payment is not completed, the time is released.',
      'Payments are processed by Stripe (card, Apple Pay, Google Pay or PayPal). We never see or store your card details.',
      '“Pay later” is a courtesy offered only to regular students with at least 12 paid lessons, and each request needs our approval.',
    ] },
    ar: { title: 'الأسعار والدفع', items: [
      'الأسعار الأساسية لكل 60 دقيقة: 9 دولار للقرآن والتجويد ومسار الأثر، ومن 13 دولار للغة العربية (الفصحى والعامية المصرية) والإنجليزية. الحصص الأقصر بنفس السعر للدقيقة (مثلاً 30 دقيقة = نصف سعر الساعة).',
      'التعليم المتقدم أو المتخصص أو المكثف قد يكون سعره أعلى، ويحدده المعلم بعد تقييم الطالب، ويظهر لك دائماً قبل الدفع.',
      'الدفع مقدماً، ولا يتأكد الحجز إلا بعد نجاح الدفع. أثناء الدفع نحجز لك الموعد حوالي 35 دقيقة، وإذا لم يكتمل الدفع يُتاح الموعد لغيرك.',
      'تتم المدفوعات عبر Stripe (بطاقة، أو Apple Pay، أو Google Pay، أو PayPal)، ولا نرى بيانات بطاقتك ولا نخزنها.',
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
      'Within 14 days of buying a package you may withdraw (see “Your 14-day right of withdrawal”): we refund the unused lessons, and lessons already taken are charged at the package price per lesson.',
      'After those 14 days, unused package lessons stay valid and are not refunded automatically. If your situation changes, contact us and the platform owner will review it fairly, case by case. This never limits your rights under consumer law.',
      'If we cancel a lesson and cannot offer a suitable new time, you get a replacement lesson or a refund for that lesson, as you choose.',
    ] },
    ar: { title: 'الباقات ورعاية الأسرة', items: [
      'الباقات دروس مدفوعة مقدماً بسعر أقل للدرس، وليست اشتراكاً، ولا يتجدد أي شيء تلقائياً.',
      'كل باقة لمجموعة مواد واحدة (مجموعة 9 دولار أو مجموعة 13 دولار) ولمدة حصة واحدة (30 أو 45 أو 60 دقيقة)، ويمكن حجز دروسها في أي وقت.',
      'يُخصم رصيد الباقة عند إتمام الدرس (أو عند عدم الحضور بدون إلغاء في الوقت المسموح)، وليس عند الحجز.',
      'رعاية الأسرة: الباقة للطفل الثاني (أو الثالث…) في نفس الحساب عليها خصم إضافي 5%.',
      'خلال 14 يوماً من شراء الباقة يحق لك الانسحاب (انظر "حقك في الانسحاب خلال 14 يوماً"): نرد لك ثمن الدروس غير المستخدمة، وتُحتسب الدروس التي تمت بسعر الدرس في الباقة.',
      'بعد هذه الأيام الـ 14 تظل دروس الباقة غير المستخدمة صالحة ولا تُسترد تلقائياً. إذا تغيرت ظروفك، تواصل معنا وسيراجع صاحب المنصة طلبك بعدل حسب كل حالة، ولا يقيّد ذلك حقوقك بموجب قوانين حماية المستهلك.',
      'إذا ألغينا نحن درساً ولم نستطع تقديم موعد بديل مناسب، تحصل على درس بديل أو استرداد ثمن هذا الدرس، حسب اختيارك.',
    ] },
  },
  {
    id: 'withdrawal',
    en: { title: 'Your 14-day right of withdrawal', items: [
      'If you are a consumer, you may withdraw from a lesson booking or a package within 14 days of buying it, without giving a reason.',
      'Because lessons often take place within those 14 days, before paying you ask us to start early by ticking a separate box. If you then withdraw, you pay only for what was already provided (for a package: lessons taken at the package price per lesson), and we refund the rest.',
      'Once a single lesson has been fully delivered at your request, the right of withdrawal for that lesson ends.',
      'To withdraw, send us a clear statement by email to support@watazawwado.academy (or on WhatsApp). You may use this model form: “I hereby give notice that I withdraw from my contract for the following service: [lesson or package], bought on [date]. Name: [ ]. Account email: [ ]. Date: [ ].”',
      'We refund within 14 days of receiving your withdrawal, using the same payment method unless you agree otherwise. A withdrawal never counts toward the refund limit below.',
    ] },
    ar: { title: 'حقك في الانسحاب خلال 14 يوماً', items: [
      'إذا كنت مستهلكاً، يحق لك الانسحاب من حجز درس أو من باقة خلال 14 يوماً من الشراء، دون ذكر السبب.',
      'لأن الدروس غالباً تتم خلال هذه الأيام الـ 14، تطلب منا قبل الدفع البدء مبكراً بوضع علامة في مربع مستقل. وإذا انسحبت بعد ذلك، تدفع فقط مقابل ما تم تقديمه فعلاً (في الباقة: الدروس التي تمت بسعر الدرس في الباقة)، ونرد لك الباقي.',
      'بعد تقديم الدرس الفردي بالكامل بناءً على طلبك، ينتهي حق الانسحاب بالنسبة لهذا الدرس.',
      'للانسحاب، أرسل لنا إقراراً واضحاً بالبريد الإلكتروني إلى support@watazawwado.academy (أو عبر واتساب). ويمكنك استخدام هذا النموذج: "أُخطركم بانسحابي من عقد الخدمة التالية: [درس أو باقة]، تم شراؤها بتاريخ [ ]. الاسم: [ ]. بريد الحساب: [ ]. التاريخ: [ ]."',
      'نرد المبلغ خلال 14 يوماً من استلام طلب الانسحاب، بنفس وسيلة الدفع ما لم تتفق معنا على غير ذلك. والانسحاب لا يُحتسب أبداً من حد الاسترداد التالي.',
    ] },
  },
  {
    id: 'cancellation',
    en: { title: 'Cancelling and rescheduling', items: [
      'Cancel up to 3 hours before the lesson: a paid lesson comes back to you as a lesson credit you can book any time; a package lesson keeps its credit.',
      'Lessons are booked from tomorrow onwards, never for the same day.',
      'Reschedule up to 1 hour before the lesson, by yourself, from your student account. The new time is on another day, from tomorrow onwards.',
      'If your teacher has to move a lesson, you get an email and a notice on the site with the reason. If the new time does not suit you, move it or cancel it under the same rules.',
      'Inside the last hour before the lesson nothing can be changed. A lesson cancelled less than 3 hours before, or missed without notice, counts as taken (no refund or credit) when the teacher was available and ready to teach. Technical problems and exceptional situations are looked at fairly, case by case.',
      'Real emergencies: message us on WhatsApp. The platform owner may, as a goodwill gesture and at their sole discretion, move the lesson. This is not a right and does not change the rules above.',
      'If we cancel, the teacher misses the lesson, or a technical problem on our side stops it, you choose: a free new time, a lesson credit, or a refund. This never counts toward the refund limit below.',
    ] },
    ar: { title: 'الإلغاء وتغيير الموعد', items: [
      'الإلغاء حتى 3 ساعات قبل الدرس: الدرس المدفوع يعود لك كرصيد حصة تحجزه في أي وقت، ودرس الباقة يحتفظ برصيده.',
      'الحجز يكون من الغد فصاعداً، ولا يكون لنفس اليوم.',
      'تغيير الموعد حتى ساعة قبل الدرس، بنفسك من حساب الطالب، والموعد الجديد يكون في يوم آخر من الغد فصاعداً.',
      'إذا اضطر معلمك لتغيير موعد درس، يصلك بريد إلكتروني وإشعار على الموقع بالسبب. وإذا لم يناسبك الموعد الجديد، يمكنك تغييره أو إلغاؤه بنفس القواعد.',
      'خلال الساعة الأخيرة قبل الدرس لا يمكن تغيير أي شيء. الدرس الذي يُلغى قبل أقل من 3 ساعات من موعده، أو الذي لم تحضره دون إبلاغ، يُحتسب كدرس تم (بدون استرداد أو رصيد) متى كان المعلم متاحاً ومستعداً للتدريس. والمشكلات التقنية والظروف الاستثنائية تُراجع بعدل حسب كل حالة.',
      'الظروف الطارئة فعلاً: تواصل معنا عبر واتساب. يجوز لصاحب المنصة، كمراعاة وحسب تقديره وحده، تغيير موعد الدرس. هذا ليس حقاً مكتسباً ولا يغير القواعد السابقة.',
      'إذا ألغينا نحن، أو غاب المعلم، أو منعت مشكلة تقنية من جهتنا الدرس، تختار أنت: موعداً جديداً مجاناً، أو رصيد حصة، أو استرداد المبلغ، ولا يُحتسب ذلك أبداً من حد الاسترداد التالي.',
    ] },
  },
  {
    id: 'refunds',
    en: { title: 'Refunds', items: [
      'Instead of keeping a lesson credit from a lesson you cancelled in time, you can ask for your money back with the “I prefer a refund” button on the Packages page. It opens WhatsApp with a ready message.',
      'Turning a lesson credit into money this way is a courtesy limited to 3 lessons per account. After that, cancelled lessons still come back as lesson credits, but they are not refundable. This limit never applies to a withdrawal within 14 days, to lessons we cancel or fail to deliver, or to any refund the law requires.',
      'We send the refund within 14 days of your request. Please send us the account or payment method where you want to receive it; we can’t send it before we have it.',
      'A refund is for the amount you paid for that lesson. Your bank or payment provider may charge its own fees.',
      'Lessons that were taken, or missed or cancelled too late while the teacher was ready, are not refundable.',
      'Nothing in these terms limits any rights you have under the consumer laws that apply to you.',
    ] },
    ar: { title: 'الاسترداد', items: [
      'بدلاً من الاحتفاظ برصيد حصة ألغيتها في الوقت المسموح، يمكنك طلب استرداد المبلغ من زر "عايز استرداد بدل الرصيد" في صفحة الباقات، فيفتح لك واتساب برسالة جاهزة.',
      'تحويل رصيد الحصة إلى مبلغ بهذه الطريقة ميزة نقدمها لحد 3 دروس لكل حساب. بعد ذلك تعود الدروس الملغاة كرصيد حصة، لكنها غير قابلة للاسترداد. ولا ينطبق هذا الحد أبداً على الانسحاب خلال 14 يوماً، ولا على الدروس التي نلغيها نحن أو لا نقدمها، ولا على أي استرداد يفرضه القانون.',
      'نرسل المبلغ خلال 14 يوماً من طلبك. يرجى إرسال الحساب أو وسيلة الدفع التي تريد الاستلام عليها، ولا نستطيع الإرسال قبل وصولها.',
      'المبلغ المسترد هو ما دفعته لهذا الدرس، وقد يخصم البنك أو مزود الدفع رسومه الخاصة.',
      'الدروس التي تمت، أو التي لم تحضرها أو ألغيتها متأخراً بينما كان المعلم مستعداً، غير قابلة للاسترداد.',
      'لا يوجد في هذه الشروط ما يقيّد أي حقوق تمنحها لك قوانين حماية المستهلك المطبقة عليك.',
    ] },
  },
  {
    id: 'conduct',
    en: { title: 'Respect and safety', items: [
      'Teachers and students treat each other with respect. A teacher may end a lesson if a student is abusive; that lesson counts as taken.',
      'Learning results depend on practice and commitment, so we can’t guarantee a specific result in a specific time.',
      'For ordinary problems with a lesson, our responsibility is normally the price paid for that lesson. Nothing in these terms excludes or limits liability where the law does not allow it, or removes any refund or other remedy that consumer law gives you.',
    ] },
    ar: { title: 'الاحترام والأمان', items: [
      'يتعامل المعلمون والطلاب باحترام متبادل، ويحق للمعلم إنهاء الدرس عند الإساءة، ويُحتسب الدرس كدرس تم.',
      'نتائج التعلم تعتمد على الممارسة والالتزام، لذلك لا نضمن نتيجة محددة في مدة محددة.',
      'في المشكلات العادية المتعلقة بدرس ما، تكون مسؤوليتنا عادةً في حدود ثمن هذا الدرس. ولا يوجد في هذه الشروط ما يستبعد المسؤولية أو يحدّها حيث لا يسمح القانون بذلك، أو يُسقط أي استرداد أو تعويض تمنحه لك قوانين حماية المستهلك.',
    ] },
  },
  {
    id: 'children',
    en: { title: 'Children and safeguarding', items: [
      'A parent or legal guardian books and pays for a child and is the contracting party. The child is the learner.',
      'Parents may sit in on any lesson and may ask for a different teacher at any time.',
      'Teachers talk to students only through the platform: Zoom lessons and the on-site chat, which the platform owner can read. Teachers must not move contact to private accounts or ask for personal information that the lesson does not need.',
      'Lessons are not recorded by us. Teachers may not record, photograph or screenshot a student without the parent’s permission.',
      'If anything in a lesson worries you, tell us straight away on WhatsApp or by email. We look into every report, may pause the teacher’s access while we do, and remove a teacher’s access to student data when they stop teaching here.',
    ] },
    ar: { title: 'الأطفال وحمايتهم', items: [
      'ولي الأمر أو الوصي القانوني هو من يحجز ويدفع للطفل وهو الطرف المتعاقد، والطفل هو المتعلم.',
      'يحق لولي الأمر حضور أي درس، وطلب تغيير المعلم في أي وقت.',
      'يتواصل المعلمون مع الطلاب عبر المنصة فقط: دروس Zoom والمحادثة داخل الموقع التي يستطيع صاحب المنصة الاطلاع عليها. ولا يجوز للمعلم نقل التواصل إلى حسابات خاصة أو طلب معلومات شخصية لا يحتاجها الدرس.',
      'نحن لا نسجّل الدروس، ولا يجوز للمعلم تسجيل الطالب أو تصويره أو أخذ لقطة شاشة له دون إذن ولي الأمر.',
      'إذا أقلقك أي شيء في درس، أخبرنا فوراً عبر واتساب أو البريد الإلكتروني. نراجع كل بلاغ، وقد نوقف وصول المعلم أثناء المراجعة، ونلغي وصول المعلم لبيانات الطلاب عند توقفه عن التدريس معنا.',
    ] },
  },
  {
    id: 'ai',
    en: { title: 'AI learning assistant', items: [
      'Some parts of the site use an AI assistant (Google Gemini): the learning guide on the homepage, the chat that suggests a learning plan, and help for teachers. You are always told when you are talking to the AI.',
      'AI answers can contain mistakes. They are suggestions only and never replace the judgment of your teacher. Prices and placement decisions are made or reviewed by people, not by the AI alone.',
      'Please do not type sensitive personal information into AI chats.',
    ] },
    ar: { title: 'المساعد التعليمي بالذكاء الاصطناعي', items: [
      'بعض أجزاء الموقع تستخدم مساعداً بالذكاء الاصطناعي (Google Gemini): المرشد التعليمي في الصفحة الرئيسية، والمحادثة التي تقترح خطة تعلم، ومساعدة المعلمين. ونوضح لك دائماً متى تتحدث مع الذكاء الاصطناعي.',
      'قد تحتوي إجابات الذكاء الاصطناعي على أخطاء، وهي اقتراحات فقط ولا تحل محل تقدير معلمك. والأسعار وقرارات تحديد المستوى يتخذها أو يراجعها أشخاص، وليس الذكاء الاصطناعي وحده.',
      'يرجى عدم كتابة معلومات شخصية حساسة في محادثات الذكاء الاصطناعي.',
    ] },
  },
  {
    id: 'complaints',
    en: { title: 'Complaints', items: [
      'Send complaints to support@watazawwado.academy (or WhatsApp), with your account email, the lesson or payment concerned, and what went wrong.',
      'We answer within the time the law requires and, where no deadline applies, within 14 days. If we need more information we will tell you what and keep you informed.',
      'This procedure does not limit any of your consumer rights.',
    ] },
    ar: { title: 'الشكاوى', items: [
      'أرسل شكواك إلى support@watazawwado.academy (أو عبر واتساب)، مع بريد حسابك، والدرس أو الدفعة المعنية، ووصف المشكلة.',
      'نرد خلال المدة التي يفرضها القانون، وإذا لم تكن هناك مدة محددة فخلال 14 يوماً. وإذا احتجنا معلومات إضافية نخبرك بما نحتاجه ونطلعك على سير الشكوى.',
      'هذا الإجراء لا يقيّد أياً من حقوقك كمستهلك.',
    ] },
  },
  {
    id: 'law',
    en: { title: 'Disputes and governing law', items: [
      'If something goes wrong, please contact us first; we will always try to find a fair solution quickly.',
      'These terms are governed by the laws of Poland, without prejudice to the mandatory consumer protection rules that apply to you.',
      'If you are a consumer, nothing in these terms takes away the mandatory rights and remedies of the country where you live, or your right to bring a claim before the courts the law allows you to use, including the courts where you live.',
      'You may also use an out-of-court dispute resolution body where one is available to you. A list of these bodies is published by the European Commission at consumer-redress.ec.europa.eu.',
    ] },
    ar: { title: 'النزاعات والقانون المطبّق', items: [
      'لو حصلت أي مشكلة، تواصل معنا الأول؛ دايماً هنحاول نوصل لحل عادل بسرعة.',
      'تخضع هذه الشروط لقوانين جمهورية بولندا، دون المساس بقواعد حماية المستهلك الإلزامية المطبقة عليك.',
      'إذا كنت مستهلكاً، لا يوجد في هذه الشروط ما يسلبك الحقوق والوسائل الإلزامية في بلد إقامتك، أو حقك في رفع دعواك أمام المحاكم التي يسمح لك القانون باللجوء إليها، بما فيها محاكم بلد إقامتك.',
      'ويمكنك أيضاً اللجوء إلى جهة لتسوية النزاعات خارج المحاكم إذا كانت متاحة لك. وتنشر المفوضية الأوروبية قائمة بهذه الجهات على consumer-redress.ec.europa.eu.',
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
    { icon: Wallet, en: ['14 days to change your mind', 'Withdraw within 14 days of buying; you pay only for what was delivered.'], ar: ['14 يوماً لتغيير رأيك', 'انسحب خلال 14 يوماً من الشراء، وتدفع فقط مقابل ما تم تقديمه.'] },
  ];

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">
          <PageHero
            title={isEn ? <>Terms of <span className="text-ribbon">Service</span></> : <>شروط الخدمة <span className="text-ribbon">والاستخدام</span></>}
            intro={isEn
              ? 'Clear, fair rules for bookings, payments, cancellations and refunds, so you always know where you stand.'
              : 'قواعد واضحة وعادلة للحجز والدفع والإلغاء والاسترداد، علشان تكون دايماً عارف حقوقك.'}
            meta={isEn ? TERMS_VERSION_LABEL.en : TERMS_VERSION_LABEL.ar}
          />

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
                {TRADER.name && TRADER.address && (
                  <div className="pb-3 mb-1 border-b border-border/60 space-y-1">
                    <p className="font-semibold text-foreground">{isEn ? 'Who you contract with' : 'الطرف المتعاقد معك'}</p>
                    <p>{isEn ? `Watazawwado Academy is run by ${TRADER.name}, ${TRADER.address}, Poland.` : `تدير منصة وتزودوا ${TRADER.name}، ${TRADER.address}، بولندا.`}</p>
                    {TRADER.nip && <p dir="ltr">{TRADER.ceidg && `CEIDG: ${TRADER.ceidg} · `}NIP: {TRADER.nip}</p>}
                    <p>{isEn ? 'Customer service and complaints: support@watazawwado.academy' : 'خدمة العملاء والشكاوى: support@watazawwado.academy'}</p>
                  </div>
                )}
                <p>{isEn ? 'Questions about these terms? We are happy to help:' : 'عندك سؤال عن الشروط؟ يسعدنا نساعدك:'}</p>
                <ul className="space-y-1">
                  <li><span className="font-semibold text-foreground" dir="ltr">info@watazawwado.academy</span> — {isEn ? 'general questions' : 'الأسئلة العامة'}</li>
                  <li><span className="font-semibold text-foreground" dir="ltr">support@watazawwado.academy</span> — {isEn ? 'bookings, lessons, complaints and withdrawals' : 'الحجوزات والدروس والشكاوى والانسحاب'}</li>
                  <li><span className="font-semibold text-foreground" dir="ltr">finance@watazawwado.academy</span> — {isEn ? 'payments and refunds' : 'المدفوعات والاسترداد'}</li>
                  <li><span className="font-semibold text-foreground" dir="ltr">privacy@watazawwado.academy</span> — {isEn ? 'your personal data' : 'بياناتك الشخصية'}</li>
                </ul>
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
