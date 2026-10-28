import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { getActiveWorkingTimezone, setActiveWorkingTimezone, getTimezoneDisplayLabel } from '../../lib/countryTimezones';

const DISMISS_KEY = 'wz_tz_check_dismissed';

/** Device zone, or null when it shows the same clock time as the zone in use (e.g. Paris vs Warsaw). */
export function deviceZoneIfDifferent(active: string, now: DateTime = DateTime.now()): string | null {
  let device = '';
  try { device = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; }
  if (!device || device === active || !now.setZone(device).isValid || !now.setZone(active).isValid) return null;
  return now.setZone(device).offset === now.setZone(active).offset ? null : device;
}

/**
 * Auto-detect, asked once: when this device sits in another time zone than the one lessons are shown in
 * (travel, or a zone saved on another device), offer to switch. "Keep" is remembered for that pair.
 */
export function TimezoneCheck({ isAr, onUse }: { isAr: boolean; onUse?: (tz: string) => Promise<void> | void }) {
  const [active, setActive] = useState(() => getActiveWorkingTimezone());
  const [device, setDevice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setActive(getActiveWorkingTimezone());
    window.addEventListener('watazawwado_timezone_change', sync);
    return () => window.removeEventListener('watazawwado_timezone_change', sync);
  }, []);

  useEffect(() => {
    const d = deviceZoneIfDifferent(active);
    let dismissed = '';
    try { dismissed = localStorage.getItem(DISMISS_KEY) || ''; } catch { /* storage blocked */ }
    setDevice(d && dismissed !== `${d}|${active}` ? d : null);
  }, [active]);

  if (!device) return null;
  const label = (tz: string) => getTimezoneDisplayLabel(tz, isAr);

  const use = async () => {
    setBusy(true);
    try {
      await onUse?.(device);
      setActiveWorkingTimezone(device);
    } finally {
      setBusy(false);
    }
  };
  const keep = () => {
    try { localStorage.setItem(DISMISS_KEY, `${device}|${active}`); } catch { /* storage blocked */ }
    setDevice(null);
  };

  return (
    <div role="status" className="rounded-2xl border border-gold/50 bg-gold/10 p-4 grid gap-3 sm:flex sm:items-center sm:justify-between" data-testid="timezone-check">
      <p className="text-sm text-foreground">
        {isAr
          ? <>جهازك على توقيت <b>{label(device)}</b>، والمواعيد معروضة بتوقيت <b>{label(active)}</b>.</>
          : <>Your device is on <b>{label(device)}</b> time; lessons are shown in <b>{label(active)}</b> time.</>}
      </p>
      <div className="flex gap-2 shrink-0">
        <button type="button" onClick={use} disabled={busy} className="flex-1 sm:flex-none min-h-11 px-4 rounded-xl bg-[#0A2E35] text-white text-sm font-semibold cursor-pointer focus-ring disabled:opacity-60">
          {isAr ? 'استخدم توقيت جهازي' : 'Use my device time'}
        </button>
        <button type="button" onClick={keep} className="flex-1 sm:flex-none min-h-11 px-4 rounded-xl border border-border text-sm font-semibold text-foreground cursor-pointer focus-ring">
          {isAr ? 'سيبه زي ما هو' : 'Keep it'}
        </button>
      </div>
    </div>
  );
}
