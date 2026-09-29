import React from 'react';
import { cn } from '../../lib/utils';

export type GlassLevel = 'surface' | 'card' | 'nav' | 'sheet' | 'dialog';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: GlassLevel;
  hover?: boolean;
  specular?: boolean;
  brandEdge?: boolean;
  as?: 'div' | 'section' | 'aside' | 'nav' | 'header' | 'footer' | 'main' | 'article';
}

const glassLevelClasses: Record<GlassLevel, string> = {
  surface: 'glass-surface',
  card: 'glass-card',
  nav: 'glass-nav',
  sheet: 'glass-sheet',
  dialog: 'glass-dialog',
};

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ level = 'card', hover = false, specular = true, brandEdge = false, as: Tag = 'div', className, children, ...props }, ref) => {
    return (
      <Tag
        ref={ref as any}
        className={cn(
          'relative rounded-2xl',
          glassLevelClasses[level],
          hover && 'glass-hover',
          specular && 'glass-specular',
          brandEdge && 'glass-brand-edge',
          className
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
GlassSurface.displayName = 'GlassSurface';
