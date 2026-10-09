import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { isEntryMissed } from '../../lib/scheduler';
import {
  Clock,
  Check,
  History as HistoryIcon,
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { activeChallenge, activeChallengeEntries } = useApp();
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'missed'>('all');

  if (!activeChallenge) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        No active savings challenge selected.
      </div>
    );
  }

  const currencyCode = activeChallenge.currency;

  // Filter entries
  const entriesWithStatus = activeChallengeEntries.map((e) => ({
    ...e,
    isMissed: !e.status || (e.status === 'pending' && isEntryMissed(e.plannedDate, e.status)),
  }));

  const filtered = entriesWithStatus.filter((e) => {
    if (filter === 'completed') return e.status === 'saved';
    if (filter === 'pending') return e.status === 'pending';
    if (filter === 'missed') return e.isMissed;
    return true;
  });

  const totalCompletedAmount = activeChallengeEntries
    .filter((e) => e.status === 'saved')
    .reduce((sum, e) => sum + e.amount, 0);

  const completedCount = activeChallengeEntries.filter((e) => e.status === 'saved').length;
  const missedCount = entriesWithStatus.filter((e) => e.isMissed).length;

  const formatCompletionDateTime = (iso: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Savings Activity & History
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Audit timeline, check completion timestamps, and monitor missed entries for {activeChallenge.name}.
        </p>
      </div>

      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Saved So Far
          </span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatCurrency(totalCompletedAmount, currencyCode)}
          </span>
          <span className="text-[10px] text-slate-400">{completedCount} days checked</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending Days
          </span>
          <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">
            {activeChallengeEntries.length - completedCount}
          </span>
          <span className="text-[10px] text-slate-400">entries to go</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Missed Days
          </span>
          <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {missedCount}
          </span>
          <span className="text-[10px] text-slate-400">catch up anytime</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
        {(['all', 'completed', 'pending', 'missed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === tab
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
            <HistoryIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">No activity matching filter.</p>
          </div>
        ) : (
          filtered.map((entry) => {
            const isSaved = entry.status === 'saved';
            const timestampFormatted = formatCompletionDateTime(entry.completedAt);

            return (
              <div
                key={entry.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSaved
                    ? 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-900/50 shadow-sm'
                    : entry.isMissed
                    ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/50 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSaved
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : entry.isMissed
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isSaved ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Day {String(entry.sequenceNumber).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-slate-400">
                          • Planned: {entry.plannedDate}
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {formatCurrency(entry.amount, currencyCode)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {isSaved ? (
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          Saved
                        </span>
                        {timestampFormatted && (
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {timestampFormatted}
                          </span>
                        )}
                      </div>
                    ) : entry.isMissed ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                        Missed Day
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
