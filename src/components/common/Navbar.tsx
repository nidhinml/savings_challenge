import React from 'react';
import { useApp } from '../../context/AppContext';
import { PiggyBank, Download, Sun, Moon, WifiOff, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenChallenges: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreate, onOpenChallenges }) => {
  const { settings, updateSettings, activeChallenge, isOnline, canInstallPwa, promptPwaInstall } = useApp();

  const toggleTheme = () => {
    const nextTheme = settings.themeMode === 'dark' ? 'light' : 'dark';
    updateSettings({ themeMode: nextTheme });
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <PiggyBank className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                SaveSmart
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                PWA
              </span>
            </div>
            {activeChallenge && (
              <button
                onClick={onOpenChallenges}
                className="text-xs text-slate-500 dark:text-slate-400 font-medium hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
                title="Switch active challenge"
              >
                <span className="max-w-[130px] truncate">{activeChallenge.name}</span>
                <span className="text-[10px] opacity-70">▾</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Offline Badge */}
          {!isOnline && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* PWA Install Button */}
          {canInstallPwa && (
            <button
              onClick={promptPwaInstall}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-all shadow-sm"
              title="Install App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Quick Create Challenge */}
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 active:scale-95 text-white transition-all shadow-sm shadow-brand-500/25"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New Goal</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {settings.themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
