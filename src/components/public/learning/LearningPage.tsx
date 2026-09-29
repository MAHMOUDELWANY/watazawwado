import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, StudyLine, MarginNote, PublicButton } from '../PublicDesignSystem';
import { SERVICES_DATA } from '../../../data/content';
import { BookOpen, Globe2, Languages, MessageSquare, Library } from 'lucide-react';

export function LearningPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  const categoryIcons: Record<string, React.ReactNode> = {
    'quran': <BookOpen className="w-5 h-5 text-primary" />,
    'islamic_studies': <Library className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    'arabic': <Languages className="w-5 h-5 text-accent" />,
    'english': <Globe2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
  };

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-16">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-6">
            <MarginNote className="mx-auto">
              {isEn ? 'Areas of Study' : 'مسارات التعلم'}
            </MarginNote>
            <h1 className="font-editorial text-4xl sm:text-5xl text-foreground">
              {isEn ? 'What you can learn.' : 'ماذا يمكنك أن تتعلم.'}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {isEn 
                ? 'Structured, personalized 1-on-1 education tailored to your goals. We focus on depth, correct understanding, and building a foundation that lasts.'
                : 'تعليم فردي منظم ومخصص لأهدافك. نركز على الفهم الصحيح، التأسيس العميق، وبناء علاقة مستدامة مع العلم.'}
            </p>
          </div>

          <div className="space-y-16 pt-12">
            {SERVICES_DATA.map((pillar) => {
              const borderColors: Record<string, string> = {
                quran: 'hover:border-primary/60 border-primary/20',
                islamic_studies: 'hover:border-teal-500/60 border-teal-500/30',
                arabic: 'hover:border-terracotta/60 border-terracotta/30',
                english: 'hover:border-teal-500/60 border-teal-500/30'
              };
              const accentColorClass = borderColors[pillar.id] || 'border-border-subtle';

              return (
                <div key={pillar.id} className={`relative ps-4 md:ps-8 border-s-2 ${accentColorClass} transition-colors duration-300`}>
                  <div className="absolute -left-[11px] rtl:-left-auto rtl:-right-[11px] top-0 bg-background p-1 rounded-full shadow-xs">
                    {categoryIcons[pillar.id] || <MessageSquare className="w-5 h-5 text-accent" />}
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="font-editorial text-2xl sm:text-3xl text-foreground mb-3 font-bold">
                      {isEn ? pillar.title : pillar.arabicTitle}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {isEn ? pillar.description : (pillar.arabicDescription || pillar.description)}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {pillar.services.map((service) => (
                      <div key={service.id} className="glass-card p-6 rounded-2xl border border-border/80 group hover:border-teal-500/40 hover:shadow-xs transition-all">
                        <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                          {isEn ? service.name : (service.arabicName || service.name)}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {isEn ? service.tagline : (service.arabicTagline || service.tagline)}
                        </p>
                        <button 
                          onClick={() => onOpenTrialModal(service.id)}
                          className="text-sm font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 flex items-center gap-1.5 transition-colors"
                        >
                          <span>{isEn ? 'Discuss in trial lesson' : 'ناقش هذا المسار في جلستك الأولى'}</span>
                          <span className="rtl:rotate-180">→</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <StudyLine className="my-16" />

          <div className="glass-card p-8 sm:p-12 rounded-2xl border border-border-subtle text-center">
            <h3 className="font-editorial text-2xl text-foreground mb-4">
              {isEn ? 'Not sure where to start?' : 'متردد من أين تبدأ؟'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {isEn 
                ? 'Book a free diagnostic trial. We will evaluate your current level and build a learning plan specifically for you.'
                : 'احجز جلسة تجريبية مجانية لتقييم مستواك. سنقوم ببناء خطة تعليمية تناسبك تماماً.'}
            </p>
            <PublicButton size="lg" onClick={() => onOpenTrialModal()}>
              {isEn ? 'Book Free Assessment' : 'احجز جلسة تقييم مجانية'}
            </PublicButton>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-6 text-sm">
              <Link to="/how-it-works" className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-bold hover:underline">
                <span>{isEn ? 'See How Lessons Work (4 Stages)' : 'تعرف على خطوات التعلم (كيف نعمل)'}</span>
                <span className="rtl:rotate-180">→</span>
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/pricing" className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline">
                <span>{isEn ? 'View Pricing Packages' : 'شاهد باقات وأسعار الدروس'}</span>
                <span className="rtl:rotate-180">→</span>
              </Link>
            </div>
          </div>

        </div>
      </PublicSection>
    </main>
  );
}
