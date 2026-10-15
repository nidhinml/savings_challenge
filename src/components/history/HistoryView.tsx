import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { isEntryMissed } from '../../lib/scheduler';
import {
  Clock,
  Check,
  History as HistoryIcon,
  ArrowRightLeft,
  Trash2,
  Calendar,
  TrendingDown,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import type { SavingsEntry } from '../../types/challenge';

export const HistoryView: React.FC = () => {
  const {
    activeChallenge,
    activeChallengeEntries,
    splitTransactions,
    deleteSplitTransaction,
    deleteManualEntry,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'entries' | 'splits'>('entries');
  const [filter, setFilter] = useState<'all' | 'completed' | 'deductions' | 'pending' | 'missed'>('all');
  const [deleteTarget, setDeleteTarget] = useState<SavingsEntry | null>(null);

  if (!activeChallenge) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        No active savings challenge selected.
      </div>
    );
  }

  const currencyCode = activeChallenge.currency;

  const entriesWithStatus = activeChallengeEntries.map((e) => ({
    ...e,
    isDeduct: e.entryType === 'deduction' || e.amount < 0,
    isMissed: !e.status || (e.status === 'pending' && isEntryMissed(e.plannedDate, e.status)),
  }));

  const filtered = entriesWithStatus.filter((e) => {
    if (filter === 'completed') return e.status === 'saved' && !e.isDeduct;
    if (filter === 'deductions') return e.isDeduct;
    if (filter === 'pending') return e.status === 'pending';
    if (filter === 'missed') return e.isMissed;
    return true;
  });

  const totalCompletedAmount = activeChallengeEntries
    .filter((e) => e.status === 'saved')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDeductions = activeChallengeEntries
    .filter((e) => e.status === 'saved' && (e.entryType === 'deduction' || e.amount < 0))
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const completedCount = activeChallengeEntries.filter((e) => e.status === 'saved' && e.entryType !== 'deduction' && e.amount > 0).length;
  const deductionsCount = activeChallengeEntries.filter((e) => e.entryType === 'deduction' || e.amount < 0).length;
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
          Savings Activity & Logs
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Audit daily completions, timestamps, and multi-goal split deposits.
        </p>
      </div>

      {/* Main Top Tab Switcher: Entries vs Splits */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('entries')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'entries'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>Daily Plan History</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('splits')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'splits'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-brand-500" />
          <span>Multi-Goal Splits ({splitTransactions.length})</span>
        </button>
      </div>

      {activeTab === 'entries' ? (
        <>
          {/* Overview Analytics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {totalCompletedAmount < 0 ? 'Net Deficit' : 'Net Saved'}
              </span>
              <span className={`text-base sm:text-lg font-black mt-1 block ${
                totalCompletedAmount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {formatCurrency(totalCompletedAmount, currencyCode)}
              </span>
              <span className="text-[10px] text-slate-400">{completedCount} days checked</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Deductions / Loss
              </span>
              <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-1 block">
                -{formatCurrency(totalDeductions, currencyCode)}
              </span>
              <span className="text-[10px] text-slate-400">{deductionsCount} deducted</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pending Days
              </span>
              <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">
                {activeChallengeEntries.filter((e) => e.status === 'pending').length}
              </span>
              <span className="text-[10px] text-slate-400">entries to go</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Missed Days
              </span>
              <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-1 block">
                {missedCount}
              </span>
              <span className="text-[10px] text-slate-400">catch up anytime</span>
            </div>
          </div>

          {/* Filter Sub-Tabs */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'completed', label: 'Saved' },
                { id: 'deductions', label: 'Deductions' },
                { id: 'pending', label: 'Pending' },
                { id: 'missed', label: 'Missed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 min-w-[70px] py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
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
                const isDeduct = entry.isDeduct;
                const isSaved = entry.status === 'saved';
                const timestampFormatted = formatCompletionDateTime(entry.completedAt);

                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDeduct
                        ? 'bg-white dark:bg-slate-900 border-rose-200/80 dark:border-rose-900/50 shadow-sm'
                        : isSaved
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
                            isDeduct
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                              : isSaved
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : entry.isMissed
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isDeduct ? (
                            <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                          ) : isSaved ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {isDeduct
                                ? 'Deduction'
                                : `Day ${String(entry.sequenceNumber).padStart(2, '0')}`}
                            </span>
                            <span className="text-xs text-slate-400">
                              • {entry.plannedDate}
                            </span>
                          </div>
                          <div
                            className={`text-base font-extrabold mt-0.5 ${
                              isDeduct
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isDeduct
                              ? `-${formatCurrency(Math.abs(entry.amount), currencyCode)}`
                              : formatCurrency(entry.amount, currencyCode)}
                          </div>
                          {entry.note && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {entry.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <div>
                          {isDeduct ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                              Loss / Deducted
                            </span>
                          ) : isSaved ? (
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

                        {/* Delete manual entry / deduction button */}
                        {(entry.isManual || isDeduct) && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(entry)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                            title="Remove this transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Multi-Goal Split History Tab */
        <div className="space-y-3">
          {splitTransactions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
              <ArrowRightLeft className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                No Split Savings Recorded Yet
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                When you split a deposit across multiple goals, the transactions and breakdown will appear here.
              </p>
            </div>
          ) : (
            splitTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {formatCurrency(tx.totalAmount, settings.currency)} Split
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tx.allocations.length} goals
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {tx.date} • {formatCompletionDateTime(tx.timestamp)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteSplitTransaction(tx.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Breakdown per goal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {tx.allocations.map((alloc) => (
                    <div
                      key={alloc.challengeId}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {alloc.challengeName}
                      </span>
                      <span className="text-xs font-black text-brand-600 dark:text-brand-400">
                        {formatCurrency(alloc.amount, settings.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                {tx.note && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg">
                    "{tx.note}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal for Manual/Deduction entry */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={
          deleteTarget?.entryType === 'deduction' || (deleteTarget?.amount || 0) < 0
            ? 'Remove Deduction Record?'
            : 'Remove Transaction Record?'
        }
        description={
          deleteTarget?.entryType === 'deduction' || (deleteTarget?.amount || 0) < 0
            ? `Are you sure you want to remove this deduction of ${formatCurrency(
                Math.abs(deleteTarget?.amount || 0),
                currencyCode
              )}? The money will be restored back to your saved balance.`
            : `Are you sure you want to remove this transaction record of ${formatCurrency(
                deleteTarget?.amount || 0,
                currencyCode
              )}?`
        }
        confirmText="Yes, Remove"
        confirmVariant="danger"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteManualEntry(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
