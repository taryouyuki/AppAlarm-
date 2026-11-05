import React from 'react';
import { AlarmEntry } from '../types/alarm';
import { daySummary, soundSummary, timeText } from '../utils/nextTime';
import { Volume2, VolumeX, Mic, Bell, Zap, Trash2, Clock } from 'lucide-react';

interface AlarmItemProps {
  entry: AlarmEntry;
  onToggle: (entry: AlarmEntry, enabled: boolean) => void;
  onEdit: (entry: AlarmEntry) => void;
  onDelete: (entry: AlarmEntry) => void;
  onTest: (entry: AlarmEntry) => void;
}

export const AlarmItem: React.FC<AlarmItemProps> = ({
  entry,
  onToggle,
  onEdit,
  onDelete,
  onTest,
}) => {
  const getSoundIcon = () => {
    switch (entry.soundMode) {
      case 1:
        return (
          <span title="無音">
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          </span>
        );
      case 3:
        return (
          <span title="音声読み上げ">
            <Mic className="w-3.5 h-3.5 text-purple-500" />
          </span>
        );
      default:
        return (
          <span title="通知音">
            <Volume2 className="w-3.5 h-3.5 text-blue-500" />
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onEdit(entry)}
      className={`group relative flex items-center justify-between p-4 mb-2.5 rounded-2xl bg-white dark:bg-slate-800 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
        entry.enabled
          ? 'border-slate-200 dark:border-slate-700'
          : 'border-slate-200/50 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 opacity-60'
      }`}
    >
      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
        {/* App Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-xs select-none bg-slate-100 dark:bg-slate-700/60"
        >
          {entry.icon || '📱'}
        </div>

        {/* Middle details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline space-x-2">
            <span
              className={`font-mono text-2xl font-bold tracking-tight ${
                entry.enabled ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {timeText(entry)}
            </span>

            {entry.alarmMode && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <Bell className="w-3 h-3" />
                アラーム鳴動
              </span>
            )}

            {entry.group && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                {entry.group}
              </span>
            )}
          </div>

          <div
            className={`text-sm font-semibold truncate ${
              entry.enabled ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {entry.label || 'アプリ未選択'}
          </div>

          <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span>{daySummary(entry)}</span>
            <span>・</span>
            <span className="inline-flex items-center gap-1">
              {getSoundIcon()}
              {soundSummary(entry)}
            </span>

            {entry.autoOpen && (
              <>
                <span>・</span>
                <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                  <Zap className="w-3 h-3" />
                  自動起動
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onTest(entry)}
          title="今すぐテスト実行"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Clock className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(entry)}
          title="削除"
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={entry.enabled}
            onChange={(e) => onToggle(entry, e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
};
