import { CoworkerId } from './data';

// ---------------- holidays and birthdays ----------------
// Seasonal garlands across the top of the office, and birthdays: the player's (a card from everyone) and each
// coworker's (a ribbon in the office, a birthday chat line, an extra friendship point for an order done for them).
export type Holiday = 'winter' | 'lunar' | 'love' | 'spooky';
// Lunar New Year moves every year: its day, by year (month is 0-based)
const LUNAR: Record<number, [number, number]> = { 2026: [1, 17], 2027: [1, 6], 2028: [0, 26], 2029: [1, 13], 2030: [1, 3] };
export function holidayOn(d = new Date()): Holiday | null {
  const m = d.getMonth(), day = d.getDate(), y = d.getFullYear();
  const ln = LUNAR[y]; if (ln) { const t0 = new Date(y, ln[0], ln[1]).getTime(), t = new Date(y, m, day).getTime(); if (t >= t0 - 3 * 864e5 && t <= t0 + 7 * 864e5) return 'lunar'; }
  if (m === 11 || (m === 0 && day <= 6)) return 'winter';
  if (m === 1 && day >= 7 && day <= 14) return 'love';
  if (m === 9 && day >= 24) return 'spooky';
  return null;
}
// each coworker's birthday (month 0-based, day)
export const BIRTHDAY: Record<CoworkerId, [number, number]> = {
  margaux: [2, 14], priya: [6, 2], theo: [10, 30], camille: [4, 21], jonah: [8, 9], odette: [3, 3],
  rio: [11, 12], sam: [7, 18], ada: [0, 27], kofi: [5, 15], mei: [9, 5], bean: [3, 1],
};
export const isBirthday = (md: [number, number] | { m: number; d: number } | null | undefined, d = new Date()) => {
  if (!md) return false; const [m, day] = Array.isArray(md) ? md : [md.m, md.d]; return d.getMonth() === m && d.getDate() === day;
};
export const birthdayToday = (ids: CoworkerId[], d = new Date()) => ids.filter((id) => isBirthday(BIRTHDAY[id], d));
