import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_CURRENCIES } from '../../lib/currency';
import type { AccentColor, ThemeMode, SavingsFrequency, GenerationMode } from '../../types/challenge';
import { Modal } from '../common/Modal';
import {
  Download,
  Upload,
  RotateCcw,
  Palette,
  Volume2,
  ShieldAlert,
  Save,
  Check,
  User,
  Sliders,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportData,
    importData,
    resetData,
    addToast,
  } = useApp();

  const [displayName, setDisplayName] = useState(settings.displayName);
  const [currency, setCurrency] = useState(settings.currency);
  const [defaultTarget, setDefaultTarget] = useState(settings.defaultTargetAmount);
  const [defaultMin, setDefaultMin] = useState(settings.defaultMinimumAmount);
  const [defaultMax, setDefaultMax] = useState(settings.defaultMaximumAmount);
  const [defaultFreq, setDefaultFreq] = useState<SavingsFrequency>(settings.defaultFrequency);
  const [defaultMode, setDefaultMode] = useState<GenerationMode>(settings.defaultGenerationMode);
  const [themeMode, setThemeMode] = useState<ThemeMode>(settings.themeMode);
  const [accentColor, setAccentColor] = useState<AccentColor>(settings.accentColor);
  const [soundEffects, setSoundEffects] = useState(settings.soundEffects);
  const [confettiEnabled, setConfettiEnabled] = useState(settings.confettiEnabled);

  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ACCENT_COLORS: { id: AccentColor; name: string; bgClass: string }[] = [
    { id: 'emerald', name: 'Emerald', bgClass: 'bg-emerald-500' },
    { id: 'teal', name: 'Teal', bgClass: 'bg-teal-500' },
    { id: 'indigo', name: 'Indigo', bgClass: 'bg-indigo-500' },
    { id: 'rose', name: 'Rose', bgClass: 'bg-rose-500' },
    { id: 'amber', name: 'Amber', bgClass: 'bg-amber-500' },
  ];

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      displayName,
      currency,
      defaultTargetAmount: defaultTarget,
      defaultMinimumAmount: defaultMin,
      defaultMaximumAmount: defaultMax,
      defaultFrequency: defaultFreq,
      defaultGenerationMode: defaultMode,
      themeMode,
      accentColor,
      soundEffects,
      confettiEnabled,
    });
  };

  const handleAccentChange = (acc: AccentColor) => {
    setAccentColor(acc);
    updateSettings({ accentColor: acc });
  };

  const handleThemeChange = (th: ThemeMode) => {
    setThemeMode(th);
    updateSettings({ themeMode: th });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.challenges || !parsed.entries) {
          throw new Error('Invalid SaveSmart backup format.');
        }
        await importData(parsed);
      } catch (err: any) {
        addToast(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const confirmReset = async () => {
    await resetData();
    setShowResetModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings & Customization
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Personalize themes, default currency, backup and restore your savings records.
        </p>
      </div>

      <form onSubmit={handleSaveDefaults} className="space-y-6">
        {/* Profile & Display Name */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <User className="w-4 h-4 text-brand-500" />
            <span>Profile & Currency</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Your Name / Nickname
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-sm text-slate-900 dark:text-white"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Appearance & Theme */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Palette className="w-4 h-4 text-brand-500" />
            <span>Appearance & Theme</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleThemeChange(mode)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all ${
                    themeMode === mode
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Accent Color Palette
            </label>
            <div className="flex items-center gap-3">
              {ACCENT_COLORS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleAccentChange(acc.id)}
                  title={acc.name}
                  className={`w-9 h-9 rounded-full ${acc.bgClass} flex items-center justify-center text-white transition-all transform active:scale-95 ${
                    accentColor === acc.id
                      ? 'ring-4 ring-slate-300 dark:ring-slate-700 scale-110 shadow-md'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {accentColor === acc.id && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preferences: Sounds & Celebrations */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Volume2 className="w-4 h-4 text-brand-500" />
            <span>Audio & Celebrations</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Sound Effects
              </span>
              <span className="text-xs text-slate-400">
                Play uplifting chimes when completing days (100% offline synthesized)
              </span>
            </div>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => setSoundEffects(e.target.checked)}
              className="w-5 h-5 rounded accent-brand-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Confetti Celebrations
              </span>
              <span className="text-xs text-slate-400">
                Burst confetti on savings milestones & reaching your target
              </span>
            </div>
            <input
              type="checkbox"
              checked={confettiEnabled}
              onChange={(e) => setConfettiEnabled(e.target.checked)}
              className="w-5 h-5 rounded accent-brand-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Challenge Defaults */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-brand-500" />
            <span>New Challenge Defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Default Target
              </label>
              <input
                type="number"
                min={1}
                value={defaultTarget}
                onChange={(e) => setDefaultTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Default Min Daily
              </label>
              <input
                type="number"
                min={1}
                value={defaultMin}
                onChange={(e) => setDefaultMin(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Default Max Daily
              </label>
              <input
                type="number"
                min={1}
                value={defaultMax}
                onChange={(e) => setDefaultMax(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Default Frequency
              </label>
              <select
                value={defaultFreq}
                onChange={(e) => setDefaultFreq(e.target.value as SavingsFrequency)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays only (Mon-Fri)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Default Generation Mode
              </label>
              <select
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value as GenerationMode)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white"
              >
                <option value="complete_plan">Complete Plan (Mode A)</option>
                <option value="daily_surprise">Daily Surprise (Mode B)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Preferences Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </form>

      {/* Backup, Export & Reset Section */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-brand-500" />
          <span>Data Storage & Backup</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Your savings records are saved locally inside your device's persistent IndexedDB database. You can export a JSON backup or restore past data anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={exportData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Restore Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Destructive Reset */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Application Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset All Data?"
        description="This will permanently delete all your savings challenges, completion logs, and custom settings. Please export a backup first if you want to keep your data."
        confirmText="Yes, Reset Everything"
        confirmVariant="danger"
        onConfirm={confirmReset}
      />
    </div>
  );
};
