import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, ShieldCheck, User, Users, Mail, Phone, BookMarked, Check } from 'lucide-react';
import { BookingFormData, Language, LearnerAudience, ProficiencyLevel } from '../../booking/types';

interface StepStudentDetailsProps {
  formData: BookingFormData;
  updateForm: (fields: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
  linkedChildren?: any[];
  isAuthenticatedStudent?: boolean;
  bookingPreference?: 'self' | 'child';
  canBookForChild?: boolean;
  studentName?: string;
  studentEmail?: string;
}

export const StepStudentDetails: React.FC<StepStudentDetailsProps> = ({
  formData,
  updateForm,
  onNext,
  onBack,
  lang,
  linkedChildren = [],
  isAuthenticatedStudent = false,
  bookingPreference = 'self',
  canBookForChild = false,
  studentName,
  studentEmail
}) => {
  const isEn = lang === 'en';
  const isChildAuthorized = Boolean(isAuthenticatedStudent && canBookForChild && linkedChildren && linkedChildren.length > 0);
  const isChild = formData.audience === 'child';

  const levels: { key: ProficiencyLevel; label: string; arabicLabel: string; desc: string }[] = [
    {
      key: 'beginner',
      label: 'Complete Beginner',
      arabicLabel: 'مبتدئ تماماً',
      desc: isEn ? 'Starting from scratch / no prior background' : 'البدء من الصفر تماماً'
    },
    {
      key: 'elementary',
      label: 'Elementary',
      arabicLabel: 'أساسي / تمهيدي',
      desc: isEn ? 'Knows basic letters / disconnected words' : 'يعرف الحروف الأساسية أو كلمات متفرقة'
    },
    {
      key: 'intermediate',
      label: 'Intermediate',
      arabicLabel: 'متوسط',
      desc: isEn ? 'Can read slowly or speak basic phrases' : 'يستطيع القراءة بتأنٍ أو التحدث بجمل بسيطة'
    },
    {
      key: 'advanced',
      label: 'Advanced',
      arabicLabel: 'متقدم',
      desc: isEn ? 'Fluent reading or conversational; refining mastery' : 'قراءة متمكنة أو طلاقة حوارية ويرغب في الإتقان'
    }
  ];

  // Validation: For authenticated guardian booking for children, a studentId is required when linked children exist
  const isFormValid = isChild
    ? (formData.childName || '').trim().length > 0 &&
      (formData.parentName || '').trim().length > 0 &&
      (formData.parentEmail || '').trim().length > 0 &&
      (formData.parentEmail || '').includes('@') &&
      (linkedChildren.length === 0 || !!formData.studentId)
    : (formData.studentName || '').trim().length > 0 &&
      (formData.email || '').trim().length > 0 &&
      (formData.email || '').includes('@');

  const handleAudienceChange = (newAudience: LearnerAudience) => {
    if (newAudience === 'child') {
      const singleChild = linkedChildren.length === 1 ? linkedChildren[0] : null;
      updateForm({
        audience: 'child',
        parentName: formData.parentName || formData.studentName || studentName || '',
        parentEmail: formData.parentEmail || formData.email || studentEmail || '',
        parentWhatsapp: formData.parentWhatsapp || formData.whatsapp || '',
        childName: singleChild ? singleChild.name : (formData.childName || ''),
        childLevel: singleChild
          ? (singleChild.current_level || singleChild.currentLevel || 'beginner')
          : formData.childLevel,
        studentId: singleChild ? singleChild.id : ''
      });
    } else {
      updateForm({
        audience: 'adult',
        studentName: formData.studentName || studentName || '',
        email: formData.email || studentEmail || ''
      });
    }
  };

  // Handle child selection
  const handleChildSelect = (childId: string) => {
    if (!childId) {
      updateForm({ studentId: '', childName: '' });
      return;
    }
    const child = linkedChildren.find((c: any) => c.id === childId);
    if (child) {
      updateForm({
        studentId: child.id,
        childName: child.name,
        childLevel: (child.current_level || child.currentLevel || formData.childLevel) as ProficiencyLevel
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 
        AUDIENCE & IDENTITY CONTEXT:
        For authenticated students, the generic two-card choice ("Who will be learning in this session?")
        is NEVER shown. Instead, clear identity context or child selection is rendered.
      */}
      {isAuthenticatedStudent ? (
        <div className="space-y-3">
          {!isChildAuthorized ? (
            /* Authenticated Student without child booking authorization: Strictly Self-Learning */
            <div
              id="student-identity-context"
              className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-primary/20 text-primary-hover dark:text-[#A8C9B4]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-foreground dark:text-[#F8F6F0] block text-sm">
                    {isEn
                      ? `Booking for ${formData.studentName || studentName || 'Yourself'}`
                      : `حجز شخصي: ${formData.studentName || studentName || 'لك'}`}
                  </span>
                  <span className="text-muted-foreground dark:text-muted-foreground text-[11px]">
                    {isEn ? 'Authenticated Student Account · Self-Learning' : 'حساب طالب موثق · تعلم شخصي'}
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-hover dark:text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isEn ? 'Verified Account' : 'حساب موثق'}</span>
              </div>
            </div>
          ) : isChild ? (
            /* Authorized Guardian booking for child */
            linkedChildren.length === 1 ? (
              /* Exactly one authorized child: Preselected */
              <div
                id="child-preselected-context"
                className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-primary/20 text-primary-hover dark:text-[#A8C9B4]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground dark:text-[#F8F6F0] block text-sm">
                      {isEn
                        ? `Booking for child: ${formData.childName || linkedChildren[0].name}`
                        : `حجز للطفل: ${formData.childName || linkedChildren[0].name}`}
                    </span>
                    <span className="text-muted-foreground dark:text-muted-foreground text-[11px]">
                      {isEn
                        ? `Parent / Guardian: ${formData.parentName || studentName || 'Account Owner'}`
                        : `ولي الأمر: ${formData.parentName || studentName || 'صاحب الحساب'}`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAudienceChange('adult')}
                  className="text-[11px] font-medium text-primary-hover dark:text-primary hover:underline cursor-pointer"
                >
                  {isEn ? 'Switch to self booking' : 'التحويل لحجز شخصي'}
                </button>
              </div>
            ) : (
              /* Multiple authorized children: Explicit selection required */
              <div
                id="multi-child-selection-context"
                className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#231D28] border border-border dark:border-border"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80">
                    {isEn ? 'Who is this lesson for?' : 'من سيتعلم في هذا الدرس؟'} <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAudienceChange('adult')}
                    className="text-[11px] font-medium text-primary-hover dark:text-primary hover:underline cursor-pointer"
                  >
                    {isEn ? 'Switch to self booking' : 'التحويل لحجز شخصي'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {isEn ? 'Please select which child will attend this session:' : 'يرجى تحديد الطفل الذي سيحضر هذا الدرس:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {linkedChildren.map((child: any) => {
                    const isSelected = formData.studentId === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => handleChildSelect(child.id)}
                        className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-foreground dark:bg-[#29232F] border-primary ring-1 ring-primary'
                            : 'bg-white dark:bg-background border-border dark:border-border hover:bg-foreground/30'
                        }`}
                      >
                        <div>
                          <div className="font-serif text-xs font-semibold text-foreground dark:text-foreground">
                            {child.name}
                          </div>
                          <div className="text-[10px] text-foreground/60 dark:text-border/60 capitalize">
                            {child.current_level || child.currentLevel || 'Learner'}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {!formData.studentId && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    {isEn ? 'Selection required: please click a child above to continue.' : 'يرجى اختيار أحد الأطفال للمتابعة.'}
                  </p>
                )}
              </div>
            )
          ) : (
            /* Authorized Guardian choosing to book for themselves (adult self) */
            <div
              id="guardian-self-context"
              className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-primary/20 text-primary-hover dark:text-[#A8C9B4]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-foreground dark:text-[#F8F6F0] block text-sm">
                    {isEn
                      ? `Booking for ${formData.studentName || studentName || 'Yourself'}`
                      : `حجز شخصي: ${formData.studentName || studentName || 'لك'}`}
                  </span>
                  <span className="text-muted-foreground dark:text-muted-foreground text-[11px]">
                    {isEn ? 'Authenticated Student Account · Self-Learning' : 'حساب طالب موثق · تعلم شخصي'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAudienceChange('child')}
                className="text-[11px] font-medium text-primary-hover dark:text-primary hover:underline cursor-pointer sm:shrink-0"
              >
                {isEn ? 'Booking for your child instead?' : 'الحجز لطفلك بدلاً من ذلك؟'}
              </button>
            </div>
          )}
        </div>
      ) : isAuthenticatedStudent ? (
        /* Authorized Student choosing to book for themselves (adult self) without child access */
        <div
          id="student-self-context"
          className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-primary/20 text-primary-hover dark:text-[#A8C9B4]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground dark:text-[#F8F6F0] block text-sm">
                {isEn
                  ? `Booking for ${formData.studentName || studentName || 'Yourself'}`
                  : `حجز شخصي: ${formData.studentName || studentName || 'لك'}`}
              </span>
              <span className="text-muted-foreground dark:text-muted-foreground text-[11px]">
                {isEn ? 'Authenticated Student Account · Self-Learning' : 'حساب طالب موثق · تعلم شخصي'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Guest / Unauthenticated flow: Traditional 2-card selector */
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-border/70 mb-2">
            {isEn ? 'Who will be learning in this session?' : 'من سيتعلم في هذا الدرس؟'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleAudienceChange('adult')}
              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center gap-3.5 ${
                !isChild
                  ? 'bg-foreground dark:bg-[#29232F] border-muted-foreground dark:border-muted-foreground ring-1 ring-muted-foreground shadow-xs'
                  : 'bg-white dark:bg-[#231D28] border-border dark:border-border hover:bg-foreground/40'
              }`}
            >
              <div className={`p-2 rounded-xl ${!isChild ? 'bg-muted-foreground text-white' : 'bg-[#EDE3D4] dark:bg-background text-foreground dark:text-border'}`}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif text-sm font-medium text-foreground dark:text-foreground">
                  {isEn ? 'I am learning (Adult / Self)' : 'أنا المتعلم (بالغ / شخصي)'}
                </div>
                <div className="text-[11px] text-foreground/60 dark:text-border/60">
                  {isEn ? 'Direct communication for your own learning' : 'تواصل وتنسيق مباشر لتعلمك الشخصي'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAudienceChange('child')}
              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center gap-3.5 ${
                isChild
                  ? 'bg-foreground dark:bg-[#29232F] border-muted-foreground dark:border-muted-foreground ring-1 ring-muted-foreground shadow-xs'
                  : 'bg-white dark:bg-[#231D28] border-border dark:border-border hover:bg-foreground/40'
              }`}
            >
              <div className={`p-2 rounded-xl ${isChild ? 'bg-muted-foreground text-white' : 'bg-[#EDE3D4] dark:bg-background text-foreground dark:text-border'}`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif text-sm font-medium text-foreground dark:text-foreground">
                  {isEn ? 'For my child (Parent / Guardian)' : 'لطفلي (حجز ولي الأمر)'}
                </div>
                <div className="text-[11px] text-foreground/60 dark:text-border/60">
                  {isEn ? 'Parents attend or receive updates' : 'متابعة وإشراف وتنسيق مع ولي الأمر'}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Fields */}
      {!isChild ? (
        /* ADULT FIELDS */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1.5">
                {isEn ? 'Your Full Name' : 'اسمك الكريم'} <span className="text-muted-foreground dark:text-muted-foreground">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => updateForm({ studentName: e.target.value })}
                placeholder={isEn ? 'e.g. Tariq Mansour' : 'مثال: طارق منصور'}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border bg-white dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1.5">
                {isEn ? 'Age Group' : 'الفئة العمرية'}
              </label>
              <select
                value={formData.ageGroup || '18-29'}
                onChange={(e) => updateForm({ ageGroup: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border bg-white dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="18-29">18 – 29 {isEn ? 'years' : 'سنة'}</option>
                <option value="30-45">30 – 45 {isEn ? 'years' : 'سنة'}</option>
                <option value="46+">46+ {isEn ? 'years' : 'سنة'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? 'Email Address' : 'البريد الإلكتروني'}</span> <span className="text-muted-foreground dark:text-muted-foreground">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border bg-white dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] text-foreground/55 dark:text-border/55 mt-1">
                {isEn ? 'Zoom meeting room credentials will be sent here.' : 'سيتم إرسال رابط قاعة زووم إلى هذا البريد.'}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? 'WhatsApp Number (Recommended)' : 'رقم الواتساب (موصى به للتذكير)'}</span>
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => updateForm({ whatsapp: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border bg-white dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] text-foreground/55 dark:text-border/55 mt-1">
                {isEn ? 'For courteous lesson reminders and direct questions.' : 'للتذكير بموعد الدرس ولأي استفسار مباشر.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* CHILD & PARENT FIELDS */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#231D28] border border-border dark:border-border space-y-4">
            <div className="font-serif text-sm font-medium text-muted-foreground dark:text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{isEn ? '1. Learner (Child) Details' : '١. بيانات الطفل (الطالب)'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1">
                  {isEn ? 'Child’s Full Name' : 'اسم الطفل الكريم'} <span className="text-muted-foreground dark:text-muted-foreground">*</span>
                </label>
                {linkedChildren.length > 0 ? (
                  <select
                    value={formData.studentId || ''}
                    onChange={(e) => handleChildSelect(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border bg-foreground/30 dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>{isEn ? 'Select a child' : 'اختر طفلاً'}</option>
                    {linkedChildren.map((child: any) => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={formData.childName}
                    onChange={(e) => updateForm({ childName: e.target.value })}
                    placeholder={isEn ? 'e.g. Yusuf' : 'مثال: يوسف'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border bg-foreground/30 dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1">
                  {isEn ? 'Child’s Age' : 'عمر الطفل'} <span className="text-muted-foreground dark:text-muted-foreground">*</span>
                </label>
                <select
                  value={formData.childAge || '8-11'}
                  onChange={(e) => updateForm({ childAge: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border bg-foreground/30 dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="5-7">5 – 7 {isEn ? 'years old' : 'سنوات'}</option>
                  <option value="8-11">8 – 11 {isEn ? 'years old' : 'سنوات'}</option>
                  <option value="12-14">12 – 14 {isEn ? 'years old' : 'سنة'}</option>
                  <option value="15-17">15 – 17 {isEn ? 'years old' : 'سنة'}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#231D28] border border-border dark:border-border space-y-4">
            <div className="font-serif text-sm font-medium text-muted-foreground dark:text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{isEn ? '2. Parent / Guardian Contact' : '٢. بيانات ولي الأمر للتواصل والتنسيق'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1">
                  {isEn ? 'Parent’s Full Name' : 'اسم ولي الأمر'} <span className="text-muted-foreground dark:text-muted-foreground">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => updateForm({ parentName: e.target.value })}
                  placeholder={isEn ? 'e.g. Maryam Khan' : 'مثال: مريم خان'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border bg-foreground/30 dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1">
                  {isEn ? 'Parent’s Email' : 'البريد الإلكتروني لولي الأمر'} <span className="text-muted-foreground dark:text-muted-foreground">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.parentEmail}
                  onChange={(e) => updateForm({ parentEmail: e.target.value })}
                  placeholder="parent@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border bg-foreground/30 dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-border/80 mb-1">
                  {isEn ? 'Parent’s WhatsApp' : 'رقم واتساب ولي الأمر'}
                </label>
                <input
                  type="tel"
                  value={formData.parentWhatsapp}
                  onChange={(e) => updateForm({ parentWhatsapp: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-border bg-foreground/30 dark:bg-background text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Starting Level Assessment */}
      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-border/70">
          <BookMarked className="w-3.5 h-3.5 text-primary" />
          <span>
            {isChild
              ? isEn ? 'Child’s Current Level in this Subject' : 'المستوى التقريبي الحالي للطفل'
              : isEn ? 'Where Are You Starting From?' : 'أين يبدأ مستواك الحالي؟'}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {levels.map((lvl) => {
            const currentSelected = isChild ? formData.childLevel : formData.currentLevel;
            const isSelected = currentSelected === lvl.key;
            return (
              <button
                key={lvl.key}
                type="button"
                onClick={() =>
                  isChild
                    ? updateForm({ childLevel: lvl.key })
                    : updateForm({ currentLevel: lvl.key })
                }
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-foreground dark:bg-[#29232F] border-primary ring-1 ring-primary text-foreground dark:text-foreground'
                    : 'bg-white dark:bg-[#231D28] border-border dark:border-border text-foreground/70 dark:text-border/70 hover:bg-foreground/30'
                }`}
              >
                <div className="font-serif text-xs font-medium mb-0.5">
                  {isEn ? lvl.label : lvl.arabicLabel}
                </div>
                <div className="text-[10px] text-foreground/55 dark:text-border/55 line-clamp-2">
                  {lvl.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trust & Privacy Reassurance */}
      <div className="p-3.5 rounded-xl bg-[#EDE3D4] dark:bg-[#29232F] border border-primary/30 flex items-center gap-3 text-xs text-foreground/80 dark:text-border/80">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
        <span>
          {isEn
            ? 'We respect your privacy. No passwords, payment cards, or sensitive documents are requested. Your information is used strictly to coordinate your lesson with Mahmoud.'
            : 'نحترم خصوصيتكم التامة. لا نطلب أي بيانات بطاقات بنكية أو مستندات حساسة. تُستخدم بياناتكم حصراً للتنسيق الشخصي مع محمود.'}
        </span>
      </div>

      {/* Controls */}
      <div className="pt-4 border-t border-border dark:border-border flex items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-foreground/80 dark:text-border/80 hover:bg-[#EDE3D4] dark:hover:bg-[#29232F] transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back to Goals' : 'الرجوع للأهداف'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          disabled={!isFormValid}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-muted-foreground hover:bg-[#584960] text-white text-sm font-medium shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <span>{isEn ? 'Next: Lesson Length & Type' : 'التالي: مدة ونوع الدرس'}</span>
          <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
};
