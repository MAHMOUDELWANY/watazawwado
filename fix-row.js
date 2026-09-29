const fs = require('fs');

let c = fs.readFileSync('src/components/intake/IntakeConversation.tsx', 'utf8');

c = c.replace(
  `function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}`,
  `function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  const displayValue = value.length > 90 ? value.substring(0, 90) + '...' : value;
  return (
    <div className="flex flex-col mb-3 last:mb-0">
      <dt className="text-muted-foreground text-[11px] uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className="text-foreground text-sm font-medium leading-relaxed break-words">{displayValue}</dd>
    </div>
  );
}`
);

fs.writeFileSync('src/components/intake/IntakeConversation.tsx', c);
