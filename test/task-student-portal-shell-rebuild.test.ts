import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task: Student Portal Information Architecture & Application Shell Rebuild', () => {
  const rootDir = process.cwd();
  const studentAppPath = path.join(rootDir, 'src/student/StudentApp.tsx');
  const studentHomePath = path.join(rootDir, 'src/student/pages/StudentHomePage.tsx');
  const studentNotificationsPath = path.join(rootDir, 'src/student/pages/StudentNotificationsPage.tsx');

  const studentAppSource = fs.readFileSync(studentAppPath, 'utf-8');
  const studentHomeSource = fs.readFileSync(studentHomePath, 'utf-8');
  const studentNotificationsSource = fs.readFileSync(studentNotificationsPath, 'utf-8');

  // ====================================================================
  // 1. APPLICATION SHELL & INFORMATION ARCHITECTURE
  // ====================================================================
  describe('1. Information Architecture & Navigation Items', () => {
    it('verifies persistent sidebar navigation contains all required destinations', () => {
      // Must include all core destinations
      assert.ok(studentAppSource.includes("path: '/student'"), 'Must include Overview route in navigation');
      assert.ok(studentAppSource.includes("path: '/student/lessons'"), 'Must include My Lessons route in navigation');
      assert.ok(!studentAppSource.includes("path: '/student/packages'"), 'Packages must not be primary navigation');
      // Payments and notifications left the sidebar in the 2026-09-29 redesign; they stay one tap away.
      assert.ok(studentHomeSource.includes('to="/student/payments"'), 'Overview must link to Payments');
      assert.ok(studentAppSource.includes('to="/student/notifications"'), 'Header must link to Notifications');
      // The account opens from the avatar menu (tablet/desktop) and the top of the More sheet (phone), 2026-10-23.
      assert.ok(studentAppSource.includes('accountPath="/student/account"'), 'Avatar menu opens the account');
      assert.ok(studentAppSource.includes('to="/student/account"'), 'More sheet opens the account');
    });

    it('verifies Book New Lesson is prominent and routes to /student/book with zero /#book references', () => {
      assert.ok(studentAppSource.includes("path: '/student/book'"), 'Sidebar must route Book to /student/book');
      assert.ok(studentAppSource.includes("to: book.path") && studentAppSource.includes('primary: true'), 'Mobile bar must make Book the primary action');
      assert.ok(!studentAppSource.includes('/#book'), 'StudentApp must contain zero /#book links');
      assert.ok(!studentHomeSource.includes('/#book'), 'StudentHomePage must contain zero /#book links');
    });

    it('verifies application header with dynamic route titles and action utilities', () => {
      // Header like the teacher's (owner, 2026-10-23): main sections as pill tabs; no page title (each page has its own).
      assert.ok(studentAppSource.includes('<header className="shrink-0 z-20'), 'Must render dedicated application header');
      assert.ok(studentAppSource.includes("aria-label={isAr ? 'الأقسام الرئيسية' : 'Main sections'}"), 'Header carries the main sections');
      // Action utilities
      assert.ok(studentAppSource.includes('to="/student/notifications"'), 'Header must include notification trigger');
      assert.ok(studentAppSource.includes('toggleLang'), 'Header must include language toggle');
      assert.ok(studentAppSource.includes('<ThemeToggle />'), 'Shell must include theme toggle');
      assert.ok(studentAppSource.includes('studentInitial'), 'Header must display student initial avatar');
    });

    it('verifies responsive layout using wide viewport instead of cramped column', () => {
      assert.ok(studentAppSource.includes('max-w-6xl'), 'Main content uses the same width as the teacher workspace');
      assert.ok(!studentAppSource.includes('max-w-5xl mx-auto\n            <Routes>'), 'Must not restrict viewport to narrow 5xl column');
    });

    it('verifies mobile navigation with accessible drawer and bottom action bar', () => {
      assert.ok(studentAppSource.includes('Bottom mobile navigation'), 'Must include mobile bottom navigation bar');
      assert.ok(studentAppSource.includes('min-h-[44px]'), 'Must enforce minimum 44px touch targets on mobile');
      assert.ok(studentAppSource.includes('aria-label='), 'Must include aria-label accessibility attributes');
    });
  });

  // ====================================================================
  // 2. OVERVIEW PAGE (STUDENT HOMEPAGE) COMMAND CENTER
  // ====================================================================
  describe('2. Overview Command Center Architecture', () => {
    it('verifies Overview avoids generic metric card clutter and features clean hierarchy', () => {
      // Greeting
      assert.ok(studentHomeSource.includes('welcomeTitle'), 'Must include the welcome greeting');
      // Quick actions
      assert.ok(studentHomeSource.includes('to="/student/book"'), 'Quick actions must link to /student/book');
      assert.ok(!studentHomeSource.includes('to="/student/packages"'), 'Quick actions must prioritize booking, not package shopping');
      assert.ok(studentHomeSource.includes('to="/student/lessons"'), 'Quick actions must link to /student/lessons');
      assert.ok(studentHomeSource.includes('to="/student/payments"'), 'Quick actions must link to /student/payments');
    });

    it('verifies Next Lesson section handles valid Zoom links and pending states correctly', () => {
      assert.ok(studentHomeSource.includes('hasValidZoomUrl'), 'Must validate Zoom meeting URL format');
      assert.ok(studentHomeSource.includes('Join Zoom Classroom') || studentHomeSource.includes('دخول فصل زووم'), 'Must provide direct Zoom join when valid');
      assert.ok(studentHomeSource.includes('Zoom link is being prepared') || studentHomeSource.includes('رابط زووم بيتجهز'), 'Must show pending explanation when link not yet available');
    });

    it('verifies recent lessons list uses clean flat structure with natural page scrolling', () => {
      assert.ok(studentHomeSource.includes('recentLessons'), 'Must display recent lessons');
      assert.ok(studentHomeSource.includes('divide-y divide-border'), 'Must use clean dividers for recent lessons');
      assert.ok(studentHomeSource.includes('View all lessons') || studentHomeSource.includes('عرض كامل السجل'), 'Must link to full lessons history');
    });

    it('verifies Learning Snapshot and Package Credits integration', () => {
      assert.ok(studentHomeSource.includes('Learning Snapshot') || studentHomeSource.includes('ملخص التعلم'), 'Must include learning snapshot');
      assert.ok(studentHomeSource.includes('creditsRemaining'), 'Must display package credits remaining');
      assert.ok(!studentHomeSource.includes('Ustadh Mahmoud') && !studentHomeSource.includes('الأستاذ محمود'), 'The academy is not centred on one person (owner, 2026-10-18)');
      assert.ok(studentHomeSource.includes('assignedTeacherName'), 'Must show the assigned teacher');
    });
  });

  // ====================================================================
  // 3. NOTIFICATIONS PAGE INTEGRATION
  // ====================================================================
  describe('3. Student Notifications System Integration', () => {
    it('verifies StudentNotificationsPage exists and handles all required notification events', () => {
      assert.ok(studentNotificationsSource.includes('lesson_reminder'), 'Must support lesson_reminder events');
      assert.ok(studentNotificationsSource.includes('payment_verified'), 'Must support payment_verified events');
      assert.ok(studentNotificationsSource.includes('payment_review'), 'Must support payment_review events');
      assert.ok(studentNotificationsSource.includes('payment_action'), 'Must support payment_action events');
      assert.ok(studentNotificationsSource.includes('package_active'), 'Must support package_active events');
    });

    it('verifies notifications filtering and mark-as-read functionality', () => {
      assert.ok(studentNotificationsSource.includes('markAsRead'), 'Must provide markAsRead handler');
      assert.ok(studentNotificationsSource.includes('markAllAsRead'), 'Must provide markAllAsRead handler');
      assert.ok(studentNotificationsSource.includes("setFilter('all')"), 'Must support all filter');
      assert.ok(studentNotificationsSource.includes("setFilter('unread')"), 'Must support unread filter');
    });

    it('verifies route registration in StudentApp', () => {
      assert.ok(studentAppSource.includes('<Route path="/notifications" element={<StudentNotificationsPage'), 'StudentApp must register /notifications route');
    });
  });
});
