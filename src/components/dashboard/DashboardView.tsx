import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { formatFriendlyDate } from '../../lib/scheduler';
import { ProgressRing } from '../common/ProgressRing';
import { ProgressBar } from '../common/ProgressBar';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Flame,
  PlusCircle,
  HelpCircle,
  RefreshCw,
  Trophy,
  CalendarDays,
} from 'lucide-react';
import type { TabType } from '../common/BottomNav';

interface DashboardViewProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenCreate: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onOpenCreate }) => {
  const {
    settings,
    activeChallenge,
    stats,
    markEntryAsSaved,
    generateNextSurpriseEntry,
    rerollSurpriseAmount,
  } = useApp();

  const [isSaving, setIsSaving] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDisplay = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const currencyCode = activeChallenge?.currency || settings.currency;

  if (!activeChallenge || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Active Savings Goal</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1 mb-6">
          Set up your first customizable savings challenge and start building wealth daily!
        </p>
        <button
          onClick={onOpenCreate}
          className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-transform active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          Create Savings Challenge
        </button>
      </div>
    );
  }

  const nextEntry = stats.nextPendingEntry;
  const isCompletedGoal = stats.progressPercentage >= 100;

  const handleQuickSave = async () => {
    if (!nextEntry || isSaving) return;
    try {
      setIsSaving(true);
      await markEntryAsSaved(nextEntry.id);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSurprise = async () => {
    if (activeChallenge.generationMode !== 'daily_surprise') return;
    await generateNextSurpriseEntry(activeChallenge.id);
  };

  const handleReroll = async () => {
    if (!nextEntry || isRerolling) return;
    try {
      setIsRerolling(true);
      await rerollSurpriseAmount(nextEntry.id);
    } finally {
      setIsRerolling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            {todayDisplay}
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {settings.displayName || 'Saver'}
          </h1>
        </div>
        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{stats.currentStreak} day streak</span>
          </div>
        )}
      </div>

      {/* Main Challenge Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 shadow-xl border border-slate-700/60">
        {/* Subtle Ambient Background Mesh */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {activeChallenge.generationMode === 'daily_surprise' ? 'Daily Surprise' : 'Complete Plan'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {activeChallenge.frequency === 'weekdays' ? 'Weekdays' : activeChallenge.frequency}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('challenges')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
            >
              Switch Goal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-6">
            {activeChallenge.name}
          </h2>

          {/* Metrics Split Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Circular Progress & Percentage */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <ProgressRing
                progress={stats.progressPercentage}
                size={136}
                strokeWidth={11}
                centerContent={
                  <div className="text-center">
                    <span className="text-2xl font-black tracking-tight text-white">
                      {stats.progressPercentage}%
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Complete
                    </span>
                  </div>
                }
              />
            </div>

            {/* Financial Overview Stats */}
            <div className="sm:col-span-7 space-y-3.5">
              <div className="flex justify-between items-baseline border-b border-slate-700/60 pb-2.5">
                <span className="text-xs font-medium text-slate-400">Target Goal</span>
                <span className="text-lg font-bold text-white tracking-tight">
                  {formatCurrency(stats.targetAmount, currencyCode)}
                </span>
              </div>

              <div className="flex justify-between items-baseline border-b border-slate-700/60 pb-2.5">
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Total Saved
                </span>
                <span className="text-lg font-black text-emerald-400 tracking-tight">
                  {formatCurrency(stats.totalSaved, currencyCode)}
                </span>
              </div>

              <div className="flex justify-between items-baseline pb-1">
                <span className="text-xs font-medium text-slate-400">Remaining</span>
                <span className="text-lg font-bold text-slate-200 tracking-tight">
                  {formatCurrency(stats.remainingAmount, currencyCode)}
                </span>
              </div>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <ProgressBar progress={stats.progressPercentage} size="sm" />
          </div>
        </div>
      </div>

      {/* Next Savings Amount Hero Card */}
      {isCompletedGoal ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-brand-600 text-white shadow-xl text-center space-y-3 animate-scale-up">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black">Challenge Successfully Completed!</h3>
          <p className="text-sm text-emerald-100 max-w-sm mx-auto">
            Outstanding discipline! You have saved all {formatCurrency(stats.targetAmount, currencyCode)}.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenCreate}
              className="px-6 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm shadow-md hover:bg-emerald-50 active:scale-95 transition-all"
            >
              Start Another Challenge
            </button>
          </div>
        </div>
      ) : nextEntry ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden transition-all hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold text-xs">
                Day {String(nextEntry.sequenceNumber).padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatFriendlyDate(nextEntry.plannedDate)}
              </span>
            </div>
            {activeChallenge.generationMode === 'daily_surprise' && (
              <button
                onClick={handleReroll}
                disabled={isRerolling}
                className="text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 font-semibold transition-colors"
                title="Reroll surprise amount"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRerolling ? 'animate-spin' : ''}`} />
                <span>Re-roll</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Next Daily Amount
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {formatCurrency(nextEntry.amount, currencyCode)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Transfer/keep this amount in real life, then tap below
              </p>
            </div>

            <button
              onClick={handleQuickSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>{isSaving ? 'Recording...' : 'Mark as Saved'}</span>
            </button>
          </div>
        </div>
      ) : activeChallenge.generationMode === 'daily_surprise' ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center">
          <Sparkles className="w-8 h-8 text-brand-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Ready for your next savings step?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Generate today's randomized savings amount toward your remaining target.
          </p>
          <button
            onClick={handleGenerateSurprise}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md"
          >
            Reveal Next Amount
          </button>
        </div>
      ) : null}

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold">Completed</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.completedEntries}{' '}
            <span className="text-xs font-normal text-slate-400">/ {stats.totalEntries}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">days saved</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold">Pending</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.pendingEntries}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">entries left</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-semibold">Daily Avg</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(stats.averageSavedPerDay, currencyCode)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">per completed day</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Flame className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold">Missed</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.missedEntries}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">past due days</span>
        </div>
      </div>

      {/* Quick Navigation Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          onClick={() => onNavigateTab('plan')}
          className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">View Full Plan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check off days and see future amounts
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
        </button>

        <button
          onClick={onOpenCreate}
          className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">New Challenge</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a customized savings goal
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
        </button>
      </div>
    </div>
  );
};
