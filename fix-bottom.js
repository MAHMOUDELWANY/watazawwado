const fs = require('fs');
let c = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');

c = c.replace(
  /<StudentAuthModal/,
  `{/* Global Onboarding Guide */}
      <OnboardingGuide steps={globalTourSteps} isOpen={showGlobalTour} onClose={() => setShowGlobalTour(false)} isAr={isAr} />
      <StudentAuthModal`
);

fs.writeFileSync('src/student/StudentApp.tsx', c);
