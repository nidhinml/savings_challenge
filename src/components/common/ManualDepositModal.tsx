import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { getTodayDateString } from '../../lib/scheduler';
import { Modal } from './Modal';
import { Sparkles, AlertCircle, Calendar, FileText, Target } from 'lucide-react';

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

  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('500');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Active goals or all non-archived goals
  const activeGoals = challenges.filter((c) => c.status === 'active');
  const availableGoals = activeGoals.length > 0 ? activeGoals : challenges.filter((c) => c.status !== 'archived');

  // Initialize fields once when the modal opens
  useEffect(() => {
    if (isOpen) {
      const active = challenges.filter((c) => c.status === 'active');
      const fallback = active[0]?.id || challenges[0]?.id || '';
      const initialGoalId =
        defaultGoalId && challenges.some((c) => c.id === defaultGoalId)
          ? defaultGoalId
          : activeChallenge?.id && challenges.some((c) => c.id === activeChallenge.id)
            ? activeChallenge.id
            : fallback;

      setSelectedGoalId(initialGoalId);
      setAmountStr('500');
      setDate(getTodayDateString());
      setNote('');
      setErrorMessage('');
    }
  }, [isOpen, defaultGoalId]); // Stable dependencies: only run on modal open / goal ID change

  const targetGoal = challenges.find((c) => c.id === selectedGoalId) || activeChallenge;
  const currencyCode = targetGoal?.currency || settings.currency;
  const numericAmount = parseInt(amountStr, 10) || 0;

  const handleAmountChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setAmountStr(cleaned);
    if (errorMessage) setErrorMessage('');
  };

  const handleSetPreset = (preset: number) => {
    setAmountStr(String(preset));
    if (errorMessage) setErrorMessage('');
  };

  const handleAddIncrement = (inc: number) => {
    const current = parseInt(amountStr, 10) || 0;
    setAmountStr(String(current + inc));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseInt(amountStr, 10);

    if (!selectedGoalId) {
      setErrorMessage('Please select a target goal to deposit into.');
      return;
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setErrorMessage('Please enter a valid deposit amount greater than 0.');
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await addManualSavings(selectedGoalId, finalAmount, date, note.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to add manual savings:', err);
      setErrorMessage('Failed to save manual deposit. Please try again.');
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
      hideFooter={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Goal Selector */}
        <div>
          <label
            htmlFor="manual-savings-goal-select"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            <Target className="w-3.5 h-3.5 text-brand-500" />
            <span>Select Goal Target</span>
          </label>
          {availableGoals.length > 0 ? (
            <select
              id="manual-savings-goal-select"
              value={selectedGoalId}
              onChange={(e) => {
                setSelectedGoalId(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            >
              {availableGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — Target: {formatCurrency(g.targetAmount, g.currency)}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              No active goals available. Create a goal first!
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label
            htmlFor="manual-savings-amount-input"
            className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            <span>Savings Amount</span>
            <span className="text-brand-600 dark:text-brand-400 font-semibold lowercase">
              Type any amount
            </span>
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-400 dark:text-slate-500 font-bold text-lg">
                {currencyCode}
              </span>
            </div>
            <input
              id="manual-savings-amount-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Quick Presets:</span>
              <span className="text-slate-400">Set direct</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[100, 250, 500, 1000, 2000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSetPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    numericAmount === preset
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {formatCurrency(preset, currencyCode)}
                </button>
              ))}
            </div>

            {/* Quick Add Increment Chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Add:
              </span>
              {[50, 100, 200, 500, 1000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddIncrement(inc)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                >
                  +{formatCurrency(inc, currencyCode)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label
            htmlFor="manual-savings-date-input"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date Saved</span>
          </label>
          <input
            id="manual-savings-date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Note / Motivation */}
        <div>
          <label
            htmlFor="manual-savings-note-input"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Note (Optional)</span>
          </label>
          <input
            id="manual-savings-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Birthday gift money, spare cash, freelance gig"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="manual-savings-submit-btn"
            disabled={!numericAmount || numericAmount <= 0 || isSubmitting || !selectedGoalId}
            className="flex-1 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Recording...'
                : numericAmount > 0
                  ? `Save ${formatCurrency(numericAmount, currencyCode)}`
                  : 'Enter Amount'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
