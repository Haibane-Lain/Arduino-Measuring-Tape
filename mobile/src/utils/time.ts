const pad = (value: number) => value.toString().padStart(2, '0');

/** `10:37:45` - used for the "last updated" stamp. */
export function formatClock(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** `Today 21:38`, `Yesterday 10:27` or `12 Sep 10:27`. */
export function formatHistoryStamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDelta = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (dayDelta === 0) return `Today ${time}`;
  if (dayDelta === 1) return `Yesterday ${time}`;

  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${date.getDate()} ${month} ${time}`;
}
