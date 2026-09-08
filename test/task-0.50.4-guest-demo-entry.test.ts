import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.50.4 — Restore Public Guest/Demo Entry Point (Production UI Gate)', () => {
  const rootDir = process.cwd();

  describe('1. Navigation Bar Guest Demo Discoverability', () => {
    it('verifies Navbar includes discoverable Explore as Guest links in both desktop and mobile views', () => {
      const navbarFile = fs.readFileSync(path.join(rootDir, 'src/components/Navbar.tsx'), 'utf-8');
      
      // Desktop link check
      assert.ok(navbarFile.includes('id="nav-demo-link"'), 'Desktop nav must contain id="nav-demo-link"');
      assert.ok(navbarFile.includes('href="/student/demo"'), 'Desktop nav demo link must point to /student/demo');
      assert.ok(
        navbarFile.includes("lang === 'en' ? 'Explore as Guest' : 'استكشف كضيف'"),
        'Desktop nav demo link must have clear bilingual label'
      );

      // Mobile drawer link check
      assert.ok(navbarFile.includes('id="mobile-demo-link"'), 'Mobile drawer must contain id="mobile-demo-link"');
      assert.ok(
        navbarFile.includes("lang === 'en' ? 'Explore as Guest (Interactive Demo)' : 'استكشف كضيف (عرض تجريبي)'"),
        'Mobile drawer demo link must have clear bilingual label'
      );
    });
  });

  describe('2. Hero Section Guest Demo CTA', () => {
    it('verifies Hero section includes prominent Explore as Guest CTA alongside Get Started', () => {
      const heroFile = fs.readFileSync(path.join(rootDir, 'src/components/Hero.tsx'), 'utf-8');
      
      assert.ok(heroFile.includes('id="hero-demo-btn"'), 'Hero must contain id="hero-demo-btn"');
      assert.ok(heroFile.includes('href="/student/demo"'), 'Hero demo button must point to /student/demo');
      assert.ok(
        heroFile.includes("isEn ? 'Explore as Guest' : 'استكشف كضيف'"),
        'Hero demo button must have clear bilingual label'
      );
      assert.ok(heroFile.includes('id="hero-get-started-btn"'), 'Hero real booking CTA must remain intact');
    });
  });

  describe('3. Footer Guest Demo Entry Point', () => {
    it('verifies Footer includes Explore as Guest link with footer-demo-link id', () => {
      const footerFile = fs.readFileSync(path.join(rootDir, 'src/components/Footer.tsx'), 'utf-8');
      
      assert.ok(footerFile.includes('id="footer-demo-link"'), 'Footer must contain id="footer-demo-link"');
      assert.ok(footerFile.includes('href="/student/demo"'), 'Footer demo link must point to /student/demo');
      assert.ok(
        footerFile.includes("isEn ? 'Explore as Guest' : 'استكشف كضيف'"),
        'Footer demo link must have clear bilingual label'
      );
    });
  });

  describe('4. Get Started Modal Guest Demo Option', () => {
    it('verifies GetStartedModal provides direct entry point to Demo experience', () => {
      const modalFile = fs.readFileSync(path.join(rootDir, 'src/components/GetStartedModal.tsx'), 'utf-8');
      
      assert.ok(modalFile.includes('id="get-started-demo-btn"'), 'Modal must contain id="get-started-demo-btn"');
      assert.ok(modalFile.includes("navigate('/student/demo')"), 'Modal demo button must navigate to /student/demo');
    });
  });

  describe('5. Direct Route & Authentication Exemption', () => {
    it('verifies routing layer allows unauthenticated direct access to /student/demo and redirects /demo', () => {
      const appFile = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
      const studentAppFile = fs.readFileSync(path.join(rootDir, 'src/student/StudentApp.tsx'), 'utf-8');
      
      // /demo alias
      assert.ok(appFile.includes('path="/demo"'), 'App.tsx must define /demo route');
      assert.ok(appFile.includes('to="/student/demo"'), 'App.tsx must redirect /demo to /student/demo');

      // StudentApp bypasses auth for demo
      assert.ok(
        studentAppFile.includes("location.pathname.startsWith('/student/demo')"),
        'StudentApp must bypass auth checks when pathname starts with /student/demo'
      );
      assert.ok(studentAppFile.includes('<StudentDemoPage'), 'StudentApp must render StudentDemoPage for demo route');
    });
  });

  describe('6. Zero Database Mutation & Mock Isolation', () => {
    it('verifies StudentDemoPage is completely isolated from production database mutations', () => {
      const demoPageFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentDemoPage.tsx'), 'utf-8');
      
      // Must NOT call Supabase booking RPC or direct tables
      assert.ok(!demoPageFile.includes('create_booking_atomic'), 'Demo page must never invoke create_booking_atomic');
      assert.ok(!demoPageFile.includes('supabase.from('), 'Demo page must never execute direct table mutations');
      assert.ok(!demoPageFile.includes('/api/bookings'), 'Demo page must never post to real booking API');
      assert.ok(demoPageFile.includes('Interactive Demo Mode'), 'Demo page must clearly display Demo Mode banner');
    });
  });

  describe('7. Task 0.50.3 Hardened Email Regex Invariant Preservation', () => {
    it('verifies migration 000005 preserves the hardened email validation regex without regression', () => {
      const migrationFile = fs.readFileSync(
        path.join(rootDir, 'supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql'),
        'utf-8'
      );
      
      assert.ok(
        migrationFile.includes("v_contact_email !~ '^[a-z0-9]+([._%+-][a-z0-9]+)*@[a-z0-9]+([.-][a-z0-9]+)*\\.[a-z]{2,}$'"),
        'Migration 000005 must preserve the exact hardened email regex'
      );
    });
  });
});
