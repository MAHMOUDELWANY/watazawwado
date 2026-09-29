const fs = require('fs');

let c = fs.readFileSync('src/dashboard/DashboardApp.tsx', 'utf8');

if (!c.includes('desktopSidebarOpen')) {
  c = c.replace(
    /const \[isMobileMenuOpen, setIsMobileMenuOpen\] = useState\(false\);/,
    `const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [showGlobalTour, setShowGlobalTour] = useState(false);`
  );
}

// Ensure HelpCircle, Globe are imported
if (!c.includes('HelpCircle,')) {
  c = c.replace(
    /import { Menu, X, LayoutDashboard,/,
    `import { HelpCircle, Globe, Menu, X, LayoutDashboard,`
  );
}
if (!c.includes('OnboardingGuide')) {
  c = c.replace(
    /import { ThemeToggle } from '\.\.\/components\/ui\/ThemeToggle';/,
    `import { ThemeToggle } from '../components/ui/ThemeToggle';\nimport { OnboardingGuide } from '../components/ui/OnboardingGuide';`
  );
}

// Sidebar toggle button update
c = c.replace(
  /<button\s*onClick=\{toggleMobileMenu\}\s*className="p-2 -ms-2 rounded-xl text-muted-foreground/g,
  `<button 
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setDesktopSidebarOpen(!desktopSidebarOpen);
                } else {
                  toggleMobileMenu();
                }
              }}
              className="p-2 -ms-2 rounded-xl text-muted-foreground`
);

// Remove md:hidden from the hamburger button so it shows on desktop too
c = c.replace(
  /<button\s*onClick=\{[^}]+\}\s*className="p-2 -ms-2 rounded-xl text-muted-foreground hover:bg-surface-subtle md:hidden/g,
  `<button 
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setDesktopSidebarOpen(!desktopSidebarOpen);
                } else {
                  toggleMobileMenu();
                }
              }}
              className="p-2 -ms-2 rounded-xl text-muted-foreground hover:bg-surface-subtle`
);

// Desktop styling for sidebar
c = c.replace(
  /md:static md:translate-x-0 md:w-\[280px\] md:m-4 md:rounded-3xl md:glass-nav md:shadow-xl md:border md:border-border\/50/g,
  `\${desktopSidebarOpen ? 'md:static md:translate-x-0 md:w-[280px] md:m-4 md:rounded-3xl md:glass-nav md:shadow-xl md:border md:border-border/50' : 'md:hidden md:w-0 md:m-0'}`
);

// Language toggle and Help/Logout
const oldLangRegex = /<div className="flex items-center justify-between px-2 pb-1">[\s\S]*?<button[\s\S]*?onClick=\{toggleLanguage\}[\s\S]*?>[\s\S]*?<\/button>\s*<\/div>/;

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
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold text-sm"
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
            </div>
`;

// Just replace everything from `<div className="flex items-center justify-between px-2 pt-2">` to the end of the sidebar footer controls!
c = c.replace(
  /<div className="flex items-center justify-between px-2 pt-2">[\s\S]*?<LogOut className="w-4 h-4" \/>[\s\S]*?<\/button>\s*<\/div>/,
  newFooterControls
);

// We need to inject the Tour Steps logic
const tourStepsCode = `  const globalTourSteps = [
    {
      targetId: 'teacher-sidebar',
      title: lang === 'ar' ? 'القائمة الجانبية' : 'Navigation',
      content: lang === 'ar' ? 'يمكنك التنقل بين لوحة التحكم، الطلاب، الجدولة، والفواتير.' : 'Navigate through dashboard, students, schedule, and billing.'
    },
    {
      targetId: 'language-toggle',
      title: lang === 'ar' ? 'تغيير اللغة' : 'Change Language',
      content: lang === 'ar' ? 'تبديل واجهة المعلم بين العربية والإنجليزية.' : 'Toggle teacher interface between Arabic and English.'
    },
    {
      targetId: 'teacher-logout',
      title: lang === 'ar' ? 'تسجيل الخروج' : 'Log Out',
      content: lang === 'ar' ? 'تسجيل الخروج من الحساب.' : 'Sign out of your account.'
    }
  ];`;

if (!c.includes('globalTourSteps')) {
  c = c.replace(
    /const toggleMobileMenu = \(\) => setIsMobileMenuOpen\(!isMobileMenuOpen\);/,
    `const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);\n${tourStepsCode}`
  );
}

// Append the OnboardingGuide component at the end of DashboardApp
c = c.replace(
  /<\/div>\s*<\/>\s*\);\s*}\s*$/g,
  `        {/* Global Onboarding Guide */}
        <OnboardingGuide steps={globalTourSteps} isOpen={showGlobalTour} onClose={() => setShowGlobalTour(false)} isAr={lang === 'ar'} />
      </div>
    </>
  );
}
`
);

fs.writeFileSync('src/dashboard/DashboardApp.tsx', c);
