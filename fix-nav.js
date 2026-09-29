const fs = require('fs');
let content = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');

// Fix dangling Plus,
content = content.replace('    {\n      name: isAr ? \'الدروس\' : \'Lessons\',\n      path: \'/student/lessons\',\n      icon: Calendar,\n  Plus,\n      badge: null\n    },', 
'    {\n      name: isAr ? \'الدروس\' : \'Lessons\',\n      path: \'/student/lessons\',\n      icon: Calendar,\n      badge: null\n    },');

const oldNavRegex = /\{\/\* Mobile Bottom Navigation Bar.*?<\/nav>/s;
const newNav = `{/* Mobile Bottom Navigation Bar (Floating Pill Design) */}
        <div className="lg:hidden fixed bottom-6 inset-x-4 z-50">
          <nav 
            className="relative w-full h-[68px] glass-nav rounded-full flex items-center justify-between px-2 shadow-2xl border border-border/30"
            aria-label={isAr ? 'التنقل السفلي' : 'Bottom mobile navigation'}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/student' && location.pathname.startsWith(item.path));
              const isBook = item.path === '/student/book';
              const Icon = item.icon;

              if (isBook) {
                return (
                  <div key={item.path} className="relative flex-1 flex justify-center">
                    <Link
                      to={item.path}
                      id="nav-book-link"
                      className="absolute -top-7 w-[60px] h-[60px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_16px_rgba(197,31,36,0.3)] hover:bg-primary-hover active:scale-95 transition-all border-[4px] border-background"
                    >
                      <Icon className="w-7 h-7" />
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  id={item.path === '/student/account' ? 'nav-account-link' : undefined}
                  className="relative flex flex-col items-center justify-center py-2 flex-1 group h-full"
                >
                  <div className={\`relative flex items-center justify-center w-12 h-12 rounded-full transition-colors \${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }\`}>
                    <Icon className={\`w-6 h-6 transition-transform duration-300 \${isActive ? '-translate-y-2' : ''}\`} />
                    {/* Active Dot Indicator */}
                    {isActive && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(197,31,36,0.8)]" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>`;

content = content.replace(oldNavRegex, newNav);

fs.writeFileSync('src/student/StudentApp.tsx', content);
