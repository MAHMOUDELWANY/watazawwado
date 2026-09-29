const fs = require('fs');

let c = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');

if (!c.includes('OnboardingGuide')) {
  c = c.replace(
    /import { AccountDropdown } from '\.\.\/components\/ui\/AccountDropdown';/,
    `import { AccountDropdown } from '../components/ui/AccountDropdown';\nimport { OnboardingGuide } from '../components/ui/OnboardingGuide';`
  );
}

if (!c.includes('HelpCircle,')) {
  c = c.replace(
    /import { Globe, LogOut, BookOpen,/,
    `import { HelpCircle, Globe, LogOut, BookOpen,`
  );
}

const tourStepsCode = `  const globalTourSteps = [
    {
      targetId: 'nav-book-link-desktop',
      title: isAr ? 'حجز الدروس' : 'Book Lessons',
      content: isAr ? 'من هنا يمكنك اختيار الدرس وحجز مواعيدك بكل سهولة.' : 'From here you can choose a subject and book your lessons easily.'
    },
    {
      targetId: 'nav-account-link-desktop',
      title: isAr ? 'إدارة الحساب' : 'Account Management',
      content: isAr ? 'تعديل بياناتك، متابعة رصيدك، وتغيير الإعدادات من هذا القسم.' : 'Update your profile, check your balance, and change settings here.'
    },
    {
      targetId: 'language-toggle',
      title: isAr ? 'تغيير اللغة' : 'Change Language',
      content: isAr ? 'يمكنك التبديل بين العربية والإنجليزية في أي وقت.' : 'You can switch between Arabic and English at any time.'
    },
    {
      targetId: 'student-logout',
      title: isAr ? 'تسجيل الخروج' : 'Log Out',
      content: isAr ? 'عند الانتهاء، يمكنك تسجيل الخروج من هنا بأمان.' : 'When you are done, you can safely log out from here.'
    }
  ];`;

if (!c.includes('globalTourSteps')) {
  c = c.replace(
    /const toggleSidebar = \(\) => setSidebarOpen\(!sidebarOpen\);/,
    `const toggleSidebar = () => setSidebarOpen(!sidebarOpen);\n${tourStepsCode}`
  );
}

const helpButtonCode = `
      <div className="p-4 mt-auto border-t border-border/10">
        <button 
          onClick={() => { setSidebarOpen(false); setShowGlobalTour(true); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold text-sm"
        >
          <HelpCircle className="w-4 h-4" />
          <span>{isAr ? 'دليل الاستخدام' : 'Tour Guide'}</span>
        </button>
        <button `;

c = c.replace(
  /<div className="p-4 mt-auto mb-\[env\(safe-area-inset-bottom\)\] lg:mb-0 border-t border-border\/10">\s*<button /g,
  helpButtonCode.replace('mt-auto', 'mt-auto mb-[env(safe-area-inset-bottom)] lg:mb-0')
);

const renderTourCode = `
        {/* Global Onboarding Guide */}
        <OnboardingGuide steps={globalTourSteps} isOpen={showGlobalTour} onClose={() => setShowGlobalTour(false)} isAr={isAr} />
      </div>
    </>
  );
}
`;

c = c.replace(
  /<\/div>\s*<\/>\s*\);\s*}\s*$/g,
  renderTourCode
);

fs.writeFileSync('src/student/StudentApp.tsx', c);
