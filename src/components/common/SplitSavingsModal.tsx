import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { Modal } from './Modal';
import {
  CheckCircle2,
  AlertCircle,
  Equal,
  Sparkles,
  Percent,
} from 'lucide-react';

interface SplitSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
}

export const SplitSavingsModal: React.FC<SplitSavingsModalProps> = ({
  isOpen,
  onClose,
  initialAmount,
}) => {
  const { challenges, splitAmountAcrossChallenges, settings } = useApp();

  const activeGoals = useMemo(() => {
    return challenges.filter((c) => c.status === 'active');
  }, [challenges]);

  const [totalAmount, setTotalAmount] = useState<number>(initialAmount || 1000);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected goals and equal split when modal opens
  useEffect(() => {
    if (isOpen && activeGoals.length > 0) {
      const ids = activeGoals.map((g) => g.id);
      setSelectedGoalIds(ids);

      const amt = initialAmount && initialAmount > 0 ? initialAmount : 1000;
      setTotalAmount(amt);

      // Distribute evenly
      distributeEqually(amt, ids);
    }
  }, [isOpen, activeGoals, initialAmount]);

  const distributeEqually = (total: number, goalIds: string[]) => {
    if (goalIds.length === 0) return;
    const base = Math.floor(total / goalIds.length);
    let remainder = total - base * goalIds.length;

    const newAlloc: Record<string, number> = {};
    goalIds.forEach((id, idx) => {
      newAlloc[id] = base + (idx === 0 ? remainder : 0);
    });
    setAllocations(newAlloc);
  };

  const distributeProportionally = () => {
    if (selectedGoalIds.length === 0 || totalAmount <= 0) return;

    // Weight by goal targetAmount
    const selected = activeGoals.filter((g) => selectedGoalIds.includes(g.id));
    const sumTargets = selected.reduce((s, g) => s + g.targetAmount, 0);
    if (sumTargets <= 0) return;

    const newAlloc: Record<string, number> = {};
    let allocatedSoFar = 0;

    selected.forEach((g, idx) => {
      if (idx === selected.length - 1) {
        newAlloc[g.id] = Math.max(0, totalAmount - allocatedSoFar);
      } else {
        const share = Math.round((g.targetAmount / sumTargets) * totalAmount);
        newAlloc[g.id] = share;
        allocatedSoFar += share;
      }
    });

    setAllocations(newAlloc);
  };

  const handleGoalToggle = (goalId: string) => {
    const next = selectedGoalIds.includes(goalId)
      ? selectedGoalIds.filter((id) => id !== goalId)
      : [...selectedGoalIds, goalId];

    setSelectedGoalIds(next);
    distributeEqually(totalAmount, next);
  };

  const handleAmountChange = (goalId: string, val: number) => {
    setAllocations((prev) => ({
      ...prev,
      [goalId]: Math.max(0, val),
    }));
  };

  const handleTotalChange = (val: number) => {
    const nextTotal = Math.max(0, val);
    setTotalAmount(nextTotal);
    distributeEqually(nextTotal, selectedGoalIds);
  };

  // Calculations
  const currentSumAllocated = useMemo(() => {
    return selectedGoalIds.reduce((sum, id) => sum + (allocations[id] || 0), 0);
  }, [selectedGoalIds, allocations]);

  const difference = totalAmount - currentSumAllocated;
  const isBalanced = difference === 0 && totalAmount > 0;

  const handleAutoBalance = () => {
    if (selectedGoalIds.length === 0) return;
    const firstId = selectedGoalIds[0];
    setAllocations((prev) => ({
      ...prev,
      [firstId]: Math.max(0, (prev[firstId] || 0) + difference),
    }));
  };

  const handleConfirm = async () => {
    if (!isBalanced || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const allocList = selectedGoalIds.map((id) => ({
        challengeId: id,
        amount: allocations[id] || 0,
      }));

      await splitAmountAcrossChallenges(totalAmount, allocList, note.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Split Savings Across Goals"
      description="Divide today's deposit between multiple active targets."
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {/* Total Input */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Total Amount to Save & Split
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              step={1}
              value={totalAmount || ''}
              onChange={(e) => handleTotalChange(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-extrabold text-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Quick presets for total */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[500, 1000, 1500, 2000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleTotalChange(amt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  totalAmount === amt
                    ? 'bg-brand-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {formatCurrency(amt, settings.currency)}
              </button>
            ))}
          </div>
        </div>

        {/* Action Pills: Equal vs Proportional */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Distribute
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => distributeEqually(totalAmount, selectedGoalIds)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              <Equal className="w-3.5 h-3.5" />
              <span>Equal Split</span>
            </button>
            <button
              type="button"
              onClick={distributeProportionally}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>By Target Ratio</span>
            </button>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {activeGoals.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No active goals available.</p>
          ) : (
            activeGoals.map((goal) => {
              const isSelected = selectedGoalIds.includes(goal.id);
              const allocatedAmt = allocations[goal.id] || 0;
              const percentOfTotal =
                totalAmount > 0 ? Math.round((allocatedAmt / totalAmount) * 100) : 0;

              return (
                <div
                  key={goal.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-brand-500/60 shadow-sm'
                      : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleGoalToggle(goal.id)}
                        className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                      />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {goal.name}
                      </span>
                    </label>

                    {isSelected && (
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {percentOfTotal}%
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400 font-medium">
                          Goal Target: {formatCurrency(goal.targetAmount, goal.currency)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400">{goal.currency}</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={allocatedAmt || ''}
                            onChange={(e) => handleAmountChange(goal.id, Number(e.target.value))}
                            className="w-24 px-2 py-1 text-right rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </div>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={totalAmount || 100}
                        value={allocatedAmt}
                        onChange={(e) => handleAmountChange(goal.id, Number(e.target.value))}
                        className="w-full accent-brand-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Balance Status Banner */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            isBalanced
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span>
              {isBalanced ? (
                'Amounts perfectly balanced!'
              ) : difference > 0 ? (
                `₹${difference} remaining to allocate`
              ) : (
                `₹${Math.abs(difference)} over allocated`
              )}
            </span>
          </div>

          {!isBalanced && (
            <button
              type="button"
              onClick={handleAutoBalance}
              className="underline font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900"
            >
              Auto-balance
            </button>
          )}
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
            Deposit Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Freelance bonus, spare cash deposit"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {/* Confirm Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isBalanced || isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Processing Split...'
                : `Save ${formatCurrency(totalAmount, settings.currency)} Across ${selectedGoalIds.length} Goals`}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
