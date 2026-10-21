/**
 * PA-03: iCalendar (RFC 5545) text for "Add to my calendar" (one lesson) and the family feed. Times are UTC so every
 * calendar app shows them in the viewer's own time zone. Never put a Zoom link in here: joining happens on the site.
 */
export interface IcsEvent {
  uid: string;
  startIso: string;
  endIso: string;
  title: string;
  description?: string;
  url?: string;
}

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Escapes text values: backslash, semicolon, comma and line breaks. */
export function icsText(value: string): string {
  return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Folds a content line at 75 octets (continuation lines start with a space), keeping UTF-8 characters whole. */
export function foldLine(line: string): string {
  const bytes = (s: string) => new TextEncoder().encode(s).length;
  if (bytes(line) <= 75) return line;
  const parts: string[] = [];
  let current = '';
  for (const ch of line) {
    if (bytes(current + ch) > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = ch;
    } else current += ch;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function buildIcs(events: IcsEvent[], calendarName = 'Watazawwado'): string {
  const now = stamp(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Watazawwado Academy//Lessons//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(calendarName)}`
  ];
  for (const e of events) {
    if (Number.isNaN(Date.parse(e.startIso)) || Number.isNaN(Date.parse(e.endIso))) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${icsText(e.uid)}`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(e.startIso)}`,
      `DTEND:${stamp(e.endIso)}`,
      `SUMMARY:${icsText(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${icsText(e.description)}`] : []),
      ...(e.url ? [`URL:${e.url.replace(/[\r\n]/g, '')}`] : []),
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
