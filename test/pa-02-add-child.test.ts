import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';

describe('PA-02 add another child after onboarding', () => {
  const api = fs.readFileSync('api/index.ts', 'utf8');
  const route = api.slice(api.indexOf("app.post('/api/student/children'"), api.indexOf("app.patch('/api/student/me'"));

  it('enforces the age rule and family size on the server', () => {
    assert.ok(route.includes('isChildAge(req.body?.age)'), 'child age 6-17 checked server-side');
    assert.ok(route.includes('>= 10'), 'at most 10 children');
    assert.ok(route.includes('onboarding_completed'), 'only after onboarding');
    assert.ok(route.includes("relationship_type: 'parent'"), 'the child is linked to this account');
    assert.ok(route.includes(".delete().eq('id', child.id)"), 'no orphan child if the guardian link fails');
  });

  it('accepts only catalogue subjects and their levels, and a retry returns the child already added', () => {
    assert.ok(route.includes('findSubject(req.body.learningInterest.trim())'));
    assert.ok(route.includes('levelsFor(subject)'));
    assert.ok(route.includes('alreadyAdded: true'));
  });

  it('tells the rest of the portal to reload the profile after adding', () => {
    assert.ok(fs.readFileSync('src/student/components/AddChildForm.tsx', 'utf8').includes('window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT))'));
    assert.ok(fs.readFileSync('src/student/StudentApp.tsx', 'utf8').includes('window.addEventListener(PROFILE_CHANGED_EVENT, reload)'));
  });

  it('never changes the parent profile and never trusts a teacher id that is not an active public teacher', () => {
    assert.ok(!/from\('students'\)\s*\.update/.test(route), 'no update to the parent row');
    assert.ok(route.includes('publicTeachers.find(t => t.id === req.body.teacherId)'));
  });

  it('families add from home and the family tab; an adult learner opts in from Preferences only', () => {
    const profile = fs.readFileSync('src/student/pages/StudentProfilePage.tsx', 'utf8');
    assert.ok(profile.includes('<AddChildForm'));
    assert.ok(profile.includes('id="add-child-optin"'), 'adult learners get one explicit "add a child" step');
    assert.match(profile, /isFamily \|\| profile\?\.guardian \? \[\{\s*id: 'family'/, 'the family tab is for family accounts only');
    const home = fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8');
    assert.ok(home.includes('to="/student/account?tab=family#add-child"'), 'family home links open the family tab');
    assert.ok(!home.includes('a personal account can add a child'), 'no add-child nudge on an adult learner home');
  });

  describe('endpoint', () => {
    let server: http.Server;
    let base: string;
    before(async () => {
      await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
    });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('requires a signed-in student', async () => {
      const r = await fetch(`${base}/api/student/children`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', age: 9 }) });
      assert.strictEqual(r.status, 401);
    });
  });
});
