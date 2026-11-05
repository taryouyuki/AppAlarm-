import { AlarmEntry, AppSettingsData, HistoryRecord, InstalledApp, MODE_DAILY, MODE_WEEKLY, SOUND_DEFAULT, THEME_SYSTEM } from '../types/alarm';

const STORAGE_KEY_ALARMS = 'appalarm_items';
const STORAGE_KEY_SETTINGS = 'appalarm_settings';
const STORAGE_KEY_HISTORY = 'appalarm_history';

export const DEFAULT_SETTINGS: AppSettingsData = {
  snoozeMinutes: 5,
  maxSnooze: 3,
  themeMode: THEME_SYSTEM,
  useDynamicColor: true,
  fadeEnabled: true,
  fadeSeconds: 10,
  historyEnabled: true,
};

export const DEFAULT_INSTALLED_APPS: InstalledApp[] = [
  { pkg: 'com.google.android.youtube', label: 'YouTube', icon: '📺', color: '#EF4444', launchUrl: 'https://www.youtube.com' },
  { pkg: 'jp.naver.line.android', label: 'LINE', icon: '💬', color: '#10B981', launchUrl: 'https://line.me' },
  { pkg: 'com.twitter.android', label: 'X (旧Twitter)', icon: '✖️', color: '#0F172A', launchUrl: 'https://x.com' },
  { pkg: 'com.google.android.apps.maps', label: 'Google マップ', icon: '🗺️', color: '#3B82F6', launchUrl: 'https://maps.google.com' },
  { pkg: 'com.google.android.gm', label: 'Gmail', icon: '✉️', color: '#EA4335', launchUrl: 'https://mail.google.com' },
  { pkg: 'com.spotify.music', label: 'Spotify', icon: '🎵', color: '#22C55E', launchUrl: 'https://open.spotify.com' },
  { pkg: 'com.google.android.calendar', label: 'Google カレンダー', icon: '📅', color: '#2563EB', launchUrl: 'https://calendar.google.com' },
  { pkg: 'com.slack', label: 'Slack', icon: '💼', color: '#6366F1', launchUrl: 'https://slack.com' },
  { pkg: 'com.apple.weather', label: '天気予報', icon: '☀️', color: '#F59E0B', launchUrl: 'https://weathernews.jp' },
  { pkg: 'com.android.calculator2', label: '電卓', icon: '🔢', color: '#64748B' },
  { pkg: 'com.android.camera', label: 'カメラ', icon: '📷', color: '#475569' },
  { pkg: 'com.google.android.keep', label: 'Google Keep', icon: '📝', color: '#EAB308', launchUrl: 'https://keep.google.com' },
];

export const INITIAL_ALARMS: AlarmEntry[] = [
  {
    id: 1700000001,
    hour: 7,
    minute: 0,
    pkg: 'com.google.android.youtube',
    label: 'YouTube',
    icon: '📺',
    mode: MODE_WEEKLY,
    days: 0b0011111, // Mon-Fri
    skipHolidays: true,
    enabled: true,
    autoOpen: false,
    alarmMode: true,
    group: '朝の習慣',
    alarmSoundUri: 'gentle_chime',
    snoozeMinutes: 5,
    maxSnooze: 3,
    soundMode: SOUND_DEFAULT,
    soundUri: 'gentle_chime',
    voiceText: 'おはようございます。YouTubeを開く時間です。',
    perDayHour: [-1, -1, -1, -1, -1, -1, -1],
    perDayMinute: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 1700000002,
    hour: 8,
    minute: 45,
    pkg: 'com.google.android.calendar',
    label: 'Google カレンダー',
    icon: '📅',
    mode: MODE_DAILY,
    days: 0x7f,
    skipHolidays: true,
    enabled: true,
    autoOpen: true,
    alarmMode: false,
    group: '仕事',
    alarmSoundUri: '',
    snoozeMinutes: 10,
    maxSnooze: 2,
    soundMode: SOUND_DEFAULT,
    soundUri: '',
    voiceText: '今日のスケジュールを確認しましょう。',
    perDayHour: [-1, -1, -1, -1, -1, -1, -1],
    perDayMinute: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 1700000003,
    hour: 22,
    minute: 30,
    pkg: 'com.spotify.music',
    label: 'Spotify',
    icon: '🎵',
    mode: MODE_DAILY,
    days: 0x7f,
    skipHolidays: false,
    enabled: false,
    autoOpen: false,
    alarmMode: false,
    group: '',
    alarmSoundUri: '',
    snoozeMinutes: -1,
    maxSnooze: -1,
    soundMode: 3, // voice
    soundUri: '',
    voiceText: '寝る前のリラックス音楽を再生する時間です。',
    perDayHour: [-1, -1, -1, -1, -1, -1, -1],
    perDayMinute: [0, 0, 0, 0, 0, 0, 0],
  },
];

// --- Alarms ---
export function loadAlarms(): AlarmEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALARMS);
    if (!raw) {
      saveAlarms(INITIAL_ALARMS);
      return INITIAL_ALARMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_ALARMS;
    return parsed.sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour;
      return a.minute - b.minute;
    });
  } catch {
    return INITIAL_ALARMS;
  }
}

export function saveAlarms(items: AlarmEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ALARMS, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function upsertAlarm(entry: AlarmEntry): AlarmEntry[] {
  const items = loadAlarms();
  const idx = items.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    items[idx] = entry;
  } else {
    items.push(entry);
  }
  items.sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    return a.minute - b.minute;
  });
  saveAlarms(items);
  return items;
}

export function deleteAlarm(id: number): AlarmEntry[] {
  const items = loadAlarms().filter((e) => e.id !== id);
  saveAlarms(items);
  return items;
}

export function exportAlarmsJson(): string {
  const items = loadAlarms();
  return JSON.stringify(items, null, 2);
}

export function importAlarmsJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return false;
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) return false;
      if (typeof item.id !== 'number' || typeof item.hour !== 'number') return false;
    }
    saveAlarms(parsed);
    return true;
  } catch {
    return false;
  }
}

// --- Settings ---
export function loadSettings(): AppSettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettingsData): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// --- History ---
export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordHistory(label: string, action: HistoryRecord['action']): void {
  const settings = loadSettings();
  if (!settings.historyEnabled) return;
  try {
    const list = loadHistory();
    list.unshift({
      time: Date.now(),
      label: label || 'アラーム',
      action,
    });
    if (list.length > 300) list.length = 300;
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch {
    // ignore
  }
}

export function getHistoryCounts(): { stop: number; snooze: number; auto: number; notify: number } {
  const list = loadHistory();
  let stop = 0;
  let snooze = 0;
  let auto = 0;
  let notify = 0;
  for (const r of list) {
    if (r.action === 'stop') stop++;
    else if (r.action === 'snooze') snooze++;
    else if (r.action === 'auto') auto++;
    else notify++;
  }
  return { stop, snooze, auto, notify };
}

// --- Installed Apps ---
export function loadApps(): InstalledApp[] {
  try {
    const raw = localStorage.getItem('appalarm_installed_apps');
    if (!raw) return DEFAULT_INSTALLED_APPS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_INSTALLED_APPS;
  }
}

export function addCustomApp(app: InstalledApp): InstalledApp[] {
  const list = loadApps();
  list.push(app);
  try {
    localStorage.setItem('appalarm_installed_apps', JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}
