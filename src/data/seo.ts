/**
 * Search-engine data for the public pages: used in the browser (SEOHead) and at build time
 * (scripts/prerender-seo.ts writes one HTML file per page with these tags, so crawlers and link
 * previews get the right title/description without running JavaScript).
 * Brand name everywhere: "Watazawwado Academy" + "وتزودوا" + the domain, so search engines stop
 * confusing us with similarly named sites.
 */

export const SITE_URL = 'https://watazawwado.academy';
export const BRAND_EN = 'Watazawwado Academy';
export const BRAND_AR = 'أكاديمية وتزودوا';

export interface PageSeo {
  path: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  /** Short visible summary written into the prerendered HTML (replaced by the app once it loads). */
  h1En: string;
}

export const PUBLIC_PAGES: PageSeo[] = [
  {
    path: '/',
    titleEn: 'Watazawwado Academy | Online Quran, Tajweed, Arabic & English',
    titleAr: 'أكاديمية وتزودوا Watazawwado | قرآن وتجويد ومسار الأثر وعربي وإنجليزي',
    descEn: 'Watazawwado Academy: live 1-on-1 Zoom lessons in Quran, Tajweed, the Zad Path, Arabic and English for families and adults. Free 30-minute trial.',
    descAr: 'أكاديمية وتزودوا: حصص فردية مباشرة على Zoom في القرآن والتجويد ومسار الأثر والعربية والإنجليزية، للأطفال والكبار حول العالم. أول حصة مجاناً ٣٠ دقيقة.',
    h1En: 'Watazawwado Academy — online 1-on-1 Quran, Arabic & English'
  },
  {
    path: '/about',
    titleEn: 'About Watazawwado Academy: our mission and teachers',
    titleAr: 'عن أكاديمية وتزودوا ومعلمينا | Watazawwado',
    descEn: 'Who we are and why we teach: an online academy for one-on-one lessons, balanced and moderate, with an Azhari foundation, following Ahl al-Sunnah wal-Jama‘ah.',
    descAr: 'إحنا مين وليه بنعلّم: أكاديمية أونلاين لحصص فردية، بتعليم وسطي معتدل وتأسيس أزهري في العقيدة على منهج أهل السنة والجماعة.',
    h1En: 'About Watazawwado Academy'
  },
  {
    path: '/how-it-works',
    titleEn: 'How it works: free trial & lessons | Watazawwado Academy',
    titleAr: 'إزاي بنشتغل: الحصة التجريبية والحصص | وتزودوا Watazawwado',
    descEn: 'Create a free account, book a free 30-minute trial, take a short placement test, then learn 1-on-1 on Zoom at times that suit you.',
    descAr: 'اعمل حساب مجاني، احجز حصة تجريبية مجانية 30 دقيقة، خد اختبار تحديد مستوى قصير، وبعدها اتعلم حصص فردية على زووم في الوقت اللي يناسبك.',
    h1En: 'How Watazawwado Academy works'
  },
  {
    path: '/learning',
    titleEn: 'Quran, Tajweed, Arabic & English Classes | Watazawwado',
    titleAr: 'المواد: القرآن والتجويد والعربية والإنجليزية | وتزودوا',
    descEn: 'Quran reading, Tajweed, memorization and revision, the Zad Path (Zad Essentials and Seerah), Fusha, Egyptian Arabic and English, taught 1-on-1 online.',
    descAr: 'قراءة القرآن، التجويد، الحفظ والمراجعة، مسار الأثر (أول الزاد والسيرة)، الفصحى، العامية المصرية، والإنجليزية: حصص فردية أونلاين.',
    h1En: 'Subjects at Watazawwado Academy'
  },
  {
    path: '/pricing',
    titleEn: 'Prices & packages — from $9/hour | Watazawwado Academy',
    titleAr: 'الأسعار والباقات — من 9 دولار للساعة | وتزودوا Watazawwado',
    descEn: 'Quran, Tajweed and the Zad Path from $9 an hour; Fusha, Egyptian Arabic and English from $13. Packages of 4, 8 or 12 lessons, family discount, free trial.',
    descAr: 'القرآن والتجويد ومسار الأثر من 9 دولار للساعة، والفصحى والعامية المصرية والإنجليزية من 13 دولار. باقات 4 و8 و12 حصة وخصم عائلي، وحصة تجريبية مجانية.',
    h1En: 'Prices and packages'
  },
  {
    path: '/faq',
    titleEn: 'Frequently asked questions | Watazawwado Academy',
    titleAr: 'الأسئلة الشائعة | وتزودوا Watazawwado',
    descEn: 'Answers about the free trial, Zoom lessons, teachers, scheduling, cancellations, payments and packages at Watazawwado Academy.',
    descAr: 'إجابات عن الحصة التجريبية، حصص زووم، المعلمين، المواعيد، الإلغاء، الدفع والباقات في أكاديمية وتزودوا.',
    h1En: 'Frequently asked questions'
  },
  {
    path: '/safety',
    titleEn: 'Your child’s safety in lessons | Watazawwado Academy',
    titleAr: 'أمان ابنك في الحصص | وتزودوا Watazawwado',
    descEn: 'Parents can sit in, the teacher hosts every Zoom lesson with a waiting room, lessons are not recorded and teachers talk to students only on our platform.',
    descAr: 'ولي الأمر يقدر يحضر، والمعلم هو مضيف كل حصة Zoom مع غرفة انتظار، والحصص مش بتتسجّل، والمعلم بيكلّم الطالب على منصتنا بس.',
    h1En: 'Your child’s safety'
  },
  {
    path: '/community',
    titleEn: 'Our community for families and students | Watazawwado Academy',
    titleAr: 'مجتمع وتزودوا لأسرنا وطلابنا | وتزودوا Watazawwado',
    descEn: 'A closed community inside your account: a Hall of Honor for big milestones and a class board for effort, shared only when the family agrees.',
    descAr: 'مجتمع مقفول جوه حسابك: لوحة شرف للإنجازات الكبيرة ولوحة حلقة للمجهود، وبيظهر بس لما الأسرة توافق.',
    h1En: 'Our community'
  },
  {
    path: '/privacy',
    titleEn: 'Privacy policy | Watazawwado Academy',
    titleAr: 'سياسة الخصوصية | وتزودوا Watazawwado',
    descEn: 'How Watazawwado Academy collects, uses and protects your personal data.',
    descAr: 'إزاي أكاديمية وتزودوا بتجمع بياناتك الشخصية وبتستخدمها وبتحميها.',
    h1En: 'Privacy policy'
  },
  {
    path: '/terms',
    titleEn: 'Terms of service & cancellation policy | Watazawwado Academy',
    titleAr: 'الشروط وسياسة الإلغاء والاسترداد | وتزودوا Watazawwado',
    descEn: 'Terms of service of Watazawwado Academy, including booking, cancellation, rescheduling and refund rules.',
    descAr: 'شروط استخدام أكاديمية وتزودوا، بما فيها قواعد الحجز والإلغاء وتغيير الميعاد والاسترداد.',
    h1En: 'Terms of service'
  }
];

export const findPageSeo = (path: string) => PUBLIC_PAGES.find((p) => p.path === path) || null;

/** English lives at the plain path, Arabic under /ar (owner 2026-10-28). pageUrl('/pricing', 'ar') -> https://.../ar/pricing */
export const pagePath = (path: string, lang: 'ar' | 'en') => (lang === 'en' ? path : path === '/' ? '/ar' : `/ar${path}`);
export const pageUrl = (path: string, lang: 'ar' | 'en') => `${SITE_URL}${pagePath(path, lang)}`;
