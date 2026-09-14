import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('Task 0.58-A: Student Identity Resolution & Storage Cleanup', async (t) => {
  await t.test('Should successfully verify Identity conflict logic exists in api/index.ts', () => {
    const apiCode = fs.readFileSync('api/index.ts', 'utf8');
    
    // Check if Identity Conflict status 409 is thrown
    assert(apiCode.includes("Identity conflict. Email is already associated with a student record but cannot be linked to this auth user."));
    assert(apiCode.includes("res.status(409).json({ error: 'Identity conflict"));
    
    // Check if we correctly create only if NO record exists at all
    assert(apiCode.includes("// Only create a new student record if NO matching record exists at all (genuine new user)."));
  });
  
  await t.test('Should successfully verify sessionStorage was removed from auth.tsx and dashboardApi.ts', () => {
    const authCode = fs.readFileSync('src/lib/auth.tsx', 'utf8');
    
    assert(!authCode.includes("sessionStorage.setItem('student_authenticated', 'true')"));
    assert(!authCode.includes("sessionStorage.setItem('mahmoud_teacher_authenticated', 'true')"));
    
    const dashboardCode = fs.readFileSync('src/dashboard/lib/dashboardApi.ts', 'utf8');
    assert(!dashboardCode.includes("sessionStorage.getItem('mahmoud_teacher_authenticated')"));
  });
  
  await t.test('Should successfully verify Interactive Demo was removed from authenticated student sidebar', () => {
    const appCode = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');
    
    // It should exist in the unauthenticated view
    assert(appCode.includes('Explore as Guest (Interactive Demo)'));
    
    // It should NOT exist in the navItems
    const navItemsMatch = appCode.match(/const navItems = \[([\s\S]*?)\];/);
    assert(navItemsMatch);
    if (navItemsMatch) {
      assert(!navItemsMatch[1].includes('Demo'));
    }
  });
});
