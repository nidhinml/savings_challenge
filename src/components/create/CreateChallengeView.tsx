import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { SavingsFrequency, GenerationMode } from '../../types/challenge';
import { SUPPORTED_CURRENCIES, formatCurrency } from '../../lib/currency';
import { validatePartitionFeasibility, generateConstrainedPartition } from '../../lib/partition';
import { getTodayDateString } from '../../lib/scheduler';
import {
  Sparkles,
  AlertCircle,
  Calculator,
  CheckCircle2,
} from 'lucide-react';

interface CreateChallengeViewProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateChallengeView: React.FC<CreateChallengeViewProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { settings, createChallenge } = useApp();

  const [name, setName] = useState('Emergency Fund');
  const [currency, setCurrency] = useState(settings.currency || 'INR');
  const [targetAmount, setTargetAmount] = useState<number>(settings.defaultTargetAmount || 10000);
  const [minAmount, setMinAmount] = useState<number>(settings.defaultMinimumAmount || 100);
  const [maxAmount, setMaxAmount] = useState<number>(settings.defaultMaximumAmount || 1500);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [frequency, setFrequency] = useState<SavingsFrequency>(settings.defaultFrequency || 'daily');
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    settings.defaultGenerationMode || 'complete_plan'
  );
  const [notes, setNotes] = useState('');
  const [previewPlan, setPreviewPlan] = useState<number[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target preset amounts
  const TARGET_PRESETS = [5000, 10000, 25000, 50000, 100000];

  // Validation calculation
  const validation = useMemo(() => {
    return validatePartitionFeasibility(targetAmount, minAmount, maxAmount);
  }, [targetAmount, minAmount, maxAmount]);

  const handleGeneratePreview = () => {
    if (!validation.isValid) return;
    try {
      const plan = generateConstrainedPartition(targetAmount, minAmount, maxAmount);
      setPreviewPlan(plan);
    } catch {
      setPreviewPlan(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await createChallenge({
        name: name.trim() || 'Savings Goal',
        targetAmount,
        minimumAmount: minAmount,
        maximumAmount: maxAmount,
        currency,
        startDate,
        frequency,
        generationMode,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Create Savings Challenge
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure your goal, daily limits, and smart randomized partition algorithm.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Name & Currency */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Goal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Laptop, Vacation, Emergency Fund"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm text-slate-900 dark:text-white"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Amount & Presets */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Target Amount
          </label>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {TARGET_PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setTargetAmount(amt);
                  setPreviewPlan(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  targetAmount === amt
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {formatCurrency(amt, currency)}
              </button>
            ))}
          </div>

          <div className="relative mt-2">
            <input
              type="number"
              min={1}
              step={1}
              value={targetAmount || ''}
              onChange={(e) => {
                setTargetAmount(Math.max(0, parseInt(e.target.value) || 0));
                setPreviewPlan(null);
              }}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-extrabold text-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Daily Range: Min and Max */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Random Savings Range
            </span>
            <span className="text-xs text-slate-400 font-medium">Daily limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Minimum Daily Amount
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={minAmount || ''}
                onChange={(e) => {
                  setMinAmount(Math.max(1, parseInt(e.target.value) || 1));
                  setPreviewPlan(null);
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-base text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Maximum Daily Amount
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={maxAmount || ''}
                onChange={(e) => {
                  setMaxAmount(Math.max(1, parseInt(e.target.value) || 1));
                  setPreviewPlan(null);
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-base text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Validation Feedback / Warnings */}
          {!validation.isValid && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{validation.errorMessage}</p>
                {validation.suggestedTarget && (
                  <p className="mt-1">
                    Suggested target: <strong>{formatCurrency(validation.suggestedTarget, currency)}</strong>
                    <button
                      type="button"
                      onClick={() => setTargetAmount(validation.suggestedTarget!)}
                      className="ml-2 underline font-bold"
                    >
                      Apply suggestion
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          {validation.isValid && validation.minDays && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Feasible in <strong>{validation.minDays}</strong> to <strong>{validation.maxDays}</strong> savings days.
              </span>
            </div>
          )}
        </div>

        {/* Schedule & Frequency */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Savings Schedule & Frequency
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'daily' as SavingsFrequency, title: 'Daily', desc: 'Every day' },
              { id: 'weekdays' as SavingsFrequency, title: 'Weekdays', desc: 'Mon - Fri' },
              { id: 'weekly' as SavingsFrequency, title: 'Weekly', desc: 'Once a week' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id)}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  frequency === f.id
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold text-xs">{f.title}</div>
                <div className="text-[10px] opacity-75 mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Generation Mode Selector */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Challenge Generation Mode
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGenerationMode('complete_plan')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                generationMode === 'complete_plan'
                  ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-900 dark:text-brand-200 ring-2 ring-brand-500/20 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Mode A: Complete Plan
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generates the full timeline upfront. You can inspect all days and track progress.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setGenerationMode('daily_surprise')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                generationMode === 'daily_surprise'
                  ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-900 dark:text-brand-200 ring-2 ring-brand-500/20 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-brand-500" />
                Mode B: Daily Surprise
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Reveals one new amount at a time as you save, keeping the target on track.
              </p>
            </button>
          </div>
        </div>

        {/* Optional Motivation Notes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Goal Motivation / Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Save ₹500 every few days for flight tickets or rainy day buffer"
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-xs text-slate-900 dark:text-white resize-none"
          />
        </div>

        {/* Live Preview Button */}
        {generationMode === 'complete_plan' && validation.isValid && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleGeneratePreview}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {previewPlan ? 'Regenerate Preview Plan' : 'Preview Generated Amounts'}
            </button>

            {previewPlan && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <span>Preview Plan ({previewPlan.length} entries)</span>
                  <span>Total: {formatCurrency(previewPlan.reduce((a, b) => a + b, 0), currency)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {previewPlan.map((amount, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                    >
                      D{idx + 1}: {formatCurrency(amount, currency)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!validation.isValid || isSubmitting}
            className="px-7 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 active:scale-95 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating Goal...' : 'Launch Savings Challenge'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
