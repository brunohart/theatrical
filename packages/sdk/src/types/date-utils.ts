export type ISODateString = string;
export type NZTimezone = 'Pacific/Auckland';

export function toNZDate(date: Date): ISODateString {
  return date.toLocaleDateString('en-NZ', { timeZone: 'Pacific/Auckland' });
}

export function toISOWithTimezone(date: Date, offsetHours = 12): ISODateString {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  const sign = offsetHours >= 0 ? '+' : '-';
  const oh = pad(Math.abs(offsetHours));
  return `${y}-${m}-${d}T${h}:${min}:${s}${sign}${oh}:00`;
}
