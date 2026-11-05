import React, { useState } from 'react';
import {
  AlarmEntry,
  AppSettingsData,
  InstalledApp,
  MODE_ONCE,
  MODE_DAILY,
  MODE_WEEKLY,
  MODE_DATE,
  MODE_PERDAY,
  SOUND_DEFAULT,
  SOUND_SILENT,
  SOUND_CUSTOM,
  SOUND_VOICE,
  SNOOZE_NONE,
  SNOOZE_UNLIMITED,
} from '../types/alarm';
import { soundEngine, AVAILABLE_SOUNDS } from '../utils/audio';
import { ChevronDown, ChevronUp, Play, Square, Volume2, X, Plus, Check, Clock } from 'lucide-react';

interface EditModalProps {
  initialEntry: AlarmEntry | null;
  apps: InstalledApp[];
  allGroups: string[];
  settings: AppSettingsData;
  onSave: (entry: AlarmEntry) => void;
  onDelete?: (id: number) => void;
  onClose: () => void;
  onTest: (entry: AlarmEntry) => void;
  onAddCustomApp: (app: InstalledApp) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  initialEntry,
  apps,
  allGroups,
  settings,
  onSave,
  onDelete,
  onClose,
  onTest,
  onAddCustomApp,
}) => {
  const isNew = !initialEntry;

  const [entry, setEntry] = useState<AlarmEntry>(() => {
    if (initialEntry) {
      return { ...initialEntry };
    }
    return {
      id: Date.now(),
      hour: 7,
      minute: 0,
      pkg: apps[0]?.pkg || 'com.google.android.youtube',
      label: apps[0]?.label || 'YouTube',
      icon: apps[0]?.icon || '📺',
      mode: MODE_DAILY,
      days: 0x7f,
      skipHolidays: false,
      enabled: true,
      autoOpen: false,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      perDayHour: [-1, -1, -1, -1, -1, -1, -1],
      perDayMinute: [0, 0, 0, 0, 0, 0, 0],
      alarmMode: false,
      group: '',
      alarmSoundUri: 'classic_alarm',
      snoozeMinutes: -1,
      maxSnooze: -1,
      soundMode: SOUND_DEFAULT,
      soundUri: 'gentle_chime',
      voiceText: 'アプリを開く時間です',
    };
  });

  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    repeat: false,
    sound: false,
    behavior: false,
    snooze: false,
  });

  const [showAppPicker, setShowAppPicker] = useState(false);
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [customAppName, setCustomAppName] = useState('');
  const [customAppUrl, setCustomAppUrl] = useState('');
  const [customAppIcon, setCustomAppIcon] = useState('📱');
  const [showCustomAppForm, setShowCustomAppForm] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDay = (dayIndex: number) => {
    const bit = 1 << dayIndex;
    const newDays = (entry.days & bit) !== 0 ? entry.days & ~bit : entry.days | bit;
    setEntry({ ...entry, days: newDays });
  };

  const getRepeatSummary = () => {
    if (entry.mode === MODE_ONCE) return '1回だけ';
    if (entry.mode === MODE_DATE) {
      return `${entry.year}/${String(entry.month).padStart(2, '0')}/${String(entry.day).padStart(2, '0')} のみ`;
    }
    if (entry.mode === MODE_PERDAY) return '曜日ごとの時刻設定';
    if (entry.mode === MODE_DAILY) return entry.skipHolidays ? '毎日（祝日を除く）' : '毎日';
    const names = ['月', '火', '水', '木', '金', '土', '日'];
    let str = '';
    for (let i = 0; i < 7; i++) {
      if ((entry.days & (1 << i)) !== 0) str += names[i];
    }
    return (str ? str + '曜' : 'なし') + (entry.skipHolidays ? '（祝日を除く）' : '');
  };

  const getSoundSummary = () => {
    switch (entry.soundMode) {
      case SOUND_SILENT:
        return '無音';
      case SOUND_CUSTOM:
        return entry.soundUri
          ? AVAILABLE_SOUNDS.find((s) => s.id === entry.soundUri)?.name || 'カスタム音'
          : '通知音';
      case SOUND_VOICE:
        return '音声で読み上げ';
      default:
        return '標準の通知音';
    }
  };

  const getBehaviorSummary = () => {
    const parts = [entry.autoOpen ? '自動で開く' : '確認して開く'];
    if (entry.alarmMode) parts.push('アラーム');
    return parts.join(' ・ ');
  };

  const getSnoozeSummary = () => {
    const min = entry.snoozeMinutes > 0 ? entry.snoozeMinutes : settings.snoozeMinutes;
    let limitStr = '3回まで';
    const limit = entry.maxSnooze !== -1 ? entry.maxSnooze : settings.maxSnooze;
    if (limit === SNOOZE_NONE) limitStr = '再通知しない';
    else if (limit === SNOOZE_UNLIMITED) limitStr = '上限なし';
    else limitStr = `${limit}回まで`;

    const isInherited = entry.snoozeMinutes === -1 && entry.maxSnooze === -1;
    return `${min}分 ・ ${limitStr}${isInherited ? '（アプリ設定に準拠）' : ''}`;
  };

  const handleTestPreview = (soundId: string) => {
    if (isPlayingAudio) {
      soundEngine.stopSound();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      soundEngine.playSound(soundId, false, 0, () => setIsPlayingAudio(false));
    }
  };

  const handleTtsPreview = () => {
    soundEngine.speak(entry.voiceText || 'アプリを開く時間です');
  };

  const handleCreateCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAppName.trim()) return;
    const newApp: InstalledApp = {
      pkg: `user.custom.${Date.now()}`,
      label: customAppName.trim(),
      icon: customAppIcon || '📱',
      color: '#3B82F6',
      launchUrl: customAppUrl.trim() || undefined,
    };
    onAddCustomApp(newApp);
    setEntry((prev) => ({
      ...prev,
      pkg: newApp.pkg,
      label: newApp.label,
      icon: newApp.icon,
    }));
    setShowCustomAppForm(false);
    setShowAppPicker(false);
    setCustomAppName('');
    setCustomAppUrl('');
  };

  const handleSave = () => {
    if (!entry.pkg) {
      alert('開くアプリを選択してください');
      return;
    }
    if (entry.mode === MODE_WEEKLY && entry.days === 0) {
      alert('曜日を1つ以上選んでください');
      return;
    }
    if (entry.mode === MODE_PERDAY && entry.perDayHour.every((h) => h < 0)) {
      alert('時刻を1つ以上設定してください');
      return;
    }
    onSave(entry);
  };

  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isNew ? 'アラームを追加' : 'アラームを編集'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 text-slate-800 dark:text-slate-200 text-sm">
          {/* Time Card */}
          {entry.mode !== MODE_PERDAY && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">時刻</span>
              <div className="flex items-center justify-center space-x-4 py-2">
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={String(entry.hour).padStart(2, '0')}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                      setEntry({ ...entry, hour: val });
                    }}
                    className="w-20 text-center font-mono text-4xl sm:text-5xl font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                  <span className="text-xs text-slate-400 mt-1">時 (0-23)</span>
                </div>

                <span className="font-mono text-4xl font-bold text-slate-400">:</span>

                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={String(entry.minute).padStart(2, '0')}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                      setEntry({ ...entry, minute: val });
                    }}
                    className="w-20 text-center font-mono text-4xl sm:text-5xl font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                  <span className="text-xs text-slate-400 mt-1">分 (0-59)</span>
                </div>
              </div>
            </div>
          )}

          {/* Target App Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">開くアプリ</span>
              <button
                type="button"
                onClick={() => setShowAppPicker(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                変更
              </button>
            </div>

            <div
              onClick={() => setShowAppPicker(true)}
              className="flex items-center space-x-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                {entry.icon || '📱'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">
                  {entry.label}
                </div>
                <div className="text-xs text-slate-400 truncate">{entry.pkg}</div>
              </div>
            </div>

            {/* Group assignment */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">グループ:</span>
              <div className="flex items-center gap-1.5">
                <select
                  value={entry.group || ''}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setShowNewGroupInput(true);
                    } else {
                      setEntry({ ...entry, group: e.target.value });
                    }
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="">なし</option>
                  {allGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  <option value="__NEW__">＋ 新しいグループ…</option>
                </select>
              </div>
            </div>

            {showNewGroupInput && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="グループ名（例: 朝の習慣）"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newGroupName.trim()) {
                      setEntry({ ...entry, group: newGroupName.trim() });
                    }
                    setShowNewGroupInput(false);
                    setNewGroupName('');
                  }}
                  className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg"
                >
                  設定
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGroupInput(false)}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>

          {/* Section: Repeat */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('repeat')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">繰り返し</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{getRepeatSummary()}</div>
              </div>
              {openSections.repeat ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.repeat && (
              <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                <div className="space-y-2">
                  {[
                    { label: '1回だけ（次のその時刻）', value: MODE_ONCE },
                    { label: '毎日', value: MODE_DAILY },
                    { label: '曜日を指定', value: MODE_WEEKLY },
                    { label: '日付を指定', value: MODE_DATE },
                    { label: '曜日ごとに時刻を変える', value: MODE_PERDAY },
                  ].map((item) => (
                    <label key={item.value} className="flex items-center space-x-2.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="repeatMode"
                        checked={entry.mode === item.value}
                        onChange={() => {
                          const updated = { ...entry, mode: item.value };
                          if (item.value === MODE_PERDAY && updated.perDayHour.every((h) => h < 0)) {
                            updated.perDayHour = [
                              entry.hour,
                              entry.hour,
                              entry.hour,
                              entry.hour,
                              entry.hour,
                              entry.hour,
                              entry.hour,
                            ];
                            updated.perDayMinute = [
                              entry.minute,
                              entry.minute,
                              entry.minute,
                              entry.minute,
                              entry.minute,
                              entry.minute,
                              entry.minute,
                            ];
                          }
                          setEntry(updated);
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>

                {entry.mode === MODE_WEEKLY && (
                  <div className="pt-2">
                    <span className="text-xs text-slate-500 block mb-1.5">鳴動する曜日を選択</span>
                    <div className="grid grid-cols-7 gap-1">
                      {dayNames.map((d, idx) => {
                        const selected = (entry.days & (1 << idx)) !== 0;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDay(idx)}
                            className={`h-10 rounded-xl text-xs font-bold transition-all ${
                              selected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-750 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {entry.mode === MODE_DATE && (
                  <div className="pt-2">
                    <span className="text-xs text-slate-500 block mb-1.5">指定日</span>
                    <input
                      type="date"
                      value={`${entry.year || new Date().getFullYear()}-${String(
                        entry.month || new Date().getMonth() + 1
                      ).padStart(2, '0')}-${String(entry.day || new Date().getDate()).padStart(2, '0')}`}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        setEntry({ ...entry, year: y, month: m, day: d });
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                    />
                  </div>
                )}

                {entry.mode === MODE_PERDAY && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs text-slate-500 block">各曜日の時刻を設定（×で解除）</span>
                    {dayNames.map((d, idx) => {
                      const h = entry.perDayHour[idx];
                      const m = entry.perDayMinute[idx];
                      const isSet = h >= 0;
                      return (
                        <div
                          key={d}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <span className="font-semibold text-xs w-12">{d}曜</span>
                          <div className="flex items-center space-x-2">
                            {isSet ? (
                              <input
                                type="time"
                                value={`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`}
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  const [nh, nm] = e.target.value.split(':').map(Number);
                                  const ph = [...entry.perDayHour];
                                  const pm = [...entry.perDayMinute];
                                  ph[idx] = nh;
                                  pm[idx] = nm;
                                  setEntry({ ...entry, perDayHour: ph, perDayMinute: pm });
                                }}
                                className="font-mono text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const ph = [...entry.perDayHour];
                                  const pm = [...entry.perDayMinute];
                                  ph[idx] = 7;
                                  pm[idx] = 0;
                                  setEntry({ ...entry, perDayHour: ph, perDayMinute: pm });
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                              >
                                ＋ 設定する
                              </button>
                            )}
                            {isSet && (
                              <button
                                type="button"
                                onClick={() => {
                                  const ph = [...entry.perDayHour];
                                  ph[idx] = -1;
                                  setEntry({ ...entry, perDayHour: ph });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded-md"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={entry.skipHolidays}
                      onChange={(e) => setEntry({ ...entry, skipHolidays: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>日本の祝日はスキップする</span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-6 mt-0.5">
                    振替休日・国民の休日を含む日本の祝日を自動計算して除外します
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Notification Style */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('sound')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">通知のしかた</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{getSoundSummary()}</div>
              </div>
              {openSections.sound ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.sound && (
              <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                <div className="space-y-2">
                  {[
                    { label: '標準の通知音', value: SOUND_DEFAULT },
                    { label: '通知音なし (無音)', value: SOUND_SILENT },
                    { label: '通知音を選ぶ', value: SOUND_CUSTOM },
                    { label: '音声で読み上げ (TTS)', value: SOUND_VOICE },
                  ].map((item) => (
                    <label key={item.value} className="flex items-center space-x-2.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="soundMode"
                        checked={entry.soundMode === item.value}
                        onChange={() => setEntry({ ...entry, soundMode: item.value })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>

                {entry.soundMode === SOUND_CUSTOM && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs text-slate-500 block">通知音</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {AVAILABLE_SOUNDS.map((snd) => (
                        <div
                          key={snd.id}
                          onClick={() => setEntry({ ...entry, soundUri: snd.id })}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                            entry.soundUri === snd.id
                              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                          }`}
                        >
                          <span>{snd.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestPreview(snd.id);
                            }}
                            className="p-1 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                          >
                            {isPlayingAudio ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.soundMode === SOUND_VOICE && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs text-slate-500 block">読み上げる文章 (日本語TTS)</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={entry.voiceText}
                        onChange={(e) => setEntry({ ...entry, voiceText: e.target.value })}
                        placeholder="例: アプリを開く時間です"
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleTtsPreview}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        試聴
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Behavior */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('behavior')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">起動のしかた</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{getBehaviorSummary()}</div>
              </div>
              {openSections.behavior ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.behavior && (
              <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-3.5">
                <div>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={entry.autoOpen}
                      onChange={(e) => setEntry({ ...entry, autoOpen: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>確認せずに自動で開く</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-6.5 mt-0.5">
                    オンにすると「開きますか？」の通知を出さずに対象アプリを直接起動します
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={entry.alarmMode}
                      onChange={(e) => setEntry({ ...entry, alarmMode: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>アラームとして鳴らす（停止 / スヌーズ）</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-6.5 mt-0.5">
                    時刻になると全画面で点灯し、アラーム音が鳴ります。「停止」でアプリを起動、「スヌーズ」で後でもう一度鳴ります
                  </p>

                  {entry.alarmMode && (
                    <div className="mt-3 pl-6.5 space-y-1.5">
                      <span className="text-xs text-slate-500 block">アラーム鳴動音</span>
                      <select
                        value={entry.alarmSoundUri || 'classic_alarm'}
                        onChange={(e) => setEntry({ ...entry, alarmSoundUri: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
                      >
                        {AVAILABLE_SOUNDS.filter((s) => s.type === 'alarm' || s.type === 'both').map((snd) => (
                          <option key={snd.id} value={snd.id}>
                            {snd.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Snooze */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('snooze')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">再通知 (スヌーズ)</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{getSnoozeSummary()}</div>
              </div>
              {openSections.snooze ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.snooze && (
              <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1.5">再通知までの時間</span>
                  <select
                    value={entry.snoozeMinutes}
                    onChange={(e) => setEntry({ ...entry, snoozeMinutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                  >
                    <option value={-1}>アプリ設定に従う（現在: {settings.snoozeMinutes}分）</option>
                    <option value={5}>5分後</option>
                    <option value={10}>10分後</option>
                    <option value={15}>15分後</option>
                    <option value={30}>30分後</option>
                    <option value={60}>60分後</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1.5">再通知できる回数</span>
                  <select
                    value={entry.maxSnooze}
                    onChange={(e) => setEntry({ ...entry, maxSnooze: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                  >
                    <option value={-1}>アプリ設定に従う</option>
                    <option value={SNOOZE_UNLIMITED}>上限なし</option>
                    <option value={1}>1回まで</option>
                    <option value={2}>2回まで</option>
                    <option value={3}>3回まで</option>
                    <option value={5}>5回まで</option>
                    <option value={SNOOZE_NONE}>再通知しない</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Quick Test Button */}
          <button
            type="button"
            onClick={() => onTest(entry)}
            className="w-full py-3 px-4 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-blue-200/60 dark:border-blue-800/40"
          >
            <Clock className="w-4 h-4" />
            テスト実行（通知・アラームを今すぐ確認）
          </button>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 shrink-0 space-y-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base shadow-sm transition-colors"
          >
            {isNew ? 'この内容で追加' : '保存する'}
          </button>

          {!isNew && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`「${entry.label}」のアラームを削除しますか？`)) {
                  onDelete(entry.id);
                  onClose();
                }
              }}
              className="w-full py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold rounded-lg transition-colors"
            >
              このアラームを削除
            </button>
          )}
        </div>
      </div>

      {/* App Picker Sub-Modal */}
      {showAppPicker && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">開くアプリを選択</h3>
              <button onClick={() => setShowAppPicker(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2 overflow-y-auto space-y-1 flex-1">
              {apps.map((app) => (
                <div
                  key={app.pkg}
                  onClick={() => {
                    setEntry({
                      ...entry,
                      pkg: app.pkg,
                      label: app.label,
                      icon: app.icon,
                    });
                    setShowAppPicker(false);
                  }}
                  className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    entry.pkg === app.pkg ? 'bg-blue-50/80 dark:bg-blue-950/50 font-semibold' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                    {app.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate text-slate-900 dark:text-slate-100">{app.label}</div>
                  </div>
                  {entry.pkg === app.pkg && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              ))}
            </div>

            {!showCustomAppForm ? (
              <button
                type="button"
                onClick={() => setShowCustomAppForm(true)}
                className="mt-3 w-full py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" />
                アプリやウェブサイトを追加
              </button>
            ) : (
              <form onSubmit={handleCreateCustomApp} className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">アプリ・サービス名</label>
                  <input
                    type="text"
                    required
                    placeholder="例: Notion, GitHub"
                    value={customAppName}
                    onChange={(e) => setCustomAppName(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">起動URL（任意）</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={customAppUrl}
                    onChange={(e) => setCustomAppUrl(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">絵文字アイコン</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={customAppIcon}
                    onChange={(e) => setCustomAppIcon(e.target.value)}
                    className="w-12 text-center px-2 py-1 bg-white dark:bg-slate-900 border rounded-md text-base"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="flex-1 py-1.5 bg-blue-600 text-white rounded-md font-bold">
                    登録して選択
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomAppForm(false)}
                    className="px-2 py-1.5 text-slate-400 hover:text-slate-600"
                  >
                    戻る
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
