import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { getTodayDateString } from '../../lib/scheduler';
import { Modal } from './Modal';
import {
  Sparkles,
  AlertCircle,
  Calendar,
  FileText,
  Target,
  MinusCircle,
  PlusCircle,
  TrendingDown,
  Coins,
  Tag,
} from 'lucide-react';

export type TransactionMode = 'deposit' | 'deduction';

interface ManualDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGoalId?: string;
  initialMode?: TransactionMode;
}

const LOSS_REASONS = [
  '💸 Lost Money',
  '🚨 Emergency Expense',
  '🛍️ Impulse Purchase',
  '🏧 Cash Withdrawal',
  '✏️ Balance Adjustment',
];

export const ManualDepositModal: React.FC<ManualDepositModalProps> = ({
  isOpen,
  onClose,
  defaultGoalId,
  initialMode = 'deposit',
}) => {
  const { challenges, activeChallenge, addManualSavings, deductSavings, allChallengesStats, settings } = useApp();

  const [mode, setMode] = useState<TransactionMode>(initialMode);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('500');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Active goals or all non-archived goals
  const activeGoals = challenges.filter((c) => c.status === 'active');
  const availableGoals = activeGoals.length > 0 ? activeGoals : challenges.filter((c) => c.status !== 'archived');

  // Initialize fields once when the modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'deposit');
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
      setSelectedReason('');
      setErrorMessage('');
    }
  }, [isOpen, defaultGoalId, initialMode]);

  const targetGoal = challenges.find((c) => c.id === selectedGoalId) || activeChallenge;
  const currencyCode = targetGoal?.currency || settings.currency;
  const targetGoalStats = targetGoal ? allChallengesStats[targetGoal.id] : null;
  const currentSavedBalance = targetGoalStats ? targetGoalStats.totalSaved : 0;
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

  const handleSelectReason = (reasonText: string) => {
    setSelectedReason(reasonText);
    const cleanLabel = reasonText.replace(/^[^\w\s]+/, '').trim();
    if (!note || LOSS_REASONS.some((r) => r.includes(note))) {
      setNote(cleanLabel);
    }
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseInt(amountStr, 10);

    if (!selectedGoalId) {
      setErrorMessage('Please select a target goal.');
      return;
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }



    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      if (mode === 'deduction') {
        await deductSavings(
          selectedGoalId,
          finalAmount,
          date,
          note.trim() || undefined,
          selectedReason || 'Lost Money'
        );
      } else {
        await addManualSavings(selectedGoalId, finalAmount, date, note.trim() || undefined);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to submit transaction:', err);
      setErrorMessage(err?.message || 'Failed to process transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeduct = mode === 'deduction';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDeduct ? 'Deduct / Minus Money' : 'Add Manual Savings'}
      description={
        isDeduct
          ? 'Deduct money from your savings if you lost money, had an emergency, or withdrew funds (deductions can exceed balance into negative/deficit).'
          : 'Record an extra or custom savings deposit toward your goal.'
      }
      hideFooter={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Selector Tabs (Deposit vs Deduct) */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            id="tab-mode-deposit"
            onClick={() => {
              setMode('deposit');
              setErrorMessage('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !isDeduct
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Deposit Money (+)</span>
          </button>

          <button
            type="button"
            id="tab-mode-deduct"
            onClick={() => {
              setMode('deduction');
              setErrorMessage('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isDeduct
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Deduct / Loss (-)</span>
          </button>
        </div>

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
            className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <Target className={`w-3.5 h-3.5 ${isDeduct ? 'text-rose-500' : 'text-brand-500'}`} />
              <span>Select Goal Target</span>
            </span>
            {targetGoal && (
              <span className={`text-[11px] font-semibold lowercase ${currentSavedBalance < 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {currentSavedBalance < 0 ? 'deficit: ' : 'saved: '}
                {formatCurrency(currentSavedBalance, currencyCode)}
              </span>
            )}
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
              {availableGoals.map((g) => {
                const gStat = allChallengesStats[g.id];
                const gSaved = gStat ? gStat.totalSaved : 0;
                const gSavedLabel = gSaved < 0 ? `Deficit: ${formatCurrency(gSaved, g.currency)}` : `Saved: ${formatCurrency(gSaved, g.currency)}`;
                return (
                  <option key={g.id} value={g.id}>
                    {g.name} — {gSavedLabel} / Target: {formatCurrency(g.targetAmount, g.currency)}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              No active goals available. Create a goal first!
            </div>
          )}
        </div>

        {/* Deduction Saved Balance Callout Pill */}
        {isDeduct && (
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            currentSavedBalance < 0
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700'
          }`}>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Coins className={`w-3.5 h-3.5 ${currentSavedBalance < 0 ? 'text-rose-500' : 'text-amber-500'}`} />
              <span>{currentSavedBalance < 0 ? 'Current balance (in deficit):' : 'Current saved funds available:'}</span>
            </span>
            <span className={`font-extrabold text-sm ${currentSavedBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(currentSavedBalance, currencyCode)}
            </span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label
            htmlFor="manual-savings-amount-input"
            className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            <span>{isDeduct ? 'Amount to Deduct' : 'Savings Amount'}</span>
            <span
              className={`font-semibold lowercase ${
                isDeduct ? 'text-rose-600 dark:text-rose-400' : 'text-brand-600 dark:text-brand-400'
              }`}
            >
              {isDeduct ? 'Subtract from saved' : 'Add to saved'}
            </span>
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className={`font-bold text-lg ${isDeduct ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                {isDeduct ? `-${currencyCode}` : currencyCode}
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
              className={`w-full pl-16 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border font-extrabold text-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                isDeduct
                  ? 'border-rose-200 dark:border-rose-900/60 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'
              }`}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Quick Presets:</span>
              <span className="text-slate-400">Direct tap</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[100, 250, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSetPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    numericAmount === preset
                      ? isDeduct
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                        : 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {formatCurrency(preset, currencyCode)}
                </button>
              ))}

              {/* Deduct all currently saved balance preset */}
              {isDeduct && currentSavedBalance > 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPreset(currentSavedBalance)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
                >
                  All Saved ({formatCurrency(currentSavedBalance, currencyCode)})
                </button>
              )}
            </div>

            {/* Quick Add Increments */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                {isDeduct ? 'Increase loss:' : 'Add:'}
              </span>
              {[50, 100, 200, 500, 1000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddIncrement(inc)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${
                    isDeduct
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                      : 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200/60 dark:border-brand-800/60 hover:bg-brand-100 dark:hover:bg-brand-900/40'
                  }`}
                >
                  +{formatCurrency(inc, currencyCode)}
                </button>
              ))}
            </div>

            {/* Projected Balance Callout */}
            {numericAmount > 0 && (
              <div className={`mt-2 flex items-center justify-between text-xs px-3 py-2 rounded-xl border ${
                (isDeduct ? currentSavedBalance - numericAmount : currentSavedBalance + numericAmount) < 0
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
              }`}>
                <span className="font-medium">
                  {isDeduct ? 'Balance after deduction:' : 'Balance after deposit:'}
                </span>
                <span className="font-bold">
                  {formatCurrency(
                    isDeduct ? currentSavedBalance - numericAmount : currentSavedBalance + numericAmount,
                    currencyCode
                  )}
                  {isDeduct && currentSavedBalance - numericAmount < 0 && ' (Deficit)'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Reason Chips for Deductions */}
        {isDeduct && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              <Tag className="w-3.5 h-3.5 text-rose-500" />
              <span>Reason for Deduction</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {LOSS_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSelectReason(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedReason === r
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date Selector */}
        <div>
          <label
            htmlFor="manual-savings-date-input"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date</span>
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

        {/* Note / Description */}
        <div>
          <label
            htmlFor="manual-savings-note-input"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Note / Details (Optional)</span>
          </label>
          <input
            id="manual-savings-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              isDeduct
                ? 'e.g. Lost wallet cash, bike repair, urgent medical expense'
                : 'e.g. Birthday gift money, spare cash, freelance gig'
            }
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
            disabled={
              !numericAmount ||
              numericAmount <= 0 ||
              isSubmitting ||
              !selectedGoalId
            }
            className={`flex-1 py-3 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-white disabled:opacity-50 ${
              isDeduct
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/30'
            }`}
          >
            {isDeduct ? <TrendingDown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>
              {isSubmitting
                ? 'Processing...'
                : numericAmount > 0
                  ? isDeduct
                    ? `Deduct -${formatCurrency(numericAmount, currencyCode)}`
                    : `Save +${formatCurrency(numericAmount, currencyCode)}`
                  : 'Enter Amount'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
