const fs = require('fs');

let c = fs.readFileSync('src/components/intake/IntakeConversation.tsx', 'utf8');

c = c.replace(
  `<dt className="text-muted-foreground text-[11px] uppercase tracking-wider mb-0.5">{label}</dt>`,
  `<dt className="text-accent/90 text-[11px] uppercase tracking-wider mb-0.5">{label}</dt>`
);
c = c.replace(
  `<dd className="text-foreground text-sm font-medium leading-relaxed break-words">{displayValue}</dd>`,
  `<dd className="text-foreground dark:text-accent text-sm font-medium leading-relaxed break-words">{displayValue}</dd>`
);

fs.writeFileSync('src/components/intake/IntakeConversation.tsx', c);
