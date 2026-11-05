import { AlarmEntry, MODE_ONCE, MODE_DAILY, MODE_WEEKLY, MODE_DATE, MODE_PERDAY, SOUND_DEFAULT, SOUND_SILENT, SOUND_CUSTOM, SOUND_VOICE } from '../types/alarm';
import { isJapaneseHoliday } from './holidays';

/**
 * Computes the next timestamp (in ms) when an alarm should fire.
 * Returns 0 if it won't fire in the future.
 */
export function nextTrigger(entry: AlarmEntry, nowMillis: number = Date.now()): number {
  const now = new Date(nowMillis);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (entry.mode === MODE_DATE) {
    if (!entry.year || !entry.month || !entry.day) return 0;
    const candidate = new Date(entry.year, entry.month - 1, entry.day, entry.hour, entry.minute, 0, 0);
    if (candidate.getTime() <= now.getTime()) return 0;
    if (entry.skipHolidays && isJapaneseHoliday(candidate)) return 0;
    return candidate.getTime();
  }

  if (entry.mode === MODE_PERDAY) {
    for (let i = 0; i <= 400; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      const jsDay = day.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;

      const h = entry.perDayHour[idx];
      const m = entry.perDayMinute[idx];
      if (h < 0) continue;

      const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
      if (candidate.getTime() <= now.getTime()) continue;
      if (entry.skipHolidays && isJapaneseHoliday(day)) continue;

      return candidate.getTime();
    }
    return 0;
  }

  // MODE_ONCE, MODE_DAILY, MODE_WEEKLY
  for (let i = 0; i <= 400; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);

    const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), entry.hour, entry.minute, 0, 0);
    if (candidate.getTime() <= now.getTime()) continue;

    if (entry.mode === MODE_WEEKLY) {
      const jsDay = day.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 6=Sun
      const bit = 1 << idx;
      if ((entry.days & bit) === 0) continue;
    }

    if (entry.skipHolidays && isJapaneseHoliday(day)) continue;

    return candidate.getTime();
  }

  return 0;
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function timeText(entry: AlarmEntry): string {
  return formatTime(entry.hour, entry.minute);
}

export function timeTextFor(entry: AlarmEntry, date: Date = new Date()): string {
  if (entry.mode === MODE_PERDAY) {
    const jsDay = date.getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    if (entry.perDayHour[idx] >= 0) {
      return formatTime(entry.perDayHour[idx], entry.perDayMinute[idx]);
    }
  }
  return timeText(entry);
}

export function daySummary(entry: AlarmEntry): string {
  if (entry.mode === MODE_ONCE) return '1回だけ';
  if (entry.mode === MODE_DATE) {
    if (!entry.year) return '日付が未設定';
    return `${entry.year}/${String(entry.month).padStart(2, '0')}/${String(entry.day).padStart(2, '0')} のみ`;
  }
  if (entry.mode === MODE_PERDAY) return perDaySummary(entry);
  if (entry.mode === MODE_DAILY) return entry.skipHolidays ? '毎日（祝日を除く）' : '毎日';

  const names = ['月', '火', '水', '木', '金', '土', '日'];
  let sb = '';
  for (let i = 0; i < 7; i++) {
    if ((entry.days & (1 << i)) !== 0) sb += names[i];
  }
  const base = sb + '曜';
  return entry.skipHolidays ? `${base}（祝日を除く）` : base;
}

function perDaySummary(entry: AlarmEntry): string {
  const names = ['月', '火', '水', '木', '金', '土', '日'];
  const parts: string[] = [];
  const used = new Array(7).fill(false);

  for (let i = 0; i < 7; i++) {
    if (entry.perDayHour[i] < 0 || used[i]) continue;
    let daysStr = '';
    for (let j = i; j < 7; j++) {
      if (entry.perDayHour[j] === entry.perDayHour[i] && entry.perDayMinute[j] === entry.perDayMinute[i]) {
        daysStr += names[j];
        used[j] = true;
      }
    }
    parts.push(`${daysStr} ${formatTime(entry.perDayHour[i], entry.perDayMinute[i])}`);
  }

  if (parts.length === 0) return '曜日ごとの時刻（未設定）';
  return parts.join('・');
}

export function soundSummary(entry: AlarmEntry): string {
  switch (entry.soundMode) {
    case SOUND_SILENT:
      return '無音';
    case SOUND_CUSTOM:
      return entry.soundUri ? '通知音' : '通知音（未選択）';
    case SOUND_VOICE:
      return '読み上げ';
    default:
      return '標準の通知音';
  }
}

export function formatNextDate(millis: number): string {
  if (millis <= 0) return '未定';
  const d = new Date(millis);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${h}:${min}`;
}
