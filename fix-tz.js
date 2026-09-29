const fs = require('fs');

let c = fs.readFileSync('src/student/pages/StudentOnboardingPage.tsx', 'utf8');

c = c.replace(
  `                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Your Timezone (IANA)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-accent absolute start-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm"
                    />
                  </div>`,
  `                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Your Timezone
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-accent absolute start-3.5 top-[11px] pointer-events-none" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm appearance-none"
                    >
                      {Intl.supportedValuesOf('timeZone').map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>`
);

fs.writeFileSync('src/student/pages/StudentOnboardingPage.tsx', c);
