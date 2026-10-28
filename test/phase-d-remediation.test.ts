import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Phase D Remediation: SEO Protection Hook', () => {
  const code = fs.readFileSync(path.join(process.cwd(), 'src/components/SEOProtection.tsx'), 'utf8');
  assert.ok(code.includes("setMeta('name', 'robots', 'noindex, nofollow')"), 'Should set noindex for private routes');
  assert.ok(code.includes("setMeta('name', 'robots', 'index, follow"), 'Should set index for public routes');
  // Every public page must be indexable (it used to be the homepage only).
  const seo = fs.readFileSync(path.join(process.cwd(), 'src/data/seo.ts'), 'utf8');
  for (const p of ['/about', '/how-it-works', '/learning', '/pricing', '/faq', '/privacy', '/terms']) {
    assert.ok(seo.includes(`path: '${p}'`), `${p} should be an indexable public page`);
  }
  
  const appCode = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
  assert.ok(appCode.includes('<SEOProtection />'), 'Should be injected in App.tsx');
});

test('Phase D Remediation: Modal FocusTrap', () => {
  const code = fs.readFileSync(path.join(process.cwd(), 'src/components/FocusTrap.tsx'), 'utf8');
  // QA-02 rewrote the trap (document-level listener, recomputed focusables); same two behaviours.
  assert.ok(code.includes('if (e.key !== \'Tab\') return;'), 'Should listen to Tab key');
  assert.ok(code.includes('e.shiftKey && active === firstEl') && code.includes('lastEl.focus()'), 'Should cycle back to last');
  
  const modalCode = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/Modal.tsx'), 'utf8');
  assert.ok(modalCode.includes('<FocusTrap'), 'Generic Modal should use FocusTrap');
  assert.ok(modalCode.includes('e.key === \'Escape\''), 'Escape handling should be preserved');
  
  const lessonModalCode = fs.readFileSync(path.join(process.cwd(), 'src/dashboard/components/BookingDetailModal.tsx'), 'utf8');
  assert.ok(lessonModalCode.includes('<FocusTrap'), 'The lesson window should use FocusTrap');
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
