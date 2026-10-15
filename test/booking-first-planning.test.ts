import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (name: string) => fs.readFileSync(`src/${name}`, 'utf8');

describe('booking flow: one lesson at a time, packages on the packages page (RULES.md §4)', () => {
  it('keeps the packages page reachable from the student account', () => {
    const app = read('student/StudentApp.tsx');
    assert.match(app, /<Route path="\/packages"/);
  });

  it('no longer sells multi-lesson plans from the booking flow', () => {
    const flow = read('components/booking/BookingFlow.tsx');
    assert.ok(!fs.existsSync('src/components/booking/MultiLessonPlan.tsx'), 'MultiLessonPlan was removed');
    assert.doesNotMatch(flow, /multi-lesson-plan|MultiLessonPlan|lessonCount/);
    assert.doesNotMatch(fs.readFileSync('api/index.ts', 'utf8'), /\/api\/student\/multi-lesson-plan/);
  });

  it('shows server catalog packages for the chosen band and length, display only', () => {
    const step = read('components/booking/StepPackageQuantity.tsx');
    assert.match(step, /eligibility_rules\?\.hourly_rate/);
    assert.match(step, /eligibility_rules\?\.duration_minutes/);
    // In-app link keeps the booking draft; the packages page leads back to it.
    assert.match(step, /to="\/student\/packages\?from=booking"/);
    assert.doesNotMatch(step, /fetch\(/);
  });

  it('still redeems a single lesson credit', () => {
    const repo = read('lib/bookingRepository.ts');
    assert.match(repo, /package_entitlement_id: data\.packageEntitlementId \|\| null/);
    assert.match(read('components/booking/StepLessonType.tsx'), /Use an existing lesson credit/);
  });
});

describe('learning guide unavailable state', () => {
  it('maps AI_UNAVAILABLE/503 to a calm, distinct state with a helpful next step', () => {
    const guide = read('components/intake/IntakeConversation.tsx');
    assert.match(guide, /data\?\.code === 'AI_UNAVAILABLE' \|\| r\.status === 503/);
    assert.match(guide, /setAiUnavailable\(true\)/);
    assert.match(guide, /The learning guide is unavailable right now\./);
    assert.match(guide, /you can still book a lesson or message Ustadh Mahmoud directly/i);
    assert.match(guide, /aiUnavailable && \(/);
  });

  it('keeps the API key server-side only (never referenced in the client guide)', () => {
    const guide = read('components/intake/IntakeConversation.tsx');
    assert.doesNotMatch(guide, /GEMINI_API_KEY/);
    assert.doesNotMatch(guide, /apiKey/);
    const intakeApi = read('../api/index.ts');
    assert.match(intakeApi, /process\.env\.GEMINI_API_KEY/);
  });
});
