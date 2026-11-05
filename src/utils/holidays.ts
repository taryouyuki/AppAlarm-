/**
 * Japanese public holidays, computed from statutory rules:
 * fixed dates, Happy-Monday dates, the two equinoxes (1980-2099 formula),
 * substitute holidays (振替休日) and sandwiched holidays (国民の休日).
 */

const CACHE = new Map<number, Set<string>>();

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function nthMonday(year: number, month: number, n: number): { year: number; month: number; day: number } {
  const date = new Date(year, month - 1, 1);
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }
  date.setDate(date.getDate() + (n - 1) * 7);
  return { year, month, day: date.getDate() };
}

function equinoxDay(year: number, spring: boolean): number {
  const base = spring ? 20.8431 : 23.2488;
  const v = base + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4.0);
  return Math.floor(v);
}

export function getJapaneseHolidays(year: number): Set<string> {
  const cached = CACHE.get(year);
  if (cached) return cached;

  const set = new Set<string>();

  const add = (m: number, d: number) => {
    set.add(formatDateKey(year, m, d));
  };

  // Fixed holidays
  add(1, 1); // 元日
  const adult = nthMonday(year, 1, 2); // 成人の日
  add(adult.month, adult.day);
  add(2, 11); // 建国記念の日
  add(2, 23); // 天皇誕生日
  add(3, equinoxDay(year, true)); // 春分の日
  add(4, 29); // 昭和の日
  add(5, 3); // 憲法記念日
  add(5, 4); // みどりの日
  add(5, 5); // こどもの日
  const marine = nthMonday(year, 7, 3); // 海の日
  add(marine.month, marine.day);
  add(8, 11); // 山の日
  const elders = nthMonday(year, 9, 3); // 敬老の日
  add(elders.month, elders.day);
  add(9, equinoxDay(year, false)); // 秋分の日
  const sports = nthMonday(year, 10, 2); // スポーツの日
  add(sports.month, sports.day);
  add(11, 3); // 文化の日
  add(11, 23); // 勤労感謝の日

  // 振替休日: when a holiday falls on Sunday, the next non-holiday day is a holiday
  const sorted = Array.from(set).sort();
  for (const dateStr of sorted) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getDay() === 0) { // Sunday
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      while (set.has(formatDateKey(next.getFullYear(), next.getMonth() + 1, next.getDate()))) {
        next.setDate(next.getDate() + 1);
      }
      set.add(formatDateKey(next.getFullYear(), next.getMonth() + 1, next.getDate()));
    }
  }

  // 国民の休日: a single day between two holidays becomes a holiday
  const cursor = new Date(year, 0, 2);
  const end = new Date(year, 11, 30);
  const extra = new Set<string>();

  while (cursor <= end) {
    const currentKey = formatDateKey(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate());
    const prevDate = new Date(cursor);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevKey = formatDateKey(prevDate.getFullYear(), prevDate.getMonth() + 1, prevDate.getDate());
    const nextDate = new Date(cursor);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextKey = formatDateKey(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());

    if (!set.has(currentKey) && set.has(prevKey) && set.has(nextKey)) {
      extra.add(currentKey);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const k of extra) {
    set.add(k);
  }

  CACHE.set(year, set);
  return set;
}

export function isJapaneseHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const key = formatDateKey(y, date.getMonth() + 1, date.getDate());
  return getJapaneseHolidays(y).has(key);
}
