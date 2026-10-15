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
    titleEn: 'Watazawwado Academy (وتزودوا) | Online 1-on-1 Quran, Arabic & Islamic Studies',
    titleAr: 'أكاديمية وتزودوا Watazawwado Academy | دروس قرآن وعربي ودراسات إسلامية أونلاين',
    descEn: 'Watazawwado Academy (watazawwado.academy): live 1-on-1 Zoom lessons in Quran, Tajweed, Islamic studies, Arabic and English for Muslim families and adults worldwide. Free 30-minute trial.',
    descAr: 'أكاديمية وتزودوا: حصص فردية مباشرة على زووم في القرآن والتجويد والدراسات الإسلامية والعربية والإنجليزية للأطفال والكبار حول العالم. حصة تجريبية مجانية 30 دقيقة.',
    h1En: 'Watazawwado Academy — online 1-on-1 Quran, Arabic & Islamic studies'
  },
  {
    path: '/about',
    titleEn: 'About Watazawwado Academy & our teachers | وتزودوا',
    titleAr: 'عن أكاديمية وتزودوا ومعلمينا | Watazawwado',
    descEn: 'Meet the teachers of Watazawwado Academy: balanced, moderate teaching with an Azhari foundation in Aqeedah, following Ahl al-Sunnah wal-Jama‘ah, for children and adults.',
    descAr: 'تعرّف على معلمي أكاديمية وتزودوا: تعليم وسطي معتدل بتأسيس أزهري في العقيدة على منهج أهل السنة والجماعة، للأطفال والكبار.',
    h1En: 'About Watazawwado Academy'
  },
  {
    path: '/how-it-works',
    titleEn: 'How it works — free trial, placement test & lessons | Watazawwado Academy',
    titleAr: 'إزاي بنشتغل — الحصة التجريبية واختبار المستوى والحصص | وتزودوا Watazawwado',
    descEn: 'Create a free account, book a free 30-minute trial, take a short placement test, then learn 1-on-1 on Zoom at times that suit you. See how Watazawwado Academy works.',
    descAr: 'اعمل حساب مجاني، احجز حصة تجريبية مجانية 30 دقيقة، خد اختبار تحديد مستوى قصير، وبعدها اتعلم حصص فردية على زووم في الوقت اللي يناسبك.',
    h1En: 'How Watazawwado Academy works'
  },
  {
    path: '/learning',
    titleEn: 'Subjects — Quran, Tajweed, Hifz, Islamic studies, Arabic & English | Watazawwado',
    titleAr: 'المواد — القرآن والتجويد والحفظ والعلوم الشرعية والعربية والإنجليزية | وتزودوا Watazawwado',
    descEn: 'Quran reading (Noorani Qaida), Tajweed, memorization and revision, Aqeedah, Fiqh, Seerah, Modern Standard Arabic, Egyptian Arabic, Arabic conversation and English — 1-on-1 online.',
    descAr: 'القراءة والقاعدة النورانية، التجويد، الحفظ والمراجعة، العقيدة والفقه والسيرة، العربية الفصحى والمصرية والمحادثة، والإنجليزية — حصص فردية أونلاين.',
    h1En: 'Subjects at Watazawwado Academy'
  },
  {
    path: '/pricing',
    titleEn: 'Prices & packages — from $9/hour | Watazawwado Academy',
    titleAr: 'الأسعار والباقات — من 9 دولار للساعة | وتزودوا Watazawwado',
    descEn: 'Quran, Tajweed and Islamic studies from $9 an hour; Arabic and English from $13 an hour. Packages of 4, 8 or 12 lessons and a family discount. Free trial lesson.',
    descAr: 'القرآن والتجويد والعلوم الشرعية من 9 دولار للساعة، والعربية والإنجليزية من 13 دولار. باقات 4 و8 و12 حصة وخصم عائلي، وحصة تجريبية مجانية.',
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
