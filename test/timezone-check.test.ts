import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { deviceZoneIfDifferent } from '../src/components/ui/TimezoneCheck';

describe('Time zone check (auto-detect)', () => {
  const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = DateTime.fromISO('2026-10-28T12:00:00Z');

  it('stays quiet when the device is already on the zone in use', () => {
    assert.equal(deviceZoneIfDifferent(device, now), null);
  });

  it('offers the device zone when its clock differs from the zone in use', () => {
    const far = now.setZone(device).offset === now.setZone('Pacific/Kiritimati').offset ? 'Pacific/Pago_Pago' : 'Pacific/Kiritimati';
    assert.equal(deviceZoneIfDifferent(far, now), device);
  });
});
