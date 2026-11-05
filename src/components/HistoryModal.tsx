import React, { useState } from 'react';
import { loadHistory, clearHistory, getHistoryCounts } from '../utils/storage';
import { HistoryRecord } from '../types/alarm';
import { X, History, Trash2, CheckCircle2, Clock, Zap, Bell } from 'lucide-react';

interface HistoryModalProps {
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose }) => {
  const [records, setRecords] = useState<HistoryRecord[]>(() => loadHistory());
  const counts = getHistoryCounts();

  const handleClear = () => {
    if (confirm('履歴をすべて消去しますか？')) {
      clearHistory();
      setRecords([]);
    }
  };

  const formatRecordTime = (millis: number) => {
    const d = new Date(millis);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${h}:${min}`;
  };

  const getActionBadge = (action: HistoryRecord['action']) => {
    switch (action) {
      case 'stop':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            停止
          </span>
        );
      case 'snooze':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            スヌーズ
          </span>
        );
      case 'auto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Zap className="w-3 h-3" />
            自動で起動
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Bell className="w-3 h-3" />
            通知
          </span>
        );
    }
  };

  const statItems = [
    { label: '発火回数', value: records.length, color: 'text-slate-900 dark:text-slate-100' },
    { label: '停止', value: counts.stop, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'スヌーズ', value: counts.snooze, color: 'text-amber-600 dark:text-amber-400' },
    { label: '自動で起動', value: counts.auto, color: 'text-indigo-600 dark:text-indigo-400' },
    { label: '通知のみ', value: counts.notify, color: 'text-blue-600 dark:text-blue-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            履歴と統計
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">集計</span>
            <div className="space-y-1.5 pt-1">
              {statItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                  <span className={`font-mono text-base font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">最近の履歴</span>
            {records.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">まだ履歴がありません</div>
            ) : (
              <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
                {records.slice(0, 50).map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span className="font-mono text-slate-400 text-[11px] w-20 shrink-0">
                        {formatRecordTime(r.time)}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {r.label}
                      </span>
                    </div>
                    <div className="shrink-0 ml-2">{getActionBadge(r.action)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {records.length > 0 && (
            <button
              onClick={handleClear}
              className="w-full py-2.5 px-3 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              履歴を消去
            </button>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl text-sm transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
