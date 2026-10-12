import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  User, 
  Users, 
  Target, 
  Clock, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  Sparkles, 
  HelpCircle,
  Calendar,
  ShieldCheck,
  GraduationCap,
  Check,
  HeartHandshake
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CountryTimezonePicker } from '../../components/ui/CountryTimezonePicker';

interface StudentOnboardingPageProps {
  currentProfile?: any;
  session?: {
    access_token?: string | null;
  } | null;
  onCompleted?: (profile: any) => void;
  onOpenBookingModal?: () => void;
}

const SERVICES_OPTIONS = [
  { 
    id: 'quran-reading', 
    labelEn: 'Quran Reading (Noorani Qaida / Foundation)',
    labelAr: 'تلاوة القرآن وتأسيس القراءة (القاعدة النورانية)' 
  },
  { 
    id: 'quran-memorization', 
    labelEn: 'Quran Memorization (Hifz)',
    labelAr: 'حفظ القرآن الكريم ومراجعته (الحفظ المتقن)' 
  },
  { 
    id: 'tajweed', 
    labelEn: 'Tajweed Rules & Accurate Pronunciation',
    labelAr: 'أحكام التجويد ومخارج الحروف والإتقان' 
  },
  { 
    id: 'islamic-studies', 
    labelEn: 'Islamic Studies & Daily Fiqh',
    labelAr: 'العلوم الشرعية والفقه اليومي الميسر' 
  },
  { 
    id: 'modern-standard-arabic', 
    labelEn: 'Modern Standard Arabic (Fusha)',
    labelAr: 'اللغة العربية الفصحى وقواعد النحو' 
  },
  { 
    id: 'egyptian-arabic', 
    labelEn: 'Egyptian Colloquial Arabic (Ammiya)',
    labelAr: 'اللهجة المصرية العامية للمحادثة والتواصل' 
  },
  { 
    id: 'english', 
    labelEn: 'English Language Support',
    labelAr: 'اللغة الإنجليزية والمحادثة الأكاديمية' 
  },
];

const LEVEL_OPTIONS = [
  { 
    id: 'beginner', 
    titleEn: 'Complete Beginner', 
    titleAr: 'مبتدئ تماماً',
    descEn: 'Starting from alphabet, basic sounds, or no prior background',
    descAr: 'البدء من الحروف الهجائية، الأصوات الأولية، أو بدون خلفية مسبقة' 
  },
  { 
    id: 'elementary', 
    titleEn: 'Elementary / Foundations', 
    titleAr: 'تأسيسي / مبتدئ متقدم',
    descEn: 'Can identify letters/words; developing basic fluency',
    descAr: 'يميز الحروف والكلمات البسيطة؛ في مرحلة بناء الطلاقة الأولية' 
  },
  { 
    id: 'intermediate', 
    titleEn: 'Intermediate', 
    titleAr: 'متوسط',
    descEn: 'Can read Quran or converse with some hesitation',
    descAr: 'يستطيع القراءة من المصحف أو التحدث مع بعض التردد وبحاجة لضبط' 
  },
  { 
    id: 'advanced', 
    titleEn: 'Advanced', 
    titleAr: 'متقدم / متقن',
    descEn: 'Fluent; polishing Tajweed rules, memorization, or advanced Arabic',
    descAr: 'طلاقة عالية؛ تثبيت الحفظ، دقائق التجويد، أو التعمق اللغوي' 
  },
];

const TEACHERS_CATALOG = [
  {
    id: 'male_teacher',
    gender: 'male',
    nameAr: 'الأستاذ محمود علواني',
    nameEn: 'Ustadh Mahmoud Elwany',
    titleAr: 'المشرف التعليمي ومعلم القرآن واللغات',
    titleEn: 'Lead Instructor — Quran, Tajweed & Arabic',
    avatar: '👨‍🏫',
    tagsAr: ['إجازة في القرآن الكريم', 'تجويد وقراءات', 'العربية الفصحى', 'إتقان الإنجليزية'],
    tagsEn: ['Quran Ijazah', 'Tajweed Mastery', 'Fusha Arabic', 'Fluent English'],
    descriptionAr: 'خريج أزهري معتمد، متمرس في التدريس الفردي الهادئ للمبتدئين والمتقدمين بأسلوب تفاعلي رصين.',
    descriptionEn: 'Azhar-grounded certified educator with 3+ years teaching Quran & Arabic worldwide.'
  },
  {
    id: 'female_teacher',
    gender: 'female',
    nameAr: 'الأستاذة أفنان',
    nameEn: 'Teacher Afnan',
    titleAr: 'معلمة معتمدة للقرآن الكريم وتأسيس البراعم والإناث',
    titleEn: 'Certified Teacher — Quran, Tajweed & Youth Specialist',
    avatar: '👩‍🏫',
    tagsAr: ['تأسيس الأطفال والناشئة', 'تجويد القرآن', 'إناث وأطفال', 'أسلوب تربوي مشجع'],
    tagsEn: ['Kids & Youth Specialist', 'Tajweed & Hifz', 'Female Learners', 'Gentle Pedagogy'],
    descriptionAr: 'معلمة مؤهلة متخصصة في تأسيس الأطفال وبناء حب التلاوة لدى الطالبات والبراعم بصبر وإتقان.',
    descriptionEn: 'Specialized in gentle foundations for young learners and female students.'
  }
];

export default function StudentOnboardingPage({
  currentProfile,
  session,
  onCompleted,
  onOpenBookingModal
}: StudentOnboardingPageProps) {
  const isRTL = document.documentElement.dir === "rtl";
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [learnerType, setLearnerType] = useState<'adult' | 'child'>(currentProfile?.learnerType || 'adult');
  const [studentName, setStudentName] = useState(currentProfile?.name || '');
  const [parentName, setParentName] = useState(currentProfile?.guardian?.parentName || '');
  const [parentWhatsapp, setParentWhatsapp] = useState(currentProfile?.guardian?.parentWhatsapp || '');

  // Smart Routing & Teacher Assignment State
  const [gender, setGender] = useState<'male' | 'female'>(
    currentProfile?.gender === 'female' ? 'female' : 'male'
  );
  const [teacherGenderPreference, setTeacherGenderPreference] = useState<'male_teacher' | 'female_teacher'>(
    currentProfile?.teacherGenderPreference === 'female_teacher' || currentProfile?.gender === 'female'
      ? 'female_teacher'
      : 'male_teacher'
  );
  const [country, setCountry] = useState(currentProfile?.country || 'EG');
  const [assignedTeacherName, setAssignedTeacherName] = useState<string>(() => {
    const isFemale = currentProfile?.gender === 'female' || currentProfile?.teacherGenderPreference === 'female_teacher';
    return isFemale
      ? (isRTL ? 'الأستاذة أفنان' : 'Teacher Afnan')
      : (isRTL ? 'الأستاذ محمود علواني' : 'Ustadh Mahmoud Elwany');
  });

  const handleGenderSelect = (selectedGender: 'male' | 'female') => {
    setGender(selectedGender);
    if (selectedGender === 'male') {
      setTeacherGenderPreference('male_teacher');
      setAssignedTeacherName(isRTL ? 'الأستاذ محمود علواني' : 'Ustadh Mahmoud Elwany');
    } else {
      setTeacherGenderPreference('female_teacher');
      setAssignedTeacherName(isRTL ? 'الأستاذة أفنان' : 'Teacher Afnan');
    }
  };

  const handleTeacherSelect = (teacherId: 'male_teacher' | 'female_teacher') => {
    setTeacherGenderPreference(teacherId);
    if (teacherId === 'male_teacher') {
      setAssignedTeacherName(isRTL ? 'الأستاذ محمود علواني' : 'Ustadh Mahmoud Elwany');
    } else {
      setAssignedTeacherName(isRTL ? 'الأستاذة أفنان' : 'Teacher Afnan');
    }
  };
  
  const [learningInterest, setLearningInterest] = useState(currentProfile?.learningInterest || 'quran-reading');
  const [currentLevel, setCurrentLevel] = useState(currentProfile?.currentLevel || 'beginner');
  
  const [learningGoal, setLearningGoal] = useState(currentProfile?.learningGoal || '');
  const [learningNeeds, setLearningNeeds] = useState(currentProfile?.learningNeeds || '');
  const [whatsapp, setWhatsapp] = useState(currentProfile?.whatsapp || '');
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || currentProfile?.timezone || 'UTC';
    } catch {
      return currentProfile?.timezone || 'UTC';
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!studentName.trim() || studentName.trim().length < 2) {
      setError(isRTL ? 'يرجى إدخال اسم الدارس بالكامل (حرفان على الأقل).' : 'Please provide the learner full name (at least 2 characters).');
      setStep(1);
      return;
    }

    if (learnerType === 'child' && (!parentName.trim() || parentName.trim().length < 2)) {
      setError(isRTL ? 'اسم ولي الأمر مطلوب عند تسجيل الأطفال.' : 'Parent / Guardian name is required for child learners.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = session?.access_token;

      if (!token) {
        throw new Error(isRTL ? 'جلسة تسجيل الدخول منتهية. يرجى تسجيل الدخول مجدداً.' : 'Authentication session unavailable. Please sign in again.');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch('/api/student/onboarding', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: studentName.trim(),
          learnerType,
          gender,
          teacherGenderPreference,
          country,
          parentName: learnerType === 'child' ? parentName.trim() : null,
          parentWhatsapp: learnerType === 'child' ? parentWhatsapp.trim() : null,
          learningInterest,
          currentLevel,
          learningGoal: learningGoal.trim(),
          learningNeeds: learningNeeds.trim(),
          timezone,
          whatsapp: whatsapp.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isRTL ? 'تعذر حفظ بيانات الحساب. يرجى المحاولة لاحقاً.' : 'Failed to complete onboarding. Please try again.'));
      }

      if (data.assignedTeacherName) {
        setAssignedTeacherName(data.assignedTeacherName);
      }

      setCompletedSuccess(true);
      if (onCompleted) {
        onCompleted(data.profile);
      }
    } catch (err: any) {
      setError(err.message || (isRTL ? 'حدث خطأ غير متوقع أثناء إعداد الملف الشخصي.' : 'An unexpected error occurred during onboarding.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card border border-border/60 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {isRTL ? 'تم إعداد ملفك التعليمي بنجاح!' : 'Your Learning Profile is Ready!'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {isRTL 
                ? `مرحباً بك في منصة وتزودوا. تم توجيه ملفك بنجاح إلى (${assignedTeacherName}). خطوتك القادمة هي حجز جلستك الأولى للتعارف وتحديد المستوى.`
                : `Welcome to Watazawwado. Your profile has been assigned to ${assignedTeacherName}. Next, schedule your first 1-on-1 session.`}
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-surface border border-border/60 text-start flex items-center gap-3.5">
            <GraduationCap className="w-6 h-6 text-primary shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-foreground block">
                {isRTL ? 'المعلم المعين لرحلتك:' : 'Assigned Instructor:'}
              </span>
              <span className="text-primary font-bold">{assignedTeacherName}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (onOpenBookingModal) {
                  onOpenBookingModal();
                } else {
                  navigate('/student/book');
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{isRTL ? 'احجز جلستك الفردية الأولى (مجانًا)' : 'Book Your 1-on-1 Free Trial'}</span>
            </button>

            <button
              onClick={() => navigate('/student')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl glass-card border border-border/60 hover:bg-surface-subtle text-foreground font-medium text-sm transition-all cursor-pointer"
            >
              <span>{isRTL ? 'الانتقال إلى لوحة التحكم' : 'Enter Dashboard'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {isRTL ? 'إعداد الحساب والملف التعليمي' : 'Personalized Onboarding'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          {isRTL ? 'تخصيص ملفك ومسارك الدراسي' : 'Set Up Your Learning Profile'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {isRTL 
            ? 'خطوات بسيطة تستغرق دقيقتين لمساعدتنا على مواءمة خطتك واختيار المعلم الأنسب لأهدافك.'
            : 'Takes 2 minutes and helps us adapt each lesson specifically to your pace and goals.'}
        </p>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-10 bg-primary'
                  : s < step
                  ? 'w-6 bg-primary/50'
                  : 'w-6 bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-sm leading-relaxed">
          {error}
        </div>
      )}

      {/* Form Container */}
      <div className="glass-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* 1. Learner Type */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                {isRTL ? 'لمن يتم حجز الدروس؟' : 'Who is taking the lessons?'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLearnerType('adult')}
                  className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-start gap-3.5 ${
                    learnerType === 'adult'
                      ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 font-medium'
                      : 'border-border/70 hover:border-border glass-surface text-muted-foreground'
                  }`}
                >
                  <User className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {isRTL ? 'طالب بالغ / بنفسي' : 'Adult Learner'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {isRTL ? 'سأدرس بنفسي' : 'I am enrolling for myself'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLearnerType('child')}
                  className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-start gap-3.5 ${
                    learnerType === 'child'
                      ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 font-medium'
                      : 'border-border/70 hover:border-border glass-surface text-muted-foreground'
                  }`}
                >
                  <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {isRTL ? 'طفل / ناشئ (ولي أمر)' : 'Child / Youth'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {isRTL ? 'أسجل نيابة عن ابني أو ابنتي' : 'I am enrolling my child'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Learner Full Name */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {learnerType === 'child' 
                  ? (isRTL ? 'اسم الطفل / الدارس بالكامل' : "Child's Full Name")
                  : (isRTL ? 'الاسم بالكامل' : 'Your Full Name')}
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={isRTL ? 'مثال: عبد الرحمن طارق' : 'e.g. Tariq Rahman'}
                className="w-full px-4 py-3 rounded-xl border border-border glass-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
            </div>

            {/* Parent Info if Child */}
            {learnerType === 'child' && (
              <div className="p-4 sm:p-5 rounded-2xl glass-surface border border-border/70 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-primary">
                  {isRTL ? 'بيانات ولي الأمر للتواصل والمتابعة' : 'Parent / Guardian Information'}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {isRTL ? 'اسم ولي الأمر' : 'Parent Name'}
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder={isRTL ? 'مثال: طارق رحمن' : 'e.g. Tariq Rahman'}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border glass-card text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {isRTL ? 'رقم واتساب ولي الأمر (لإرسال التقارير وتحديثات الحصص)' : 'Parent WhatsApp (for lesson updates)'}
                  </label>
                  <input
                    type="tel"
                    value={parentWhatsapp}
                    onChange={(e) => setParentWhatsapp(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border glass-card text-sm text-foreground"
                  />
                </div>
              </div>
            )}

            {/* 3. Gender Selection */}
            <div className="space-y-3 pt-1">
              <label className="block text-sm font-semibold text-foreground">
                {learnerType === 'child' 
                  ? (isRTL ? 'جنس الطفل / الدارس' : "Child's Gender") 
                  : (isRTL ? 'الجنس' : 'Gender')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleGenderSelect('male')}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    gender === 'male'
                      ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/40 font-semibold'
                      : 'border-border/70 hover:border-border glass-surface text-muted-foreground'
                  }`}
                >
                  <span className="text-base">👦 {isRTL ? 'ذكر (طالب / ولد)' : 'Male'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenderSelect('female')}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    gender === 'female'
                      ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/40 font-semibold'
                      : 'border-border/70 hover:border-border glass-surface text-muted-foreground'
                  }`}
                >
                  <span className="text-base">👧 {isRTL ? 'أنثى (طالبة / بنت)' : 'Female'}</span>
                </button>
              </div>
            </div>

            {/* 4. Teacher Selection Cards (Direct 2-Option Selector with Full Transparency) */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-foreground">
                  {isRTL ? 'المعلم المعين لرحلتك التعليمية' : 'Assigned Instructor'}
                </label>
                <span className="text-xs text-primary font-medium">
                  {isRTL ? 'انقر لتغيير المعلم' : 'Tap to switch instructor'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRTL 
                  ? 'تم التعيين تلقائياً بحسب الجنس لتوفير البيئة الأنسب، ويمكنك التبديل بين الأستاذ محمود والأستاذة أفنان بنقرة واحدة:'
                  : 'Automatically routed based on gender. You can freely switch between Ustadh Mahmoud and Teacher Afnan:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {TEACHERS_CATALOG.map((teacher) => {
                  const isSelected = teacherGenderPreference === teacher.id;
                  return (
                    <div
                      key={teacher.id}
                      onClick={() => handleTeacherSelect(teacher.id as 'male_teacher' | 'female_teacher')}
                      className={`relative p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-md'
                          : 'border-border/70 hover:border-primary/40 glass-surface opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{teacher.avatar}</span>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">
                                {isRTL ? teacher.nameAr : teacher.nameEn}
                              </h4>
                              <p className="text-[11px] text-muted-foreground">
                                {isRTL ? teacher.titleAr : teacher.titleEn}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-xs">
                              <Check className="w-3 h-3" />
                              <span>{isRTL ? 'مختار' : 'Selected'}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {isRTL ? teacher.descriptionAr : teacher.descriptionEn}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {(isRTL ? teacher.tagsAr : teacher.tagsEn).map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface border border-border/60 text-foreground/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!studentName.trim()) {
                    setError(isRTL ? 'يرجى إدخال اسم الدارس للمتابعة.' : 'Please enter the learner full name.');
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer"
              >
                <span>{isRTL ? 'المتابعة: المادة والمستوى' : 'Continue: Subject & Level'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                {isRTL ? 'المادة أو المسار الدراسي الأساسي' : 'Primary Subject of Interest'}
              </label>
              <select
                value={learningInterest}
                onChange={(e) => setLearningInterest(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border glass-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              >
                {SERVICES_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-surface text-foreground">
                    {isRTL ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2.5">
                {isRTL ? 'تحديد المستوى الحالي التقريبي' : 'Current Level Assessment'}
              </label>
              <div className="space-y-2.5">
                {LEVEL_OPTIONS.map((lvl) => {
                  const isSelected = currentLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setCurrentLevel(lvl.id)}
                      className={`w-full p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 font-medium'
                          : 'border-border/70 hover:border-border glass-surface text-muted-foreground'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-foreground">
                          {isRTL ? lvl.titleAr : lvl.titleEn}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {isRTL ? lvl.descAr : lvl.descEn}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isRTL ? 'السابق' : 'Back'}
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer"
              >
                <span>{isRTL ? 'المتابعة: الأهداف والتواصل' : 'Continue: Goals & Contact'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {isRTL ? 'ما هو هدفك الأساسي من هذه الدروس؟' : 'What is your main goal for this journey?'}
              </label>
              <input
                type="text"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder={isRTL ? 'مثال: إتقان قراءة سورة البقرة بالتجويد، أو حفظ جزء عم، أو التحدث بالفصحى...' : 'e.g. Read Surah Al-Baqarah fluently with Tajweed, or memorize Juz Amma'}
                className="w-full px-4 py-3 rounded-xl border border-border glass-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
            </div>

            {/* Country & Timezone Selection */}
            <div className="p-4 sm:p-5 rounded-2xl glass-surface border border-border/70">
              <CountryTimezonePicker
                country={country}
                timezone={timezone}
                onCountryChange={(newCountry) => setCountry(newCountry)}
                onTimezoneChange={(newTz) => setTimezone(newTz)}
                isAr={isRTL}
                showTimePreview={true}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {isRTL ? 'رقم الواتساب / الهاتف للتواصل والتنسيق' : 'WhatsApp / Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-primary absolute start-3.5 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {isRTL 
                  ? `ملاحظات أو احتياجات دراسية تود مشاركتها مع (${assignedTeacherName}) (اختياري)`
                  : `Any specific notes or learning needs for ${assignedTeacherName}? (Optional)`}
              </label>
              <textarea
                rows={2}
                value={learningNeeds}
                onChange={(e) => setLearningNeeds(e.target.value)}
                placeholder={isRTL ? 'مثال: يفضل الشرح المرئي، يحتاج تأنياً في مخارج الحروف، التفضيلات الزمنية...' : 'e.g. Prefers visual mnemonics, needs patience with pronunciation, scheduling preferences...'}
                className="w-full px-4 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isRTL ? 'السابق' : 'Back'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isRTL ? 'جاري حفظ الملف...' : 'Saving Profile...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isRTL ? 'إتمام الإعداد وتأكيد الحساب' : 'Complete Onboarding'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
