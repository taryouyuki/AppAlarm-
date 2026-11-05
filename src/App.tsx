import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlarmEntry,
  AppSettingsData,
  InstalledApp,
  THEME_DARK,
  THEME_LIGHT,
} from './types/alarm';
import {
  loadAlarms,
  upsertAlarm,
  deleteAlarm,
  loadSettings,
  saveSettings,
  loadApps,
  addCustomApp,
  recordHistory,
} from './utils/storage';
import { nextTrigger, formatNextDate, timeTextFor } from './utils/nextTime';
import { Header } from './components/Header';
import { AlarmItem } from './components/AlarmItem';
import { EditModal } from './components/EditModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { WakeAlarmModal } from './components/WakeAlarmModal';
import { NotificationToast } from './components/NotificationToast';
import { WidgetCard } from './components/WidgetCard';
import { Plus, Clock } from 'lucide-react';

export const App: React.FC = () => {
  const [alarms, setAlarms] = useState<AlarmEntry[]>(() => loadAlarms());
  const [settings, setSettings] = useState<AppSettingsData>(() => loadSettings());
  const [apps, setApps] = useState<InstalledApp[]>(() => loadApps());
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const [editingAlarm, setEditingAlarm] = useState<AlarmEntry | null | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWidget, setShowWidget] = useState(true);

  const [activeAlarm, setActiveAlarm] = useState<{
    entry: AlarmEntry;
    mode: 'wake' | 'toast';
    snoozesUsed: number;
  } | null>(null);

  const [snoozeQueue, setSnoozeQueue] = useState<
    Array<{ id: number; triggerAt: number; snoozesUsed: number }>
  >([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.themeMode === THEME_DARK ||
      (settings.themeMode !== THEME_LIGHT &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.themeMode]);

  const allGroups = useMemo(() => {
    const set = new Set<string>();
    alarms.forEach((a) => {
      if (a.group && a.group.trim()) set.add(a.group.trim());
    });
    return Array.from(set);
  }, [alarms]);

  const filteredAlarms = useMemo(() => {
    if (!selectedGroup) return alarms;
    return alarms.filter((a) => a.group === selectedGroup);
  }, [alarms, selectedGroup]);

  const nextAlarmInfo = useMemo(() => {
    let earliest: { entry: AlarmEntry; at: number } | null = null;
    const now = Date.now();

    for (const a of alarms) {
      if (!a.enabled) continue;
      const at = nextTrigger(a, now);
      if (at > now) {
        if (!earliest || at < earliest.at) {
          earliest = { entry: a, at };
        }
      }
    }
    return earliest;
  }, [alarms]);

  const handleOpenTarget = useCallback((entry: AlarmEntry) => {
    const foundApp = apps.find((a) => a.pkg === entry.pkg);
    const targetUrl = foundApp?.launchUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast(`「${entry.label}」を起動しました`);
    }
  }, [apps, showToast]);

  const fireAlarm = useCallback((entry: AlarmEntry, snoozesUsed: number = 0) => {
    if (entry.alarmMode) {
      setActiveAlarm({ entry, mode: 'wake', snoozesUsed });
    } else if (entry.autoOpen) {
      recordHistory(entry.label, 'auto');
      handleOpenTarget(entry);
      showToast(`自動起動: 「${entry.label}」を開きました`);
    } else {
      recordHistory(entry.label, 'notify');
      setActiveAlarm({ entry, mode: 'toast', snoozesUsed });
    }
  }, [handleOpenTarget, showToast]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const nowSecond = Math.floor(now / 1000);

      setSnoozeQueue((prevQueue) => {
        const remaining: typeof prevQueue = [];
        for (const s of prevQueue) {
          if (Math.floor(s.triggerAt / 1000) <= nowSecond) {
            const entry = alarms.find((a) => a.id === s.id);
            if (entry) {
              fireAlarm(entry, s.snoozesUsed);
            }
          } else {
            remaining.push(s);
          }
        }
        return remaining;
      });

      for (const entry of alarms) {
        if (!entry.enabled) continue;
        const triggerTime = nextTrigger(entry, now - 1000);
        if (triggerTime > 0 && Math.floor(triggerTime / 1000) === nowSecond) {
          fireAlarm(entry, 0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, fireAlarm]);

  const handleToggle = (entry: AlarmEntry, enabled: boolean) => {
    const updated = { ...entry, enabled };
    const nextList = upsertAlarm(updated);
    setAlarms(nextList);

    if (enabled) {
      const at = nextTrigger(updated, Date.now());
      if (at > 0) {
        showToast(`次回 ${formatNextDate(at)}`);
      } else {
        showToast('保存しました（次回予定は未定）');
      }
    }
  };

  const handleSaveAlarm = (entry: AlarmEntry) => {
    const nextList = upsertAlarm(entry);
    setAlarms(nextList);
    setEditingAlarm(undefined);

    const at = nextTrigger(entry, Date.now());
    if (at > 0) {
      showToast(`次回 ${formatNextDate(at)}`);
    } else {
      showToast('保存しました');
    }
  };

  const handleDeleteAlarm = (id: number) => {
    const nextList = deleteAlarm(id);
    setAlarms(nextList);
    showToast('アラームを削除しました');
  };

  const handleTestAlarm = (entry: AlarmEntry) => {
    fireAlarm(entry, 0);
  };

  const handleSnoozeRequest = (entry: AlarmEntry, currentSnoozes: number) => {
    const minutes = entry.snoozeMinutes > 0 ? entry.snoozeMinutes : settings.snoozeMinutes;
    const triggerAt = Date.now() + minutes * 60 * 1000;
    recordHistory(entry.label, 'snooze');

    setSnoozeQueue((prev) => [
      ...prev.filter((s) => s.id !== entry.id),
      { id: entry.id, triggerAt, snoozesUsed: currentSnoozes + 1 },
    ]);

    setActiveAlarm(null);
    showToast(`${minutes}分後に再通知します`);
  };

  const handleStopAlarm = (entry: AlarmEntry) => {
    recordHistory(entry.label, 'stop');
    setActiveAlarm(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center p-3 sm:p-6 transition-colors">
      <div className="w-full max-w-lg mx-auto flex flex-col min-h-[92vh]">
        <Header
          onOpenHistory={() => setShowHistory(true)}
          onOpenSettings={() => setShowSettings(true)}
          onToggleWidget={() => setShowWidget((v) => !v)}
          showWidget={showWidget}
          nextAlarmSummary={
            nextAlarmInfo ? `${formatNextDate(nextAlarmInfo.at)} (${nextAlarmInfo.entry.label})` : undefined
          }
        />

        {showWidget && (
          <WidgetCard
            nextAlarm={nextAlarmInfo}
            onOpenApp={(entry) => handleOpenTarget(entry)}
            onEditAlarm={(entry) => setEditingAlarm(entry)}
            onClose={() => setShowWidget(false)}
          />
        )}

        {allGroups.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2.5 mb-2 shrink-0 scrollbar-none">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGroup === null
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              すべて
            </button>
            {allGroups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGroup === g
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 space-y-2">
          {filteredAlarms.length > 0 ? (
            filteredAlarms.map((entry) => (
              <AlarmItem
                key={entry.id}
                entry={entry}
                onToggle={handleToggle}
                onEdit={(e) => setEditingAlarm(e)}
                onDelete={(e) => {
                  if (confirm(`${e.label}（${timeTextFor(e)}）のアラームを削除しますか？`)) {
                    handleDeleteAlarm(e.id);
                  }
                }}
                onTest={handleTestAlarm}
              />
            ))
          ) : (
            <div className="py-14 px-4 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                まだアラームがありません
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                下のボタンから追加してください
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-4 pt-3 mt-4 shrink-0">
          <button
            onClick={() => setEditingAlarm(null)}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>アラームを追加</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-80 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white text-xs font-semibold shadow-xl border border-slate-700/60 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {editingAlarm !== undefined && (
        <EditModal
          initialEntry={editingAlarm}
          apps={apps}
          allGroups={allGroups}
          settings={settings}
          onSave={handleSaveAlarm}
          onDelete={editingAlarm ? (id) => handleDeleteAlarm(id) : undefined}
          onClose={() => setEditingAlarm(undefined)}
          onTest={handleTestAlarm}
          onAddCustomApp={(newApp) => {
            const nextApps = addCustomApp(newApp);
            setApps(nextApps);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            saveSettings(newSettings);
          }}
          onOpenHistory={() => {
            setShowSettings(false);
            setShowHistory(true);
          }}
          onClose={() => setShowSettings(false)}
          onReloadAlarms={() => setAlarms(loadAlarms())}
        />
      )}

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}

      {activeAlarm && activeAlarm.mode === 'wake' && (
        <WakeAlarmModal
          entry={activeAlarm.entry}
          settings={settings}
          snoozesUsed={activeAlarm.snoozesUsed}
          onStop={() => handleStopAlarm(activeAlarm.entry)}
          onSnooze={() => handleSnoozeRequest(activeAlarm.entry, activeAlarm.snoozesUsed)}
          onOpenTarget={() => handleOpenTarget(activeAlarm.entry)}
        />
      )}

      {activeAlarm && activeAlarm.mode === 'toast' && (
        <NotificationToast
          entry={activeAlarm.entry}
          settings={settings}
          snoozesUsed={activeAlarm.snoozesUsed}
          onOpen={() => {
            recordHistory(activeAlarm.entry.label, 'notify');
            handleOpenTarget(activeAlarm.entry);
            setActiveAlarm(null);
          }}
          onSnooze={() => handleSnoozeRequest(activeAlarm.entry, activeAlarm.snoozesUsed)}
          onDismiss={() => setActiveAlarm(null)}
        />
      )}
    </div>
  );
};
