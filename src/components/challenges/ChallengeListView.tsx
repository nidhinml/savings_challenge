import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import type { SavingsChallenge } from '../../types/challenge';
import * as db from '../../lib/db';
import { ProgressBar } from '../common/ProgressBar';
import { Modal } from '../common/Modal';
import {
  PlusCircle,
  Pause,
  Play,
  Archive,
  Trash2,
  Layers,
} from 'lucide-react';

interface ChallengeListViewProps {
  onOpenCreate: () => void;
  onSelectChallenge: (challenge: SavingsChallenge) => void;
}

export const ChallengeListView: React.FC<ChallengeListViewProps> = ({
  onOpenCreate,
  onSelectChallenge,
}) => {
  const {
    challenges,
    activeChallenge,
    setActiveChallengeId,
    updateChallenge,
    deleteChallenge,
  } = useApp();

  const [challengeProgressMap, setChallengeProgressMap] = useState<
    Record<string, { totalSaved: number; progress: number; totalEntries: number; completedEntries: number }>
  >({});

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Load progress for each challenge
  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      const map: Record<string, { totalSaved: number; progress: number; totalEntries: number; completedEntries: number }> = {};
      for (const ch of challenges) {
        const entries = await db.getEntriesForChallenge(ch.id);
        const totalSaved = entries
          .filter((e) => e.status === 'saved')
          .reduce((sum, e) => sum + e.amount, 0);
        const progress =
          ch.targetAmount > 0
            ? Math.min(100, Math.round((totalSaved / ch.targetAmount) * 100))
            : 0;
        map[ch.id] = {
          totalSaved,
          progress,
          totalEntries: entries.length,
          completedEntries: entries.filter((e) => e.status === 'saved').length,
        };
      }
      if (isMounted) {
        setChallengeProgressMap(map);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [challenges, activeChallenge]);

  const togglePause = async (ch: SavingsChallenge, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = ch.status === 'paused' ? 'active' : 'paused';
    await updateChallenge({ ...ch, status: newStatus });
  };

  const toggleArchive = async (ch: SavingsChallenge, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = ch.status === 'archived' ? 'active' : 'archived';
    await updateChallenge({ ...ch, status: newStatus });
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    await deleteChallenge(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Your Savings Challenges
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage multiple independent goals, pause, or switch focus.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/25 active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {challenges.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">No challenges yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Create your first savings goal to start your journey.
            </p>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
            >
              Create Goal
            </button>
          </div>
        ) : (
          challenges.map((ch) => {
            const stats = challengeProgressMap[ch.id] || {
              totalSaved: 0,
              progress: 0,
              totalEntries: 0,
              completedEntries: 0,
            };
            const isActive = activeChallenge?.id === ch.id;

            return (
              <div
                key={ch.id}
                onClick={() => {
                  setActiveChallengeId(ch.id);
                  onSelectChallenge(ch);
                }}
                className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 border-brand-500 ring-2 ring-brand-500/20 shadow-lg'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                {/* Active Indicator Top Accent */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 to-brand-400" />
                )}

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {ch.name}
                      </h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                          Active
                        </span>
                      )}
                      {ch.status === 'paused' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Paused
                        </span>
                      )}
                      {ch.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Finished
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{ch.frequency}</span>
                      <span>•</span>
                      <span>{ch.generationMode === 'daily_surprise' ? 'Surprise Mode' : 'Complete Plan'}</span>
                    </div>
                  </div>

                  {/* Right side actions: Pause, Archive, Delete */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => togglePause(ch, e)}
                      title={ch.status === 'paused' ? 'Resume challenge' : 'Pause challenge'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {ch.status === 'paused' ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => toggleArchive(ch, e)}
                      title={ch.status === 'archived' ? 'Unarchive' : 'Archive'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(ch.id);
                      }}
                      title="Delete challenge"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Details */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Saved: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(stats.totalSaved, ch.currency)}</strong> of {formatCurrency(ch.targetAmount, ch.currency)}
                    </span>
                    <span className="font-extrabold text-brand-600 dark:text-brand-400">
                      {stats.progress}%
                    </span>
                  </div>

                  <ProgressBar progress={stats.progress} size="sm" />

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>
                      {stats.completedEntries} / {stats.totalEntries} days checked off
                    </span>
                    <span>Range: {formatCurrency(ch.minimumAmount, ch.currency)} – {formatCurrency(ch.maximumAmount, ch.currency)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Challenge?"
        description="Are you sure you want to permanently delete this challenge and all of its recorded savings history? This action cannot be undone."
        confirmText="Yes, Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
};
