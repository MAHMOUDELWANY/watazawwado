const fs = require('fs');

// 1. FIX StudentApp.tsx
let studentApp = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');

// Remove OnboardingGuide from coreLoading
studentApp = studentApp.replace(/\{\/\* Global Onboarding Guide \*\/}[\s\S]*?<OnboardingGuide[^>]*\/>\s*/, '');

// Add OnboardingGuide to main return
studentApp = studentApp.replace(
  /<StudentAuthModal/,
  `{/* Global Onboarding Guide */}
      <OnboardingGuide steps={globalTourSteps} isOpen={showGlobalTour} onClose={() => setShowGlobalTour(false)} isAr={isAr} />
      <StudentAuthModal`
);

// Add data-tour to language toggle in StudentApp
studentApp = studentApp.replace(
  /onClick=\{toggleLang\}/,
  'onClick={toggleLang} data-tour="language-toggle"'
);

fs.writeFileSync('src/student/StudentApp.tsx', studentApp);

// 2. FIX DashboardApp.tsx
let dashboardApp = fs.readFileSync('src/dashboard/DashboardApp.tsx', 'utf8');

if (!dashboardApp.includes('<OnboardingGuide steps={globalTourSteps}')) {
  dashboardApp = dashboardApp.replace(
    /<\/main>\s*<\/div>\s*\);\s*}\s*$/g,
    `      </main>
      {/* Global Onboarding Guide */}
      <OnboardingGuide steps={globalTourSteps} isOpen={showGlobalTour} onClose={() => setShowGlobalTour(false)} isAr={lang === 'ar'} />
    </div>
  );
}
`
  );
}

fs.writeFileSync('src/dashboard/DashboardApp.tsx', dashboardApp);
