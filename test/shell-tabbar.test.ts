import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isTabActive } from '../src/components/ui/MobileTabBar';

test('root tab matches only itself, others match their sub-pages', () => {
  assert.equal(isTabActive('/dashboard', '/dashboard', '/dashboard'), true);
  assert.equal(isTabActive('/dashboard', '/dashboard/', '/dashboard'), true);
  assert.equal(isTabActive('/dashboard', '/dashboard/students', '/dashboard'), false);
  assert.equal(isTabActive('/dashboard/students', '/dashboard/students/abc', '/dashboard'), true);
  assert.equal(isTabActive('/student/book', '/student/bookings', '/student'), false);
});

test('tab bars point at existing routes for every role', () => {
  const dash = fs.readFileSync('src/dashboard/DashboardApp.tsx', 'utf8');
  for (const route of ['/upcoming', '/availability', '/messages', '/bookings', '/students']) {
    assert.ok(dash.includes(`<Route path="${route}"`), `dashboard route ${route} exists`);
  }
  assert.match(dash, /<MobileTabBar/);
  assert.match(dash, /setIsMobileMenuOpen\(true\)/, '"More" opens the drawer');
  const student = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');
  assert.match(student, /<MobileTabBar/);
  for (const path of ["path: '/student'", "path: '/student/lessons'", "path: '/student/book'", "path: '/student/messages'", "to=\"/student/account\""]) {
    assert.ok(student.includes(path), `student nav ${path}`);
  }
  assert.match(student, /setSidebarOpen\(true\)/, '"More" opens the sheet');
  // One place per screen size: header tabs and rail share no page; bottom bar and the More sheet share none.
  assert.match(student, /const topTabs = \[home, lessons, book, curriculum\];/);
  assert.match(student, /const railItems = \[messages, calendar, progress, guide, invite\];/);
  assert.match(student, /const moreItems = \[curriculum, calendar, progress, guide, invite\];/);
});

test('welcome loader is wired after sign-in for staff and students', () => {
  assert.match(fs.readFileSync('src/pages/StaffLoginPage.tsx', 'utf8'), /markJustSignedIn\(\);\s*\n\s*navigate\('\/dashboard'/);
  assert.match(fs.readFileSync('src/dashboard/DashboardApp.tsx', 'utf8'), /useWelcomeGate\(/);
  assert.match(fs.readFileSync('src/student/StudentApp.tsx', 'utf8'), /useWelcomeGate\(/);
});
