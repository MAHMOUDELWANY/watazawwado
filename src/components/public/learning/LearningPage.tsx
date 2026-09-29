import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, StudyLine, MarginNote, PublicButton } from '../PublicDesignSystem';
import { SERVICES_DATA } from '../../../data/content';
import { BookOpen, Globe2, Languages, MessageSquare, Library } from 'lucide-react';

export function LearningPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  const categoryIcons: Record<string, React.ReactNode> = {
    'quran': <BookOpen className="w-5 h-5 text-accent" />,
    'islamic_studies': <Library className="w-5 h-5 text-accent" />,
    'arabic': <Languages className="w-5 h-5 text-accent" />,
    'english': <Globe2 className="w-5 h-5 text-accent" />
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
            {SERVICES_DATA.map((pillar) => (
              <div key={pillar.id} className="relative ps-4 md:ps-8 border-s-2 border-border-subtle hover:border-accent transition-colors duration-300">
                <div className="absolute -left-[11px] rtl:-left-auto rtl:-right-[11px] top-0 bg-background p-1">
                  {categoryIcons[pillar.id] || <MessageSquare className="w-5 h-5 text-accent" />}
                </div>
                
                <div className="mb-6">
                  <h2 className="font-editorial text-2xl sm:text-3xl text-foreground mb-3">
                    {isEn ? pillar.title : pillar.arabicTitle}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {pillar.services.map((service) => (
                    <div key={service.id} className="bg-surface-warm p-6 rounded-lg border border-border-subtle group">
                      <h3 className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {service.tagline}
                      </p>
                      <button 
                        onClick={() => onOpenTrialModal(service.id)}
                        className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                      >
                        {isEn ? 'Discuss in trial lesson' : 'ناقش هذا المسار في الجلسة التجريبية'}
                        <span className="rtl:rotate-180">→</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
          </div>

        </div>
      </PublicSection>
    </main>
  );
}
