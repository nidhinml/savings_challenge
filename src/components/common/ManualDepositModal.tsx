import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { getTodayDateString } from '../../lib/scheduler';
import { Modal } from './Modal';
import { Sparkles } from 'lucide-react';

interface ManualDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGoalId?: string;
}

export const ManualDepositModal: React.FC<ManualDepositModalProps> = ({
  isOpen,
  onClose,
  defaultGoalId,
}) => {
  const { challenges, activeChallenge, addManualSavings, settings } = useApp();

  const activeGoals = challenges.filter((c) => c.status === 'active');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [amount, setAmount] = useState<number>(500);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial = defaultGoalId || activeChallenge?.id || (activeGoals[0]?.id ?? '');
      setSelectedGoalId(initial);
      setDate(getTodayDateString());
      setAmount(500);
      setNote('');
    }
  }, [isOpen, defaultGoalId, activeChallenge, activeGoals]);

  const targetGoal = challenges.find((c) => c.id === selectedGoalId) || activeChallenge;
  const currencyCode = targetGoal?.currency || settings.currency;

  const handleAddChip = (increment: number) => {
    setAmount((prev) => (prev || 0) + increment);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || amount <= 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addManualSavings(selectedGoalId, amount, date, note.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Manual Savings"
      description="Record an extra or custom savings amount toward your goal."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Select Goal Target
          </label>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {activeGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — Target: {formatCurrency(g.targetAmount, g.currency)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Savings Amount
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              step={1}
              value={amount || ''}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Quick Increment Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[100, 200, 500, 1000, 2000].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => handleAddChip(inc)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                +{formatCurrency(inc, currencyCode)}
              </button>
            ))}
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Date Saved
          </label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Note / Motivation */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Birthday gift money, spare cash, freelance gig"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Confirm Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={amount <= 0 || isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Recording...'
                : `Deposit ${formatCurrency(amount, currencyCode)} into Goal`}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
