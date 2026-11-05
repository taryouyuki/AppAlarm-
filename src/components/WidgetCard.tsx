import React from 'react';
import { AlarmEntry } from '../types/alarm';
import { formatNextDate, timeTextFor } from '../utils/nextTime';
import { Smartphone, ExternalLink, X, Clock } from 'lucide-react';

interface WidgetCardProps {
  nextAlarm: { entry: AlarmEntry; at: number } | null;
  onOpenApp: (entry: AlarmEntry) => void;
  onEditAlarm: (entry: AlarmEntry) => void;
  onClose: () => void;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  nextAlarm,
  onOpenApp,
  onEditAlarm,
  onClose,
}) => {
  return (
    <div className="mb-4 p-4 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-100 uppercase tracking-wider">
          <Smartphone className="w-4 h-4" />
          <span>ホーム画面ウィジェット (再現プレビュー)</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {nextAlarm ? (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
              {nextAlarm.entry.icon || '📱'}
            </div>
            <div>
              <div className="text-xs text-blue-200 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                次回予定: {formatNextDate(nextAlarm.at)}
              </div>
              <div className="text-xl font-bold tracking-tight text-white flex items-baseline gap-2">
                <span>{nextAlarm.entry.label}</span>
                <span className="font-mono text-sm font-semibold opacity-90">
                  {timeTextFor(nextAlarm.entry)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenApp(nextAlarm.entry)}
              className="px-3.5 py-2 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span>開く</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 py-3 text-center text-sm text-blue-100">
          有効なアラームがありません（アラームを追加してください）
        </div>
      )}
    </div>
  );
};
