import React, { useEffect } from 'react';
import { AlarmEntry, AppSettingsData } from '../types/alarm';
import { timeTextFor } from '../utils/nextTime';
import { soundEngine } from '../utils/audio';
import { Bell, ExternalLink, RefreshCw, X } from 'lucide-react';

interface NotificationToastProps {
  entry: AlarmEntry;
  settings: AppSettingsData;
  snoozesUsed: number;
  onOpen: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  entry,
  settings,
  snoozesUsed,
  onOpen,
  onSnooze,
  onDismiss,
}) => {
  const snoozeMinutes = entry.snoozeMinutes > 0 ? entry.snoozeMinutes : settings.snoozeMinutes;
  const maxSnooze = entry.maxSnooze !== -1 ? entry.maxSnooze : settings.maxSnooze;
  const canSnooze = maxSnooze !== -2 && (maxSnooze <= 0 || snoozesUsed < maxSnooze);

  useEffect(() => {
    if (entry.soundMode === 3) {
      soundEngine.speak(entry.voiceText || 'アプリを開く時間です');
    } else if (entry.soundMode !== 1) {
      const soundId = entry.soundMode === 2 && entry.soundUri ? entry.soundUri : 'short_pop';
      soundEngine.playSound(soundId, false, 0);
    }
    soundEngine.vibrate([200, 100, 200]);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`「${entry.label}」を開きますか？`, {
          body: `${timeTextFor(entry)} のアラーム`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: `appalarm-${entry.id}`,
          requireInteraction: true,
        });
        notif.onclick = () => {
          window.focus();
          onOpen();
          notif.close();
        };
      } catch {
        // ignore
      }
    }
  }, [entry, onOpen]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-90 w-full max-w-md px-4 animate-in slide-in-from-top duration-300">
      <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xl shrink-0">
              {entry.icon || '📱'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5" />
                アプリ起動アラーム
              </div>
              <h4 className="font-bold text-sm text-slate-100 truncate">
                「{entry.label}」を開きますか？
              </h4>
              <p className="text-xs text-slate-400">
                {timeTextFor(entry)} のアラーム
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={onOpen}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            開く
          </button>

          {canSnooze ? (
            <button
              onClick={onSnooze}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              {snoozeMinutes}分後に再通知
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 px-2 py-1">
              {maxSnooze === -2 ? '再通知はオフ' : '再通知の上限到達'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
