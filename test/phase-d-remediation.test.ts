import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Phase D Remediation: SEO Protection Hook', () => {
  const code = fs.readFileSync(path.join(process.cwd(), 'src/components/SEOProtection.tsx'), 'utf8');
  assert.ok(code.includes('setAttribute(\'name\', \'robots\')'), 'Should create meta robots tag');
  assert.ok(code.includes('content\', \'noindex, nofollow\''), 'Should set noindex for private routes');
  assert.ok(code.includes('content\', \'index, follow\''), 'Should set index for public routes');
  
  const appCode = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
  assert.ok(appCode.includes('<SEOProtection />'), 'Should be injected in App.tsx');
});

test('Phase D Remediation: Modal FocusTrap', () => {
  const code = fs.readFileSync(path.join(process.cwd(), 'src/components/FocusTrap.tsx'), 'utf8');
  assert.ok(code.includes('const isTabPressed = e.key === \'Tab\''), 'Should listen to Tab key');
  assert.ok(code.includes('document.activeElement === firstElement'), 'Should cycle back to last');
  
  const modalCode = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/Modal.tsx'), 'utf8');
  assert.ok(modalCode.includes('<FocusTrap'), 'Generic Modal should use FocusTrap');
  assert.ok(modalCode.includes('e.key === \'Escape\''), 'Escape handling should be preserved');
  
  const lessonModalCode = fs.readFileSync(path.join(process.cwd(), 'src/dashboard/components/LessonDetailModal.tsx'), 'utf8');
  assert.ok(lessonModalCode.includes('<FocusTrap'), 'LessonDetailModal should use FocusTrap');
});

test('Phase D Remediation: ErrorBoundary', () => {
  const code = fs.readFileSync(path.join(process.cwd(), 'src/components/ErrorBoundary.tsx'), 'utf8');
  assert.ok(code.includes('componentDidCatch'), 'Should implement ErrorBoundary lifecycles');
  
  const appCode = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
  assert.ok(appCode.includes('<ErrorBoundary>'), 'App routes should be wrapped');
  
  const dashboardCode = fs.readFileSync(path.join(process.cwd(), 'src/dashboard/DashboardApp.tsx'), 'utf8');
  assert.ok(dashboardCode.includes('<ErrorBoundary>'), 'Dashboard routes should be wrapped');
  
  const studentCode = fs.readFileSync(path.join(process.cwd(), 'src/student/StudentApp.tsx'), 'utf8');
  assert.ok(studentCode.includes('<ErrorBoundary>'), 'Student routes should be wrapped');
});

test('Phase D Remediation: Empty States', () => {
  const bookingsCode = fs.readFileSync(path.join(process.cwd(), 'src/dashboard/pages/BookingsPage.tsx'), 'utf8');
  assert.ok(bookingsCode.includes('<EmptyState'), 'Bookings page should use EmptyState');
  
  const studentsCode = fs.readFileSync(path.join(process.cwd(), 'src/dashboard/pages/StudentsPage.tsx'), 'utf8');
  assert.ok(studentsCode.includes('<EmptyState'), 'Students page should use EmptyState');
});
