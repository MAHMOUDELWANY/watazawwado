const fs = require('fs');

let c = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');

if (!c.includes('desktopSidebarOpen')) {
  c = c.replace(
    /const \[sidebarOpen, setSidebarOpen\] = useState\(false\);/,
    `const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [showGlobalTour, setShowGlobalTour] = useState(false);
  const { signOut } = useTeacherAuth();`
  );
}

if (!c.includes('useTeacherAuth')) {
  c = c.replace(
    /import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';/,
    `import { useTeacherAuth } from '../lib/auth';\nimport { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';`
  );
}

// Sidebar styling
c = c.replace(
  /lg:static lg:translate-x-0 lg:w-\[280px\] lg:m-4 lg:rounded-3xl lg:glass-nav lg:shadow-xl lg:border lg:border-border\/50/g,
  `\${desktopSidebarOpen ? 'lg:static lg:translate-x-0 lg:w-[280px] lg:m-4 lg:rounded-3xl lg:glass-nav lg:shadow-xl lg:border lg:border-border/50' : 'lg:hidden lg:w-0 lg:m-0'}`
);

// Toggle desktop sidebar
c = c.replace(
  /<button\s+onClick=\{toggleSidebar\}\s+className="lg:hidden min-h-\[44px\]/g,
  `<button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setDesktopSidebarOpen(!desktopSidebarOpen);
                  } else {
                    toggleSidebar();
                  }
                }}
                className="min-h-[44px]`
);

// Add logout button to sidebar bottom
c = c.replace(
  /<\/div>\s*<\/aside>/g,
  `
    <div className="p-4 mt-auto mb-[env(safe-area-inset-bottom)] lg:mb-0 border-t border-border/10">
      <button 
        onClick={() => signOut()}
        data-tour="student-logout"
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-semibold text-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
      </button>
    </div>
  </div>
</aside>`
);

// We need to import LogOut
if (!c.includes('LogOut,')) {
  c = c.replace(
    /import {\s*BookOpen,/,
    `import { LogOut, BookOpen,`
  );
}

fs.writeFileSync('src/student/StudentApp.tsx', c);
