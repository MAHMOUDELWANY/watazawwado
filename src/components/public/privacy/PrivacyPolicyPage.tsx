import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, MarginNote, BrandGlassCard } from '../PublicDesignSystem';
import { ShieldCheck, Lock, Eye, FileText, Mail, Globe, CheckCircle2 } from 'lucide-react';

export function PrivacyPolicyPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <MarginNote className="mx-auto flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isEn ? 'Legal & Transparency' : 'الشفافية والالتزام القانوني'}</span>
            </MarginNote>
            
            <h1 className="font-editorial text-4xl sm:text-5xl text-foreground font-bold">
              {isEn ? 'Privacy Policy' : 'سياسة الخصوصية'}
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? 'Your privacy and trust are paramount. Learn how Watazawwado Academy collects, uses, protects, and handles your personal information.'
                : 'خصوصيتك وثقتك هما أولويتنا القصوى. توضح هذه الوثيقة كيف تجمع منصة وتزودوا التعليمية بياناتك وتحميها وتتعامل معها بكل أمان.'}
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold">
              <span>{isEn ? 'Last Updated: October 2026' : 'آخر تحديث: أكتوبر 2026'}</span>
              <span>•</span>
              <span>watazawwado.academy</span>
            </div>
          </div>

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
                      Welcome to <strong>Watazawwado Academy</strong> (accessible at <a href="https://watazawwado.academy" className="text-teal-600 dark:text-teal-400 underline">watazawwado.academy</a>). This platform is a dedicated, independent educational practice founded and operated by <strong>Ustadh Mahmoud Said Alwani</strong>, offering personalized 1-on-1 online instruction in the Holy Quran, Tajweed, Arabic Language, and Islamic Studies.
                    </>
                  ) : (
                    <>
                      أهلاً بك في <strong>منصة وتزودوا التعليمية (Watazawwado Academy)</strong> المتاحة عبر الرابط (<a href="https://watazawwado.academy" className="text-teal-600 dark:text-teal-400 underline">watazawwado.academy</a>). تُدار المنصة تحت إشراف <strong>الأستاذ محمود سعيد علواني</strong> لتقديم دروس فردية مباشرة ومخصصة لتعليم القرآن الكريم والتجويد واللغة العربية والدراسات الإسلامية للطلاب في مختلف أنحاء العالم.
                    </>
                  )}
                </p>
                <p>
                  {isEn
                    ? 'By using our website, signing up for an account, or scheduling lessons, you agree to the collection and use of information in accordance with this Privacy Policy.'
                    : 'باستخدامك لموقعنا الإلكتروني، أو تسجيل حساب جديد، أو حجز الدروس، فإنك توافق على جمع واستخدام المعلومات وفقاً لبنود سياسة الخصوصية هذه.'}
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
                      ? 'Student age category (adult or child), parent/guardian contact name and contact details (for minor students), learning goals, current level, timezone, and preferred schedule.'
                      : 'فئة الطالب (بالغ أو طفل)، اسم وبيانات ولي الأمر (في حال كان الطالب قاصراً)، الأهداف التعليمية، المستوى الحالي، المنطقة الزمنية، والمواعيد المفضلة.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Payment & Transaction Records:' : 'سجلات الدفع والتحويلات:'}</strong>{' '}
                    {isEn
                      ? 'Payment method chosen (e.g. PayPal, Payoneer, Bank Transfer, ACH), transaction reference number, and payment proof submitted for verification. We do not process or store credit card numbers directly on our servers.'
                      : 'طريقة الدفع المختارة (مثل PayPal أو Payoneer أو التحويل البنكي)، ورقم المعاملة المرجعي لتأكيد الحجز. لا نخزن أو نعالج أي أرقام بطاقات ائتمانية على خوادمنا.'}
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
                    <strong>Vercel Inc.</strong> — {isEn ? 'Global edge application deployment and SSL/TLS encryption in transit.' : 'استضافة واجهة الويب والتشفير الكامل للبيانات أثناء النقل (SSL/TLS).'}
                  </li>
                </ul>
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
                    ? 'For any student under 18 years of age, registration, bookings, and communications must be initiated with the explicit consent and oversight of a parent or legal guardian. We collect the child’s first name and approximate level solely for pedagogical planning. Parents maintain full authority to review, update, or delete their child’s records at any time.'
                    : 'بالنسبة للطلاب دون سن 18 عاماً، يشترط أن تتم الحجوزات والتواصل تحت إشراف وموافقة ولي الأمر أو الوصي القانوني. يتم جمع الاسم الأول للطفل ومستواه لأغراض الخطة التدريسية فقط، ويحتفظ ولي الأمر بالحق الكامل في تعديل أو حذف بيانات طفله متى شاء.'}
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
                  <li>{isEn ? 'Right to revoke Google OAuth access at any time via your Google Account Security Settings.' : 'الحق في إلغاء صلاحية الوصول لحساب Google في أي وقت عبر إعدادات أمان حسابك في Google.'}</li>
                </ul>
                <p className="pt-2">
                  {isEn
                    ? 'To request complete deletion of your account and personal data, please contact us at privacy@watazawwado.academy. Requests are fulfilled within 48 hours without fees.'
                    : 'لطلب حذف حسابك وبياناتك الشخصية بشكل نهائي، يرجى مراسلتنا عبر البريد الإلكتروني privacy@watazawwado.academy، ويتم تنفيذ الطلب خلال 48 ساعة دون أي رسوم.'}
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
                    ? 'If you have questions, concerns, or requests regarding this Privacy Policy or the handling of your data, please contact Ustadh Mahmoud directly:'
                    : 'إذا كان لديك أي استفسار أو طلب يتعلق بسياسة الخصوصية أو معالجة بياناتك، يمكنك التواصل مباشرة مع الأستاذ محمود علواني عبر الوسائل التالية:'}
                </p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span>privacy@watazawwado.academy</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span>mahmoudelwany98@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>https://watazawwado.academy</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <span>WhatsApp: +201552425799</span>
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
