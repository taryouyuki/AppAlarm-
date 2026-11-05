import React, { useEffect, useState } from 'react';
import { AlarmEntry, AppSettingsData } from '../types/alarm';
import { timeTextFor } from '../utils/nextTime';
import { soundEngine } from '../utils/audio';
import { Bell, Volume2, ExternalLink } from 'lucide-react';

interface WakeAlarmModalProps {
  entry: AlarmEntry;
  settings: AppSettingsData;
  snoozesUsed: number;
  onStop: () => void;
  onSnooze: () => void;
  onOpenTarget: () => void;
}

export const WakeAlarmModal: React.FC<WakeAlarmModalProps> = ({
  entry,
  settings,
  snoozesUsed,
  onStop,
  onSnooze,
  onOpenTarget,
}) => {
  const [currentTime, setCurrentTime] = useState<string>(timeTextFor(entry));
  const [fadeVolume, setFadeVolume] = useState<number>(settings.fadeEnabled ? 0.1 : 1.0);

  const snoozeMinutes = entry.snoozeMinutes > 0 ? entry.snoozeMinutes : settings.snoozeMinutes;
  const maxSnooze = entry.maxSnooze !== -1 ? entry.maxSnooze : settings.maxSnooze;
  const canSnooze = maxSnooze !== -2 && (maxSnooze <= 0 || snoozesUsed < maxSnooze);

  useEffect(() => {
    const soundId = entry.alarmSoundUri || 'classic_alarm';
    const fadeSeconds = settings.fadeEnabled ? settings.fadeSeconds : 0;
    soundEngine.playSound(soundId, true, fadeSeconds);
    soundEngine.vibrate([500, 300, 500, 300, 1000]);

    if (settings.fadeEnabled) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(1.0, 0.1 + 0.9 * (elapsed / settings.fadeSeconds));
        setFadeVolume(progress);
        if (progress >= 1.0) clearInterval(interval);
      }, 500);
      return () => {
        clearInterval(interval);
        soundEngine.stopSound();
      };
    }

    return () => {
      soundEngine.stopSound();
    };
  }, [entry, settings]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStopAndOpen = () => {
    soundEngine.stopSound();
    onStop();
    onOpenTarget();
  };

  const handleSnooze = () => {
    soundEngine.stopSound();
    onSnooze();
  };

  return (
    <div className="fixed inset-0 z-100 bg-[#121722] text-white flex flex-col items-center justify-between p-6 sm:p-12 animate-in fade-in duration-300">
      <div className="w-full flex items-center justify-between text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg animate-pulse">
            <Bell className="w-4 h-4" />
          </span>
          <span className="font-semibold text-rose-400 tracking-wide text-xs uppercase">
            アラーム鳴動中
          </span>
        </div>

        {settings.fadeEnabled && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Volume2 className="w-4 h-4 animate-bounce" />
            <span>音量フェードイン: {Math.round(fadeVolume * 100)}%</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center my-auto space-y-4 max-w-md w-full text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl shadow-2xl relative z-10">
            {entry.icon || '📱'}
          </div>
          <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-xl animate-pulse"></div>
        </div>

        <div className="font-mono text-7xl sm:text-8xl font-black tracking-tight text-white select-none drop-shadow-md">
          {currentTime}
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-100">
            「{entry.label}」を開きますか？
          </h2>
          <p className="text-sm text-slate-400">指定した予定時刻になりました</p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3 pb-4">
        <button
          onClick={handleStopAndOpen}
          className="w-full py-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xl shadow-xl hover:shadow-2xl active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>停止</span>
          <ExternalLink className="w-5 h-5 text-slate-600" />
        </button>

        {canSnooze && (
          <button
            onClick={handleSnooze}
            className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-base border border-slate-700 active:scale-[0.99] transition-all"
          >
            スヌーズ（{snoozeMinutes}分後）
          </button>
        )}

        <p className="text-center text-xs text-slate-500 pt-1">
          停止すると対象アプリを開きます
        </p>
      </div>
    </div>
  );
};
