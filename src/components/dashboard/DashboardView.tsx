import React, { useState, useRef } from 'react';
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
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Target,
  Plus,
  Minus,
  MinusCircle,
  Coins,
  Layers,
} from 'lucide-react';
import type { TabType } from '../common/BottomNav';

interface DashboardViewProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenCreate: () => void;
  onOpenSplit?: (amount?: number) => void;
  onOpenManual?: (goalId?: string, mode?: 'deposit' | 'deduction') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenCreate,
  onOpenSplit,
  onOpenManual,
}) => {
  const {
    settings,
    challenges,
    activeChallenge,
    setActiveChallengeId,
    stats,
    allGoalsSummary,
    allChallengesStats,
    markEntryAsSaved,
    generateNextSurpriseEntry,
    rerollSurpriseAmount,
  } = useApp();

  const [dashboardMode, setDashboardMode] = useState<'goal' | 'all'>('goal');
  const [isSaving, setIsSaving] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null);

  const activeGoals = challenges.filter((c) => c.status === 'active');
  const currentGoalIndex = activeChallenge
    ? activeGoals.findIndex((c) => c.id === activeChallenge.id)
    : 0;

  const handlePrevGoal = () => {
    if (activeGoals.length <= 1) return;
    const prevIndex = (currentGoalIndex - 1 + activeGoals.length) % activeGoals.length;
    setActiveChallengeId(activeGoals[prevIndex].id);
  };

  const handleNextGoal = () => {
    if (activeGoals.length <= 1) return;
    const nextIndex = (currentGoalIndex + 1) % activeGoals.length;
    setActiveChallengeId(activeGoals[nextIndex].id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;

    // Minimum swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePrevGoal(); // Swiped right -> go to previous
      } else {
        handleNextGoal(); // Swiped left -> go to next
      }
    }
    touchStartXRef.current = null;
  };

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

        {/* Global Quick Action: Manual Deposit & Deduct */}
        {onOpenManual && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenManual(activeChallenge?.id, 'deposit')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
              title="Record a custom savings deposit"
            >
              <Plus className="w-3.5 h-3.5 text-brand-500 stroke-[3]" />
              <span>Manual Save</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenManual(activeChallenge?.id, 'deduction')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200/80 dark:border-rose-800/80 shadow-sm active:scale-95 transition-all"
              title="Deduct money or record lost funds"
            >
              <Minus className="w-3.5 h-3.5 text-rose-500 stroke-[3]" />
              <span>Deduct</span>
            </button>
          </div>
        )}
      </div>

      {/* View Switcher: Goal Carousel vs All-in-One Dashboard */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
        <button
          type="button"
          onClick={() => setDashboardMode('goal')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            dashboardMode === 'goal'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-brand-500" />
          <span>Goal Carousel</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardMode('all')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            dashboardMode === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-purple-500" />
          <span>All-in-One Dashboard</span>
        </button>
      </div>

      {dashboardMode === 'all' ? (
        /* ================= ALL-IN-ONE COMBINED OVERVIEW DASHBOARD ================= */
        <div className="space-y-6 animate-scale-up">
          {/* Portfolio Net Worth Summary Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1">
                  <Coins className="w-4 h-4" /> Total Savings Vault
                </span>
                <span className="text-xs text-slate-400">
                  {allGoalsSummary.activeCount} active • {allGoalsSummary.completedCount} completed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <ProgressRing
                    progress={allGoalsSummary.overallProgress}
                    size={130}
                    strokeWidth={11}
                    centerContent={
                      <div className="text-center">
                        <span className="text-2xl font-black text-white">
                          {allGoalsSummary.overallProgress}%
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Overall
                        </span>
                      </div>
                    }
                  />
                </div>

                <div className="sm:col-span-7 space-y-3">
                  <div className="flex justify-between items-baseline border-b border-slate-700/60 pb-2">
                    <span className="text-xs font-medium text-slate-400">Total Goals Target</span>
                    <span className="text-base font-bold text-white">
                      {formatCurrency(allGoalsSummary.totalTarget, settings.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-slate-700/60 pb-2">
                    <span className="text-xs font-medium text-emerald-400">Combined Saved</span>
                    <span className="text-xl font-black text-emerald-400">
                      {formatCurrency(allGoalsSummary.totalSaved, settings.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium text-slate-400">Total Remaining</span>
                    <span className="text-base font-bold text-slate-300">
                      {formatCurrency(allGoalsSummary.totalRemaining, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <ProgressBar progress={allGoalsSummary.overallProgress} size="sm" />
              </div>
            </div>
          </div>

          {/* Quick Hub Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {onOpenManual && (
              <button
                type="button"
                onClick={() => onOpenManual(undefined, 'deposit')}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm hover:border-brand-500/50 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5 text-brand-500 mx-auto mb-1 stroke-[2.5]" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Manual Save
                </span>
                <span className="text-[10px] text-slate-400">Add funds</span>
              </button>
            )}

            {onOpenManual && (
              <button
                type="button"
                onClick={() => onOpenManual(undefined, 'deduction')}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm hover:border-rose-500/50 transition-all active:scale-95"
              >
                <MinusCircle className="w-5 h-5 text-rose-500 mx-auto mb-1 stroke-[2.2]" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Deduct / Loss
                </span>
                <span className="text-[10px] text-slate-400">Minus money</span>
              </button>
            )}

            {onOpenSplit && challenges.length > 1 && (
              <button
                type="button"
                onClick={() => onOpenSplit()}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm hover:border-brand-500/50 transition-all active:scale-95"
              >
                <ArrowRightLeft className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Split Deposit
                </span>
                <span className="text-[10px] text-slate-400">Across goals</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenCreate}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm hover:border-brand-500/50 transition-all active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                New Goal
              </span>
              <span className="text-[10px] text-slate-400">Custom target</span>
            </button>
          </div>

          {/* All Goals Matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-500" />
              <span>All Challenges at a Glance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {challenges.map((ch) => {
                const chStat = allChallengesStats[ch.id] || {
                  totalSaved: 0,
                  progressPercentage: 0,
                  remainingAmount: ch.targetAmount,
                  totalEntries: 0,
                  completedEntries: 0,
                };
                const isChActive = activeChallenge?.id === ch.id;

                return (
                  <div
                    key={ch.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isChActive
                        ? 'bg-white dark:bg-slate-900 border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block truncate max-w-[170px]">
                          {ch.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Target: {formatCurrency(ch.targetAmount, ch.currency)}
                        </span>
                      </div>

                      <span className="text-xs font-black text-brand-600 dark:text-brand-400">
                        {chStat.progressPercentage}%
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <ProgressBar progress={chStat.progressPercentage} size="sm" />
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                        <span>Saved: {formatCurrency(chStat.totalSaved, ch.currency)}</span>
                        <span>Left: {formatCurrency(chStat.remainingAmount, ch.currency)}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChallengeId(ch.id);
                          setDashboardMode('goal');
                        }}
                        className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {isChActive ? 'Active View' : 'Focus Goal'}
                      </button>

                      {onOpenManual && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenManual(ch.id, 'deposit')}
                            className="text-[11px] font-semibold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400"
                          >
                            + Save
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            type="button"
                            onClick={() => onOpenManual(ch.id, 'deduction')}
                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400"
                          >
                            - Deduct
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ================= SWIPEABLE GOAL CAROUSEL VIEW ================= */
        <div className="space-y-6">
          {/* Goal Selector Swiper Bar (Controls + Dots) */}
          {activeGoals.length > 1 && (
            <div className="flex items-center justify-between px-2 text-xs">
              <button
                type="button"
                onClick={handlePrevGoal}
                className="flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1"
                title="Swipe left to previous goal"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Prev</span>
              </button>

              {/* Carousel Dot Indicators */}
              <div className="flex items-center gap-1.5">
                {activeGoals.map((g, idx) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveChallengeId(g.id)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentGoalIndex
                        ? 'w-6 bg-brand-600 dark:bg-brand-400'
                        : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                    }`}
                    title={`Switch to ${g.name}`}
                  />
                ))}
                <span className="text-[10px] text-slate-400 ml-1.5 font-semibold">
                  {currentGoalIndex + 1} of {activeGoals.length}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextGoal}
                className="flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1"
                title="Swipe right to next goal"
              >
                <span className="hidden xs:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Swipeable Main Challenge Hero Card with Touch Gestures */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 shadow-xl border border-slate-700/60 select-none transition-all"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {activeChallenge.generationMode === 'daily_surprise'
                      ? 'Daily Surprise'
                      : 'Complete Plan'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeChallenge.frequency === 'weekdays'
                      ? 'Weekdays'
                      : activeChallenge.frequency}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {stats.currentStreak > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                      <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{stats.currentStreak} streak</span>
                    </div>
                  )}
                  <button
                    onClick={() => onNavigateTab('challenges')}
                    className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    All Goals <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-white mb-6">
                {activeChallenge.name}
              </h2>

              {/* Metrics Split Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    onClick={handleQuickSave}
                    disabled={isSaving}
                    className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>{isSaving ? 'Recording...' : 'Mark as Saved'}</span>
                  </button>

                  {onOpenSplit && activeGoals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onOpenSplit(nextEntry.amount)}
                      className="px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-slate-200/80 dark:border-slate-700/80"
                      title="Split this amount across different goals"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-brand-500" />
                      <span>Split</span>
                    </button>
                  )}

                  {onOpenManual && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenManual(activeChallenge.id, 'deposit')}
                        className="px-3 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 active:scale-95 transition-all border border-slate-200/80 dark:border-slate-700/80"
                        title="Add a custom manual amount instead"
                      >
                        <Plus className="w-4 h-4 text-brand-500 stroke-[3]" />
                        <span className="hidden sm:inline">Custom</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenManual(activeChallenge.id, 'deduction')}
                        className="px-3 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 active:scale-95 transition-all border border-rose-200/80 dark:border-rose-800/80"
                        title="Deduct money or record lost funds"
                      >
                        <Minus className="w-4 h-4 text-rose-500 stroke-[3]" />
                        <span className="hidden sm:inline">Deduct</span>
                      </button>
                    </div>
                  )}
                </div>
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
      )}
    </div>
  );
};
