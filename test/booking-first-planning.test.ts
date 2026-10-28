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

  it('shows server catalog packages for the chosen band and length as envelopes, and buys inside the flow (owner D4)', () => {
    const step = read('components/booking/StepPackageQuantity.tsx');
    assert.match(step, /eligibility_rules\?\.hourly_rate/);
    assert.match(step, /eligibility_rules\?\.duration_minutes/);
    // Compact envelope-style plan cards, one tap to choose (owner, 2026-10-28 phone review).
    assert.match(step, /role="radio"/);
    assert.match(step, /Envelope edge/);
    assert.doesNotMatch(step, /from=booking/, 'no detour to the packages page');
    assert.doesNotMatch(step, /fetch\(/);
    const flow = read('components/booking/BookingFlow.tsx');
    // Server sets the price: the flow sends only the catalog id, then pays the new entitlement.
    assert.match(flow, /\/api\/student\/packages\/select/);
    assert.match(flow, /targetType="package"/);
    assert.match(flow, /target_type'\) === 'package'/);
    assert.match(flow, /packageEntitlementId: entitlementId/);
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
    assert.match(guide, /you can still book a lesson or message us directly/i);
    assert.match(guide, /aiUnavailable && \(/);
  });

  it('keeps the API key server-side only (never referenced in the client guide)', () => {
    const guide = read('components/intake/IntakeConversation.tsx');
    assert.doesNotMatch(guide, /GEMINI_API_KEY/);
    assert.doesNotMatch(guide, /apiKey/);
    const intakeApi = read('../server/routes/intake.ts');
    assert.match(intakeApi, /process\.env\.GEMINI_API_KEY/);
  });
});
