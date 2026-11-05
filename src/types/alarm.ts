export const MODE_ONCE = 0;
export const MODE_DAILY = 1;
export const MODE_WEEKLY = 2;
export const MODE_DATE = 3;
export const MODE_PERDAY = 4;

export const SOUND_DEFAULT = 0;
export const SOUND_SILENT = 1;
export const SOUND_CUSTOM = 2;
export const SOUND_VOICE = 3;

export const THEME_SYSTEM = 0;
export const THEME_LIGHT = 1;
export const THEME_DARK = 2;

export const SNOOZE_UNLIMITED = 0;
export const SNOOZE_NONE = -2;

export interface AlarmEntry {
  id: number;
  hour: number;
  minute: number;
  pkg: string;
  label: string;
  icon?: string;
  mode: number;
  days: number; // bit 0 = Mon ... bit 6 = Sun
  skipHolidays: boolean;
  enabled: boolean;
  autoOpen: boolean;
  year?: number;
  month?: number;
  day?: number;
  perDayHour: number[]; // 7 elements, -1 = no alarm
  perDayMinute: number[]; // 7 elements
  alarmMode: boolean;
  group: string;
  alarmSoundUri: string;
  snoozeMinutes: number; // -1 = follow app setting
  maxSnooze: number; // -1 = follow app setting
  soundMode: number;
  soundUri: string;
  voiceText: string;
}

export interface AppSettingsData {
  snoozeMinutes: number;
  maxSnooze: number;
  themeMode: number;
  useDynamicColor: boolean;
  fadeEnabled: boolean;
  fadeSeconds: number;
  historyEnabled: boolean;
}

export type HistoryAction = 'stop' | 'snooze' | 'auto' | 'notify';

export interface HistoryRecord {
  time: number;
  label: string;
  action: HistoryAction;
}

export interface InstalledApp {
  pkg: string;
  label: string;
  icon: string;
  color: string;
  launchUrl?: string;
}
