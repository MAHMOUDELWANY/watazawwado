const fs = require('fs');

let c = fs.readFileSync('src/components/booking/StepDateTime.tsx', 'utf8');

c = c.replace(
  `text-foreground/70 dark:text-muted-foreground/70`,
  `text-accent/80 dark:text-accent/80`
);
c = c.replace(
  `<span className="font-semibold text-muted-foreground">`,
  `<span className="font-semibold text-accent">`
);
c = c.replace(
  `className="w-full flex flex-wrap items-center justify-between p-3 sm:p-4 rounded-xl border border-border/50 bg-secondary/10 text-sm mb-6 gap-3"`,
  `className="w-full flex flex-wrap items-center justify-between p-3 sm:p-4 rounded-xl border border-accent/20 bg-accent/10 text-sm mb-6 gap-3"`
);
// fallback if the class was slightly different:
c = c.replace(
  `className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border/50 bg-secondary/10 text-sm mb-6"`,
  `className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border border-accent/20 bg-accent/10 text-sm mb-6"`
);

fs.writeFileSync('src/components/booking/StepDateTime.tsx', c);
