import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Calendar, 
  GraduationCap, 
  Check, 
  Plus, 
  Trash2, 
  Baby, 
  HeartHandshake, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CountryTimezonePicker } from '../../components/ui/CountryTimezonePicker';
import { WhatsAppPhoneInput } from '../../components/ui/WhatsAppPhoneInput';
import { getCountryByCode } from '../../lib/countryTimezones';

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
    avatar: '👨‍🏫'
  },
  {
    id: 'female_teacher',
    gender: 'female',
    nameAr: 'الأستاذة أفنان',
    nameEn: 'Teacher Afnan',
    avatar: '👩‍🏫'
  }
];

export interface ChildOnboardingForm {
  id: string;
  name: string;
  gender: 'male' | 'female';
  teacherGenderPreference: 'male_teacher' | 'female_teacher' | 'auto';
  learningInterest: string;
  currentLevel: string;
  notes: string;
}

export default function StudentOnboardingPage({
  currentProfile,
  session,
  onCompleted,
  onOpenBookingModal
}: StudentOnboardingPageProps) {
  const isRTL = document.documentElement.dir === "rtl";
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [learnerType, setLearnerType] = useState<'adult' | 'child'>(
    currentProfile?.learnerType === 'child' || currentProfile?.canBookForChild ? 'child' : 'adult'
  );

  // Adult learner details
  const [studentName, setStudentName] = useState(currentProfile?.name || '');
  const [gender, setGender] = useState<'male' | 'female'>(
    currentProfile?.gender === 'female' ? 'female' : 'male'
  );
  const [teacherGenderPreference, setTeacherGenderPreference] = useState<'male_teacher' | 'female_teacher'>(
    currentProfile?.teacherGenderPreference === 'female_teacher' || currentProfile?.gender === 'female'
      ? 'female_teacher'
      : 'male_teacher'
  );
  const [learningInterest, setLearningInterest] = useState(currentProfile?.learningInterest || 'quran-reading');
  const [currentLevel, setCurrentLevel] = useState(currentProfile?.currentLevel || 'beginner');
  const [learningGoal, setLearningGoal] = useState(currentProfile?.learningGoal || '');
  const [learningNeeds, setLearningNeeds] = useState(currentProfile?.learningNeeds || '');

  // Parent / Family details
  const [parentName, setParentName] = useState(currentProfile?.guardian?.parentName || currentProfile?.name || '');
  const [children, setChildren] = useState<ChildOnboardingForm[]>(() => {
    if (Array.isArray(currentProfile?.linkedChildren) && currentProfile.linkedChildren.length > 0) {
      return currentProfile.linkedChildren.map((c: any, idx: number) => ({
        id: c.id || `child-${idx + 1}`,
        name: c.name || '',
        gender: c.gender === 'female' ? 'female' : 'male',
        teacherGenderPreference: c.gender === 'female' ? 'female_teacher' : 'male_teacher',
        learningInterest: c.learningInterest || 'quran-reading',
        currentLevel: c.currentLevel || 'beginner',
        notes: c.notes || ''
      }));
    }
    return [
      {
        id: 'child-1',
        name: '',
        gender: 'male',
        teacherGenderPreference: 'auto',
        learningInterest: 'quran-reading',
        currentLevel: 'beginner',
        notes: ''
      }
    ];
  });

  // Country, Timezone & WhatsApp
  const [country, setCountry] = useState(currentProfile?.country || 'EG');
  const [timezone, setTimezone] = useState(() => {
    const meta = getCountryByCode(currentProfile?.country || 'EG');
    return meta?.primaryTimezone || currentProfile?.timezone || 'Africa/Cairo';
  });

  const [whatsapp, setWhatsapp] = useState(currentProfile?.whatsapp || '');
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSuccess, setCompletedSuccess] = useState(false);
  const [assignedTeacherName, setAssignedTeacherName] = useState<string>(() => {
    const isFemale = currentProfile?.gender === 'female' || currentProfile?.teacherGenderPreference === 'female_teacher';
    return isFemale
      ? (isRTL ? 'الأستاذة أفنان' : 'Teacher Afnan')
      : (isRTL ? 'الأستاذ محمود علواني' : 'Ustadh Mahmoud Elwany');
  });

  // Handle adult gender switch -> auto routes teacher
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

  // Children helpers
  const handleAddChild = () => {
    setChildren(prev => [
      ...prev,
      {
        id: `child-${Date.now()}-${prev.length + 1}`,
        name: '',
        gender: 'male',
        teacherGenderPreference: 'auto',
        learningInterest: 'quran-reading',
        currentLevel: 'beginner',
        notes: ''
      }
    ]);
  };

  const handleRemoveChild = (index: number) => {
    if (children.length <= 1) return;
    setChildren(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateChild = (index: number, partial: Partial<ChildOnboardingForm>) => {
    setChildren(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...partial };
      return copy;
    });
  };

  // Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Validation
    if (learnerType === 'adult') {
      if (!studentName.trim() || studentName.trim().length < 2) {
        setError(isRTL ? 'يرجى إدخال اسم الدارس بالكامل (حرفان على الأقل).' : 'Please enter your full name (at least 2 characters).');
        setStep(1);
        return;
      }
    } else {
      if (!parentName.trim() || parentName.trim().length < 2) {
        setError(isRTL ? 'يرجى إدخال اسم ولي الأمر بالكامل.' : 'Please enter parent/guardian full name.');
        setStep(1);
        return;
      }
      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        if (!c.name.trim() || c.name.trim().length < 2) {
          setError(isRTL ? `يرجى إدخال اسم الطفل رقم (${i + 1}) بالكامل.` : `Please enter full name for child #${i + 1}.`);
          setStep(2);
          return;
        }
      }
    }

    if (!whatsapp.trim() || !isPhoneValid) {
      setError(isRTL ? 'يرجى إدخال رقم هاتف صحيح عليه تطبيق واتساب للتواصل.' : 'Please enter a valid phone number with active WhatsApp.');
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

      const payload: Record<string, any> = {
        learnerType,
        country,
        timezone,
        whatsapp: whatsapp.trim()
      };

      if (learnerType === 'adult') {
        payload.name = studentName.trim();
        payload.gender = gender;
        payload.teacherGenderPreference = teacherGenderPreference;
        payload.learningInterest = learningInterest;
        payload.currentLevel = currentLevel;
        payload.learningGoal = learningGoal.trim();
        payload.learningNeeds = learningNeeds.trim();
      } else {
        payload.name = parentName.trim();
        payload.parentName = parentName.trim();
        payload.parentWhatsapp = whatsapp.trim();
        payload.children = children.map(c => ({
          name: c.name.trim(),
          gender: c.gender,
          teacherGenderPreference: c.teacherGenderPreference,
          learningInterest: c.learningInterest,
          currentLevel: c.currentLevel,
          notes: c.notes.trim()
        }));
      }

      const res = await fetch('/api/student/onboarding', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
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

  // Success view
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
              {isRTL ? 'تم إعداد حسابك وملفك العائلي بنجاح!' : 'Your Learning Account is Ready!'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {learnerType === 'child' ? (
                isRTL 
                  ? `تم تسجيل بيانات ${children.length} من الأبناء وربطهم بالمعلمين المعتمدين. خطوتكم القادمة هي حجز جلسة التعارف وتحديد المستوى الأولى لكل طفل.`
                  : `Successfully registered ${children.length} learner(s) with dedicated instructors. Next, book their first 1-on-1 trial session.`
              ) : (
                isRTL 
                  ? `مرحباً بك في منصة وتزودوا. تم توجيه ملفك بنجاح إلى (${assignedTeacherName}). خطوتك القادمة هي حجز جلستك الأولى للتعارف وتحديد المستوى.`
                  : `Welcome to Watazawwado. Your profile has been assigned to ${assignedTeacherName}. Next, schedule your first 1-on-1 session.`
              )}
            </p>
          </div>

          {learnerType === 'child' ? (
            <div className="space-y-3 text-start">
              <span className="text-xs font-semibold text-muted-foreground block">
                {isRTL ? 'الأبناء المسجلون وتوزيع المعلمين:' : 'Registered Learners & Assigned Teachers:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {children.map((c, idx) => {
                  const teacher = c.teacherGenderPreference === 'female_teacher' 
                    ? (isRTL ? 'المعلمة أفنان' : 'Teacher Afnan')
                    : (c.teacherGenderPreference === 'male_teacher' 
                      ? (isRTL ? 'الأستاذ محمود' : 'Ustadh Mahmoud')
                      : (c.gender === 'female' ? (isRTL ? 'المعلمة أفنان' : 'Teacher Afnan') : (isRTL ? 'الأستاذ محمود' : 'Ustadh Mahmoud')));
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl glass-surface border border-border/60 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          <span>{c.gender === 'female' ? '👧' : '👦'}</span>
                          <span>{c.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {c.currentLevel} • {SERVICES_OPTIONS.find(s => s.id === c.learningInterest)?.labelAr?.split(' ')[0] || ''}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                        {teacher}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl glass-surface border border-border/60 text-start flex items-center gap-3.5">
              <GraduationCap className="w-6 h-6 text-primary shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-foreground block">
                  {isRTL ? 'المعلم المعين لرحلتك:' : 'Assigned Instructor:'}
                </span>
                <span className="text-primary font-bold">{assignedTeacherName}</span>
              </div>
            </div>
          )}

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
              <span>{isRTL ? 'احجز الجلسة الفردية الأولى (مجانًا)' : 'Book Free Trial Lesson'}</span>
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
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {isRTL ? 'إعداد الحساب والمسار التعليمي' : 'Personalized Onboarding'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          {learnerType === 'child'
            ? (isRTL ? 'إعداد حساب العائلة والأبناء' : 'Set Up Family & Children Profile')
            : (isRTL ? 'تخصيص ملفك ومسارك الدراسي' : 'Set Up Your Learning Profile')}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {isRTL 
            ? 'خطوات يسيرة ومحكمة لمساعدتنا على مواءمة خطتك واختيار المعلم المعتمد الأنسب لأهدافك.'
            : 'Quick, tailored setup ensuring you get the most suited teacher and optimal learning pace.'}
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
        {/* ================= STEP 1: ACCOUNT TYPE & PRIMARY CONTACT ================= */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* 1. Learner Type Selector */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                {isRTL ? 'نوع الحساب وطبيعة الدارسين:' : 'Who will be taking the lessons?'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      {isRTL ? 'طالب بنفسي (بالغ / راشد)' : 'Adult Learner (For Myself)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {isRTL ? 'سأدرس بنفسي في جلسات فردية خاصة' : 'I am enrolling for my own individual lessons'}
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
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <span>{isRTL ? 'ولي أمر (حساب عائلي للأبناء)' : 'Parent / Family Account'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {isRTL ? 'تسجيل وإدارة دروس أطفالي واختيار معلم لكل طفل' : 'Enrolling one or multiple children with teacher preferences'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Primary Account Holder Name */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {learnerType === 'child'
                  ? (isRTL ? 'اسم ولي الأمر (الأب / الأم)' : "Parent / Guardian Full Name")
                  : (isRTL ? 'الاسم بالكامل' : 'Your Full Name')}
              </label>
              <input
                type="text"
                value={learnerType === 'child' ? parentName : studentName}
                onChange={(e) => {
                  if (learnerType === 'child') {
                    setParentName(e.target.value);
                  } else {
                    setStudentName(e.target.value);
                  }
                }}
                placeholder={isRTL ? 'مثال: عبد الرحمن طارق' : 'e.g. Tariq Rahman'}
                className="w-full px-4 py-3 rounded-xl border border-border glass-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
            </div>

            {/* 3. If Adult: Gender & Teacher Preferences */}
            {learnerType === 'adult' && (
              <>
                <div className="space-y-3 pt-1">
                  <label className="block text-sm font-semibold text-foreground">
                    {isRTL ? 'الجنس' : 'Gender'}
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
                      <span className="text-base">👦 {isRTL ? 'ذكر (طالب)' : 'Male'}</span>
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
                      <span className="text-base">👧 {isRTL ? 'أنثى (طالبة)' : 'Female'}</span>
                    </button>
                  </div>
                </div>

                {/* Teacher Selection for Adult */}
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
                      : 'Automatically assigned based on gender. You can freely switch between instructors:'}
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
                                </div>
                              </div>

                              {isSelected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-xs">
                                  <Check className="w-3 h-3" />
                                  <span>{isRTL ? 'مختار' : 'Selected'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 4. Automated Country & Timezone (Locked Timezone per selection) */}
            <div className="p-4 sm:p-5 rounded-2xl glass-surface border border-border/70 space-y-4">
              <CountryTimezonePicker
                country={country}
                timezone={timezone}
                onCountryChange={(newCountry) => setCountry(newCountry)}
                onTimezoneChange={(newTz) => setTimezone(newTz)}
                isAr={isRTL}
                showTimePreview={true}
              />
            </div>

            {/* 5. WhatsApp Phone Input with Country Code & Validation */}
            <div>
              <WhatsAppPhoneInput
                countryCode={country}
                value={whatsapp}
                onChange={(formatted, valid) => {
                  setWhatsapp(formatted);
                  setIsPhoneValid(valid);
                }}
                isAr={isRTL}
                required={true}
              />
            </div>

            {/* Next Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const nameToCheck = learnerType === 'child' ? parentName : studentName;
                  if (!nameToCheck.trim()) {
                    setError(isRTL ? 'يرجى إدخال الاسم بالكامل للمتابعة.' : 'Please enter the full name to proceed.');
                    return;
                  }
                  if (!whatsapp.trim() || !isPhoneValid) {
                    setError(isRTL ? 'يرجى التأكد من كتابة رقم الواتساب بالصيغة الصحيحة لدولتك.' : 'Please enter a valid WhatsApp number for your country.');
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer"
              >
                <span>
                  {learnerType === 'child' 
                    ? (isRTL ? 'المتابعة: بيانات الأبناء' : 'Continue: Children Details')
                    : (isRTL ? 'المتابعة: المادة والمستوى' : 'Continue: Subject & Level')}
                </span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 2: LEARNING CONFIGURATION ================= */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* PARENT WORKFLOW: MULTI-CHILD MANAGEMENT */}
            {learnerType === 'child' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Baby className="w-5 h-5 text-primary" />
                      <span>{isRTL ? 'بيانات الأبناء والمعلم المفضل' : 'Children Information & Teacher Assignment'}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRTL 
                        ? 'يمكنك إضافة طفل أو طفلين أو أكثر، وتحديد جنس كل طفل والمعلم المناسب له بدقة.'
                        : 'Add 1, 2, or more children with individual gender, teacher preference, and subjects.'}
                    </p>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {children.length} {isRTL ? (children.length === 1 ? 'طفل' : 'أبناء') : 'Child(ren)'}
                  </span>
                </div>

                {/* Children Cards List */}
                <div className="space-y-5">
                  {children.map((child, index) => {
                    const currentTeacherPreference = child.teacherGenderPreference === 'auto'
                      ? (child.gender === 'female' ? 'female_teacher' : 'male_teacher')
                      : child.teacherGenderPreference;

                    return (
                      <div
                        key={child.id}
                        className="p-5 sm:p-6 rounded-2xl glass-surface border border-border/80 shadow-xs space-y-4 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-secondary/15 text-foreground border border-border/60">
                            <span>{child.gender === 'female' ? '👧' : '👦'}</span>
                            <span>{isRTL ? `الطفل (${index + 1})` : `Child #${index + 1}`}</span>
                          </span>

                          {children.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(index)}
                              className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title={isRTL ? 'حذف هذا الطفل' : 'Remove child'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isRTL ? 'حذف' : 'Remove'}</span>
                            </button>
                          )}
                        </div>

                        {/* Child Name & Gender */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                          <div className="sm:col-span-7">
                            <label className="block text-xs font-semibold text-foreground mb-1">
                              {isRTL ? 'اسم الابن / الابنة بالكامل' : "Child's Full Name"}
                            </label>
                            <input
                              type="text"
                              value={child.name}
                              onChange={(e) => handleUpdateChild(index, { name: e.target.value })}
                              placeholder={isRTL ? 'مثال: يوسف، فاطمة...' : 'e.g. Yusuf, Fatima...'}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border glass-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <label className="block text-xs font-semibold text-foreground mb-1">
                              {isRTL ? 'الجنس' : 'Gender'}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateChild(index, { 
                                    gender: 'male',
                                    teacherGenderPreference: child.teacherGenderPreference === 'auto' ? 'auto' : 'male_teacher'
                                  });
                                }}
                                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  child.gender === 'male'
                                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 font-bold'
                                    : 'border-border/70 glass-card text-muted-foreground'
                                }`}
                              >
                                <span>👦</span>
                                <span>{isRTL ? 'ولد' : 'Boy'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateChild(index, { 
                                    gender: 'female',
                                    teacherGenderPreference: child.teacherGenderPreference === 'auto' ? 'auto' : 'female_teacher'
                                  });
                                }}
                                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  child.gender === 'female'
                                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 font-bold'
                                    : 'border-border/70 glass-card text-muted-foreground'
                                }`}
                              >
                                <span>👧</span>
                                <span>{isRTL ? 'بنت' : 'Girl'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Teacher Assignment for this child */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-xs font-semibold text-foreground">
                            {isRTL ? 'المعلم المعين للطفل:' : 'Assigned Teacher for Child:'}
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateChild(index, { teacherGenderPreference: 'male_teacher' })}
                              className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                                currentTeacherPreference === 'male_teacher'
                                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-medium'
                                  : 'border-border/70 glass-card text-muted-foreground hover:border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">👨‍🏫</span>
                                <div className="text-xs">
                                  <span className="font-bold text-foreground block">{isRTL ? 'الأستاذ محمود علواني' : 'Ustadh Mahmoud'}</span>
                                </div>
                              </div>
                              {currentTeacherPreference === 'male_teacher' && <Check className="w-3.5 h-3.5 text-primary" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateChild(index, { teacherGenderPreference: 'female_teacher' })}
                              className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                                currentTeacherPreference === 'female_teacher'
                                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30 font-medium'
                                  : 'border-border/70 glass-card text-muted-foreground hover:border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">👩‍🏫</span>
                                <div className="text-xs">
                                  <span className="font-bold text-foreground block">{isRTL ? 'الأستاذة أفنان' : 'Teacher Afnan'}</span>
                                </div>
                              </div>
                              {currentTeacherPreference === 'female_teacher' && <Check className="w-3.5 h-3.5 text-primary" />}
                            </button>
                          </div>
                        </div>

                        {/* Subject & Level for this child */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
                              {isRTL ? 'المادة المراد دراستها' : 'Subject of Study'}
                            </label>
                            <select
                              value={child.learningInterest}
                              onChange={(e) => handleUpdateChild(index, { learningInterest: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-border glass-card text-foreground text-xs"
                            >
                              {SERVICES_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id} className="bg-surface text-foreground">
                                  {isRTL ? opt.labelAr : opt.labelEn}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
                              {isRTL ? 'المستوى الحالي للطفل' : 'Current Level'}
                            </label>
                            <select
                              value={child.currentLevel}
                              onChange={(e) => handleUpdateChild(index, { currentLevel: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-border glass-card text-foreground text-xs"
                            >
                              {LEVEL_OPTIONS.map((lvl) => (
                                <option key={lvl.id} value={lvl.id} className="bg-surface text-foreground">
                                  {isRTL ? lvl.titleAr : lvl.titleEn}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Notes for child */}
                        <div>
                          <input
                            type="text"
                            value={child.notes}
                            onChange={(e) => handleUpdateChild(index, { notes: e.target.value })}
                            placeholder={isRTL ? 'ملاحظات خاصة بالطفل (اختياري: العمر، تفضيلات معينة...)' : 'Notes for this child (Optional: age, preferences...)'}
                            className="w-full px-3 py-1.5 rounded-lg border border-border/70 glass-card text-foreground text-xs placeholder:text-muted-foreground/60"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* + Add Another Child Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRTL ? '+ إضافة طفل آخر للحساب العائلي' : '+ Add Another Child to Family'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ADULT WORKFLOW: SUBJECT & LEVEL */
              <div className="space-y-6">
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

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {isRTL ? 'ما هو هدفك الأساسي من هذه الدروس؟' : 'What is your main goal?'}
                  </label>
                  <input
                    type="text"
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                    placeholder={isRTL ? 'مثال: إتقان قراءة سورة البقرة بالتجويد، أو حفظ جزء عم، أو التحدث بالفصحى...' : 'e.g. Read Quran fluently with Tajweed, or memorize Juz Amma'}
                    className="w-full px-4 py-3 rounded-xl border border-border glass-surface text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {isRTL 
                      ? `ملاحظات أو احتياجات دراسية تود مشاركتها مع المعلم (اختياري)`
                      : `Any specific notes or learning needs for the instructor? (Optional)`}
                  </label>
                  <textarea
                    rows={2}
                    value={learningNeeds}
                    onChange={(e) => setLearningNeeds(e.target.value)}
                    placeholder={isRTL ? 'مثال: تفضيل أوقات مسائية، شرح مخارج الحروف بتأنٍ...' : 'e.g. Evening slots preferred, extra focus on pronunciation...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm"
                  />
                </div>
              </div>
            )}

            {/* Back / Continue Buttons */}
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
                onClick={() => {
                  if (learnerType === 'child') {
                    for (let i = 0; i < children.length; i++) {
                      if (!children[i].name.trim()) {
                        setError(isRTL ? `يرجى إدخال اسم الطفل (${i + 1}) للمتابعة.` : `Please enter name for child #${i + 1}.`);
                        return;
                      }
                    }
                  }
                  setError(null);
                  setStep(3);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer"
              >
                <span>{isRTL ? 'المتابعة: مراجعة وتأكيد' : 'Continue: Review & Confirm'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 3: REVIEW & CONFIRMATION ================= */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="text-start pb-2 border-b border-border/70">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{isRTL ? 'مراجعة بيانات الحساب وتأكيد التسجيل' : 'Review & Confirm Profile'}</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL 
                  ? 'يرجى مراجعة التفاصيل أدناه قبل الاعتماد النهائي لحسابك التعليمي.'
                  : 'Please verify the details below before completing your profile.'}
              </p>
            </div>

            {/* Summary Card */}
            <div className="p-5 sm:p-6 rounded-2xl glass-surface border border-border/70 space-y-4 text-start">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground block">
                    {learnerType === 'child' ? (isRTL ? 'ولي الأمر:' : 'Parent Name:') : (isRTL ? 'اسم الدارس:' : 'Learner Name:')}
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {learnerType === 'child' ? parentName : studentName}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block">
                    {isRTL ? 'رقم الواتساب المسجل:' : 'Registered WhatsApp:'}
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm" dir="ltr">
                    {whatsapp}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block">
                    {isRTL ? 'الدولة والمنطقة الزمنية:' : 'Country & Timezone:'}
                  </span>
                  <span className="font-semibold text-foreground">
                    {getCountryByCode(country)?.nameAr || country} ({timezone})
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block">
                    {isRTL ? 'نوع الحساب:' : 'Account Type:'}
                  </span>
                  <span className="font-semibold text-primary">
                    {learnerType === 'child' ? (isRTL ? `عائلي (${children.length} أبناء)` : `Family (${children.length} learners)`) : (isRTL ? 'طالب فردي' : 'Single Learner')}
                  </span>
                </div>
              </div>

              {/* Children Review if Parent */}
              {learnerType === 'child' ? (
                <div className="pt-3 border-t border-border/60 space-y-2.5">
                  <span className="text-xs font-bold text-foreground block">
                    {isRTL ? 'تفاصيل الأبناء والمعلمين المعتمدين:' : 'Children & Instructors Breakdown:'}
                  </span>
                  <div className="space-y-2">
                    {children.map((c, i) => {
                      const teacher = c.teacherGenderPreference === 'female_teacher' 
                        ? (isRTL ? 'المعلمة أفنان' : 'Teacher Afnan')
                        : (c.teacherGenderPreference === 'male_teacher' 
                          ? (isRTL ? 'الأستاذ محمود علواني' : 'Ustadh Mahmoud')
                          : (c.gender === 'female' ? (isRTL ? 'المعلمة أفنان' : 'Teacher Afnan') : (isRTL ? 'الأستاذ محمود علواني' : 'Ustadh Mahmoud')));
                      const subject = SERVICES_OPTIONS.find(s => s.id === c.learningInterest)?.labelAr || c.learningInterest;

                      return (
                        <div key={i} className="p-3 rounded-xl glass-card border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span>{c.gender === 'female' ? '👧' : '👦'}</span>
                            <span className="font-bold text-foreground text-sm">{c.name}</span>
                            <span className="text-muted-foreground">• {subject} ({c.currentLevel})</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 font-bold text-primary">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>{teacher}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'المعلم المعين:' : 'Instructor:'}</span>
                    <span className="font-bold text-primary">{assignedTeacherName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'المسار الدراسي:' : 'Subject:'}</span>
                    <span className="font-semibold text-foreground">
                      {SERVICES_OPTIONS.find(s => s.id === learningInterest)?.labelAr || learningInterest}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit and Back */}
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
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl btn-primary-material text-primary-foreground font-bold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isRTL ? 'جاري حفظ البيانات...' : 'Saving Profile...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isRTL ? 'تأكيد وإتمام الإعداد' : 'Confirm & Complete'}</span>
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
