import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { formatFriendlyDate, isEntryMissed } from '../../lib/scheduler';
import { Modal } from '../common/Modal';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import type { SavingsEntry } from '../../types/challenge';

export const PlanView: React.FC = () => {
  const {
    activeChallenge,
    activeChallengeEntries,
    markEntryAsSaved,
    undoEntrySaved,
    regeneratePlan,
    generateNextSurpriseEntry,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'pending' | 'saved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [undoTargetEntry, setUndoTargetEntry] = useState<SavingsEntry | null>(null);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  if (!activeChallenge) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        No active challenge selected.
      </div>
    );
  }

  const currencyCode = activeChallenge.currency;
  const completedCount = activeChallengeEntries.filter((e) => e.status === 'saved').length;
  const isSurpriseMode = activeChallenge.generationMode === 'daily_surprise';

  // Filter and search entries
  const filteredEntries = activeChallengeEntries.filter((entry) => {
    if (filter === 'saved' && entry.status !== 'saved') return false;
    if (filter === 'pending' && entry.status !== 'pending') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const dayMatch = `day ${entry.sequenceNumber}`.includes(q) || String(entry.sequenceNumber) === q;
      const amountMatch = String(entry.amount).includes(q);
      const dateMatch = entry.plannedDate.includes(q);
      return dayMatch || amountMatch || dateMatch;
    }
    return true;
  });

  const handleMarkSaved = async (entry: SavingsEntry) => {
    if (isProcessingId === entry.id || entry.status === 'saved') return;
    try {
      setIsProcessingId(entry.id);
      await markEntryAsSaved(entry.id);
    } finally {
      setIsProcessingId(null);
    }
  };

  const confirmUndo = async () => {
    if (!undoTargetEntry) return;
    try {
      setIsProcessingId(undoTargetEntry.id);
      await undoEntrySaved(undoTargetEntry.id);
    } finally {
      setIsProcessingId(null);
      setUndoTargetEntry(null);
    }
  };

  const handleRegenerate = async () => {
    await regeneratePlan(activeChallenge.id);
    setShowRegenModal(false);
  };

  const formatCompletionTime = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* Header & Plan Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Daily Savings Plan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isSurpriseMode ? 'Daily Surprise Mode' : 'Complete Plan'} • {activeChallenge.name}
          </p>
        </div>

        {/* Regenerate Plan Action */}
        {!isSurpriseMode && (
          <button
            onClick={() => setShowRegenModal(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Plan</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col xs:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search day or amount..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 shrink-0">
          {(['all', 'pending', 'saved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
            <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No entries found matching filter.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSaved = entry.status === 'saved';
            const isMissed = !isSaved && isEntryMissed(entry.plannedDate, entry.status);
            const isBusy = isProcessingId === entry.id;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isSaved
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 shadow-sm'
                    : isMissed
                    ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/50 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                {/* Left side: Day, Date, Amount */}
                <div className="flex items-center gap-3.5">
                  {/* Status Indicator Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSaved
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : isMissed
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isSaved ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Day {String(entry.sequenceNumber).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        • {formatFriendlyDate(entry.plannedDate)}
                      </span>
                      {isMissed && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Missed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-base font-extrabold tracking-tight ${
                          isSaved
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(entry.amount, currencyCode)}
                      </span>

                      {isSaved && entry.completedAt && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          Saved on {formatCompletionTime(entry.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Action Button */}
                <div className="flex items-center gap-2">
                  {isSaved ? (
                    <button
                      onClick={() => setUndoTargetEntry(entry)}
                      disabled={isBusy}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Undo completed day"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Undo</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkSaved(entry)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 active:scale-95 text-white shadow-sm shadow-brand-600/30 transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                      <span>{isBusy ? 'Saving...' : 'Save'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mode B: Add next daily surprise if all are saved */}
      {isSurpriseMode && activeChallengeEntries.every((e) => e.status === 'saved') && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-brand-500/30 text-center shadow-md">
          <Sparkles className="w-8 h-8 text-brand-500 mx-auto mb-2" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Ready for your next savings step?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
            All current days completed! Generate the next surprise amount.
          </p>
          <button
            onClick={() => generateNextSurpriseEntry(activeChallenge.id)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md"
          >
            Generate Next Day
          </button>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      <Modal
        isOpen={!!undoTargetEntry}
        onClose={() => setUndoTargetEntry(null)}
        title="Undo Completion?"
        description={`Day ${undoTargetEntry?.sequenceNumber} (${formatCurrency(
          undoTargetEntry?.amount || 0,
          currencyCode
        )}) will be returned to Pending. This will deduct the amount from your total saved progress.`}
        confirmText="Yes, Undo"
        confirmVariant="danger"
        onConfirm={confirmUndo}
      />

      {/* Regenerate Confirmation Modal */}
      <Modal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        title="Regenerate Entire Plan?"
        description={
          completedCount > 0
            ? `Warning: You have already marked ${completedCount} day(s) as completed. Regenerating now will discard existing completion history and create fresh random amounts summing to ${formatCurrency(
                activeChallenge.targetAmount,
                currencyCode
              )}.`
            : `This will create a new randomized set of daily amounts totaling ${formatCurrency(
                activeChallenge.targetAmount,
                currencyCode
              )}.`
        }
        confirmText="Regenerate Plan"
        confirmVariant={completedCount > 0 ? 'danger' : 'primary'}
        onConfirm={handleRegenerate}
      />
    </div>
  );
};
