import React, { useEffect, useState } from 'react';
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
import { Input } from '../../components/ui/Input';
import { BookShelf } from '../../components/onboarding/BookShelf';
import { TravelModeChoice, PassCard, PassField, passInputClass, SealChoice, GuideChoice, FoldedPass, teacherColor } from '../../components/onboarding/TravelPass';
import { JourneyPath, LEVELS } from '../../components/onboarding/JourneyPath';
import { JourneyBackdrop, JourneyTrail } from '../../components/onboarding/JourneyChrome';
import { subjectLabel, findSubject, levelsFor } from '../../components/onboarding/subjects';
import { Label } from '../../components/ui/Label';
import { CountryTimezonePicker } from '../../components/ui/CountryTimezonePicker';
import { WhatsAppPhoneInput } from '../../components/ui/WhatsAppPhoneInput';
import { getCountryByCode, findCountryByTimezone } from '../../lib/countryTimezones';
import { useTeacherAuth } from '../../lib/auth';
import {
  ADULT_MIN_AGE, GUARDIAN_MIN_AGE, CHILD_MIN_AGE, CHILD_MAX_AGE, MAX_AGE,
  parseAge, isAdultAge, isGuardianAge, isChildAge, SIGNUP_CHOICE_KEY
} from '../../lib/ageRules';

interface StudentOnboardingPageProps {
  currentProfile?: any;
  session?: {
    access_token?: string | null;
  } | null;
  onCompleted?: (profile: any) => void;
  onOpenBookingModal?: () => void;
}

export interface TeacherCard { id: string; gender: 'male' | 'female'; nameAr: string; nameEn: string; photo: string | null }

/**
 * Shown only until the real list arrives (GET /api/student/teachers). These ids are not teacher
 * accounts, so they are never sent; the server then routes by the teacher's gender.
 */
const FALLBACK_TEACHERS: TeacherCard[] = [
  { id: 'male_teacher', gender: 'male', nameAr: 'أستاذ محمود', nameEn: 'Ustadh Mahmoud', photo: '/teacher-mahmoud-avatar.jpg' },
  { id: 'female_teacher', gender: 'female', nameAr: 'أستاذة أفنان', nameEn: 'Ustadha Afnan', photo: '/teacher-afnan-avatar.jpg' }
];
const isFallbackTeacherId = (id: string) => FALLBACK_TEACHERS.some((t) => t.id === id);

/** The chosen teacher, else the first one of the learner's gender, else the first teacher. */
export function resolveTeacherCard(teachers: TeacherCard[], id: string, gender: 'male' | 'female'): TeacherCard {
  return teachers.find((t) => t.id === id) || teachers.find((t) => t.gender === gender) || teachers[0] || FALLBACK_TEACHERS[0];
}

/**
 * Country and time zone from the browser's own time zone (no network, nothing stored).
 * Returns null when the zone is not in the served-country list (then /api/geo is asked).
 */
function detectCountryFromBrowser(): { country: string; timezone: string } | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    const found = findCountryByTimezone(tz);
    if (!found || found.code === 'OTHER') return null;
    const inList = found.timezones.some((t) => t.value === tz);
    return { country: found.code, timezone: inList ? tz : found.primaryTimezone };
  } catch {
    return null;
  }
}

export interface ChildOnboardingForm {
  id: string;
  name: string;
  gender: 'male' | 'female';
  teacherGenderPreference: 'male_teacher' | 'female_teacher' | 'auto';
  /** The teacher picked for this child ('' = the first teacher of the child's gender). */
  teacherId: string;
  learningInterest: string;
  currentLevel: string;
  notes: string;
  /** Exact age in years, as typed (required). */
  age: string;
}

export default function StudentOnboardingPage({
  currentProfile,
  session,
  onCompleted,
  onOpenBookingModal
}: StudentOnboardingPageProps) {
  const isRTL = document.documentElement.dir === "rtl";
  const navigate = useNavigate();
  // What the account chose on the sign-up form (personal / family, guardian age).
  const { user } = useTeacherAuth();
  const signupMeta = ((): { account_type?: string; guardian_age?: number | string | null } => {
    const meta = (user?.user_metadata || {}) as { account_type?: string; guardian_age?: number | string };
    if (meta.account_type) return meta;
    try {
      // Google sign-up carries no metadata: use the choice saved by the sign-up form on this device.
      const saved = JSON.parse(localStorage.getItem(SIGNUP_CHOICE_KEY) || 'null');
      if (saved?.accountType === 'family') return { account_type: 'family', guardian_age: saved.guardianAge };
    } catch {}
    return meta;
  })();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [learnerType, setLearnerType] = useState<'adult' | 'child'>(
    currentProfile?.learnerType === 'child' || currentProfile?.canBookForChild || signupMeta.account_type === 'family' ? 'child' : 'adult'
  );
  const [guardianAge, setGuardianAge] = useState<string>(() => {
    const fromSignup = parseAge(signupMeta.guardian_age);
    if (fromSignup) return String(fromSignup);
    return currentProfile?.learnerType === 'child' && currentProfile?.age ? String(currentProfile.age) : '';
  });

  // Teachers to choose from: the real active teachers, so every new teacher appears here.
  const [teachers, setTeachers] = useState<TeacherCard[]>(FALLBACK_TEACHERS);
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    let cancelled = false;
    fetch('/api/student/teachers', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.teachers) ? data.teachers.filter((t: any) => t?.id && t?.nameEn) : [];
        if (!cancelled && list.length) setTeachers(list as TeacherCard[]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session?.access_token]);

  // Adult learner details
  const [studentName, setStudentName] = useState(currentProfile?.name || '');
  const [gender, setGender] = useState<'male' | 'female'>(
    currentProfile?.gender === 'female' ? 'female' : 'male'
  );
  const [teacherId, setTeacherId] = useState<string>(currentProfile?.assignedTeacherId || '');
  const [teacherGenderPreference, setTeacherGenderPreference] = useState<'male' | 'female'>(
    currentProfile?.teacherGenderPreference === 'female_teacher' || currentProfile?.gender === 'female' ? 'female' : 'male'
  );
  const adultTeacher = resolveTeacherCard(teachers, teacherId, teacherGenderPreference);
  const teacherName = (t: TeacherCard) => (isRTL ? t.nameAr : t.nameEn);
  const childTeacher = (c: ChildOnboardingForm) =>
    resolveTeacherCard(teachers, c.teacherId, c.teacherGenderPreference === 'auto' ? c.gender : c.teacherGenderPreference === 'female_teacher' ? 'female' : 'male');
  const [learningInterest, setLearningInterest] = useState(currentProfile?.learningInterest || 'quran-reading');
  const [currentLevel, setCurrentLevel] = useState(currentProfile?.currentLevel || 'beginner');
  const [learningGoal, setLearningGoal] = useState(currentProfile?.learningGoal || '');
  const [age, setAge] = useState<string>(currentProfile?.age ? String(currentProfile.age) : '');
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
        teacherId: c.assignedTeacherId || '',
        learningInterest: c.learningInterest || 'quran-reading',
        currentLevel: c.currentLevel || 'beginner',
        notes: c.notes || '',
        age: c.age ? String(c.age) : ''
      }));
    }
    return [
      {
        id: 'child-1',
        name: '',
        gender: 'male',
        teacherGenderPreference: 'auto',
        teacherId: '',
        learningInterest: 'quran-reading',
        currentLevel: 'beginner',
        notes: '',
        age: ''
      }
    ];
  });

  // Country, Timezone & WhatsApp: the saved country, else detected from this device's time zone
  // (previously this always started on Egypt).
  const [initialPlace] = useState(() => (currentProfile?.country ? null : detectCountryFromBrowser()));
  const [country, setCountry] = useState<string>(currentProfile?.country || initialPlace?.country || 'OTHER');
  const [timezone, setTimezone] = useState<string>(() => {
    if (currentProfile?.country) {
      return currentProfile?.timezone || getCountryByCode(currentProfile.country)?.primaryTimezone || 'UTC';
    }
    if (initialPlace) return initialPlace.timezone;
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  // Time zone not in our list: ask the hosting edge for the visitor's country instead.
  useEffect(() => {
    if (currentProfile?.country || initialPlace) return;
    let cancelled = false;
    fetch('/api/geo')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const code = typeof data?.country === 'string' ? data.country : '';
        const match = code ? getCountryByCode(code) : null;
        if (cancelled || !match || match.code !== code) return;
        setCountry(match.code);
        setTimezone((tz) => (match.timezones.some((t) => t.value === tz) ? tz : match.primaryTimezone));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const [whatsapp, setWhatsapp] = useState(currentProfile?.whatsapp || '');
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Family accounts: only one child's ticket is open at a time; finished ones fold into a pass.
  const childComplete = (c: ChildOnboardingForm) => c.name.trim().length >= 2 && isChildAge(c.age);
  const childAgeMessage = (index: number) => isRTL
    ? `سن الطفل رقم (${index + 1}) لازم يكون من ${CHILD_MIN_AGE} لـ ${CHILD_MAX_AGE} سنة. لو ${ADULT_MIN_AGE} سنة أو أكبر، يفتح حساب شخصي باسمه.`
    : `Child #${index + 1} must be ${CHILD_MIN_AGE} to ${CHILD_MAX_AGE} years old. Learners aged ${ADULT_MIN_AGE}+ open their own account.`;
  const incompleteChildMessage = (index: number) => {
    const c = children[index];
    if (c && c.name.trim().length >= 2 && c.age.trim()) return childAgeMessage(index);
    return isRTL ? `كمّل اسم وسن الطفل رقم (${index + 1}) الأول.` : `Please add the name and age of child #${index + 1} first.`;
  };
  const adultAgeMessage = isRTL
    ? `الحساب الشخصي للي عندهم ${ADULT_MIN_AGE} سنة أو أكتر. لو أقل، ولي أمرك يقدر يفتح حساب عائلة ويسجّلك فيه.`
    : `A personal account is for learners aged ${ADULT_MIN_AGE} or over. Under ${ADULT_MIN_AGE}? A parent can open a family account for you.`;
  const guardianAgeMessage = isRTL
    ? `حساب العائلة بيفتحه ولي أمر عنده ${GUARDIAN_MIN_AGE} سنة أو أكتر.`
    : `A family account is opened by a parent or guardian aged ${GUARDIAN_MIN_AGE} or over.`;
  /** Step one: name, ages, WhatsApp. Returns the first problem, or null. */
  const stepOneProblem = (): string | null => {
    const nameToCheck = learnerType === 'child' ? parentName : studentName;
    if (nameToCheck.trim().length < 2) {
      return isRTL ? 'اكتب الاسم بالكامل (حرفين على الأقل).' : 'Please enter the full name (at least 2 characters).';
    }
    if (learnerType === 'adult' && !isAdultAge(age)) {
      return age.trim() && parseAge(age) !== null && Number(age) < ADULT_MIN_AGE
        ? adultAgeMessage
        : (isRTL ? 'اكتب سنك بالأرقام (مثال: 24).' : 'Please enter your age in numbers (e.g. 24).');
    }
    if (learnerType === 'child' && !isGuardianAge(guardianAge)) return guardianAgeMessage;
    if (!whatsapp.trim() || !isPhoneValid) {
      return isRTL ? 'اكتب رقم واتساب صحيح لدولتك.' : 'Please enter a valid WhatsApp number for your country.';
    }
    return null;
  };
  const [openChild, setOpenChild] = useState<number>(() => {
    const firstIncomplete = children.findIndex((c) => !childComplete(c));
    return firstIncomplete;
  });
  const finishChild = (index: number): boolean => {
    const c = children[index];
    if (!c || childComplete(c)) {
      setError(null);
      setOpenChild(-1);
      return true;
    }
    setError(incompleteChildMessage(index));
    return false;
  };
  const [completedSuccess, setCompletedSuccess] = useState(false);
  const assignedTeacherName = teacherName(adultTeacher);

  // Adult gender switch: suggest the first teacher of the same gender (one tap to change).
  const handleGenderSelect = (selectedGender: 'male' | 'female') => {
    setGender(selectedGender);
    setTeacherGenderPreference(selectedGender);
    setTeacherId('');
  };

  const handleTeacherSelect = (id: string) => {
    const t = teachers.find((x) => x.id === id);
    setTeacherId(id);
    if (t) setTeacherGenderPreference(t.gender);
  };

  // Children helpers
  const handleAddChild = () => {
    if (openChild >= 0 && !finishChild(openChild)) return;
    setOpenChild(children.length);
    setChildren(prev => [
      ...prev,
      {
        id: `child-${Date.now()}-${prev.length + 1}`,
        name: '',
        gender: 'male',
        teacherGenderPreference: 'auto',
        teacherId: '',
        learningInterest: 'quran-reading',
        currentLevel: 'beginner',
        notes: '',
        age: ''
      }
    ]);
  };

  const handleRemoveChild = (index: number) => {
    if (children.length <= 1) return;
    setOpenChild((cur) => (cur === index ? -1 : cur > index ? cur - 1 : cur));
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

    // Validation (same limits as the server: src/lib/ageRules.ts)
    const firstProblem = stepOneProblem();
    if (firstProblem) {
      setError(firstProblem);
      setStep(1);
      return;
    }
    if (learnerType === 'child') {
      const incomplete = children.findIndex((c) => !childComplete(c));
      if (incomplete >= 0) {
        setError(incompleteChildMessage(incomplete));
        setOpenChild(incomplete);
        setStep(2);
        return;
      }
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
        payload.teacherGenderPreference = adultTeacher.gender === 'female' ? 'female_teacher' : 'male_teacher';
        if (!isFallbackTeacherId(adultTeacher.id)) payload.teacherId = adultTeacher.id;
        payload.learningInterest = learningInterest;
        payload.currentLevel = currentLevel;
        payload.learningGoal = learningGoal.trim();
        payload.learningNeeds = learningNeeds.trim();
        payload.age = Number(age);
      } else {
        payload.name = parentName.trim();
        payload.parentName = parentName.trim();
        payload.parentWhatsapp = whatsapp.trim();
        payload.guardianAge = Number(guardianAge);
        payload.children = children.map(c => {
          const t = childTeacher(c);
          return {
          name: c.name.trim(),
          gender: c.gender,
          teacherGenderPreference: t.gender === 'female' ? 'female_teacher' : 'male_teacher',
          ...(isFallbackTeacherId(t.id) ? {} : { teacherId: t.id }),
          learningInterest: c.learningInterest,
          currentLevel: c.currentLevel,
          notes: c.notes.trim(),
          age: Number(c.age)
          };
        });
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
      <div className="relative isolate max-w-2xl mx-auto py-10 sm:py-14 px-4 text-center">
        <JourneyBackdrop />
        {/* The closing moment: the verse the site is named after, revealed word by word. */}
        <div className="mb-8" dir="rtl" lang="ar">
          <p className="font-display text-3xl sm:text-5xl leading-[1.7] text-[#087D91] dark:text-[#5FC3D3]">
            {'﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾'.split(' ').map((w, i) => (
              <motion.span
                key={i}
                className="inline-block mx-1.5"
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.25 + i * 0.28, duration: 0.6 }}
              >
                {w}
              </motion.span>
            ))}
          </p>
          <motion.div
            className="mx-auto mt-3 h-[3px] w-24 rounded-full bg-[#C51F24]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="rounded-[28px] border border-border/60 bg-surface/85 backdrop-blur-xl p-6 sm:p-10 shadow-[0_40px_80px_-40px_rgba(8,125,145,.45)] space-y-6"
        >

          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {isRTL ? 'أهلًا بيك في عائلة وتزودوا' : 'Welcome to the Watazawwado family'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {learnerType === 'child' ? (
                isRTL 
                  ? `تم تسجيل بيانات ${children.length} من الأبناء وربطهم بالمعلمين المعتمدين. الخطوة الجاية: احجزوا الحصة التجريبية، وبعدها اختبار تحديد مستوى قصير لكل طفل.`
                  : `Successfully registered ${children.length} learner(s) with dedicated instructors. Next: book the free trial, then a short placement test for each child.`
              ) : (
                isRTL 
                  ? `مرحباً بك في منصة وتزودوا. تم توجيه ملفك بنجاح إلى (${assignedTeacherName}). الخطوة الجاية: احجز حصتك التجريبية المجانية، وبعدها اختبار تحديد مستوى قصير (حوالي 5 دقايق).`
                  : `Welcome to Watazawwado. Your profile has been assigned to ${assignedTeacherName}. Next: book your free trial, then take a short placement test (about 5 minutes).`
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
                  const teacher = teacherName(childTeacher(c));
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl glass-surface border border-border/60 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          <span>{c.gender === 'female' ? '👧' : '👦'}</span>
                          <span>{c.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {c.currentLevel} • {subjectLabel(c.learningInterest, isRTL)}
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
                navigate('/student/book');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{isRTL ? 'احجز الحصة التجريبية (مجانًا)' : 'Book the free trial'}</span>
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
    <div className="relative isolate max-w-3xl mx-auto py-8 sm:py-12 px-4">
      <JourneyBackdrop />
      {/* Journey header: the trail, then the question of this step */}
      <div className="text-center mb-8 space-y-6">
        <JourneyTrail
          step={step}
          labels={isRTL ? ['مين هيتعلم', 'الزاد', 'الانطلاق'] : ['Who', 'Provision', 'Set off']}
        />
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            {step === 1
              ? (isRTL ? 'مين اللي هيبدأ الرحلة؟' : 'Who is starting the journey?')
              : step === 2
              ? (isRTL ? 'اختار زادك من العلم' : 'Choose your provision of knowledge')
              : (isRTL ? 'كل حاجة جاهزة للانطلاق' : 'Everything is ready to set off')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            {step === 1
              ? (isRTL ? 'شوية بيانات بسيطة عشان نختارلك المعلم المناسب.' : 'A few details so we can match you with the right teacher.')
              : step === 2
              ? (isRTL ? 'اسحب كتابك من الرف، وقولنا انت فين في الطريق.' : 'Pull your book from the shelf, and tell us where you are on the road.')
              : (isRTL ? 'راجع بياناتك، وبعدها نبدأ.' : 'Check your details, then we begin.')}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-sm leading-relaxed">
          {error}
        </div>
      )}

      {/* Form Container */}
      <div className="rounded-[28px] border border-border/60 bg-surface/85 backdrop-blur-xl p-5 sm:p-10 shadow-[0_40px_80px_-40px_rgba(8,125,145,.45)]">
        {/* ================= STEP 1: ACCOUNT TYPE & PRIMARY CONTACT ================= */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* How you travel: alone or as a family caravan */}
            <TravelModeChoice value={learnerType} onChange={setLearnerType} isAr={isRTL} />

            {/* The traveller's ticket */}
            <PassCard name={learnerType === 'child' ? parentName : studentName} isAr={isRTL}>
              <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
                <PassField
                  htmlFor="onboarding-name"
                  label={learnerType === 'child' ? (isRTL ? 'اسم ولي الأمر' : 'Parent / guardian name') : (isRTL ? 'اسمك بالكامل' : 'Your full name')}
                >
                  <input
                    id="onboarding-name"
                    type="text"
                    autoComplete="name"
                    value={learnerType === 'child' ? parentName : studentName}
                    onChange={(e) => (learnerType === 'child' ? setParentName(e.target.value) : setStudentName(e.target.value))}
                    placeholder={isRTL ? 'مثال: عبد الرحمن طارق' : 'e.g. Tariq Rahman'}
                    className={passInputClass}
                  />
                </PassField>
                {learnerType === 'adult' ? (
                  <PassField htmlFor="onboarding-age" label={isRTL ? 'السن' : 'Age'}>
                    <input
                      id="onboarding-age"
                      type="number"
                      inputMode="numeric"
                      min={ADULT_MIN_AGE}
                      max={MAX_AGE}
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder={isRTL ? 'مثال: 24' : 'e.g. 24'}
                      aria-invalid={Boolean(age.trim()) && !isAdultAge(age)}
                      aria-describedby="onboarding-age-hint"
                      className={passInputClass}
                    />
                  </PassField>
                ) : (
                  <PassField htmlFor="onboarding-guardian-age" label={isRTL ? 'سن ولي الأمر' : 'Your age'}>
                    <input
                      id="onboarding-guardian-age"
                      type="number"
                      inputMode="numeric"
                      min={GUARDIAN_MIN_AGE}
                      max={MAX_AGE}
                      required
                      value={guardianAge}
                      onChange={(e) => setGuardianAge(e.target.value)}
                      placeholder={isRTL ? 'مثال: 38' : 'e.g. 38'}
                      aria-invalid={Boolean(guardianAge.trim()) && !isGuardianAge(guardianAge)}
                      aria-describedby="onboarding-age-hint"
                      className={passInputClass}
                    />
                  </PassField>
                )}
              </div>
              {(() => {
                const value = learnerType === 'adult' ? age : guardianAge;
                const tooYoung = parseAge(value) !== null && Number(value) < (learnerType === 'adult' ? ADULT_MIN_AGE : GUARDIAN_MIN_AGE);
                return (
                  <p
                    id="onboarding-age-hint"
                    className={`-mt-3 text-xs leading-relaxed ${tooYoung ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}
                    aria-live="polite"
                  >
                    {tooYoung
                      ? (learnerType === 'adult' ? adultAgeMessage : guardianAgeMessage)
                      : learnerType === 'adult'
                        ? (isRTL ? `الحساب الشخصي من ${ADULT_MIN_AGE} سنة وطالع.` : `Personal accounts are for ages ${ADULT_MIN_AGE}+.`)
                        : (isRTL ? `ولي الأمر ${GUARDIAN_MIN_AGE} سنة أو أكتر، والأبناء من ${CHILD_MIN_AGE} لـ ${CHILD_MAX_AGE} سنة.` : `Guardians are ${GUARDIAN_MIN_AGE}+; children are ${CHILD_MIN_AGE} to ${CHILD_MAX_AGE}.`)}
                    {tooYoung && learnerType === 'adult' && (
                      <button
                        type="button"
                        onClick={() => { setLearnerType('child'); setError(null); }}
                        className="ms-1.5 underline font-bold cursor-pointer"
                      >
                        {isRTL ? 'حوّل لحساب عائلة' : 'Switch to a family account'}
                      </button>
                    )}
                  </p>
                );
              })()}

              {learnerType === 'adult' && (
                <>
                  <PassField label={isRTL ? 'الجنس' : 'Gender'}>
                    <SealChoice
                      label={isRTL ? 'الجنس' : 'Gender'}
                      value={gender}
                      onChange={(g) => handleGenderSelect(g)}
                      options={[
                        { id: 'male' as const, text: isRTL ? 'ذكر' : 'Male' },
                        { id: 'female' as const, text: isRTL ? 'أنثى' : 'Female' }
                      ]}
                    />
                  </PassField>

                  <PassField label={isRTL ? 'مرشدك في الرحلة' : 'Your guide on the journey'}>
                    <p className="text-xs text-muted-foreground mb-2.5">
                      {isRTL ? 'اخترناه لك حسب الجنس، وتقدر تغيّره بضغطة. هيوصله تسجيلك وتتفتح بينكم محادثة.' : 'Suggested by gender; change it with one tap. Your teacher gets your sign-up and a chat opens between you.'}
                    </p>
                    <GuideChoice
                      teachers={teachers}
                      value={adultTeacher.id}
                      onChange={handleTeacherSelect}
                      isAr={isRTL}
                    />
                  </PassField>
                </>
              )}

              <PassField label={isRTL ? 'نقطة الانطلاق' : 'Starting point'}>
                <CountryTimezonePicker
                  country={country}
                  timezone={timezone}
                  onCountryChange={(newCountry) => setCountry(newCountry)}
                  onTimezoneChange={(newTz) => setTimezone(newTz)}
                  isAr={isRTL}
                  showTimePreview={true}
                />
              </PassField>

              <PassField label={isRTL ? 'للتواصل في الطريق' : 'To reach you on the way'}>
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
              </PassField>
            </PassCard>

            {/* Next Button */}
            <div className="pt-4 flex sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  const problem = stepOneProblem();
                  if (problem) {
                    setError(problem);
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer"
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
                    const guideOfChild = childTeacher(child);

                    if (index !== openChild) {
                      const found = findSubject(child.learningInterest);
                      const guide = guideOfChild;
                      const level = levelsFor(child.learningInterest).find((l) => l.id === child.currentLevel) || LEVELS.find((l) => l.id === child.currentLevel) || LEVELS[0];
                      return (
                        <FoldedPass
                          key={child.id}
                          isAr={isRTL}
                          name={child.name || (isRTL ? `الطفل رقم ${index + 1}` : `Child #${index + 1}`)}
                          age={child.age}
                          subjectId={child.learningInterest}
                          subjectName={subjectLabel(child.learningInterest, isRTL)}
                          subjectColor={found?.family.color || '#087D91'}
                          levelName={isRTL ? level.ar : level.en}
                          guideName={isRTL ? guide.nameAr : guide.nameEn}
                          guidePhoto={guide.photo}
                          guideColor={teacherColor(guide.gender)}
                          onEdit={() => {
                            if (openChild >= 0 && !finishChild(openChild)) return;
                            setOpenChild(index);
                          }}
                          onRemove={children.length > 1 ? () => handleRemoveChild(index) : undefined}
                        />
                      );
                    }

                    return (
                      <PassCard key={child.id} name={child.name} isAr={isRTL}>
                        <div className="flex items-center justify-between -mt-2">
                          <span className="text-xs font-bold text-[#8B4935] dark:text-[#D8C6AE]">
                            {isRTL ? `المسافر رقم ${index + 1} في القافلة` : `Traveller ${index + 1} in the caravan`}
                          </span>
                          {children.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(index)}
                              className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isRTL ? 'شيل' : 'Remove'}</span>
                            </button>
                          )}
                        </div>

                        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
                          <PassField htmlFor={`child-name-${index}`} label={isRTL ? 'اسم الابن / الابنة' : "Child's name"}>
                            <input
                              id={`child-name-${index}`}
                              type="text"
                              value={child.name}
                              onChange={(e) => handleUpdateChild(index, { name: e.target.value })}
                              placeholder={isRTL ? 'مثال: يوسف' : 'e.g. Yusuf'}
                              className={passInputClass}
                            />
                          </PassField>
                          <PassField htmlFor={`child-age-${index}`} label={isRTL ? 'السن' : 'Age'}>
                            <input
                              id={`child-age-${index}`}
                              type="number"
                              inputMode="numeric"
                              min={CHILD_MIN_AGE}
                              max={CHILD_MAX_AGE}
                              required
                              value={child.age}
                              onChange={(e) => handleUpdateChild(index, { age: e.target.value })}
                              placeholder={isRTL ? 'مثال: 9' : 'e.g. 9'}
                              aria-invalid={Boolean(child.age.trim()) && !isChildAge(child.age)}
                              aria-describedby={`child-age-hint-${index}`}
                              className={passInputClass}
                            />
                          </PassField>
                        </div>
                        <p
                          id={`child-age-hint-${index}`}
                          className={`-mt-3 text-xs leading-relaxed ${child.age.trim() && !isChildAge(child.age) ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}
                          aria-live="polite"
                        >
                          {child.age.trim() && !isChildAge(child.age)
                            ? childAgeMessage(index)
                            : (isRTL ? `السن من ${CHILD_MIN_AGE} لـ ${CHILD_MAX_AGE} سنة.` : `Ages ${CHILD_MIN_AGE} to ${CHILD_MAX_AGE}.`)}
                        </p>

                        <PassField label={isRTL ? 'ولد ولا بنت' : 'Boy or girl'}>
                          <SealChoice
                            label={isRTL ? 'ولد ولا بنت' : 'Boy or girl'}
                            value={child.gender}
                            onChange={(g) => handleUpdateChild(index, {
                              gender: g,
                              // Re-suggest a teacher of the child's gender unless one was picked by hand.
                              ...(child.teacherGenderPreference === 'auto' ? { teacherId: '' } : {})
                            })}
                            options={[
                              { id: 'male' as const, text: isRTL ? 'ولد' : 'Boy' },
                              { id: 'female' as const, text: isRTL ? 'بنت' : 'Girl' }
                            ]}
                          />
                        </PassField>

                        <PassField label={isRTL ? 'مرشده في الرحلة' : 'Their guide on the journey'}>
                          <GuideChoice
                            teachers={teachers}
                            value={guideOfChild.id}
                            onChange={(id) => {
                              const t = teachers.find((x) => x.id === id);
                              handleUpdateChild(index, {
                                teacherId: id,
                                teacherGenderPreference: t?.gender === 'female' ? 'female_teacher' : 'male_teacher'
                              });
                            }}
                            isAr={isRTL}
                          />
                        </PassField>

                        {/* Subject & Level for this child */}
                        <div className="space-y-4 pt-1">
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-2">
                              {isRTL ? `المادة اللي ${child.name.trim() || 'الطفل'} هيدرسها` : `What ${child.name.trim() || 'this child'} will study`}
                            </p>
                            <BookShelf
                              name={`child-${index}-subject`}
                              value={child.learningInterest}
                              onChange={(id) => handleUpdateChild(index, { learningInterest: id })}
                              isAr={isRTL}
                            />
                          </div>
                          {/* Subjects taught by age version (Zad Path) have no level to pick; JourneyPath then only resets it. */}
                          <div>
                            {levelsFor(child.learningInterest).length !== 1 && (
                              <p className="text-xs font-semibold text-foreground mb-2">
                                {isRTL ? 'مستواه الحالي' : 'Current level'}
                              </p>
                            )}
                            <JourneyPath
                              name={`child-${index}-level`}
                              subject={child.learningInterest}
                              value={child.currentLevel}
                              onChange={(id) => handleUpdateChild(index, { currentLevel: id })}
                              isAr={isRTL}
                            />
                          </div>
                        </div>

                        {/* Notes for child */}
                        <div>
                          <input
                            type="text"
                            value={child.notes}
                            onChange={(e) => handleUpdateChild(index, { notes: e.target.value })}
                            placeholder={isRTL ? 'ملاحظات للمعلم عن الطفل (اختياري)' : 'Notes for the teacher about this child (optional)'}
                            className={`${passInputClass} !text-sm !font-normal`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => finishChild(index)}
                          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#087D91] hover:bg-[#06697A] text-white font-bold text-sm cursor-pointer transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          {isRTL ? `تمام، احفظ تذكرة ${child.name.trim() || 'الطفل'}` : `Done — save ${child.name.trim() || 'this'} ticket`}
                        </button>
                      </PassCard>
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
                    <span>{isRTL ? 'ضيف طفل للقافلة' : 'Add another child to the caravan'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ADULT WORKFLOW: SUBJECT & LEVEL */
              <div className="space-y-6">
                <div>
                  <p className="block text-sm font-semibold text-foreground mb-3">
                    {isRTL ? 'عايز تدرس إيه؟' : 'What would you like to study?'}
                  </p>
                  <BookShelf name="adult-subject" value={learningInterest} onChange={setLearningInterest} isAr={isRTL} />
                </div>

                <div>
                  {levelsFor(learningInterest).length !== 1 && (
                    <p className="block text-sm font-semibold text-foreground mb-3">
                      {isRTL ? 'مستواك الحالي تقريبًا' : 'Your current level, roughly'}
                    </p>
                  )}
                  <JourneyPath name="adult-level" subject={learningInterest} value={currentLevel} onChange={setCurrentLevel} isAr={isRTL} />
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
            <div className="pt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isRTL ? 'السابق' : 'Back'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (learnerType === 'child') {
                    const incomplete = children.findIndex((c) => !childComplete(c));
                    if (incomplete >= 0) {
                      setOpenChild(incomplete);
                      setError(incompleteChildMessage(incomplete));
                      return;
                    }
                    setOpenChild(-1);
                  }
                  setError(null);
                  setStep(3);
                }}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-md cursor-pointer"
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
                    {(isRTL ? getCountryByCode(country)?.nameAr : getCountryByCode(country)?.name) || country} ({timezone})
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
                      const teacher = teacherName(childTeacher(c));
                      const subject = subjectLabel(c.learningInterest, isRTL);

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
                      {subjectLabel(learningInterest, isRTL)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit and Back */}
            <div className="pt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isRTL ? 'السابق' : 'Back'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl btn-primary-material text-primary-foreground font-bold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
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
