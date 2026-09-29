const fs = require('fs');

let c1 = fs.readFileSync('src/components/ContactSection.tsx', 'utf8');
c1 = c1.replace(
  'className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-surface text-sm font-medium hover:bg-surface-subtle transition-colors text-foreground"',
  'className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full btn-whatsapp text-sm font-medium"'
);
fs.writeFileSync('src/components/ContactSection.tsx', c1);

let c2 = fs.readFileSync('src/components/FreeTrialSection.tsx', 'utf8');
c2 = c2.replace(
  'className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass-surface border border-border text-foreground hover:bg-surface-subtle transition-all font-medium justify-center min-w-[240px] shadow-xs"',
  'className="inline-flex items-center gap-2 px-5 py-3 rounded-xl btn-whatsapp font-medium justify-center min-w-[240px] shadow-xs"'
);
fs.writeFileSync('src/components/FreeTrialSection.tsx', c2);

let c3 = fs.readFileSync('src/components/Footer.tsx', 'utf8');
c3 = c3.replace(
  'className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"',
  'className="inline-flex items-center gap-2 text-sm btn-whatsapp px-3 py-1.5 rounded-full"'
);
fs.writeFileSync('src/components/Footer.tsx', c3);
