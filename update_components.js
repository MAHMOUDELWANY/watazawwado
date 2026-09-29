const fs = require('fs');
const path = require('path');

const navbarPath = path.join(__dirname, 'src', 'components', 'Navbar.tsx');
let navbarContent = fs.readFileSync(navbarPath, 'utf8');

navbarContent = navbarContent.replace(
  "className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${\n        isScrolled\n          ? 'glass-nav border-b-0 py-3'\n          : 'bg-transparent py-4 sm:py-5 border-b border-transparent'\n      }`}",
  "className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-center ${\n        isScrolled ? 'pt-2 sm:pt-4 px-2 sm:px-4' : ''\n      }`}"
);

navbarContent = navbarContent.replace(
  '<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">',
  '<div className={`w-full transition-all duration-300 flex items-center justify-between ${\n        isScrolled \n          ? \'max-w-6xl px-4 sm:px-6 lg:px-8 py-2.5 glass-nav rounded-full shadow-sm\'\n          : \'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-transparent\'\n      }`}>'
);

navbarContent = navbarContent.replace(
  'hover:text-foreground transition-colors py-1',
  'hover:text-interactive transition-colors py-1'
);

navbarContent = navbarContent.replace(
  '<Globe className="w-3.5 h-3.5 text-accent" />',
  '<Globe className="w-4 h-4 text-interactive transition-colors" />'
);

navbarContent = navbarContent.replace(
  '<button\n            onClick={() => onOpenTrialModal()}\n            id="header-get-started-cta"\n            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-medium transition-all shadow-xs cursor-pointer"\n          >',
  '<button\n            onClick={() => onOpenTrialModal()}\n            id="header-get-started-cta"\n            className="hidden sm:inline-flex btn-primary-material text-sm px-4 py-2"\n          >'
);

fs.writeFileSync(navbarPath, navbarContent);

const footerPath = path.join(__dirname, 'src', 'components', 'Footer.tsx');
let footerContent = fs.readFileSync(footerPath, 'utf8');

footerContent = footerContent.replace(
  'text-primary hover:underline',
  'text-interactive hover:underline'
);
footerContent = footerContent.replace(
  'text-xs sm:text-sm',
  'text-sm sm:text-base'
);
footerContent = footerContent.replace(
  'text-xs sm:text-sm',
  'text-sm sm:text-base'
);

fs.writeFileSync(footerPath, footerContent);

console.log("Updated Navbar and Footer");
