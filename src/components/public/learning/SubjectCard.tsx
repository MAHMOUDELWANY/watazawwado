import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { ServiceItem } from '../../../types';
import { SUBJECT_EMBLEMS } from '../illustrations/SubjectEmblems';
import { MushafEmblem } from '../emblems/DoorEmblems';
import { Link } from '../LangLink';

export type FamilyStyle = {
  /** Portal gradient, top → bottom (deep, so it reads the same in both themes). */
  portal: [string, string];
  chip: string;
  text: string;
};

type Props = {
  service: ServiceItem;
  family: FamilyStyle;
  isEn: boolean;
  title: string;
  tagline: string;
  whoFor: string;
  learn: string[];
  frequency: string;
  /** Hourly rate in USD (RULES.md §3); the $13 band is a "from" price. */
  rate: number;
  expanded: boolean;
  onToggle: () => void;
  onTrial: () => void;
};

/** One subject: a deep portal with its emblem, a title, one line, lesson lengths, details and a free trial. */
export function SubjectCard({ service, family, isEn, title, tagline, whoFor, learn, frequency, rate, expanded, onToggle, onTrial }: Props) {
  const reduceMotion = useReducedMotion();
  const Emblem = SUBJECT_EMBLEMS[service.id] || MushafEmblem;
  const detailsId = `details-${service.id}`;
  const portalStyle = { '--door-a': family.portal[0], '--door-b': family.portal[1] } as React.CSSProperties;

  return (
    <article className="subject-card group">
      <div className="subject-portal khatam-window" style={portalStyle}>
        <span className="subject-arch" aria-hidden="true" />
        <span className="door-glow" aria-hidden="true" />
        <Emblem className="subject-emblem" />
      </div>

      <div className="flex-1 px-5 pt-5 pb-4">
        <h3 className="font-editorial text-xl font-bold text-foreground leading-snug">{title}</h3>
        <p className="mt-1.5 text-[0.95rem] text-muted-foreground leading-relaxed">{tagline}</p>
        <ul className="mt-3.5 flex flex-wrap gap-1.5" aria-label={isEn ? 'Lesson lengths' : 'مدة الحصة'}>
          {service.durations.map((d) => (
            <li key={d} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${family.chip}`}>
              {isEn ? `${d} min` : `${d} دقيقة`}
            </li>
          ))}
        </ul>
        <p className="mt-3.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-editorial text-lg font-bold text-foreground">
            {rate > 9 ? (isEn ? `from $${rate}` : `من ${rate}$`) : (isEn ? `$${rate}` : `${rate}$`)}
          </span>
          <span className="text-sm text-muted-foreground">{isEn ? 'an hour' : 'للساعة'}</span>
          <Link to={`/pricing?subject=${service.id}`} className={`ms-auto text-sm font-bold underline-offset-4 hover:underline ${family.text}`}>
            {isEn ? 'Packages' : 'الباقات'}
          </Link>
        </p>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={detailsId}
            key="details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-4 pt-4 border-t border-border space-y-3 text-sm">
              <p className="text-foreground/85 leading-relaxed">{whoFor}</p>
              <ul className="space-y-1.5">
                {learn.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${family.text}`} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className={`text-xs font-semibold ${family.text}`}>
                {isEn ? `Suggested: ${frequency}` : `المقترح: ${frequency}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-5 pb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          className="subject-details-btn"
        >
          <span>{expanded ? (isEn ? 'Less' : 'أقل') : (isEn ? 'Details' : 'التفاصيل')}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <button type="button" onClick={onTrial} className="subject-trial-btn">
          {isEn ? 'Free trial' : 'حصة مجانية'}
        </button>
      </div>
    </article>
  );
}
