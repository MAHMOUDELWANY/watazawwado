import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const API_FILE_PATH = path.join(process.cwd(), 'api', 'index.ts');

test('Phase C: AI Brief Security and Data Minimization Verification', async (t) => {
  const code = fs.readFileSync(API_FILE_PATH, 'utf8');

  await t.test('1. Endpoint is POST and protected by verifyTeacherAuth', () => {
    assert.match(
      code,
      /app\.post\('\/api\/dashboard\/students\/:id\/ai-brief',\s*verifyTeacherAuth/,
      'The AI brief endpoint must be POST and use verifyTeacherAuth middleware.'
    );
  });

  await t.test('2. Enforces database-level authorization (student.assigned_teacher_id === req.teacherUser.id)', () => {
    assert.match(
      code,
      /req\.teacherUser\?\.role !== 'super_admin'/,
      'Must check if the user is a super admin'
    );
    assert.match(
      code,
      /student\.assigned_teacher_id !== req\.teacherUser\.id/,
      'Standard teacher must only access their own assigned students'
    );
    assert.match(
      code,
      /res\.status\(403\)/,
      'Must return 403 on authorization failure'
    );
  });

  await t.test('3. Generates prompt using minimal PII data', () => {
    const aiBriefSection = code.substring(code.indexOf('app.post(\'/api/dashboard/students/:id/ai-brief\''));
    const contextObjectStr = aiBriefSection.match(/const context = \{[\s\S]*?intake: .*?\n\s*\};/)?.[0];
    
    assert.ok(contextObjectStr, 'Context object should be built before calling AI');
    
    // Explicitly check for absence of emails, passwords, auth tokens, phone numbers
    assert.doesNotMatch(contextObjectStr, /email/, 'Context must not contain email');
    assert.doesNotMatch(contextObjectStr, /whatsapp|phone/, 'Context must not contain phone/whatsapp');
    assert.doesNotMatch(contextObjectStr, /password|auth|secret/, 'Context must not contain auth secrets');
    
    // Check that we extract only the first name
    assert.match(contextObjectStr, /\.split\(' '\)\[0\]/, 'Should ideally extract only the first name to minimize PII');
  });

  await t.test('4. Validates API Key before making Gemini request', () => {
    const aiBriefSection = code.substring(code.indexOf('app.post(\'/api/dashboard/students/:id/ai-brief\''));
    assert.match(
      aiBriefSection,
      /!process\.env\.GEMINI_API_KEY/,
      'Must gracefully fail with 503 if GEMINI_API_KEY is not configured'
    );
  });

  await t.test('5. Gemini generation call is properly configured', () => {
    const aiBriefSection = code.substring(code.indexOf('app.post(\'/api/dashboard/students/:id/ai-brief\''));
    assert.match(
      aiBriefSection,
      /gemini-3\.1-flash-lite/,
      'Must use the lightweight flash-lite model'
    );
  });

  await t.test('6. Includes mandatory Arabic advisory label in the prompt', () => {
    const aiBriefSection = code.substring(code.indexOf('app.post(\'/api/dashboard/students/:id/ai-brief\''));
    assert.match(
      aiBriefSection,
      /«ملخص استرشادي مقترح — لا يغني عن تقييم المعلم المباشر»/,
      'Prompt must instruct Gemini to output the required Arabic disclaimer'
    );
  });

  await t.test('7. Gracefully handles AI service downtime / 503 errors', () => {
    const aiBriefSection = code.substring(code.indexOf('app.post(\'/api/dashboard/students/:id/ai-brief\''));
    assert.match(
      aiBriefSection,
      /err\.status === 503 \|\| err\.message\?\.toLowerCase\(\)\.includes\('timeout'\)/,
      'Catch block must handle AI timeouts/503s specifically'
    );
  });
});
