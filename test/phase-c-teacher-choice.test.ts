import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p: string) => fs.readFileSync(p, 'utf8');

describe('Phase C: the learner picks the teacher at sign-up (owner D1, 2026-10-28)', () => {
  it('the picker asks male or female first, then shows cards of that gender with a short bio', () => {
    const pass = read('src/components/onboarding/TravelPass.tsx');
    assert.match(pass, /aria-label=\{isAr \? 'معلم ولا معلمة' : 'Male or female teacher'\}/);
    assert.match(pass, /teachers\.filter\(\(t\) => t\.gender === tab\)/);
    assert.match(pass, /t\.bio &&/);
  });

  it('the teacher list carries a short bio but never the email', () => {
    const api = read('api/index.ts');
    assert.match(api, /select\('id, email, bio'\)/);
    assert.match(api, /res\.json\(\{ teachers: teachers\.map\(\(\{ email: _email, \.\.\.t \}\) => t\) \}\)/);
  });

  it('the admin gets the full details by email; teachers do not get contact details', () => {
    const ns = read('server/onboarding/newStudent.ts');
    assert.match(ns, /\['Email', 'الإيميل', opts\.forAdmin \? account\.email : null\]/);
    assert.match(ns, /to: OFFICIAL_ADMIN_EMAIL/);
    assert.match(ns, /forAdmin: true, teacherName/);
  });
});
