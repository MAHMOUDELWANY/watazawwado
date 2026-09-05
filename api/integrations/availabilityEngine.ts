/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — SERVER-SIDE AVAILABILITY ENGINE
 * File: api/integrations/availabilityEngine.ts
 * Role: Real Availability Validator & Timezone Projection
 * ====================================================================
 */

import { DateTime, Interval } from 'luxon';
import { queryGoogleFreeBusy, GoogleFreeBusyInterval } from './googleCalendar.js';
import { getActiveGoogleConnection } from './syncEngine.js';
import { createClient } from '@supabase/supabase-js';

export interface AvailableSlotDto {
  id: string;
  time24: string;
  timeDisplay: string;
  period: 'morning' | 'afternoon' | 'evening';
  available: boolean;
  cairoTimeEquiv: string;
  utcStartIso: string;
  utcEndIso: string;
}

export interface DayAvailabilityDto {
  dateString: string;
  dayOfWeek: string;
  dayOfMonth: number;
  monthName: string;
  isAvailable: boolean;
  reasonUnavailable?: string;
  slots: AvailableSlotDto[];
}

function getServerSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('[Configuration Error] SUPABASE_SERVICE_ROLE_KEY is missing. Required for availability engine.');
    return null;
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

/**
 * Returns busy UTC intervals from Supabase bookings.
 */
async function getSupabaseBookedIntervals(startUtcIso: string, endUtcIso: string): Promise<{ start: string; end: string }[]> {
  const supabase = getServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('scheduled_start, scheduled_end, status')
      .in('status', ['confirmed', 'rescheduled', 'pending'])
      .gte('scheduled_end', startUtcIso)
      .lte('scheduled_start', endUtcIso);

    if (error || !data) return [];
    return data.map((b: any) => ({
      start: b.scheduled_start,
      end: b.scheduled_end
    }));
  } catch (err) {
    console.warn('[Supabase Booked Intervals Fetch Warning]', err);
    return [];
  }
}

/**
 * Computes available booking days and slots for a given timezone and date range.
 * Merges Cairo teaching hours + Google Calendar Busy + Supabase Bookings.
 */
export async function computeAvailableSlots(
  studentTimezone: string,
  daysCount: number,
  durationMinutes: number
): Promise<DayAvailabilityDto[]> {
  const nowCairo = DateTime.now().setZone('Africa/Cairo');
  const days: DayAvailabilityDto[] = [];

  // Define window for checking external calendar
  const startWindowUtc = nowCairo.startOf('day').toUTC().toISO()!;
  const endWindowUtc = nowCairo.plus({ days: daysCount + 2 }).endOf('day').toUTC().toISO()!;

  // 1. Fetch Google Calendar busy slots if connected
  let googleBusyIntervals: GoogleFreeBusyInterval[] = [];
  try {
    const googleConn = await getActiveGoogleConnection();
    if (googleConn && googleConn.accessToken) {
      googleBusyIntervals = await queryGoogleFreeBusy(googleConn.accessToken, startWindowUtc, endWindowUtc);
    }
  } catch (err) {
    console.warn('[Availability Engine: Google FreeBusy Warning]', err);
  }

  // 2. Fetch Supabase booked intervals
  const dbBusyIntervals = await getSupabaseBookedIntervals(startWindowUtc, endWindowUtc);

  // Combine busy intervals with 10-min buffer
  const allBusy = [...googleBusyIntervals, ...dbBusyIntervals].map((interval) => {
    const start = DateTime.fromISO(interval.start, { zone: 'utc' }).minus({ minutes: 5 });
    const end = DateTime.fromISO(interval.end, { zone: 'utc' }).plus({ minutes: 5 });
    return Interval.fromDateTimes(start, end);
  });

  // Standard Cairo working hours (09:00 AM to 10:00 PM Cairo)
  const cairoTeachingHours = [
    { hour: 9, minute: 0 },
    { hour: 10, minute: 30 },
    { hour: 12, minute: 0 },
    { hour: 14, minute: 0 },
    { hour: 15, minute: 30 },
    { hour: 17, minute: 0 },
    { hour: 18, minute: 30 },
    { hour: 20, minute: 0 },
    { hour: 21, minute: 15 }
  ];

  // Start from tomorrow
  for (let i = 1; i <= daysCount; i++) {
    const targetDateCairo = nowCairo.plus({ days: i });
    const dayOfWeek = targetDateCairo.toFormat('ccc');
    const dayOfMonth = targetDateCairo.day;
    const monthName = targetDateCairo.toFormat('LLL');
    const dateString = targetDateCairo.toFormat('yyyy-MM-dd');

    // Build slots for this day
    const slots: AvailableSlotDto[] = [];

    for (const timeConfig of cairoTeachingHours) {
      const slotStartCairo = targetDateCairo.set({
        hour: timeConfig.hour,
        minute: timeConfig.minute,
        second: 0,
        millisecond: 0
      });
      const slotEndCairo = slotStartCairo.plus({ minutes: durationMinutes });

      const slotStartUtc = slotStartCairo.toUTC();
      const slotEndUtc = slotEndCairo.toUTC();
      const slotInterval = Interval.fromDateTimes(slotStartUtc, slotEndUtc);

      // Check for overlap with any busy intervals
      const isConflicted = allBusy.some((busy) => busy.overlaps(slotInterval));

      // Project into student timezone
      const studentLocalStart = slotStartUtc.setZone(studentTimezone);
      const hour = studentLocalStart.hour;

      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (hour >= 12 && hour < 17) period = 'afternoon';
      else if (hour >= 17) period = 'evening';

      slots.push({
        id: `${dateString}-${slotStartCairo.toFormat('HHmm')}`,
        time24: studentLocalStart.toFormat('HH:mm'),
        timeDisplay: studentLocalStart.toFormat('hh:mm a'),
        period,
        available: !isConflicted,
        cairoTimeEquiv: slotStartCairo.toFormat('hh:mm a') + ' Cairo',
        utcStartIso: slotStartUtc.toISO()!,
        utcEndIso: slotEndUtc.toISO()!
      });
    }

    const availableSlotsCount = slots.filter((s) => s.available).length;

    days.push({
      dateString,
      dayOfWeek,
      dayOfMonth,
      monthName,
      isAvailable: availableSlotsCount > 0,
      reasonUnavailable: availableSlotsCount === 0 ? 'No available slots on this day.' : undefined,
      slots
    });
  }

  return days;
}

/**
 * Server-side validation of a requested slot to prevent double-booking.
 */
export async function validateSlotAvailability(
  scheduledStartUtc: string,
  scheduledEndUtc: string
): Promise<{ isAvailable: boolean; conflictReason?: string }> {
  const reqStart = DateTime.fromISO(scheduledStartUtc, { zone: 'utc' });
  const reqEnd = DateTime.fromISO(scheduledEndUtc, { zone: 'utc' });

  if (!reqStart.isValid || !reqEnd.isValid) {
    return { isAvailable: false, conflictReason: 'Invalid slot datetime.' };
  }

  const reqInterval = Interval.fromDateTimes(reqStart, reqEnd);

  // 1. Check Google Calendar FreeBusy
  try {
    const googleConn = await getActiveGoogleConnection();
    if (googleConn && googleConn.accessToken) {
      const busyList = await queryGoogleFreeBusy(
        googleConn.accessToken,
        reqStart.minus({ minutes: 15 }).toISO()!,
        reqEnd.plus({ minutes: 15 }).toISO()!
      );

      const hasConflict = busyList.some((b) => {
        const busyInt = Interval.fromDateTimes(
          DateTime.fromISO(b.start, { zone: 'utc' }),
          DateTime.fromISO(b.end, { zone: 'utc' })
        );
        return busyInt.overlaps(reqInterval);
      });

      if (hasConflict) {
        return { isAvailable: false, conflictReason: 'This time slot is no longer available on the teacher calendar.' };
      }
    }
  } catch (err) {
    console.error('[Google FreeBusy validation check warning]', err);
    return { isAvailable: false, conflictReason: 'That time could not be confirmed. Please choose another slot or try again.' };
  }

  // 2. Check Supabase active bookings
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data: conflicts, error } = await supabase
        .from('bookings')
        .select('id, scheduled_start, scheduled_end')
        .in('status', ['confirmed', 'rescheduled', 'pending'])
        .lt('scheduled_start', reqEnd.toISO()!)
        .gt('scheduled_end', reqStart.toISO()!);

      if (error) {
        console.error('[Supabase booking conflict check error]', error);
        return { isAvailable: false, conflictReason: 'That time could not be confirmed. Please choose another slot or try again.' };
      }

      if (conflicts && conflicts.length > 0) {
        return { isAvailable: false, conflictReason: 'This lesson time has just been booked by another student.' };
      }
    } catch (err) {
      console.error('[Supabase booking conflict check exception]', err);
      return { isAvailable: false, conflictReason: 'That time could not be confirmed. Please choose another slot or try again.' };
    }
  }

  return { isAvailable: true };
}
