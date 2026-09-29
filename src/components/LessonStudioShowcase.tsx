import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Mic,
  Video,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Calendar,
  MessageSquare,
  Play,
  Pause,
  ChevronDown
} from 'lucide-react';
import { Language } from '../types';

interface LessonStudioShowcaseProps {
  lang: Language;
  onOpenTrialModal: () => void;
}

type StudioTab = 'quran' | 'arabic' | 'studies';

export const LessonStudioShowcase: React.FC<LessonStudioShowcaseProps> = ({
  lang,
  onOpenTrialModal,
}) => {
  const isEn = lang === 'en';
  const isRtl = lang === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<StudioTab>('quran');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(true);
  const [selectedWord, setSelectedWord] = useState<string | null>('خَفِيًّا');

  // Track scroll progress of this entire showcase container through viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Smooth out scroll physics with gentle spring
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 24,
    restDelta: 0.001,
  });

  // Central studio card 3D transforms (Perspective Tilt, Scale, Parallax Y)
  // As user scrolls: tilts forward (rotateX 16deg -> 0deg -> -6deg), scales up to 1.02, glides smoothly
  const centerRotateX = useTransform(smoothProgress, [0, 0.45, 0.85, 1], [16, 0, -3, -8]);
  const centerScale = useTransform(smoothProgress, [0, 0.45, 0.8, 1], [0.93, 1.02, 1, 0.96]);
  const centerY = useTransform(smoothProgress, [0, 0.5, 1], [50, 0, -35]);

  // Left floating card (Live Tajweed / Articulation Terminal)
  // Fans out, tilts deeper, and moves with parallax
  const rawLeftX = useTransform(smoothProgress, [0, 0.5, 1], [-10, -50, -85]);
  const leftY = useTransform(smoothProgress, [0, 0.5, 1], [100, -15, -95]);
  const rawLeftRotateZ = useTransform(smoothProgress, [0, 0.5, 1], [-4, -8, -12]);
  const rawLeftRotateY = useTransform(smoothProgress, [0, 0.5, 1], [8, 14, 18]);

  // Right floating card (Student Milestone & Teacher Notes)
  // Fans out, tilts deeper, and moves with parallax
  const rawRightX = useTransform(smoothProgress, [0, 0.5, 1], [10, 50, 85]);
  const rightY = useTransform(smoothProgress, [0, 0.5, 1], [120, 10, -80]);
  const rawRightRotateZ = useTransform(smoothProgress, [0, 0.5, 1], [4, 8, 12]);
  const rawRightRotateY = useTransform(smoothProgress, [0, 0.5, 1], [-8, -14, -18]);

  // Symmetrical RTL transformations
  const leftX = useTransform(rawLeftX, (val) => (isRtl ? -val : val));
  const rightX = useTransform(rawRightX, (val) => (isRtl ? -val : val));
  const leftRotateZ = useTransform(rawLeftRotateZ, (val) => (isRtl ? -val : val));
  const rightRotateZ = useTransform(rawRightRotateZ, (val) => (isRtl ? -val : val));
  const leftRotateY = useTransform(rawLeftRotateY, (val) => (isRtl ? -val : val));
  const rightRotateY = useTransform(rawRightRotateY, (val) => (isRtl ? -val : val));

  // Floating dock scale & opacity
  const dockScale = useTransform(smoothProgress, [0.2, 0.5, 0.8], [0.92, 1, 0.95]);
  const dockY = useTransform(smoothProgress, [0.2, 0.5, 1], [25, 0, -15]);

  return (
    <section
      ref={containerRef}
      id="live-studio-showcase"
      className="relative overflow-x-clip bg-gradient-to-b from-white via-surface-warm to-foreground dark:from-background dark:via-background dark:to-background py-20 lg:py-32 transition-colors border-b border-border/70 dark:border-border"
    >
      {/* Subtle Background Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-secondary/30 dark:bg-secondary/20 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-muted-foreground/15 dark:bg-muted-foreground/5 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/40 dark:bg-secondary/20 border border-secondary/60 text-accent text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Live 1-on-1 Studio Experience' : 'تجربة الاستوديو التعليمي المباشر'}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight mb-5"
          >
            {isEn ? (
              <>
                Inside the private lesson.{' '}
                <span className="text-primary dark:text-primary">Every minute</span> tailored to your voice.
              </>
            ) : (
              <>
                داخل الجلسة التعليمية الفردية.{' '}
                <span className="text-primary dark:text-primary">كل دقيقة</span> مخصصة لصوتك ومستواك.
              </>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="text-base sm:text-lg text-foreground/75 dark:text-border leading-relaxed max-w-2xl mx-auto mb-8"
          >
            {isEn
              ? 'Experience how live Tajweed phonetic corrections, personalized teacher notes, and calm 1-on-1 guidance unfold in real time.'
              : 'شاهد كيف تتكامل التوجيهات الصوتية الحية لأحكام التجويد، والملاحظات الشخصية، والتدريب الهادئ في جلسة فردية مباشرة.'}
          </motion.p>

          {/* Interactive Mode Tabs for the Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex p-1.5 rounded-2xl glass-surface border border-border shadow-xs gap-1.5"
          >
            <button
              onClick={() => setActiveTab('quran')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'quran'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-foreground/80 dark:text-foreground/80 hover:bg-foreground/60 dark:hover:glass-surface'
              }`}
            >
              {isEn ? 'Quran & Tajweed' : 'القرآن والتجويد'}
            </button>
            <button
              onClick={() => setActiveTab('arabic')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'arabic'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-foreground/80 dark:text-foreground/80 hover:bg-foreground/60 dark:hover:glass-surface'
              }`}
            >
              {isEn ? 'Arabic Language' : 'اللغة العربية'}
            </button>
            <button
              onClick={() => setActiveTab('studies')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'studies'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-foreground/80 dark:text-foreground/80 hover:bg-foreground/60 dark:hover:glass-surface'
              }`}
            >
              {isEn ? 'Islamic Studies' : 'الدراسات الإسلامية'}
            </button>
          </motion.div>
        </div>

        {/* 3D Perspective Stage Wrapper */}
        <div
          style={{ perspective: '1200px' }}
          className="relative min-h-[620px] sm:min-h-[670px] lg:min-h-[720px] flex items-center justify-center py-6"
        >

          {/* ========================================================================= */}
          {/* LEFT FLOATING 3D CARD: Live Tajweed Correction & Articulation Terminal */}
          {/* ========================================================================= */}
          <motion.div
            style={{
              x: leftX,
              y: leftY,
              rotateZ: leftRotateZ,
              rotateY: leftRotateY,
              transformStyle: 'preserve-3d',
            }}
            whileHover={{ scale: 1.04, rotateZ: isRtl ? 5 : -5, zIndex: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`absolute top-6 sm:top-10 ${
              isRtl ? 'right-1 sm:right-4 lg:-right-6' : 'left-1 sm:left-4 lg:-left-6'
            } z-20 w-[260px] sm:w-[310px] lg:w-[350px] rounded-2xl glass-surface dark:bg-background text-white p-4 sm:p-6 shadow-2xl shadow-black/40 border border-secondary/60 backdrop-blur-md cursor-grab active:cursor-grabbing select-none`}
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                <span className="ml-2 text-[11px] font-mono text-white/50 tracking-tight">
                  live_makharij_check.azhar
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-accent bg-secondary/40 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                LIVE
              </span>
            </div>

            {/* Terminal Body with Live Recitation Assessment */}
            <div className="space-y-3 text-xs font-mono text-white/85">
              <div className="text-white/40">// Surah Al-Fatiha • Verse 7</div>
              
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2">
                <div className="text-primary font-semibold flex items-center justify-between">
                  <span>[Makhraj Check]</span>
                  <span className="text-[10px] text-white/50">Edge of Tongue</span>
                </div>
                <div className="font-display text-right text-lg text-foreground dir-rtl leading-relaxed font-bold">
                  غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ
                </div>
                <p className="text-[11px] text-white/70 leading-normal font-sans">
                  <span className="text-warning font-bold">✦ Correction:</span> Soften the{' '}
                  <span className="text-white font-semibold underline decoration-primary">Ghayn (غ)</span> without throat friction. Lengthen contact for{' '}
                  <span className="text-white font-semibold underline decoration-primary">Ḍād (ض)</span>.
                </p>
              </div>

              {/* Teacher Verbal Feedback Transcript */}
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-secondary/60 text-[11px] font-sans">
                <div className="text-primary font-semibold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-primary" />
                  <span>{isEn ? "Ustadh Mahmoud's Audio Note" : "ملاحظة صوتية من الأستاذ محمود"}</span>
                </div>
                <p className="text-white/90 italic">
                  "{isEn ? 'Masha\'Allah! Your breath control in the second repetition was much calmer. Keep that mouth openness.' : 'ما شاء الله! حبس النفس في الإعادة الثانية كان أكثر هدوءاً وثباتاً. استمر على هذا الانفتاح.'}"
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                <span>Accuracy: 98%</span>
                <span className="text-primary flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Al-Azhar Method Verified
                </span>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* RIGHT FLOATING 3D CARD: Student Milestone & Teacher Notes */}
          {/* ========================================================================= */}
          <motion.div
            style={{
              x: rightX,
              y: rightY,
              rotateZ: rightRotateZ,
              rotateY: rightRotateY,
              transformStyle: 'preserve-3d',
            }}
            whileHover={{ scale: 1.04, rotateZ: isRtl ? -5 : 5, zIndex: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`absolute bottom-4 sm:bottom-8 ${
              isRtl ? 'left-1 sm:left-4 lg:-left-6' : 'right-1 sm:right-4 lg:-right-6'
            } z-20 w-[260px] sm:w-[310px] lg:w-[350px] rounded-2xl glass-surface text-foreground p-4 sm:p-6 shadow-2xl shadow-black/15 border border-border cursor-grab active:cursor-grabbing select-none`}
          >
            {/* Header: Student Profile Info */}
            <div className="flex items-center gap-3 border-b border-border pb-3 mb-3.5">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Student Maryam"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-foreground truncate">
                    Maryam K.
                  </h4>
                  <span className="text-[10px] font-medium text-primary dark:text-primary bg-secondary/30 px-2 py-0.5 rounded-full">
                    Active Student
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Toronto, Canada • Quran & Tajweed
                </p>
              </div>
            </div>

            {/* Checklist of Milestones */}
            <div className="space-y-2 mb-3.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isEn ? "Today's Lesson Progress" : "إنجاز جلسة اليوم"}
              </div>

              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="text-foreground/90 dark:text-border">
                  {isEn ? 'Noon Sakinah: Idgham with Ghunnah (Ayat 1-10)' : 'النون الساكنة: إدغام بغنة (الآيات ١-١٠)'}
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="text-foreground/90 dark:text-border">
                  {isEn ? 'Surah Maryam recitation review passed' : 'اجتياز تسميع سورة مريم بثبات'}
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>
                  {isEn ? 'Next Session: Thursday 6:00 PM EST (Zoom)' : 'الجلسة القادمة: الخميس ٦:٠٠ م بتوقيت كندا'}
                </span>
              </div>
            </div>

            {/* Homework & Recommendation Pill */}
            <div className="p-3 rounded-xl bg-foreground dark:bg-background border border-border text-xs">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-primary dark:text-primary mb-1">
                {isEn ? 'Recommended Weekly Pace' : 'الوتيرة الأسبوعية المقترحة'}
              </div>
              <p className="text-[11px] text-foreground/80 dark:text-border">
                {isEn
                  ? '2 sessions/week × 45 min — Ideal balance between retention and busy family schedules.'
                  : 'جلستان أسبوعياً × ٤٥ دقيقة — توازن مثالي بين التثبيت ومشاغل العمل والأسرة.'}
              </p>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* CENTRAL INTERACTIVE CLASSROOM STAGE (The main app window) */}
          {/* ========================================================================= */}
          <motion.div
            style={{
              rotateX: centerRotateX,
              scale: centerScale,
              y: centerY,
              transformStyle: 'preserve-3d',
            }}
            className="w-full max-w-4xl glass-card rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/60 border border-border overflow-hidden z-10 transition-shadow hover:shadow-3xl"
          >
            {/* Window Title Bar */}
            <div className="bg-surface-warm dark:bg-background px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive inline-block" />
                <span className="w-3 h-3 rounded-full bg-warning inline-block" />
                <span className="w-3 h-3 rounded-full bg-success inline-block" />
                <span className="ml-3 text-xs font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                  <Video className="w-3.5 h-3.5 text-accent" />
                  <span className="hidden sm:inline">
                    {isEn ? "Ustadh Mahmoud's Classroom • 1-on-1 Studio" : 'فصل الأستاذ محمود • جلسة فردية مباشرة'}
                  </span>
                  <span className="sm:hidden">{isEn ? 'Live Classroom' : 'فصل مباشر'}</span>
                </span>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-accent bg-primary/15 px-2.5 py-1 rounded-full border border-secondary/60">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span>{isEn ? 'Cairo ↔ Global Connected' : 'اتصال مباشر عالي الدقة'}</span>
                </span>
              </div>
            </div>

            {/* Studio Workspace Content */}
            <div className="p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 glass-card">
              
              {/* Left Column: Illuminated Subject Canvas (7 cols) */}
              <div className="lg:col-span-7 bg-surface-warm dark:bg-background rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border flex flex-col justify-between">
                <div>
                  
                  {/* Dynamic Content based on Active Tab */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'quran' && (
                      <motion.div
                        key="tab-quran"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Surah Header Banner */}
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-accent" />
                            <span className="text-xs font-semibold text-foreground">
                              {isEn ? 'Surah Maryam (سُورَةُ مَرْيَمَ)' : 'سُورَةُ مَرْيَمَ (مكية)'}
                            </span>
                          </div>
                          <button
                            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 text-accent text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            {isPlayingAudio ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>{isEn ? 'Pause Sample' : 'إيقاف التلاوة'}</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>{isEn ? 'Listen Sample' : 'استمع للتلاوة'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Bismillah Banner */}
                        <div className="text-center font-display text-lg text-primary dark:text-primary mb-4 dir-rtl font-semibold">
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </div>

                        {/* Quran Text with Authentic Tajweed Colors */}
                        <div className="font-display text-xl sm:text-2xl text-right leading-[2.2] sm:leading-[2.4] text-foreground dir-rtl selection:bg-primary/30">
                          <span
                            onClick={() => setSelectedWord('كٓهيعٓصٓ')}
                            className={`px-1 rounded transition-colors cursor-pointer ${
                              selectedWord === 'كٓهيعٓصٓ' ? 'bg-primary/25 ring-1 ring-primary' : 'hover:bg-primary/15'
                            }`}
                          >
                            كٓهيعٓصٓ ﴿١﴾
                          </span>{' '}
                          <span
                            onClick={() => setSelectedWord('زَكَرِيَّآ')}
                            className={`px-1 rounded transition-colors cursor-pointer ${
                              selectedWord === 'زَكَرِيَّآ' ? 'bg-primary/25 ring-1 ring-primary' : 'hover:bg-primary/15'
                            }`}
                          >
                            ذِكْرُ رَحْمَتِ رَبِّكَ عَبْدَهُۥ{' '}
                            <span className="text-warning font-bold underline decoration-dotted underline-offset-4">
                              زَكَرِيَّآ
                            </span>{' '}
                            ﴿٢﴾
                          </span>{' '}
                          <span
                            onClick={() => setSelectedWord('خَفِيًّا')}
                            className={`px-1.5 py-0.5 rounded-md border cursor-pointer transition-colors ${
                              selectedWord === 'خَفِيًّا'
                                ? 'bg-primary/30 border-primary'
                                : 'bg-primary/15 border-secondary/60'
                            }`}
                          >
                            إِذْ نَادَىٰ رَبَّهُۥ نِدَآءً{' '}
                            <span className="text-primary dark:text-primary font-bold">
                              خَفِيًّا
                            </span>{' '}
                            ﴿٣﴾
                          </span>{' '}
                          <span
                            onClick={() => setSelectedWord('شَيْبًا')}
                            className={`px-1 rounded transition-colors cursor-pointer ${
                              selectedWord === 'شَيْبًا' ? 'bg-primary/25 ring-1 ring-primary' : 'hover:bg-primary/15'
                            }`}
                          >
                            قَالَ رَبِّ إِنِّى وَهَنَ الْعَظْمُ مِنِّى وَاشْتَعَلَ الرَّأْسُ شَيْبًا ﴿٤﴾
                          </span>
                        </div>

                        {/* Interactive Tajweed Legend */}
                        <div className="mt-5 pt-3 border-t border-border flex flex-wrap items-center gap-2.5 text-[11px]">
                          <span className="text-muted-foreground font-medium">
                            {isEn ? 'Rules:' : 'الأحكام:'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-primary dark:text-primary bg-blue-500/10 px-2 py-0.5 rounded font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {isEn ? 'Ikhfa (Tanween + Kha)' : 'إخفاء حقيقي'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-warning bg-amber-500/10 px-2 py-0.5 rounded font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {isEn ? 'Madd Muttasil' : 'مد متصل ٤-٥ حركات'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-success bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {isEn ? 'Ghunnah 2 Counts' : 'غنة حرفية'}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'arabic' && (
                      <motion.div
                        key="tab-arabic"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                          <span className="text-xs font-semibold text-foreground">
                            {isEn ? 'Arabic Conversation & Grammar Module' : 'وحدة المحادثة والنحو العربي التطبيقي'}
                          </span>
                          <span className="text-[11px] text-primary font-medium">Level: A2/B1</span>
                        </div>

                        <div className="space-y-3 font-sans text-sm">
                          <div className="p-3 rounded-xl glass-surface border border-border">
                            <div className="text-xs text-primary font-semibold mb-1">
                              {isEn ? 'Teacher (Mahmoud):' : 'المعلم (أستاذ محمود):'}
                            </div>
                            <div className="font-display text-lg text-right dir-rtl text-foreground">
                              «مَا هُوَ هَدَفُكَ الرَّئِيسِيُّ مِنْ تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ؟»
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              "What is your primary goal from learning the Arabic language?"
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-secondary/30 border border-primary/25">
                            <div className="text-xs text-accent font-semibold mb-1">
                              {isEn ? 'Student Response & Correction:' : 'إجابة الطالب والتحليل النحوي:'}
                            </div>
                            <div className="font-display text-lg text-right dir-rtl text-foreground">
                              «أُرِيدُ أَنْ <span className="text-primary font-bold">أَفْهَمَ</span> الْقُرْآنَ بِدُونِ تَرْجَمَةٍ.»
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              <span className="text-primary font-medium">Grammar point:</span> Mansoob with Fat-ha after 'An' (أَنْ الناصبة).
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'studies' && (
                      <motion.div
                        key="tab-studies"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                          <span className="text-xs font-semibold text-foreground">
                            {isEn ? 'Islamic Studies • Fiqh & Daily Practice' : 'الفقه الإسلامي والعبادات اليومية'}
                          </span>
                          <span className="text-[11px] text-primary font-medium">Al-Azhar Curriculum</span>
                        </div>

                        <div className="space-y-2.5 text-xs text-foreground/85 dark:text-border">
                          <div className="p-3 rounded-xl glass-surface border border-border">
                            <div className="font-semibold text-xs text-primary mb-1">
                              {isEn ? 'Core Concept: Khushu in Daily Salah' : 'المفهوم الأساسي: الخشوع في الصلاة'}
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {isEn
                                ? 'Understanding what you recite transforms prayer from mechanical movements into an intimate conversation with your Creator.'
                                : 'فهم ما تقرؤه في صلاتك يحولها من مجرد حركات مجردة إلى مناجاة روحية واعية مع الخالق.'}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-surface-warm dark:bg-background border border-border flex items-center justify-between">
                            <span className="font-medium text-[11px]">
                              {isEn ? 'Lesson Notes & Reflections PDF' : 'ملخص الجلسة وملف الملاحظات'}
                            </span>
                            <span className="text-[10px] text-accent bg-secondary/40 px-2 py-0.5 rounded">
                              Auto-Saved ✓
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Live Pointer Bar */}
                <div className="mt-4 pt-3 border-t border-border/60 dark:border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {isEn ? "Ustadh Mahmoud is guiding this session" : "الأستاذ محمود يشرف على هذه الجلسة"}
                  </span>
                  <span className="text-[11px] font-mono">Zoom Audio: 48kHz HD</span>
                </div>
              </div>

              {/* Right Column: Live Video, Waveform & Real-Time Lesson Controls (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                
                {/* Teacher Video Stream Mockup */}
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden glass-surface border border-border aspect-4/3 shadow-md group">
                  <img
                    src="https://raw.githubusercontent.com/StackBlitz/stackblitz-images/main/teacher-mahmoud-portrait.jpg"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80";
                    }}
                    alt="Ustadh Mahmoud Teaching"
                    className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Teacher Name Tag */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span>{isEn ? 'Ustadh Mahmoud (Teacher)' : 'أستاذ محمود (المعلم)'}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div className="text-[10px] text-white/70">
                        {isEn ? 'Al-Azhar Scholar • C1 English' : 'خريج الأزهر الشريف • إنجليزية C1'}
                      </div>
                    </div>

                    {/* Equalizer Waveform */}
                    <div className="flex items-center gap-0.5 h-4">
                      {isPlayingAudio ? (
                        <>
                          <motion.span
                            animate={{ height: ['4px', '14px', '6px', '16px', '4px'] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                            className="w-1 bg-primary rounded-full"
                          />
                          <motion.span
                            animate={{ height: ['8px', '18px', '10px', '4px', '8px'] }}
                            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut', delay: 0.2 }}
                            className="w-1 bg-primary rounded-full"
                          />
                          <motion.span
                            animate={{ height: ['12px', '6px', '16px', '8px', '12px'] }}
                            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut', delay: 0.1 }}
                            className="w-1 bg-primary rounded-full"
                          />
                          <motion.span
                            animate={{ height: ['6px', '14px', '8px', '12px', '6px'] }}
                            transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut', delay: 0.3 }}
                            className="w-1 bg-primary rounded-full"
                          />
                        </>
                      ) : (
                        <div className="text-[10px] text-white/60 flex items-center gap-1">
                          <VolumeX className="w-3 h-3" />
                          <span>Muted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interactive Tool Actions */}
                <div className="bg-surface-warm dark:bg-background rounded-xl p-3.5 border border-border space-y-2.5">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>{isEn ? 'Interactive Teaching Tools' : 'أدوات الشرح التفاعلية'}</span>
                    <span className="text-[10px] text-primary font-normal">Active Session</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg glass-card border-none">
                      <Volume2 className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] font-medium">{isEn ? 'Slow Recitation' : 'تكرار متأنٍ'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg glass-card border-none">
                      <Mic className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] font-medium">{isEn ? 'Makharij Guide' : 'مخارج الحروف'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg glass-card border-none">
                      <MessageSquare className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] font-medium">{isEn ? 'Bilingual Chat' : 'حوار بالإنجليزية'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg glass-card border-none">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] font-medium">{isEn ? 'Flexible Times' : 'مواعيد مرنة'}</span>
                    </div>
                  </div>
                </div>

                {/* Free Trial Direct Call-to-Action */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenTrialModal}
                  className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-xs sm:text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{isEn ? 'Book Free 30-Min Trial Session' : 'احجز جلستك التجريبية المجانية (٣٠ دقيقة)'}</span>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                </motion.button>

              </div>

            </div>

            {/* Bottom Dock (mirrors the dock in the video with app icons & "all under one mentorship") */}
            <motion.div
              style={{
                scale: dockScale,
                y: dockY,
              }}
              className="bg-surface-warm dark:bg-background border-t border-border px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {isEn ? 'All 13 Disciplines' : '١٣ تخصصاً تعليمياً'}
                </span>
                <span>•</span>
                <span>{isEn ? 'One Direct Mentorship with Mahmoud' : 'إشراف تعليمي مباشر مع الأستاذ محمود'}</span>
              </div>

              {/* Badges Dock */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-1 rounded-md glass-surface border border-border text-foreground text-[11px] font-medium shadow-xs">
                  Quran
                </span>
                <span className="px-2.5 py-1 rounded-md glass-surface border border-border text-foreground text-[11px] font-medium shadow-xs">
                  Tajweed
                </span>
                <span className="px-2.5 py-1 rounded-md glass-surface border border-border text-foreground text-[11px] font-medium shadow-xs">
                  Islamic Studies
                </span>
                <span className="px-2.5 py-1 rounded-md glass-surface border border-border text-foreground text-[11px] font-medium shadow-xs">
                  Arabic
                </span>
                <span className="px-2.5 py-1 rounded-md glass-surface border border-border text-foreground text-[11px] font-medium shadow-xs">
                  English
                </span>
              </div>
            </motion.div>

          </motion.div>

        </div>

        {/* Transition Headline to the next section (Mirroring the video's "The official apps themselves..." bottom transition) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="mt-16 sm:mt-24 pt-12 border-t border-border max-w-4xl mx-auto text-center"
        >
          <div className="text-xs uppercase tracking-widest text-primary dark:text-primary font-semibold mb-3">
            {isEn ? 'Direct Teacher-to-Student Relationship' : 'علاقة مباشرة بين المعلم والطالب'}
          </div>
          <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight mb-4">
            {isEn
              ? 'No middleman marketplaces. No generic pre-recorded videos.'
              : 'دون منصات وسيطة ودون تسجيلات جاهزة لا تلبي احتياجك.'}
          </h3>
          <p className="text-base text-foreground/75 dark:text-border max-w-xl mx-auto mb-8">
            {isEn
              ? 'You work directly with Ustadh Mahmoud. Every lesson is scheduled to your local timezone, with dedicated follow-up over WhatsApp.'
              : 'تتعلم مباشرة مع الأستاذ محمود، في أوقات تتوافق مع منطقتك الزمنية، ومع تواصل مستمر عبر الواتساب.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left sm:text-center max-w-2xl mx-auto">
            <div className="p-4 rounded-xl glass-surface border border-border">
              <div className="font-display text-xl font-bold text-primary dark:text-primary mb-1">
                {isEn ? '30–60 Min' : '٣٠–٦٠ دقيقة'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isEn ? 'Flexible lesson durations' : 'خيارات مدة مرنة تناسب طاقتك'}
              </div>
            </div>

            <div className="p-4 rounded-xl glass-surface border border-border">
              <div className="font-display text-xl font-bold text-primary dark:text-primary mb-1">
                {isEn ? 'One Free Trial' : 'جلسة مجانية أولى'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isEn ? '30 min evaluation & mini lesson' : 'تقييم للمستوى ودرس مصغر'}
              </div>
            </div>

            <div className="p-4 rounded-xl glass-surface border border-border">
              <div className="font-display text-xl font-bold text-primary dark:text-primary mb-1">
                {isEn ? '3h Cancel Policy' : 'إلغاء قبل ٣ ساعات'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isEn ? 'Self-service reschedule window' : 'مرونة في إعادة الجدولة'}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
