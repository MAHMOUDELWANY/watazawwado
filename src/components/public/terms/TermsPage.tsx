import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, MarginNote } from '../PublicDesignSystem';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function TermsPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <MarginNote className="mx-auto flex items-center justify-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isEn ? 'Terms & Conditions' : 'الشروط والأحكام'}</span>
            </MarginNote>
            
            <h1 className="font-editorial text-4xl sm:text-5xl text-foreground font-bold">
              {isEn ? 'Terms of Service' : 'شروط الخدمة والاستخدام'}
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? 'Clear, transparent guidelines governing educational sessions, bookings, cancellations, and student commitments at Watazawwado Academy.'
                : 'إرشادات واضحة وشفافة تنظم الجلسات التعليمية والحجوزات والإلغاء والتزامات الطلاب في منصة وتزودوا.'}
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold">
              <span>{isEn ? 'Last Updated: October 2026' : 'آخر تحديث: أكتوبر 2026'}</span>
              <span>•</span>
              <span>watazawwado.academy</span>
            </div>
          </div>

          {/* Key Policies at a Glance */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-sm">
                {isEn ? '3-Hour Reschedule Window' : 'مهلة إعادة الجدولة (3 ساعات)'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn 
                  ? 'Lessons may be rescheduled or cancelled self-service up to 3 hours before start time.' 
                  : 'يمكن إعادة جدولة أو إلغاء الدرس ذاتياً حتى 3 ساعات قبل موعد الحصة.'}
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-sm">
                {isEn ? 'One Free Trial' : 'جلسة تجريبية واحدة مجاناً'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn 
                  ? 'One complimentary 30-minute trial session is granted per new student.' 
                  : 'يحق لكل طالب جديد حجز جلسة تجريبية واحدة مجانية مدتها 30 دقيقة.'}
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-secondary/20 flex items-center justify-center text-accent">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-sm">
                {isEn ? 'Respectful Environment' : 'بيئة تعليمية منضبطة'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn 
                  ? 'Dedicated space for focused study with punctuality and mutual respect.' 
                  : 'بيئة تركز على الجدية والالتزام بالمواعيد والاحترام المتبادل بين المعلم والطالب.'}
              </p>
            </div>
          </div>

          {/* Detailed Terms */}
          <div className="space-y-10 text-foreground leading-relaxed">
            
            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 1' : 'القسم الأول'} noAccent>
                {isEn ? '1. Scope of Educational Services' : '1. نطاق الخدمات التعليمية'}
              </EditorialHeading>
              <p className="text-sm sm:text-base text-muted-foreground">
                {isEn
                  ? 'Watazawwado Academy provides live, online 1-on-1 tutoring sessions in Quran recitation, Tajweed rules, Arabic language, and foundational Islamic studies. Sessions are conducted through third-party video software (Zoom / Google Meet) under the direct instruction of Ustadh Mahmoud Said Alwani and certified teaching associates.'
                  : 'تقدم منصة وتزودوا دروساً فردية حية ومباشرة عبر الإنترنت لتعليم القرآن الكريم والتجويد واللغة العربية والدراسات الإسلامية. تُعقد الدروس عبر برامج الاتصال المرئي المعتمدة (Zoom / Google Meet) بإشراف وتدريس الأستاذ محمود سعيد علواني والمعلمين المعتمدين.'}
              </p>
            </section>

            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 2' : 'القسم الثاني'} noAccent>
                {isEn ? '2. Bookings, Cancellations, and Rescheduling Policy' : '2. سياسة الحجز والإلغاء وإعادة الجدولة'}
              </EditorialHeading>
              <div className="text-sm sm:text-base text-muted-foreground space-y-2">
                <p>
                  {isEn
                    ? 'Our scheduling system operates on a fair, mutual commitment policy:'
                    : 'يعتمد نظام المواعيد لدينا على سياسة التزام عادلة ومتبادلة بين الطرفين:'}
                </p>
                <ul className="list-disc ps-6 space-y-2">
                  <li>
                    <strong>{isEn ? 'Self-Service Rescheduling:' : 'إعادة الجدولة الذاتية:'}</strong>{' '}
                    {isEn
                      ? 'Students may reschedule or cancel any upcoming session free of charge up to 3 hours prior to the scheduled start time using the self-service management link provided in their confirmation email.'
                      : 'يحق للطالب إعادة جدولة أو إلغاء أي درس مجاناً حتى 3 ساعات قبل موعد الدرس من خلال رابط إدارة الحجز الذاتي الموجود في إيميل التأكيد.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Late Cancellations and No-Shows:' : 'الإلغاء المتأخر وعدم الحضور:'}</strong>{' '}
                    {isEn
                      ? 'Cancellations within 3 hours of lesson time or failure to attend a scheduled session without advance notice are considered consumed, as the teacher’s dedicated time slot is reserved exclusively.'
                      : 'الإلغاء في غضون أقل من 3 ساعات أو عدم حضور الجلسة دون إشعار مسبق يُعد الدرس مستهلكاً نظراً لحجز وقت المعلم بالكامل.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Teacher Punctuality:' : 'التزام المعلم بالمواعيد:'}</strong>{' '}
                    {isEn
                      ? 'In the rare event that the teacher is unable to attend due to an emergency or technical failure, the session will be fully rescheduled at the student’s convenience.'
                      : 'في حال تعذر حضور المعلم لأي ظرف طارئ، يتم تعويض الحصة بالكامل وجدولتها في موعد بديل يناسب الطالب.'}
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 3' : 'القسم الثالث'} noAccent>
                {isEn ? '3. Packages, Credits, and Payments' : '3. الباقات والأرصدة والمدفوعات'}
              </EditorialHeading>
              <div className="text-sm sm:text-base text-muted-foreground space-y-2">
                <p>
                  {isEn
                    ? 'Lessons are paid either per session or via structured multi-lesson packages. Payment claims are submitted via verified direct channels (PayPal, Payoneer, International Bank Transfer, or US ACH). Package credits are activated upon payment confirmation and remain valid according to the agreed curriculum timeframe.'
                    : 'يتم سداد رسوم الدروس إما بنظام الحصة الفردية أو عبر باقات الدروس. تُرسل إشعارات الدفع عبر وسائل التحويل المعتمدة (PayPal، Payoneer، التحويل البنكي الدولي، أو ACH الأمريكي). يتم تفعيل رصيد الباقة بمجرد مراجعة واعتماد التحويل.'}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <EditorialHeading eyebrow={isEn ? 'Section 4' : 'القسم الرابع'} noAccent>
                {isEn ? '4. Contact for Support and Inquiries' : '4. التواصل والدعم الفني'}
              </EditorialHeading>
              <div className="glass-card p-6 rounded-2xl border border-border/80 text-sm sm:text-base space-y-2 text-muted-foreground">
                <p>
                  {isEn
                    ? 'For inquiries or assistance regarding our Terms of Service, please reach out to:'
                    : 'لأي استفسار أو مساعدة تتعلق بشروط الخدمة، يرجى التواصل عبر:'}
                </p>
                <p className="font-semibold text-foreground">
                  Email: support@watazawwado.academy / mahmoudelwany98@gmail.com
                </p>
                <p className="font-semibold text-foreground">
                  WhatsApp: +201552425799
                </p>
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
