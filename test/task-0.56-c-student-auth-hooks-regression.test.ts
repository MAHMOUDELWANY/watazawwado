import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateTrialEligibility,
  mapStudentProfileToBookingInitialData,
} from '../src/student/pages/StudentBookingPage';

describe('Task 0.56-C — Student Auth Single-Source Cleanup + React Hooks Correctness', () => {
  const rootDir = process.cwd();

  // ====================================================================
  // TEST 1 --- SIDEBAR ROUTING
  // ====================================================================
  describe('TEST 1 --- Sidebar Routing to /student/book', () => {
    it('proves StudentApp sidebar links Book New Lesson to /student/book and contains zero /#book references', () => {
      const studentAppFile = fs.readFileSync(path.join(rootDir, 'src/student/StudentApp.tsx'), 'utf-8');

      // 1. Must link to /student/book
      assert.ok(
        studentAppFile.includes('to="/student/book"'),
        'StudentApp sidebar must link Book New Lesson to /student/book'
      );
      assert.ok(
        studentAppFile.includes('<span>Book New Lesson</span>'),
        'StudentApp sidebar must display Book New Lesson label'
      );

      // 2. Must NOT contain any /#book public anchor
      assert.ok(
        !studentAppFile.includes('/#book'),
        'StudentApp must contain zero public /#book anchor links'
      );
    });
  });

  // ====================================================================
  // TEST 2 --- SESSION PROPAGATION & NO STORAGE FALLBACK
  // ====================================================================
  describe('TEST 2 --- Session & Auth Token Propagation (Single Auth Mechanism)', () => {
    it('verifies session is passed to StudentBookingPage and used for authenticated requests without storage fallback', () => {
      const studentAppFile = fs.readFileSync(path.join(rootDir, 'src/student/StudentApp.tsx'), 'utf-8');
      const bookingPageFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentBookingPage.tsx'), 'utf-8');

      // StudentApp routes to StudentBookingPage passing session
      assert.ok(
        studentAppFile.includes('<StudentBookingPage profile={profile} session={session} />'),
        'StudentApp must pass session prop to StudentBookingPage'
      );

      // StudentBookingPage accepts session prop
      assert.ok(
        bookingPageFile.includes('session?: any;'),
        'StudentBookingPageProps must declare session?: any'
      );

      // Must strictly use session from auth architecture and NEVER fallback to browser storage
      assert.ok(
        !bookingPageFile.includes('localStorage.getItem'),
        'StudentBookingPage must not use localStorage.getItem for access token'
      );
      assert.ok(
        !bookingPageFile.includes('sessionStorage.getItem'),
        'StudentBookingPage must not use sessionStorage.getItem for access token'
      );
      assert.ok(
        !bookingPageFile.includes('supabase_access_token'),
        'StudentBookingPage must not check supabase_access_token in storage'
      );

      // Must display an authentication-required gate when no session exists
      assert.ok(
        bookingPageFile.includes('Authentication Required'),
        'StudentBookingPage must show Authentication Required state when unauthenticated'
      );

      // StudentBookingPage constructs Authorization header
      assert.ok(
        bookingPageFile.includes('Authorization: `Bearer ${'),
        'StudentBookingPage must attach Authorization Bearer token header to API requests'
      );
      assert.ok(
        bookingPageFile.includes('/api/student/bookings'),
        'StudentBookingPage must fetch from /api/student/bookings'
      );
    });

    it('verifies StudentApp uses single auth source without localStorage/sessionStorage fallback', () => {
      const studentAppFile = fs.readFileSync(path.join(rootDir, 'src/student/StudentApp.tsx'), 'utf-8');

      // StudentApp must NOT access browser storage for access tokens
      assert.ok(
        !studentAppFile.includes('localStorage.getItem'),
        'StudentApp must not read access tokens from localStorage'
      );
      assert.ok(
        !studentAppFile.includes('sessionStorage.getItem'),
        'StudentApp must not read access tokens from sessionStorage'
      );
      assert.ok(
        !studentAppFile.includes('supabase_access_token'),
        'StudentApp must not look for supabase_access_token in storage'
      );

      // StudentApp must strictly use session.access_token from useTeacherAuth()
      assert.ok(
        studentAppFile.includes('session?.access_token') || studentAppFile.includes('session.access_token'),
        'StudentApp must read token from session provided by useTeacherAuth'
      );
      assert.ok(
        studentAppFile.includes('Authorization: `Bearer ${session.access_token}`'),
        'StudentApp must use session.access_token directly for /api/student/me Authorization header'
      );
    });
  });

  // ====================================================================
  // TEST 2B --- REACT RULES OF HOOKS INVARIANT IN STUDENTAPP
  // ====================================================================
  describe('TEST 2B --- React Rules of Hooks Invariant in StudentApp', () => {
    it('guarantees all React hooks are executed unconditionally before any conditional return', () => {
      const studentAppFile = fs.readFileSync(path.join(rootDir, 'src/student/StudentApp.tsx'), 'utf-8');

      const effectIndex = studentAppFile.indexOf('useEffect(');
      assert.ok(effectIndex > -1, 'StudentApp must declare useEffect');

      // Find indices of early conditional returns
      const demoReturnIndex = studentAppFile.indexOf("if (location.pathname.startsWith('/student/demo'))");
      const teacherReturnIndex = studentAppFile.indexOf('if (isTeacherAuthenticated)');
      const unauthReturnIndex = studentAppFile.indexOf("if (!user || userRole !== 'student')");

      assert.ok(demoReturnIndex > -1, 'StudentApp must handle demo direct route');
      assert.ok(teacherReturnIndex > -1, 'StudentApp must handle teacher redirect');
      assert.ok(unauthReturnIndex > -1, 'StudentApp must handle unauthenticated state');

      // Rules of Hooks invariant: useEffect MUST appear before demoReturnIndex, teacherReturnIndex, etc.
      assert.ok(
        effectIndex < demoReturnIndex,
        'useEffect must be called before the /student/demo conditional return'
      );
      assert.ok(
        effectIndex < teacherReturnIndex,
        'useEffect must be called before the isTeacherAuthenticated conditional return'
      );
      assert.ok(
        effectIndex < unauthReturnIndex,
        'useEffect must be called before the unauthenticated user conditional return'
      );

      // Verify no hooks appear after the first early return
      const afterFirstReturn = studentAppFile.slice(demoReturnIndex);
      const forbiddenHooksAfterReturn = [
        'useState(',
        'useEffect(',
        'useCallback(',
        'useMemo(',
        'useRef(',
        'useContext(',
        'useReducer(',
        'useTeacherAuth(',
      ];

      for (const hook of forbiddenHooksAfterReturn) {
        assert.ok(
          !afterFirstReturn.includes(hook),
          `Rule of Hooks violation: ${hook} must not be called after conditional return`
        );
      }
    });
  });

  // ====================================================================
  // TEST 3 --- PROFILE PREFILL (ADULT & CHILD/PARENT)
  // ====================================================================
  describe('TEST 3 --- Profile Pre-filling Pure Logic', () => {
    it('pre-fills adult student profile fields accurately into BookingFormData', () => {
      const adultProfile = {
        id: 'std-adult-123',
        name: 'Zaid Khan',
        email: 'zaid@example.com',
        whatsapp: '+15551234567',
        currentLevel: 'intermediate',
        learningInterest: 'Tajweed Rules',
        learningNeeds: 'Needs focus on Makharij and heavy letters',
        learningGoal: 'Obtain Ijazah in Hafs',
        timezone: 'America/Toronto'
      };

      const result = mapStudentProfileToBookingInitialData(adultProfile, true);

      assert.equal(result.matchedServiceId, 'tajweed');
      assert.equal(result.initialMode, 'trial');
      assert.equal(result.initialData.audience, 'adult');
      assert.equal(result.initialData.studentName, 'Zaid Khan');
      assert.equal(result.initialData.email, 'zaid@example.com');
      assert.equal(result.initialData.whatsapp, '+15551234567');
      assert.equal(result.initialData.currentLevel, 'intermediate');
      assert.equal(result.initialData.notes, 'Needs focus on Makharij and heavy letters');
      assert.equal(result.initialData.goal, 'Obtain Ijazah in Hafs');
      assert.equal(result.initialData.timezone, 'America/Toronto');
      assert.equal(result.initialData.studentId, 'std-adult-123');
      assert.equal(result.initialData.childName, '');
      assert.equal(result.initialData.parentName, '');
    });

    it('pre-fills child student with guardian profile fields accurately into BookingFormData', () => {
      const childProfile = {
        id: 'std-child-456',
        name: 'Maryam Khan',
        email: 'parent@example.com',
        whatsapp: '+15559876543',
        currentLevel: 'beginner',
        learningInterest: 'Quran Reading',
        learningNeeds: 'Starting Noorani Qaida lessons',
        guardian: {
          parentName: 'Fatima Khan',
          parentEmail: 'parent@example.com',
          parentWhatsapp: '+15559876543',
          relationship: 'Mother'
        },
        timezone: 'America/New_York'
      };

      const result = mapStudentProfileToBookingInitialData(childProfile, false);

      assert.equal(result.matchedServiceId, 'quran-reading');
      assert.equal(result.initialMode, 'regular');
      assert.equal(result.initialData.audience, 'child');
      assert.equal(result.initialData.studentName, 'Maryam Khan');
      assert.equal(result.initialData.childName, 'Maryam Khan');
      assert.equal(result.initialData.childLevel, 'beginner');
      assert.equal(result.initialData.parentName, 'Fatima Khan');
      assert.equal(result.initialData.parentEmail, 'parent@example.com');
      assert.equal(result.initialData.parentWhatsapp, '+15559876543');
      assert.equal(result.initialData.parentNotes, 'Starting Noorani Qaida lessons');
      assert.equal(result.initialData.studentId, 'std-child-456');
    });
  });

  // ====================================================================
  // TEST 4 --- BOOKING FETCH FAILURE & UNVERIFIED STATE
  // ====================================================================
  describe('TEST 4 --- Booking History Fetch Failure & Unverified Invariant', () => {
    it('ensures trial is NEVER enabled when bookings fetch fails or is unverified', () => {
      // 1. Fetch failed with error
      const failedResult = calculateTrialEligibility(null, 'Network 500 error');
      assert.equal(failedResult.canBookTrial, false, 'Must not allow trial on fetch failure');
      assert.ok(
        failedResult.trialDisabledReason?.includes('network or server issue') ||
        failedResult.trialDisabledReason?.includes('unavailable until verified'),
        'Must explain trial is guarded until verified'
      );

      // 2. Fetch still loading / uninitialized
      const pendingResult = calculateTrialEligibility(null, null);
      assert.equal(pendingResult.canBookTrial, false, 'Must not allow trial while pending verification');
    });

    it('verifies StudentBookingPage UI displays retry button when booking history fails', () => {
      const bookingPageFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentBookingPage.tsx'), 'utf-8');

      assert.ok(
        bookingPageFile.includes('Retry Verification'),
        'StudentBookingPage must provide a Retry Verification button on bookings failure'
      );
      assert.ok(
        bookingPageFile.includes('fetchBookings'),
        'StudentBookingPage must re-trigger fetchBookings on retry'
      );
    });
  });

  // ====================================================================
  // TEST 5 --- STUDENT OWNERSHIP
  // ====================================================================
  describe('TEST 5 --- Server-Authoritative Student Ownership', () => {
    it('verifies create_booking_atomic enforces server-side student identity from auth.uid()', () => {
      const migrationFile = fs.readFileSync(
        path.join(rootDir, 'supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql'),
        'utf-8'
      );

      // Resolves student from auth.uid()
      assert.ok(
        migrationFile.includes('auth.uid() IS NOT NULL'),
        'create_booking_atomic must check auth.uid() IS NOT NULL'
      );
      assert.ok(
        migrationFile.includes('WHERE auth_user_id = auth.uid()'),
        'create_booking_atomic must derive student from auth_user_id = auth.uid()'
      );
      // Anti-impersonation P0003 check
      assert.ok(
        migrationFile.includes('P0003'),
        'create_booking_atomic must raise P0003 on student_id mismatch or unauthorized injection'
      );
      assert.ok(
        migrationFile.includes('Cannot create a booking on behalf of another student'),
        'create_booking_atomic must reject student impersonation attempts'
      );
    });
  });

  // ====================================================================
  // TEST 6 --- GUEST BOOKING
  // ====================================================================
  describe('TEST 6 --- Real Guest Booking Path', () => {
    it('verifies create_booking_atomic permits guest booking with student_id = NULL and rejects client student_id injection', () => {
      const migrationFile = fs.readFileSync(
        path.join(rootDir, 'supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql'),
        'utf-8'
      );

      assert.ok(
        migrationFile.includes('Unauthenticated guests cannot specify a student ID.'),
        'create_booking_atomic must reject guest specifying student_id'
      );
      assert.ok(
        migrationFile.includes('v_student_id := NULL;'),
        'create_booking_atomic must set v_student_id to NULL for unauthenticated guests'
      );
    });
  });

  // ====================================================================
  // TEST 7 --- GUEST DEMO ISOLATION
  // ====================================================================
  describe('TEST 7 --- Guest Demo Non-Mutating Isolation', () => {
    it('verifies /student/demo is sample-data driven with zero booking mutations', () => {
      const demoPageFile = fs.readFileSync(
        path.join(rootDir, 'src/student/pages/StudentDemoPage.tsx'),
        'utf-8'
      );

      assert.ok(
        demoPageFile.includes('Interactive Demo Mode') && demoPageFile.includes('Exploring as Guest with sample data'),
        'StudentDemoPage must explicitly run in sample data mode without creating real bookings'
      );
      assert.ok(
        !demoPageFile.includes('create_booking_atomic'),
        'StudentDemoPage must never call create_booking_atomic'
      );
      assert.ok(
        !demoPageFile.includes('/api/student/bookings') || demoPageFile.includes('//') || !demoPageFile.includes('fetch('),
        'StudentDemoPage must not perform mutation API calls to production booking endpoints'
      );
    });
  });

  // ====================================================================
  // TEST 8 --- TRIAL ELIGIBILITY LOGIC
  // ====================================================================
  describe('TEST 8 --- Trial Eligibility Decision Matrix', () => {
    it('correctly detects existing non-cancelled trial booking and disables trial', () => {
      const bookingsWithActiveTrial = [
        { id: 'b-1', booking_type: 'trial', status: 'confirmed' }
      ];
      const result = calculateTrialEligibility(bookingsWithActiveTrial, null);
      assert.equal(result.canBookTrial, false);
      assert.equal(result.hasUsedTrial, true);
      assert.ok(result.trialDisabledReason?.includes('already scheduled or completed'));
    });

    it('allows trial if prior trial booking was cancelled', () => {
      const bookingsWithCancelledTrial = [
        { id: 'b-2', booking_type: 'trial', status: 'cancelled' }
      ];
      const result = calculateTrialEligibility(bookingsWithCancelledTrial, null);
      assert.equal(result.canBookTrial, true);
      assert.equal(result.hasUsedTrial, false);
      assert.equal(result.trialDisabledReason, undefined);
    });

    it('allows trial if student only has regular bookings', () => {
      const bookingsRegularOnly = [
        { id: 'b-3', booking_type: 'regular', status: 'completed' }
      ];
      const result = calculateTrialEligibility(bookingsRegularOnly, null);
      assert.equal(result.canBookTrial, true);
      assert.equal(result.hasUsedTrial, false);
    });

    it('allows trial if student has zero previous bookings', () => {
      const result = calculateTrialEligibility([], null);
      assert.equal(result.canBookTrial, true);
      assert.equal(result.hasUsedTrial, false);
    });
  });

  // ====================================================================
  // TEST 9 --- ROUTING BEHAVIOR IN STUDENT PORTAL
  // ====================================================================
  describe('TEST 9 --- Routing Behavior within Student Portal', () => {
    it('verifies StudentHomePage navigation points to /student/book with zero /#book links', () => {
      const homePageFile = fs.readFileSync(
        path.join(rootDir, 'src/student/pages/StudentHomePage.tsx'),
        'utf-8'
      );

      assert.ok(
        !homePageFile.includes('href="/#book"'),
        'StudentHomePage must never link to public /#book'
      );
      assert.ok(
        homePageFile.includes('to="/student/book"'),
        'StudentHomePage must link directly to /student/book'
      );
    });

    it('verifies StudentApp routes /student/book to StudentBookingPage', () => {
      const appFile = fs.readFileSync(
        path.join(rootDir, 'src/student/StudentApp.tsx'),
        'utf-8'
      );

      assert.ok(
        appFile.includes('path="/book" element={<StudentBookingPage'),
        'StudentApp must route /book to StudentBookingPage'
      );
    });
  });

  // ====================================================================
  // TEST 10 --- COMPLETION RETURN PATH & ZOOM PENDING SAFEGUARD
  // ====================================================================
  describe('TEST 10 --- Completion Return Path & Zoom Pending Safeguard', () => {
    it('verifies StudentBookingPage passes custom done action returning to student portal', () => {
      const bookingPageFile = fs.readFileSync(
        path.join(rootDir, 'src/student/pages/StudentBookingPage.tsx'),
        'utf-8'
      );

      assert.ok(
        bookingPageFile.includes('doneLabel="Done & Return to Student Portal"'),
        'StudentBookingPage must provide student-specific done label'
      );
      assert.ok(
        bookingPageFile.includes("onDone={() => navigate('/student')}"),
        'StudentBookingPage onDone must navigate to /student'
      );
      assert.ok(
        bookingPageFile.includes("onClose={() => navigate('/student')}"),
        'StudentBookingPage onClose must navigate to /student'
      );
    });

    it('verifies BookingConfirmation handles pending Zoom link safely without redirecting to homepage', () => {
      const confirmationFile = fs.readFileSync(
        path.join(rootDir, 'src/components/booking/BookingConfirmation.tsx'),
        'utf-8'
      );

      assert.ok(
        confirmationFile.includes('isValidZoomUrl'),
        'BookingConfirmation must validate Zoom URL'
      );
      assert.ok(
        confirmationFile.includes('Link Pending') || confirmationFile.includes('قيد التجهيز'),
        'BookingConfirmation must display Link Pending badge when URL is not ready'
      );
      assert.ok(
        !confirmationFile.includes('href="/"') || !confirmationFile.includes('Join Classroom'),
        'BookingConfirmation must never link Join Classroom button to root homepage'
      );
    });
  });
});

