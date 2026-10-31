// Convert a Melbourne wall-clock entry independently of the browser's timezone.
export function melbourneBookingTime(date: string, time: string): string {
  const wallClock = `${date}T${time}:00`;
  const naive = Date.parse(`${wallClock}Z`);
  if (!Number.isFinite(naive)) throw new Error('Enter a valid booking date and time.');
  const format = (stamp: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(stamp).map(part => [part.type, part.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  };
  const candidates = [10, 11].map(offset => naive - offset * 3600000).filter(stamp => format(stamp) === wallClock);
  if (candidates.length !== 1) throw new Error('This Melbourne time is ambiguous or unavailable because of daylight saving. Select another time.');
  return new Date(candidates[0]).toISOString();
}
