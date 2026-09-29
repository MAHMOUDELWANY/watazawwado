const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  for (const [search, replace] of replacements) {
    if (typeof search === 'string') {
      content = content.replaceAll(search, replace);
    } else {
      content = content.replace(search, replace);
    }
  }
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  }
}

// Modal.tsx
replaceInFile('src/components/ui/Modal.tsx', [
  ['rounded-2xl glass-dialog', 'rounded-[32px] glass-dialog glass-specular'],
]);

// GlassSurface.tsx
replaceInFile('src/components/ui/GlassSurface.tsx', [
  ['specular = false', 'specular = true'],
]);

// Hero.tsx
replaceInFile('src/components/Hero.tsx', [
  ['bg-surface-subtle', 'glass-card glass-brand-edge'],
  ['bg-primary hover:bg-primary-hover text-primary-foreground', 'btn-primary-material'],
  [/text-sm/g, 'text-base'],
]);

// PublicHomepage.tsx
replaceInFile('src/pages/public/PublicHomepage.tsx', [
  ['bg-surface hover:bg-surface-subtle', 'glass-card glass-brand-edge'],
  ['bg-surface', 'glass-card'],
  ['text-accent', 'text-interactive'],
]);

// PricingPage.tsx
replaceInFile('src/pages/public/PricingPage.tsx', [
  ['bg-surface hover:border-primary', 'glass-card glass-brand-edge hover:glass-hover'],
  ['bg-surface', 'glass-card'],
]);

// StudentApp.tsx
replaceInFile('src/student/StudentApp.tsx', [
  ['bg-surface border-b border-border', 'glass-nav'],
  ['bg-surface border-t border-border', 'glass-nav'],
  ['bg-surface border-r border-border', 'glass-sheet'],
  ['text-accent', 'text-interactive'],
]);

// StudentHomePage.tsx
replaceInFile('src/student/pages/StudentHomePage.tsx', [
  ['bg-surface border border-border', 'glass-card'],
  ['bg-primary text-primary-foreground hover:bg-primary-hover', 'btn-primary-material'],
  ['text-sm', 'text-[15px]'],
  ['text-xs', 'text-sm'],
]);

// DashboardApp.tsx
replaceInFile('src/dashboard/DashboardApp.tsx', [
  ['bg-surface border-b border-border', 'glass-nav'],
  ['bg-surface border-r border-border', 'glass-sheet'],
]);

// Modals
const modals = [
  'src/components/StudentAuthModal.tsx',
  'src/components/GetStartedModal.tsx',
  'src/pages/public/StaffLoginPage.tsx',
  'src/components/OnboardingGuide.tsx'
];

modals.forEach(modal => {
  replaceInFile(modal, [
    ['bg-surface', 'glass-dialog'],
    ['rounded-2xl', 'rounded-[32px] glass-brand-edge glass-specular'],
    ['bg-black/20', 'bg-black/40 backdrop-blur-md'],
  ]);
});
