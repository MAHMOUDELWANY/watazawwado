import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Mail, Send, CheckCircle2, Clock } from 'lucide-react';
import { Language } from '../types';
import { ARABIC_TRANSLATIONS } from '../data/content';
import { buildWhatsAppUrl } from '../lib/whatsapp';

interface ContactSectionProps {
  lang: Language;
  onOpenTrialModal: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ lang }) => {
  const isEn = lang === 'en';
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    interest: 'Quran Reading & Tajweed',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          serviceInterest: formData.interest,
          message: formData.message,
          source: 'website_contact'
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      setFormSubmitted(true);
    } catch (err: any) {
      setFormError(err.message || 'Could not send your message. Please reach out directly on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-20 md:py-28 bg-surface-subtle border-b border-border/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mb-16"
        >
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            {isEn ? 'Direct Communication' : ARABIC_TRANSLATIONS.nav.contact}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            {isEn ? 'Reach Mahmoud directly.' : 'تواصل مع محمود مباشرة.'}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {isEn
              ? 'Have a question before booking your free trial? Or wondering which service fits your family? Message directly on WhatsApp or send a message below.'
              : 'هل لديك استفسار قبل حجز الجلسة التجريبية؟ أو ترغب في استشارة حول المسار الأنسب لك أو لأطفالك؟ تواصل مباشرة عبر واتساب أو أرسل رسالتك هنا.'}
          </p>
        </motion.div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Quick Channels & Policy (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Primary WhatsApp Card */}
            <div className="p-7 rounded-2xl bg-surface border border-border shadow-2xs hover:border-primary/40 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-foreground">
                    WhatsApp Direct
                  </h3>
                  <p className="text-xs text-primary font-medium">
                    {isEn ? 'Fastest response • Usually within hours' : 'الرد الأسرع • خلال ساعات قليلة'}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                {isEn
                  ? 'Message Mahmoud directly to ask about your level, schedule compatibility, or lesson format.'
                  : 'تحدث مع محمود مباشرة للسؤال عن التوقيت، مستواك، أو تفاصيل الدروس.'}
              </p>

              <a
                href={buildWhatsAppUrl('Assalamu Alaikum Ustadh Mahmoud, I would like to ask about your 1-on-1 lessons.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-sm shadow-xs hover:shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isEn ? 'Open WhatsApp Chat' : 'فتح محادثة واتساب'}</span>
              </a>
            </div>

            {/* Email Card */}
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-2xs">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-primary" />
                <h4 className="font-serif text-base font-medium text-foreground">
                  {isEn ? 'Email Correspondence' : 'المراسلة عبر البريد الإلكتروني'}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {isEn
                  ? 'Ideal for detailed inquiries or institutional requests.'
                  : 'مناسب للاستفسارات المفصلة أو متطلبات العائلات.'}
              </p>
              <a
                href="mailto:mhmwdlwany4222@gmail.com"
                className="text-xs sm:text-sm font-mono text-primary hover:underline"
              >
                mhmwdlwany4222@gmail.com
              </a>
            </div>

            {/* Policy Recap */}
            <div className="p-5 rounded-xl bg-surface border border-border text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>{isEn ? 'Core Scheduling Policy' : 'سياسة المواعيد الأساسية'}</span>
              </div>
              <p>
                {isEn
                  ? 'Lessons can be cancelled or rescheduled up to 3 hours in advance. Inside 3 hours, please contact Mahmoud directly.'
                  : 'يمكن إلغاء الدرس أو إعادة جدولته مجاناً حتى ٣ ساعات قبل الموعد. أقل من ٣ ساعات يُرجى التواصل مباشرة مع محمود.'}
              </p>
            </div>

          </div>

          {/* Direct Message Form (7 cols on lg) */}
          <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-7 sm:p-9 shadow-xs">
            {formSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-foreground">
                  {isEn ? 'Message Sent Successfully' : 'تم استلام رسالتك بنجاح'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {isEn
                    ? 'Jazakum Allah Khair. Mahmoud has received your note and will reply directly to your email or WhatsApp shortly.'
                    : 'جزاكم الله خيراً. تلقى محمود رسالتك وسيرد عليك عبر البريد أو الواتساب في أقرب وقت.'}
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="text-xs text-primary hover:underline font-medium mt-4 cursor-pointer"
                >
                  {isEn ? 'Send another inquiry' : 'إرسال استفسار آخر'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                  {isEn ? 'Send an Inquiry' : 'أرسل استفسارك'}
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  {isEn
                    ? 'Fill out this brief form and Mahmoud will personally get in touch.'
                    : 'املأ هذه البيانات البسيطة وسيتواصل معك محمود شخصياً.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {isEn ? 'Your Name / Student Name' : 'اسمك / اسم الطالب'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isEn ? 'e.g. Omar Khan' : 'الاسم الكريم'}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {isEn ? 'Email Address' : 'البريد الإلكتروني'} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {isEn ? 'WhatsApp Number (Optional)' : 'رقم الواتساب (اختياري)'}
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {isEn ? 'Primary Learning Interest' : 'المجال الذي ترغب بتعلمه'}
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Quran Reading & Tajweed">Quran Reading & Tajweed</option>
                      <option value="Quran Memorization">Quran Memorization (Hifz)</option>
                      <option value="Islamic Studies">Islamic Studies (Aqeedah/Fiqh/Seerah)</option>
                      <option value="Modern Standard Arabic">Modern Standard Arabic</option>
                      <option value="Arabic Conversation">Spoken Arabic Conversation</option>
                      <option value="Egyptian Arabic">Egyptian Dialect</option>
                      <option value="English Coaching">English Coaching</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    {isEn ? 'Message or Any Specific Questions' : 'رسالتك أو أي تفاصيل ترغب بمشاركتها'} *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={
                      isEn
                        ? 'Tell Mahmoud about yourself or your child, previous learning experience, or preferred days/times...'
                        : 'أخبر محمود عن مستواك، خبرتك السابقة، أو المواعيد المناسبة لك...'
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-medium text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
                  <span>
                    {submitting 
                      ? (isEn ? 'Sending...' : 'جارٍ الإرسال...')
                      : (isEn ? 'Send Message to Mahmoud' : 'إرسال الرسالة إلى محمود')}
                  </span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
