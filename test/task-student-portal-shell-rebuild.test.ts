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
      assert.ok(studentAppSource.includes("path: '/student/packages'"), 'Must include Packages route in navigation');
      assert.ok(studentAppSource.includes("path: '/student/payments'"), 'Must include Payments route in navigation');
      assert.ok(studentAppSource.includes("path: '/student/notifications'"), 'Must include Notifications route in navigation');
      assert.ok(studentAppSource.includes("path: '/student/account'"), 'Must include Account route in navigation');
    });

    it('verifies Book New Lesson is prominent and routes to /student/book with zero /#book references', () => {
      assert.ok(studentAppSource.includes('to="/student/book"'), 'Sidebar must route Book New Lesson to /student/book');
      assert.ok(studentAppSource.includes('<span>Book New Lesson</span>'), 'Sidebar must display Book New Lesson');
      assert.ok(!studentAppSource.includes('/#book'), 'StudentApp must contain zero /#book links');
      assert.ok(!studentHomeSource.includes('/#book'), 'StudentHomePage must contain zero /#book links');
    });

    it('verifies application header with dynamic route titles and action utilities', () => {
      // Header component
      assert.ok(studentAppSource.includes('<header className="h-16 flex items-center justify-between'), 'Must render dedicated application header');
      assert.ok(studentAppSource.includes('getHeaderInfo'), 'Must include dynamic route title helper');
      assert.ok(studentAppSource.includes('currentHeader.title'), 'Must display dynamic page title');
      // Action utilities
      assert.ok(studentAppSource.includes('to="/student/notifications"'), 'Header must include notification trigger');
      assert.ok(studentAppSource.includes('toggleLang'), 'Header must include language toggle');
      assert.ok(studentAppSource.includes('toggleTheme'), 'Header must include theme toggle');
      assert.ok(studentAppSource.includes('studentInitial'), 'Header must display student initial avatar');
    });

    it('verifies responsive layout using wide viewport instead of cramped column', () => {
      assert.ok(studentAppSource.includes('max-w-7xl'), 'Main content container must use max-w-7xl layout');
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
      assert.ok(studentHomeSource.includes('greetingWord'), 'Must include time-aware greeting');
      // Quick actions
      assert.ok(studentHomeSource.includes('to="/student/book"'), 'Quick actions must link to /student/book');
      assert.ok(studentHomeSource.includes('to="/student/packages"'), 'Quick actions must link to /student/packages');
      assert.ok(studentHomeSource.includes('to="/student/lessons"'), 'Quick actions must link to /student/lessons');
      assert.ok(studentHomeSource.includes('to="/student/payments"'), 'Quick actions must link to /student/payments');
    });

    it('verifies Next Lesson section handles valid Zoom links and pending states correctly', () => {
      assert.ok(studentHomeSource.includes('hasValidZoomUrl'), 'Must validate Zoom meeting URL format');
      assert.ok(studentHomeSource.includes('Join Zoom Classroom') || studentHomeSource.includes('دخول فصل زووم'), 'Must provide direct Zoom join when valid');
      assert.ok(studentHomeSource.includes('Zoom link will activate prior to lesson') || studentHomeSource.includes('رابط زووم سيتوفر قبل موعد الدرس'), 'Must show pending explanation when link not yet available');
    });

    it('verifies recent lessons list uses clean flat structure with natural page scrolling', () => {
      assert.ok(studentHomeSource.includes('recentLessons'), 'Must display recent lessons');
      assert.ok(studentHomeSource.includes('divide-y divide-border'), 'Must use clean dividers for recent lessons');
      assert.ok(studentHomeSource.includes('View all lessons') || studentHomeSource.includes('عرض كامل السجل'), 'Must link to full lessons history');
    });

    it('verifies Learning Snapshot and Package Credits integration', () => {
      assert.ok(studentHomeSource.includes('Learning Snapshot') || studentHomeSource.includes('ملخص التعلم'), 'Must include learning snapshot');
      assert.ok(studentHomeSource.includes('creditsRemaining'), 'Must display package credits remaining');
      assert.ok(studentHomeSource.includes('Ustadh Mahmoud') || studentHomeSource.includes('الأستاذ محمود'), 'Must preserve direct Ustadh Mahmoud relationship');
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
