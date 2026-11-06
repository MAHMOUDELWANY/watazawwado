import test from 'node:test';
import assert from 'node:assert';
import { createHmac } from 'crypto';
import { isValidZoomSignature, parseZoomAttendanceEvent, studentJoinPath, LINK_SCANNER_UA } from '../server/routes/attendance';

test('Join link: mail scanners and previews are not counted as the student', () => {
  assert.ok(LINK_SCANNER_UA.test('Mozilla/5.0 (compatible; Microsoft Office SafeLinks)'));
  assert.ok(LINK_SCANNER_UA.test('WhatsApp/2.23.20.0'));
  assert.ok(LINK_SCANNER_UA.test('Googlebot/2.1'));
  assert.ok(!LINK_SCANNER_UA.test('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'));
  assert.ok(!LINK_SCANNER_UA.test('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'));
});

test('Zoom webhook signature: accepts valid, rejects tampered, wrong-secret and stale calls', () => {
  const secret = 'zoom_test_secret';
  const body = '{"event":"meeting.started","payload":{"object":{"id":123}}}';
  const ts = '1800000000';
  const now = 1_800_000_000_000;
  const sign = (b: string, s = secret) => `v0=${createHmac('sha256', s).update(`v0:${ts}:${b}`).digest('hex')}`;

  assert.strictEqual(isValidZoomSignature(Buffer.from(body), ts, sign(body), secret, now), true);
  assert.strictEqual(isValidZoomSignature(body.replace('123', '124'), ts, sign(body), secret, now), false);
  assert.strictEqual(isValidZoomSignature(body, ts, sign(body, 'other'), secret, now), false);
  assert.strictEqual(isValidZoomSignature(body, ts, sign(body), secret, now + 301_000), false, 'replay window');
  assert.strictEqual(isValidZoomSignature(body, undefined, sign(body), secret, now), false);
  assert.strictEqual(isValidZoomSignature(body, ts, sign(body), '', now), false, 'no secret configured');
});

test('Zoom attendance events: host is the teacher, others are the student, unknown events are ignored', () => {
  const object = { id: 987654321, uuid: 'abc==', host_id: 'HOST1' };
  const teacher = parseZoomAttendanceEvent({ event: 'meeting.participant_joined', payload: { object: { ...object, participant: { id: 'HOST1', user_name: 'Teacher', join_time: '2026-11-06T18:00:00Z' } } } });
  assert.strictEqual(teacher?.meetingId, '987654321');
  assert.strictEqual(teacher?.row.role, 'teacher');
  assert.strictEqual(teacher?.row.event, 'joined');
  assert.strictEqual(teacher?.row.occurred_at, '2026-11-06T18:00:00.000Z');

  const student = parseZoomAttendanceEvent({ event: 'meeting.participant_left', payload: { object: { ...object, participant: { participant_uuid: 'P2', user_name: 'Amina', leave_time: '2026-11-06T18:45:00Z' } } } });
  assert.strictEqual(student?.row.role, 'student');
  assert.strictEqual(student?.row.event, 'left');
  assert.strictEqual(student?.row.participant_name, 'Amina');

  const ended = parseZoomAttendanceEvent({ event: 'meeting.ended', payload: { object: { ...object, end_time: '2026-11-06T18:46:00Z' } } });
  assert.strictEqual(ended?.row.event, 'meeting_ended');
  assert.strictEqual(ended?.row.role, 'unknown');

  // The same Zoom retry gives the same dedupe key.
  const again = parseZoomAttendanceEvent({ event: 'meeting.ended', payload: { object: { ...object, end_time: '2026-11-06T18:46:00Z' } } });
  assert.strictEqual(again?.row.dedupe_key, ended?.row.dedupe_key);

  assert.strictEqual(parseZoomAttendanceEvent({ event: 'recording.completed', payload: { object } }), null);
  assert.strictEqual(parseZoomAttendanceEvent({}), null);
});

test('Student join link goes through the site only for real https links', () => {
  assert.match(String(studentJoinPath('b1', 'https://us06web.zoom.us/j/1?pwd=x')), /\/api\/join\/b1$/);
  assert.strictEqual(studentJoinPath('b1', 'fallback-room'), 'fallback-room');
  assert.strictEqual(studentJoinPath('b1', null), null);
  assert.strictEqual(studentJoinPath(null, 'https://zoom.us/j/1'), 'https://zoom.us/j/1');
});
