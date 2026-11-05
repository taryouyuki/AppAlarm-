import React, { useRef } from 'react';
import { AppSettingsData, THEME_SYSTEM, THEME_LIGHT, THEME_DARK, SNOOZE_NONE, SNOOZE_UNLIMITED } from '../types/alarm';
import { exportAlarmsJson, importAlarmsJson } from '../utils/storage';
import { X, Download, Upload, Sliders, Palette, Clock, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettingsData;
  onUpdateSettings: (newSettings: AppSettingsData) => void;
  onOpenHistory: () => void;
  onClose: () => void;
  onReloadAlarms: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onOpenHistory,
  onClose,
  onReloadAlarms,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      const json = exportAlarmsJson();
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
      link.href = url;
      link.download = `appalarm-backup-${stamp}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('バックアップの書き出しに失敗しました');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importAlarmsJson(content)) {
        alert(`バックアップから復元しました（${file.name}）`);
        onReloadAlarms();
        onClose();
      } else {
        alert('ファイルの内容が不正です');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            設定
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Appearance */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5" />
              外観
            </div>

            <div className="space-y-2">
              {[
                { label: 'システムに合わせる', value: THEME_SYSTEM },
                { label: 'ライト', value: THEME_LIGHT },
                { label: 'ダーク', value: THEME_DARK },
              ].map((item) => (
                <label key={item.value} className="flex items-center space-x-2.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="theme"
                    checked={settings.themeMode === item.value}
                    onChange={() => onUpdateSettings({ ...settings, themeMode: item.value })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <label className="flex items-center space-x-2.5 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={settings.useDynamicColor}
                  onChange={(e) => onUpdateSettings({ ...settings, useDynamicColor: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>システムの色を使う (Material You)</span>
              </label>
              <p className="text-xs text-slate-400 pl-6.5 mt-0.5">
                壁紙やブラウザのアクセントカラーをアプリ全体の配色に適用します
              </p>
            </div>
          </div>

          {/* Alarm Ringing */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              アラーム鳴動
            </div>

            <div>
              <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={settings.fadeEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, fadeEnabled: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>音量を徐々に大きくする（フェードイン）</span>
              </label>
            </div>

            {settings.fadeEnabled && (
              <div className="pl-6.5">
                <label className="text-xs text-slate-500 block mb-1">フェードインの長さ</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, fadeSeconds: sec })}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        settings.fadeSeconds === sec
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {sec}秒
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={settings.historyEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, historyEnabled: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>履歴を記録する（停止・スヌーズなど）</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHistory();
              }}
              className="w-full mt-1 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              履歴と統計を見る →
            </button>
          </div>

          {/* Snooze Delay */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              「再通知」までの時間
            </span>
            <p className="text-xs text-slate-500">
              通知やアラームのボタンを押したあと、次にもう一度知らせるまでの基本間隔です。
            </p>
            <div className="space-y-1.5 pt-1">
              {[5, 10, 15, 30, 60].map((mins) => (
                <label key={mins} className="flex items-center space-x-2.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="defaultSnoozeMinutes"
                    checked={settings.snoozeMinutes === mins}
                    onChange={() => onUpdateSettings({ ...settings, snoozeMinutes: mins })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{mins}分後</span>
                </label>
              ))}
            </div>
          </div>

          {/* Snooze Limit */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              「再通知」の上限回数
            </span>
            <p className="text-xs text-slate-500">
              1回の発火に対して何回まで「再通知」できるか。上限に達するとボタンが消えます。
            </p>
            <div className="space-y-1.5 pt-1">
              {[
                { label: '1回まで', value: 1 },
                { label: '2回まで', value: 2 },
                { label: '3回まで (既定)', value: 3 },
                { label: '5回まで', value: 5 },
                { label: '上限なし', value: SNOOZE_UNLIMITED },
                { label: '再通知しない', value: SNOOZE_NONE },
              ].map((item) => (
                <label key={item.value} className="flex items-center space-x-2.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="defaultMaxSnooze"
                    checked={settings.maxSnooze === item.value}
                    onChange={() => onUpdateSettings({ ...settings, maxSnooze: item.value })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Backup / Restore */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <RotateCcw className="w-3.5 h-3.5" />
              バックアップと復元
            </div>
            <p className="text-xs text-slate-500">
              アラームの設定をJSONファイルに書き出し・読み込みして復元できます。
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                バックアップを書き出す (JSON)
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                バックアップから復元 (JSON)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>
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
