export type CalendarMode = 'month' | 'week' | 'day' | 'list';
export const melbourneToday = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Melbourne',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};
export const addDays = (day: string, amount: number) => {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};
export const addMonths = (day: string, amount: number) => {
  const date = new Date(`${day.slice(0, 7)}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 10);
};
export function calendarRange(day: string, mode: CalendarMode) {
  if (mode === 'day') return { from: day, to: addDays(day, 1) };
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  if (mode === 'week') {
    const from = addDays(day, -((weekday + 6) % 7));
    return { from, to: addDays(from, 7) };
  }
  const first = `${day.slice(0, 7)}-01`;
  if (mode === 'list') return { from: first, to: addMonths(first, 1) };
  const firstWeekday = new Date(`${first}T12:00:00Z`).getUTCDay();
  const from = addDays(first, -((firstWeekday + 6) % 7));
  return { from, to: addDays(from, 42) };
}
export const dateLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-AU', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
export function calendarIcs(
  events: {
    id: string;
    date: string;
    endsAt: string;
    title: string;
    site?: string;
    notes?: string;
  }[]
) {
  const escape = (value: string) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  const stamp = (value: string) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
  const fold = (line: string) => {
    const lines: string[] = [];
    let part = '';
    let size = 0;
    for (const char of line) {
      const length = new TextEncoder().encode(char).length;
      if (size + length > 75) {
        lines.push(part);
        part = ' ';
        size = 1;
      }
      part += char;
      size += length;
    }
    lines.push(part);
    return lines.join('\r\n');
  };
  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BYD Sales CRM//Calendar//EN',
      ...events.flatMap((event) => [
        'BEGIN:VEVENT',
        `UID:${escape(event.id)}@byd-sales-crm`,
        `DTSTAMP:${stamp(new Date().toISOString())}`,
        `DTSTART:${stamp(event.date)}`,
        `DTEND:${stamp(event.endsAt)}`,
        `SUMMARY:${escape(event.title)}`,
        `LOCATION:${escape(event.site || '')}`,
        `DESCRIPTION:${escape(event.notes || '')}`,
        'END:VEVENT',
      ]),
      'END:VCALENDAR',
    ]
      .map(fold)
      .join('\r\n') + '\r\n'
  );
}
