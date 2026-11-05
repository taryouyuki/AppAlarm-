import React, { useState, useEffect } from 'react';
import { Bell, History, Settings, BellRing, Smartphone } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onToggleWidget: () => void;
  showWidget: boolean;
  nextAlarmSummary?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenSettings,
  onToggleWidget,
  showWidget,
  nextAlarmSummary,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
    }
  };

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="inline-block p-1 bg-blue-600 rounded-lg text-white shadow-sm">
              <Bell className="w-5 h-5" />
            </span>
            アプリ起動アラーム
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            指定した時刻に、アプリを開くか通知で確認します
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleWidget}
            title="ウィジェット表示切替"
            className={`p-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
              showWidget
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">ウィジェット</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1"
          >
            <History className="w-4 h-4" />
            履歴
          </button>

          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1"
          >
            <Settings className="w-4 h-4" />
            設定
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>現在時刻: <strong className="text-slate-800 dark:text-slate-200">{currentTime}</strong></span>
        </div>

        {nextAlarmSummary && (
          <div className="text-blue-600 dark:text-blue-400 font-medium truncate max-w-[240px]">
            次回: {nextAlarmSummary}
          </div>
        )}

        {notificationPermission === 'default' && (
          <button
            onClick={requestPermission}
            className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 px-2 py-0.5 rounded-md font-medium"
          >
            <BellRing className="w-3.5 h-3.5" />
            通知を許可する
          </button>
        )}
      </div>
    </header>
  );
};
