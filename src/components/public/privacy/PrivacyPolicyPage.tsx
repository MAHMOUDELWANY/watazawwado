import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, MarginNote, PageHero } from '../PublicDesignSystem';
import { ShieldCheck, Lock, Eye, FileText, Mail, Globe, CheckCircle2 } from 'lucide-react';

export function PrivacyPolicyPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-20">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">

          <PageHero
            title={isEn ? <>Privacy <span className="text-ribbon">Policy</span></> : <>سياسة <span className="text-ribbon">الخصوصية</span></>}
            intro={isEn
              ? 'What we collect, why, how long we keep it, and the rights you have over your data and your children’s.'
              : 'إيه البيانات اللي بنجمعها، وليه، وبنحتفظ بيها قد إيه، وإيه حقوقك على بياناتك وبيانات أولادك.'}
            meta={isEn ? 'Last updated: October 2026' : 'آخر تحديث: أكتوبر 2026'}
          />

          {/* Quick Summary Highlights */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-sm">
                {isEn ? 'No Data Selling' : 'لا نبيع بياناتك أبداً'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? 'We never sell, rent, or trade your personal data to advertisers or third parties.'
                  : 'لا نقوم ببيع أو تأجير أو مشاركة بياناتك الشخصية لأي معلنين أو جهات تجارية.'}
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-sm">
                {isEn ? 'Google Compliance' : 'متوافق مع معايير Google'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? 'Strict adherence to Google API Services User Data Policy, including Limited Use.'
                  : 'التزام تام بسياسة بيانات مستخدمي Google وسياسة الاستخدام المحدود.'}
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-secondary/20 flex items-center justify-center text-accent">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-sm">
                {isEn ? 'Full Control & Deletion' : 'تحكم وحذف كامل للبيانات'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? 'Request deletion or export of your account and educational records at any time.'
                  : 'يمكنك طلب حذف أو تصدير حسابك وبياناتك التعليمية بالكامل في أي وقت.'}
              </p>
            </div>
          </div>

          {/* Policy Detailed Sections */}
          <div className="space-y-10 text-foreground leading-relaxed">

            {/* Section 1: Introduction */}
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 1' : 'القسم الأول'} noAccent>
                {isEn ? '1. Introduction and Platform Identity' : '1. مقدمة وهوية المنصة'}
              </EditorialHeading>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-3 text-sm sm:text-base">
                <p>
                  {isEn ? (
                    <>
                      Welcome to <strong>Watazawwado Academy</strong> (accessible at <a href="https://watazawwado.academy" className="text-teal-600 dark:text-teal-400 underline">watazawwado.academy</a>). It is an online academy offering one-on-one lessons in the Quran, Tajweed, the Zad Path, Arabic and English.
                    </>
                  ) : (
                    <>
                      أهلاً بك في <strong>أكاديمية وتزودوا (Watazawwado Academy)</strong> المتاحة عبر الرابط (<a href="https://watazawwado.academy" className="text-teal-600 dark:text-teal-400 underline">watazawwado.academy</a>). وهي أكاديمية تعليمية عبر الإنترنت تقدّم دروساً فردية في القرآن الكريم والتجويد ومسار الأثر واللغة العربية واللغة الإنجليزية للطلاب في مختلف أنحاء العالم.
                    </>
                  )}
                </p>
                <p>
                  {isEn
                    ? 'The data controller is the operator of Watazawwado named in the Terms of Service (section “Contact us”), based in Poland. For any privacy question or request, write to privacy@watazawwado.academy. This policy explains what we collect, why, on which legal basis, how long we keep it and what your rights are.'
                    : 'المسؤول عن معالجة البيانات (المتحكم) هو مشغّل منصة وتزودوا المذكور في شروط الخدمة (قسم "تواصل معنا")، ومقره بولندا. لأي سؤال أو طلب يتعلق بالخصوصية، راسلنا على privacy@watazawwado.academy. توضح هذه السياسة ما نجمعه، ولماذا، وعلى أي أساس قانوني، ومدة الاحتفاظ به، وما هي حقوقك.'}
                </p>
              </div>
            </section>

            {/* Section 2: Information We Collect */}
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 2' : 'القسم الثاني'} noAccent>
                {isEn ? '2. Information We Collect' : '2. المعلومات التي نجمعها'}
              </EditorialHeading>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-3 text-sm sm:text-base">
                <p>
                  {isEn
                    ? 'We collect only the information necessary to provide an authentic, safe, and tailored educational experience:'
                    : 'نحن نجمع فقط المعلومات الضرورية لتقديم تجربة تعليمية آمنة ومخصصة لاحتياجات الطالب:'}
                </p>
                <ul className="list-disc ps-6 space-y-2">
                  <li>
                    <strong>{isEn ? 'Account Credentials:' : 'بيانات الحساب:'}</strong>{' '}
                    {isEn
                      ? 'Full name, email address, and encrypted passwords managed securely via Supabase Authentication.'
                      : 'الاسم الكامل، والبريد الإلكتروني، وكلمات المرور المشفرة والمدارة بأمان عبر Supabase.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Google Account Profile (when using Log in with Google):' : 'بيانات حساب Google (عند تسجيل الدخول بجوجل):'}</strong>{' '}
                    {isEn
                      ? 'When you choose to sign in using Google, we access basic, non-sensitive profile information provided by Google OAuth: your verified email address, full name, and profile picture avatar.'
                      : 'عند اختيارك الدخول بواسطة Google، نصل فقط للمعلومات الأساسية غير الحساسة: بريدك الإلكتروني المعتمد، واسمك، وصورتك الشخصية لإنشاء ملفك الدراسي.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Booking & Student Profile Information:' : 'بيانات الحجز والملف الدراسي:'}</strong>{' '}
                    {isEn
                      ? 'Learner name and age, parent/guardian name and contact details (for children), learning goals, current level, timezone, preferred schedule, bookings, attendance and cancellations, teacher notes and placement test answers and results.'
                      : 'اسم المتعلم وعمره، واسم ولي الأمر وبيانات التواصل معه (للأطفال)، والأهداف التعليمية، والمستوى الحالي، والمنطقة الزمنية، والمواعيد المفضلة، والحجوزات والحضور والإلغاء، وملاحظات المعلم، وإجابات اختبار تحديد المستوى ونتيجته.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Messages and AI chats:' : 'الرسائل ومحادثات الذكاء الاصطناعي:'}</strong>{' '}
                    {isEn
                      ? 'Messages in the on-site chat with the platform owner and your teacher, and what you type in the AI learning guide and learning-plan chat.'
                      : 'الرسائل في المحادثة داخل الموقع مع صاحب المنصة ومع معلمك، وما تكتبه في المرشد التعليمي ومحادثة خطة التعلم بالذكاء الاصطناعي.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Payment & Transaction Records:' : 'سجلات الدفع والتحويلات:'}</strong>{' '}
                    {isEn
                      ? 'Payment method used on Stripe’s checkout (card, Apple Pay, Google Pay or PayPal), the amount, and the transaction reference. Card details are handled by Stripe (or PayPal if you choose it); we never see or store card numbers.'
                      : 'طريقة الدفع المستخدمة في صفحة دفع Stripe (بطاقة، أو Apple Pay، أو Google Pay، أو PayPal)، والمبلغ، والرقم المرجعي للمعاملة. بيانات البطاقة تتعامل معها Stripe (أو PayPal لو اخترته)، ولا نراها ولا نخزنها.'}
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3: How We Use Your Data */}
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 3' : 'القسم الثالث'} noAccent>
                {isEn ? '3. How We Use Your Information' : '3. كيف نستخدم معلوماتك'}
              </EditorialHeading>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-3 text-sm sm:text-base">
                <p>
                  {isEn
                    ? 'Your personal information is used exclusively for the following legitimate educational purposes:'
                    : 'تُستخدم بياناتك الشخصية حصرياً للأغراض التعليمية والتشغيلية التالية:'}
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  {[
                    {
                      en: 'Scheduling and conducting 1-on-1 lessons via video conferencing (Zoom / Google Meet).',
                      ar: 'جدولة وتنظيم الدروس الفردية عبر منصات الاتصال المرئي (Zoom / Google Meet).'
                    },
                    {
                      en: 'Sending automated booking confirmations, meeting links, and 24h & 1h lesson reminders via Brevo email service.',
                      ar: 'إرسال تأكيدات الحجز التلقائية وروابط الجلسات وتذكيرات الدروس (قبل 24 ساعة وساعة) عبر خدمة Brevo.'
                    },
                    {
                      en: 'Synchronizing confirmed lesson appointments to the teacher’s Google Calendar schedule.',
                      ar: 'مزامنة مواعيد الدروس المؤكدة مع تقويم Google الخاص بالمعلم لتفادي تضارب المواعيد.'
                    },
                    {
                      en: 'Tracking learning progress, teacher notes, homework, and Quran recitation achievements.',
                      ar: 'متابعة تقدم الطالب، وتدوين ملاحظات المعلم والواجبات المنزلية ومستوى الحفظ والتجويد.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-subtle/40 border border-border/40 text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span>{isEn ? item.en : item.ar}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Legal basis and retention (GDPR Art. 13) */}
            <section className="space-y-4">
              <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-3 text-sm sm:text-base">
                <h3 className="text-base font-semibold text-foreground">
                  {isEn ? 'Legal basis for each purpose' : 'الأساس القانوني لكل غرض'}
                </h3>
                <ul className="list-disc ps-6 space-y-1.5">
                  <li>{isEn ? 'Account, bookings, lessons, chat, placement test and learning records: performing our contract with you (GDPR Art. 6(1)(b)).' : 'الحساب والحجوزات والدروس والمحادثة واختبار تحديد المستوى والسجلات التعليمية: تنفيذ العقد معك (المادة 6(1)(ب) من اللائحة العامة لحماية البيانات).'}</li>
                  <li>{isEn ? 'Payment, invoice and tax records: our legal obligations (Art. 6(1)(c)).' : 'سجلات الدفع والفواتير والضرائب: التزاماتنا القانونية (المادة 6(1)(ج)).'}</li>
                  <li>{isEn ? 'Security, fraud and abuse prevention, and handling complaints: our legitimate interests (Art. 6(1)(f)).' : 'الأمان ومنع الاحتيال وإساءة الاستخدام ومعالجة الشكاوى: مصلحتنا المشروعة (المادة 6(1)(و)).'}</li>
                  <li>{isEn ? 'The AI learning guide and learning-plan chat: providing the service you ask for (Art. 6(1)(b)). We send the AI only what the task needs (for example a first name, never your email or payment data).' : 'المرشد التعليمي ومحادثة خطة التعلم بالذكاء الاصطناعي: تقديم الخدمة التي تطلبها (المادة 6(1)(ب)). ونرسل للذكاء الاصطناعي ما تحتاجه المهمة فقط (مثل الاسم الأول، وليس بريدك أو بيانات الدفع أبداً).'}</li>
                  <li>{isEn ? 'AI help for teachers: a teacher may use our AI assistant to prepare a lesson or to draft the short summary for the family from their own lesson notes. It receives the learner’s first name and those notes, never contact or payment data, and the teacher reviews every draft before the family sees anything. Legal basis: our legitimate interest in giving good, well-prepared lessons (Art. 6(1)(f)).' : 'مساعدة الذكاء الاصطناعي للمعلمين: يمكن للمعلم أن يستخدم مساعدنا بالذكاء الاصطناعي لتحضير الدرس أو لكتابة مسودة الملخص القصير للأسرة من ملاحظاته عن الدرس. ويصل إليه الاسم الأول للمتعلم وهذه الملاحظات فقط، دون بيانات التواصل أو الدفع، ويراجع المعلم كل مسودة قبل أن تراها الأسرة. الأساس القانوني: مصلحتنا المشروعة في تقديم دروس جيدة ومُعدّة جيداً (المادة 6(1)(و)).'}</li>
                  <li>{isEn ? 'Emails about your own lessons that you can switch off in your account (a monthly progress note, package renewal reminders, and a check-in after a few quiet weeks): our legitimate interest in supporting your learning (Art. 6(1)(f)). Each one has an off switch in your account settings.' : 'رسائل البريد عن دروسك أنت والتي يمكنك إيقافها من حسابك (ملخص التقدم الشهري، وتذكير تجديد الباقة، ورسالة اطمئنان بعد أسابيع بلا دروس): مصلحتنا المشروعة في دعم تعلمك (المادة 6(1)(و)). ولكل منها زر إيقاف في إعدادات حسابك.'}</li>
                  <li>{isEn ? 'Marketing messages: we do not send any. If we ever do, we will ask for your consent first.' : 'الرسائل التسويقية: لا نرسل أي رسائل تسويقية، وإذا فعلنا يوماً فسنطلب موافقتك أولاً.'}</li>
                </ul>
                <h3 className="text-base font-semibold text-foreground pt-2">
                  {isEn ? 'How long we keep data' : 'مدة الاحتفاظ بالبيانات'}
                </h3>
                <ul className="list-disc ps-6 space-y-1.5">
                  <li>{isEn ? 'Account, learning records, bookings, chat and AI chats: while your account is open. After you delete it, we delete or anonymise them from our live systems within 30 days.' : 'الحساب والسجلات التعليمية والحجوزات والمحادثات ومحادثات الذكاء الاصطناعي: طوال فترة فتح حسابك. وبعد حذفه نحذفها أو نجعلها مجهولة الهوية في أنظمتنا خلال 30 يوماً.'}</li>
                  <li>{isEn ? 'Payment and invoice records: 5 years from the end of the year of the payment, as Polish tax law requires.' : 'سجلات الدفع والفواتير: 5 سنوات من نهاية سنة الدفع، كما يتطلب قانون الضرائب البولندي.'}</li>
                  <li>{isEn ? 'Complaints and refund requests: up to 3 years after they are closed, in case of a later claim.' : 'الشكاوى وطلبات الاسترداد: حتى 3 سنوات بعد إغلاقها، تحسباً لأي مطالبة لاحقة.'}</li>
                  <li>{isEn ? 'Technical logs and backups: removed in the normal cycle of our providers, usually within 30 days.' : 'السجلات التقنية والنسخ الاحتياطية: تُحذف ضمن الدورة العادية لدى مزودي الخدمة، وعادةً خلال 30 يوماً.'}</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Google API Services User Data Policy Compliance */}
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 4' : 'القسم الرابع'} noAccent>
                {isEn ? '4. Google User Data & Limited Use Disclosure' : '4. بيان التزام بيانات مستخدمي Google (الاستخدام المحدود)'}
              </EditorialHeading>

              <div className="p-6 rounded-2xl border border-teal-500/30 bg-teal-500/5 space-y-3 text-sm sm:text-base">
                <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-200">
                  <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>
                    {isEn ? 'Google API Services User Data Policy Compliance' : 'الامتثال الكامل لسياسة بيانات مستخدمي Google'}
                  </span>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {isEn ? (
                    <>
                      <strong>Watazawwado Academy's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 underline font-semibold">Google API Services User Data Policy</a>, including the Limited Use requirements.</strong>
                    </>
                  ) : (
                    <>
                      <strong>إن استخدام منصة وتزودوا التعليمية ونقلها لأي تطبيق آخر للمعلومات المستلمة من واجهات برمجة تطبيقات Google يلتزم تماماً بـ <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 underline font-semibold">سياسة بيانات مستخدمي خدمات Google API</a>، بما في ذلك متطلبات الاستخدام المحدود (Limited Use).</strong>
                    </>
                  )}
                </p>

                <ul className="list-disc ps-5 text-xs sm:text-sm text-muted-foreground space-y-1.5 pt-1">
                  <li>
                    {isEn
                      ? 'We do not transfer or disclose Google user data to third parties, unless necessary to provide or improve the core educational capabilities, comply with applicable law, or as part of a merger/acquisition with explicit user consent.'
                      : 'لا ننقل أو نفصح عن بيانات مستخدمي Google لأي طرف ثالث إلا لتقديم الخدمة التعليمية الأساسية أو الامتثال للقوانين المعمول بها.'}
                  </li>
                  <li>
                    {isEn
                      ? 'We do not use Google user data to serve advertisements, including personalized, re-targeted, or interest-based advertising.'
                      : 'لا نستخدم بيانات مستخدمي Google لتقديم أي نوع من الإعلانات التجارية أو الموجهة.'}
                  </li>
                  <li>
                    {isEn
                      ? 'We do not allow humans to read Google user data, unless we have obtained your affirmative agreement for specific messages, or as necessary for security reasons.'
                      : 'لا نسمح لأي موظفين بالاطلاع على بيانات Google الخاصة بك إلا بموافقتك الصريحة أو لأغراض أمنية وفنية بحتة.'}
                  </li>
                  <li>
                    {isEn
                      ? 'We do not use Google user data to train generalized AI/ML models.'
                      : 'لا تُستخدم بيانات مستخدمي Google في تدريب أي نماذج ذكاء اصطناعي عامة.'}
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5: Third-Party Service Providers */}
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 5' : 'القسم الخامس'} noAccent>
                {isEn ? '5. Third-Party Service Providers' : '5. مزودو الخدمات التقنية'}
              </EditorialHeading>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-3 text-sm sm:text-base">
                <p>
                  {isEn
                    ? 'We engage reliable, enterprise-grade cloud providers to operate the educational infrastructure safely:'
                    : 'نتعامل مع مزودي خدمات سحابية معتمدين لتشغيل البنية التحتية التعليمية بأعلى معايير الأمان:'}
                </p>
                <ul className="list-disc ps-6 space-y-2">
                  <li>
                    <strong>Supabase Inc.</strong> — {isEn ? 'Encrypted cloud database hosting, authentication, and secure access controls.' : 'استضافة قواعد البيانات المشفرة وإدارة المصادقة الآمنة.'}
                  </li>
                  <li>
                    <strong>Brevo (Sendinblue)</strong> — {isEn ? 'Transactional email delivery for booking confirmations, invoices, and lesson reminders via verified domain noreply@watazawwado.academy.' : 'إرسال الإيميلات التشغيلية لتأكيدات الحجز والفواتير والتذكيرات عبر النطاق المعتمد.'}
                  </li>
                  <li>
                    <strong>Google Calendar & Zoom Video Communications</strong> — {isEn ? 'Scheduling lesson events and hosting secure virtual classroom sessions.' : 'مزامنة مواعيد الدروس واستضافة الفصول الافتراضية المباشرة.'}
                  </li>
                  <li>
                    <strong>Stripe & PayPal</strong> — {isEn ? 'Processing lesson and package payments. Card details go straight to them; we never see or store them.' : 'معالجة مدفوعات الدروس والباقات. بيانات البطاقة تذهب إليهم مباشرة، ولا نراها ولا نخزنها.'}
                  </li>
                  <li>
                    <strong>Google Gemini</strong> — {isEn ? 'Powers the learning assistant that reads the answers you type in the placement chat, to suggest a learning plan, and the teachers’ assistant described above (first name and lesson notes only).' : 'يشغّل المساعد التعليمي الذي يقرأ إجاباتك في محادثة تحديد المستوى ليقترح خطة تعلم مناسبة، ومساعد المعلمين المذكور أعلاه (الاسم الأول وملاحظات الدرس فقط).'}
                  </li>
                  <li>
                    <strong>Have I Been Pwned</strong> — {isEn ? 'When you choose a password, your browser checks it against known data leaks. Only the first 5 characters of a one-way hash are sent; your password never leaves your device.' : 'عند اختيار كلمة المرور، يفحصها متصفحك مقابل التسريبات المعروفة. يُرسل فقط أول 5 أحرف من بصمة مشفرة باتجاه واحد، وكلمة مرورك لا تغادر جهازك أبداً.'}
                  </li>
                  <li>
                    <strong>WhatsApp (Meta)</strong> — {isEn ? 'Only when you choose to message us, for example for support, pay-later or refund requests.' : 'فقط عندما تختار مراسلتنا، مثل الدعم أو طلبات الدفع لاحقاً أو الاسترداد.'}
                  </li>
                  <li>
                    <strong>Vercel Inc.</strong> — {isEn ? 'Global edge application deployment, SSL/TLS encryption in transit, and anonymous visit counts on our public pages (Vercel Web Analytics, no cookies).' : 'استضافة واجهة الويب والتشفير الكامل للبيانات أثناء النقل (SSL/TLS)، وإحصاءات زيارات مجهولة الهوية لصفحاتنا العامة (Vercel Web Analytics، بدون ملفات ارتباط).'}
                  </li>
                </ul>
                <p>
                  {isEn
                    ? 'These providers process data on our behalf and only for the purposes above (Stripe and PayPal also act as independent controllers for their own legal duties, such as fraud checks). Some of them are based in the United States, so data may be transferred outside the European Economic Area. Those transfers rely on the EU–US Data Privacy Framework where the provider is certified, or on the European Commission’s Standard Contractual Clauses. Each provider’s privacy policy is on its own website.'
                    : 'يعالج هؤلاء المزودون البيانات نيابةً عنا وللأغراض المذكورة أعلاه فقط (وتعمل Stripe وPayPal أيضاً كجهات متحكمة مستقلة في التزاماتهما القانونية الخاصة، مثل فحص الاحتيال). بعضهم مقره الولايات المتحدة، لذلك قد تُنقل البيانات خارج المنطقة الاقتصادية الأوروبية. ويستند هذا النقل إلى إطار خصوصية البيانات بين الاتحاد الأوروبي والولايات المتحدة إذا كان المزود معتمداً فيه، أو إلى البنود التعاقدية القياسية للمفوضية الأوروبية. وسياسة الخصوصية لكل مزود منشورة على موقعه.'}
                </p>
              </div>
            </section>

            {/* Cookies & language preference (RULES.md §6) */}
            <section className="space-y-4">
              <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-3 text-sm sm:text-base">
                <h3 className="text-base font-semibold text-foreground">
                  {isEn ? 'Cookies and your language choice' : 'ملفات تعريف الارتباط (Cookies) واختيار اللغة'}
                </h3>
                <p>
                  {isEn
                    ? 'We use only necessary cookies and browser storage: to keep you signed in and to remember the language you chose. If you are signed in and pick a language, we save it on your account so our emails reach you in that language (English by default). We do not use advertising or tracking cookies. To learn which of our posts and links bring families to us, your browser also keeps the campaign tags of the link you first arrived from (for example utm_source=youtube) and the name of the referring site; when you complete your account, we save them on it. Our public pages count visits anonymously, without cookies.'
                    : 'نستخدم فقط ملفات الارتباط وتخزين المتصفح الضرورية: لإبقائك مسجلاً للدخول ولتذكّر اللغة التي اخترتها. وإذا كنت مسجلاً واخترت لغة، نحفظها في حسابك لتصلك رسائلنا بها (الإنجليزية افتراضياً). لا نستخدم ملفات ارتباط إعلانية أو للتتبع. ولنعرف أي منشوراتنا وروابطنا توصل العائلات إلينا، يحتفظ متصفحك أيضاً بوسوم الحملة في الرابط الذي وصلت منه أول مرة (مثل utm_source=youtube) واسم الموقع الذي أحالك إلينا؛ وعند إكمال بيانات حسابك نحفظها فيه. وتُحصى زيارات صفحاتنا العامة دون معرفة هويتك ودون ملفات ارتباط.'}
                </p>
              </div>
            </section>

            {/* Section 6: Children's Privacy */}
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 6' : 'القسم السادس'} noAccent>
                {isEn ? "6. Children's Privacy & Parental Consent" : '6. خصوصية الأطفال وموافقة أولياء الأمور'}
              </EditorialHeading>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-3 text-sm sm:text-base">
                <p>
                  {isEn
                    ? 'Watazawwado Academy frequently teaches young learners learning Quran recitation and Arabic. We take child privacy with utmost seriousness:'
                    : 'تفتخر المنصة بتعليم العديد من الأطفال والناشئين للقرآن الكريم واللغة العربية، ونولي خصوصية الأطفال أقصى درجات الاهتمام:'}
                </p>
                <p>
                  {isEn
                    ? 'For a student under 18, a parent or legal guardian creates the account, books, pays and is our contracting party. We process the child’s data (name, age, level, lessons, teacher notes, placement results and chat) to deliver the lessons the parent ordered. Children under 16 should use the AI chats only with the parent’s knowledge; where the law asks for parental consent, the parent gives it for the child. We collect only what teaching needs, and parents can review, correct or delete their child’s data at any time.'
                    : 'للطالب دون سن 18 عاماً، ينشئ ولي الأمر أو الوصي القانوني الحساب ويحجز ويدفع، وهو الطرف المتعاقد معنا. نعالج بيانات الطفل (الاسم والعمر والمستوى والدروس وملاحظات المعلم ونتيجة اختبار المستوى والمحادثات) لتقديم الدروس التي طلبها ولي الأمر. ويستخدم الأطفال دون سن 16 محادثات الذكاء الاصطناعي بعلم ولي الأمر فقط، وحيث يتطلب القانون موافقة ولي الأمر فهو من يمنحها عن الطفل. نجمع فقط ما يحتاجه التعليم، ويستطيع ولي الأمر مراجعة بيانات طفله أو تصحيحها أو حذفها في أي وقت.'}
                </p>
                <p>
                  {isEn
                    ? 'Lessons are not recorded. Our rules for teachers working with children are in the Terms of Service, section “Children and safeguarding”.'
                    : 'الدروس لا تُسجَّل. وقواعدنا للمعلمين في التعامل مع الأطفال موجودة في شروط الخدمة، قسم "الأطفال وحمايتهم".'}
                </p>
              </div>
            </section>

            {/* Section 7: User Rights & Data Deletion */}
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 7' : 'القسم السابع'} noAccent>
                {isEn ? '7. Your Rights and Data Deletion Requests' : '7. حقوقك وطلب حذف البيانات'}
              </EditorialHeading>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-3 text-sm sm:text-base">
                <p>
                  {isEn
                    ? 'Under applicable data protection regulations, you hold the following rights regarding your personal information:'
                    : 'بموجب قوانين حماية البيانات المعمول بها، فإنك تتمتع بالحقوق الكاملة التالية فيما يخص بياناتك الشخصية:'}
                </p>
                <ul className="list-disc ps-6 space-y-1.5">
                  <li>{isEn ? 'Right to access and review all personal data we hold about you.' : 'الحق في الاطلاع ومراجعة كافة البيانات الشخصية المخزنة لدينا.'}</li>
                  <li>{isEn ? 'Right to rectify incorrect, incomplete, or outdated information.' : 'الحق في تصحيح أو تحديث أي معلومات غير دقيقة.'}</li>
                  <li>{isEn ? 'Right to complete deletion (the "Right to be Forgotten") of your account and records.' : 'الحق في طلب الحذف الشامل والنهائي لحسابك وكافة سجلاتك من النظام.'}</li>
                  <li>{isEn ? 'Right to restrict processing, and to object to processing based on our legitimate interests.' : 'الحق في تقييد المعالجة، والاعتراض على المعالجة القائمة على مصلحتنا المشروعة.'}</li>
                  <li>{isEn ? 'Right to data portability: a copy of the data you gave us, in a common machine-readable format.' : 'الحق في نقل البيانات: نسخة من البيانات التي قدمتها لنا بصيغة شائعة قابلة للقراءة آلياً.'}</li>
                  <li>{isEn ? 'Right to withdraw any consent you gave, at any time, without affecting what was done before.' : 'الحق في سحب أي موافقة منحتها في أي وقت، دون أن يؤثر ذلك على ما تم قبل السحب.'}</li>
                  <li>{isEn ? 'Right to revoke Google OAuth access at any time via your Google Account Security Settings.' : 'الحق في إلغاء صلاحية الوصول لحساب Google في أي وقت عبر إعدادات أمان حسابك في Google.'}</li>
                  <li>{isEn ? 'Right to complain to a data protection authority, in Poland the President of the Personal Data Protection Office (UODO, uodo.gov.pl), or the authority where you live.' : 'الحق في تقديم شكوى إلى هيئة حماية البيانات، وفي بولندا هي مكتب حماية البيانات الشخصية (UODO، uodo.gov.pl)، أو الهيئة المختصة في بلد إقامتك.'}</li>
                </ul>
                <p>
                  {isEn
                    ? 'We do not make decisions about you by automated means alone that have legal or similarly significant effects. AI suggestions are always reviewed by a person.'
                    : 'لا نتخذ بشأنك قرارات آلية بالكامل لها آثار قانونية أو آثار مهمة مماثلة، واقتراحات الذكاء الاصطناعي يراجعها دائماً شخص.'}
                </p>
                <p className="pt-2">
                  {isEn
                    ? 'To use any of these rights, write to privacy@watazawwado.academy. We answer without undue delay and at the latest within one month (extendable only where the GDPR allows), free of charge. When we delete data, we remove it from our live systems, except what the law requires us to keep (such as invoices); copies in backups disappear in the normal backup cycle. If we must keep something, we tell you why.'
                    : 'لاستخدام أي من هذه الحقوق، راسلنا على privacy@watazawwado.academy. نرد دون تأخير غير مبرر، وبحد أقصى خلال شهر (يمكن تمديده فقط حيث تسمح اللائحة العامة لحماية البيانات)، ودون أي رسوم. وعند الحذف نزيل البيانات من أنظمتنا، باستثناء ما يلزمنا القانون بالاحتفاظ به (مثل الفواتير)، وتختفي النسخ الاحتياطية ضمن دورتها العادية. وإذا اضطررنا للاحتفاظ بشيء، نخبرك بالسبب.'}
                </p>
              </div>
            </section>

            {/* Section 8: Contact Information */}
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 8' : 'القسم الثامن'} noAccent>
                {isEn ? '8. Contact Information & Data Controller' : '8. بيانات التواصل والمسؤول عن حماية البيانات'}
              </EditorialHeading>

              <div className="glass-card p-6 rounded-2xl border border-border/80 space-y-4 text-sm sm:text-base">
                <p className="text-muted-foreground">
                  {isEn
                    ? 'If you have questions, concerns, or requests regarding this Privacy Policy or the handling of your data, please contact us:'
                    : 'إذا كان لديك أي استفسار أو طلب يتعلق بسياسة الخصوصية أو معالجة بياناتك، يمكنك التواصل معنا عبر الوسائل التالية:'}
                </p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span>privacy@watazawwado.academy</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span>info@watazawwado.academy</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>https://watazawwado.academy</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <span>WhatsApp: +48508157886</span>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Bottom Back Button */}
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
