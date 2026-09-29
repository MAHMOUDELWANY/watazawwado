const fs = require('fs');

let c = fs.readFileSync('src/dashboard/DashboardApp.tsx', 'utf8');

const regex = /<div className="flex items-center justify-between px-2 pt-2">[\s\S]*?<button[\s\S]*?onClick=\{toggleLanguage\}[\s\S]*?>[\s\S]*?<\/button>\s*<\/div>/;

const newFooterControls = `
            <div className="flex items-center justify-between px-2 pt-2">
              <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'السمة' : 'Theme'}</span>
              <ThemeToggle />
            </div>
            
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs font-medium text-muted-foreground">{lang === 'ar' ? 'اللغة' : 'Language'}</span>
              <button
                onClick={toggleLanguage}
                data-tour="language-toggle"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === "en" ? 'عربي' : 'EN'}</span>
              </button>
            </div>
            
            <div className="pt-2 flex flex-col gap-2">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); setShowGlobalTour(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold text-sm cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{lang === 'ar' ? 'دليل الاستخدام' : 'Tour Guide'}</span>
              </button>
              <button 
                onClick={() => signOut()}
                data-tour="teacher-logout"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-semibold text-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            </div>`;

c = c.replace(regex, newFooterControls);

if (!c.includes('LogOut,')) {
  c = c.replace(
    /import { HelpCircle, Globe, Menu, X, LayoutDashboard,/,
    `import { LogOut, HelpCircle, Globe, Menu, X, LayoutDashboard,`
  );
}

fs.writeFileSync('src/dashboard/DashboardApp.tsx', c);
