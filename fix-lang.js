const fs = require('fs');

let c = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');

const regex = /<div className="flex items-center justify-between p-4 m-4 rounded-xl bg-surface-subtle border border-border\/50">[\s\S]*?<\/div>/;

const newLangDiv = `            <div className="flex items-center justify-between px-4 py-2.5 mx-4 mb-4 rounded-xl glass-surface border border-border/50">
              <span className="text-xs font-medium text-muted-foreground">{isAr ? 'اللغة' : 'Language'}</span>
              <button
                onClick={toggleLang}
                data-tour="language-toggle"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isAr ? 'English' : 'عربي'}</span>
              </button>
            </div>`;

c = c.replace(regex, newLangDiv);

if (!c.includes('Globe,')) {
  c = c.replace(
    /import { LogOut, BookOpen,/,
    `import { Globe, LogOut, BookOpen,`
  );
}

fs.writeFileSync('src/student/StudentApp.tsx', c);
