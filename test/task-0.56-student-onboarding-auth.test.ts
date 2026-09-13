import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task: Student Onboarding Production Fix & Auth Single-Source Verification', () => {
  const rootDir = process.cwd();

  // ====================================================================
  // TEST 1: StudentApp passes session to both onboarding render paths
  // ====================================================================
  it('1. StudentApp passes session into both onboarding render paths (gate & route)', () => {
    const studentAppFile = fs.readFileSync(path.join(rootDir, 'src/student/StudentApp.tsx'), 'utf-8');

    // Onboarding Gate render path
    const gateIndex = studentAppFile.indexOf('const needsOnboarding = profile && profile.onboardingCompleted === false;');
    assert.ok(gateIndex > -1, 'StudentApp must define needsOnboarding gate');

    const afterGate = studentAppFile.slice(gateIndex, gateIndex + 400);
    assert.ok(
      afterGate.includes('<StudentOnboardingPage') && afterGate.includes('session={session}'),
      'StudentApp must pass session={session} to StudentOnboardingPage in the onboarding gate'
    );

    // /student/onboarding route render path
    const routeIndex = studentAppFile.indexOf('path="/onboarding"');
    assert.ok(routeIndex > -1, 'StudentApp must define /onboarding route');

    const afterRoute = studentAppFile.slice(routeIndex, routeIndex + 400);
    assert.ok(
      afterRoute.includes('<StudentOnboardingPage') && afterRoute.includes('session={session}'),
      'StudentApp must pass session={session} to StudentOnboardingPage in the /onboarding route'
    );
  });

  // ====================================================================
  // TEST 2: StudentOnboardingPage does not read localStorage or sessionStorage for auth
  // ====================================================================
  it('2. StudentOnboardingPage does not read localStorage or sessionStorage for authentication', () => {
    const onboardingFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentOnboardingPage.tsx'), 'utf-8');

    assert.ok(
      !onboardingFile.includes('localStorage.getItem'),
      'StudentOnboardingPage must not read from localStorage'
    );
    assert.ok(
      !onboardingFile.includes('sessionStorage.getItem'),
      'StudentOnboardingPage must not read from sessionStorage'
    );
    assert.ok(
      !onboardingFile.includes('supabase_access_token'),
      'StudentOnboardingPage must not reference supabase_access_token'
    );
  });

  // ====================================================================
  // TEST 3: Authorization Bearer header is sent to /api/student/onboarding
  // ====================================================================
  it('3. Authorization: Bearer ${token} is constructed using session.access_token', () => {
    const onboardingFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentOnboardingPage.tsx'), 'utf-8');

    assert.ok(
      onboardingFile.includes('const token = session?.access_token;'),
      'StudentOnboardingPage must obtain token strictly from session.access_token'
    );
    assert.ok(
      onboardingFile.includes("Authorization: `Bearer ${token}`"),
      'StudentOnboardingPage must attach Authorization Bearer header using token'
    );
    assert.ok(
      onboardingFile.includes('/api/student/onboarding'),
      'StudentOnboardingPage must submit to /api/student/onboarding'
    );
  });

  // ====================================================================
  // TEST 4: Missing session fails closed with clear error
  // ====================================================================
  it('4. Missing session fails closed before making network call', () => {
    const onboardingFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentOnboardingPage.tsx'), 'utf-8');

    assert.ok(
      onboardingFile.includes("if (!token) {\n        throw new Error('Authentication session unavailable. Please sign in again.');\n      }"),
      'StudentOnboardingPage must throw error if token is unavailable before fetch'
    );
  });

  // ====================================================================
  // TEST 5 & 6: WhatsApp source and prefill behavior (no fabrication)
  // ====================================================================
  it('5. Existing currentProfile.whatsapp prefills the field accurately', () => {
    const onboardingFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentOnboardingPage.tsx'), 'utf-8');

    assert.ok(
      onboardingFile.includes("const [whatsapp, setWhatsapp] = useState(currentProfile?.whatsapp || '');"),
      'StudentOnboardingPage must initialize whatsapp from currentProfile?.whatsapp or empty string'
    );
  });

  it('6. Empty WhatsApp remains editable and is not fabricated or hardcoded', () => {
    const onboardingFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentOnboardingPage.tsx'), 'utf-8');

    // Verify there are no hardcoded phone numbers in StudentOnboardingPage
    const hardcodedPhonePatterns = [
      /\+20\d{9,}/, // Egypt numbers
      /\+1\d{10}/,  // US/Canada numbers (excluding placeholder)
      /\+44\d{9,}/, // UK numbers
    ];

    for (const pattern of hardcodedPhonePatterns) {
      assert.ok(!pattern.test(onboardingFile), `StudentOnboardingPage must not contain hardcoded phone numbers: ${pattern}`);
    }

    // Verify onChange allows user editing
    assert.ok(
      onboardingFile.includes('onChange={(e) => setWhatsapp(e.target.value)}'),
      'WhatsApp input must remain fully editable by the user'
    );
  });

  // ====================================================================
  // TEST 7: Successful onboarding preserves authenticated flow and updates in-memory profile
  // ====================================================================
  it('7. Successful onboarding calls onCompleted with updated profile and navigates', () => {
    const onboardingFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentOnboardingPage.tsx'), 'utf-8');
    const studentAppFile = fs.readFileSync(path.join(rootDir, 'src/student/StudentApp.tsx'), 'utf-8');

    assert.ok(
      onboardingFile.includes('if (onCompleted) {\n        onCompleted(data.profile);\n      }'),
      'StudentOnboardingPage must invoke onCompleted with data.profile'
    );

    assert.ok(
      studentAppFile.includes("setProfile((prev: any) => ({ ...prev, ...updated, onboardingCompleted: true }));"),
      'StudentApp must update in-memory profile and set onboardingCompleted: true'
    );

    assert.ok(
      onboardingFile.includes("navigate('/student/book')"),
      'StudentOnboardingPage must provide direct path to /student/book on completion'
    );
  });

  // ====================================================================
  // TEST 8: Existing Student Booking auth behavior remains unchanged
  // ====================================================================
  it('8. StudentBookingPage preserves session-driven auth without storage fallbacks', () => {
    const bookingPageFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentBookingPage.tsx'), 'utf-8');

    assert.ok(
      !bookingPageFile.includes('localStorage.getItem'),
      'StudentBookingPage must not read from localStorage'
    );
    assert.ok(
      !bookingPageFile.includes('sessionStorage.getItem'),
      'StudentBookingPage must not read from sessionStorage'
    );
    assert.ok(
      bookingPageFile.includes("const accessToken = activeSession?.access_token || null;"),
      'StudentBookingPage must derive token strictly from activeSession'
    );
  });

  // ====================================================================
  // TEST 9: No Guest Demo mutation path is introduced
  // ====================================================================
  it('9. Guest Demo remains strictly isolated and non-mutating', () => {
    const demoPageFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentDemoPage.tsx'), 'utf-8');

    assert.ok(
      !demoPageFile.includes('/api/student/onboarding'),
      'StudentDemoPage must never call onboarding API'
    );
    assert.ok(
      !demoPageFile.includes('create_booking_atomic'),
      'StudentDemoPage must never call booking RPC'
    );
  });
});
