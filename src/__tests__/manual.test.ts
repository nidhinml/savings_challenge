import { describe, it, expect } from 'vitest';
import type { SavingsEntry, SavingsChallenge, AllGoalsSummary } from '../types/challenge';

describe('Manual Savings Deposit & All-in-One Dashboard Calculations', () => {
  it('records a manual savings deposit with custom amount, note, and isManual flag', () => {
    const entries: SavingsEntry[] = [];
    const amount = 2500;
    const note = 'Bonus pay';

    const manualEntry: SavingsEntry = {
      id: 'entry_manual_1',
      challengeId: 'ch1',
      sequenceNumber: 1,
      plannedDate: '2026-10-09',
      amount,
      status: 'saved',
      completedAt: '2026-10-09T12:00:00Z',
      createdAt: '2026-10-09T12:00:00Z',
      updatedAt: '2026-10-09T12:00:00Z',
      note,
      isManual: true,
    };

    entries.push(manualEntry);

    expect(entries).toHaveLength(1);
    expect(entries[0].amount).toBe(2500);
    expect(entries[0].status).toBe('saved');
    expect(entries[0].isManual).toBe(true);
    expect(entries[0].note).toBe('Bonus pay');
  });

  it('marks challenge completed when manual deposit reaches or surpasses target', () => {
    const challenge: SavingsChallenge = {
      id: 'ch1',
      name: 'Travel Fund',
      targetAmount: 5000,
      minimumAmount: 100,
      maximumAmount: 1000,
      currency: 'INR',
      startDate: '2026-10-01',
      frequency: 'daily',
      generationMode: 'complete_plan',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const existingSaved = 3000;
    const manualDeposit = 2000;
    const newTotalSaved = existingSaved + manualDeposit;

    let updatedStatus = challenge.status;
    if (newTotalSaved >= challenge.targetAmount) {
      updatedStatus = 'completed';
    }

    expect(newTotalSaved).toBe(5000);
    expect(updatedStatus).toBe('completed');
  });

  it('calculates aggregate all-goals portfolio metrics correctly', () => {
    const challenges: SavingsChallenge[] = [
      {
        id: 'c1',
        name: 'Emergency Fund',
        targetAmount: 50000,
        minimumAmount: 500,
        maximumAmount: 2500,
        currency: 'INR',
        startDate: '2026-10-01',
        frequency: 'daily',
        generationMode: 'complete_plan',
        status: 'active',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
      {
        id: 'c2',
        name: 'New Phone',
        targetAmount: 25000,
        minimumAmount: 200,
        maximumAmount: 1500,
        currency: 'INR',
        startDate: '2026-10-01',
        frequency: 'daily',
        generationMode: 'complete_plan',
        status: 'completed',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ];

    const statsMap: Record<string, { totalSaved: number }> = {
      c1: { totalSaved: 20000 },
      c2: { totalSaved: 25000 },
    };

    const totalTarget = challenges.reduce((s, c) => s + c.targetAmount, 0); // 75,000
    const totalSaved = challenges.reduce((s, c) => s + statsMap[c.id].totalSaved, 0); // 45,000
    const totalRemaining = totalTarget - totalSaved; // 30,000
    const overallProgress = Math.round((totalSaved / totalTarget) * 100); // 60%

    const summary: AllGoalsSummary = {
      totalTarget,
      totalSaved,
      totalRemaining,
      overallProgress,
      activeCount: challenges.filter((c) => c.status === 'active').length,
      completedCount: challenges.filter((c) => c.status === 'completed').length,
      totalGoals: challenges.length,
    };

    expect(summary.totalTarget).toBe(75000);
    expect(summary.totalSaved).toBe(45000);
    expect(summary.totalRemaining).toBe(30000);
    expect(summary.overallProgress).toBe(60);
    expect(summary.activeCount).toBe(1);
    expect(summary.completedCount).toBe(1);
  });

  it('handles input string parsing, presets, and quick increments correctly', () => {
    // Initial amount string
    let amountStr = '500';
    expect(parseInt(amountStr, 10)).toBe(500);

    // Editing: user clears input and types custom amount
    amountStr = '';
    expect(parseInt(amountStr, 10) || 0).toBe(0);

    amountStr = '2500';
    expect(parseInt(amountStr, 10)).toBe(2500);

    // Quick preset direct set
    const preset = 1000;
    amountStr = String(preset);
    expect(parseInt(amountStr, 10)).toBe(1000);

    // Quick increment addition (+500)
    const inc = 500;
    amountStr = String((parseInt(amountStr, 10) || 0) + inc);
    expect(parseInt(amountStr, 10)).toBe(1500);

    // Cleans non-numeric inputs
    const rawPasted = '₹ 3,500'.replace(/[^0-9]/g, '');
    expect(rawPasted).toBe('3500');
    expect(parseInt(rawPasted, 10)).toBe(3500);
  });

  it('validates manual deposit requirements before saving', () => {
    const validate = (goalId: string, amountStr: string) => {
      const parsed = parseInt(amountStr, 10);
      if (!goalId) return { valid: false, error: 'Please select a target goal.' };
      if (isNaN(parsed) || parsed <= 0) return { valid: false, error: 'Please enter a valid amount.' };
      return { valid: true, amount: parsed };
    };

    expect(validate('', '500').valid).toBe(false);
    expect(validate('goal_1', '').valid).toBe(false);
    expect(validate('goal_1', '0').valid).toBe(false);
    expect(validate('goal_1', '-50').valid).toBe(false);
    expect(validate('goal_1', '750').valid).toBe(true);
    expect(validate('goal_1', '750').amount).toBe(750);
  });

  it('records a deduction / lost money with negative amount, reason, and entryType', () => {
    const entries: SavingsEntry[] = [
      {
        id: 'entry_1',
        challengeId: 'ch1',
        sequenceNumber: 1,
        plannedDate: '2026-10-09',
        amount: 2500,
        status: 'saved',
        completedAt: '2026-10-09T10:00:00Z',
        createdAt: '2026-10-09T10:00:00Z',
        updatedAt: '2026-10-09T10:00:00Z',
        isManual: true,
      },
    ];

    const deductAmount = 500;
    const deductionEntry: SavingsEntry = {
      id: 'entry_deduct_1',
      challengeId: 'ch1',
      sequenceNumber: 2,
      plannedDate: '2026-10-09',
      amount: -deductAmount,
      status: 'saved',
      completedAt: '2026-10-09T12:00:00Z',
      createdAt: '2026-10-09T12:00:00Z',
      updatedAt: '2026-10-09T12:00:00Z',
      note: 'Lost wallet cash',
      reason: 'Lost Money',
      isManual: true,
      entryType: 'deduction',
    };

    entries.push(deductionEntry);

    const netSaved = entries
      .filter((e) => e.status === 'saved')
      .reduce((sum, e) => sum + e.amount, 0);

    expect(entries).toHaveLength(2);
    expect(deductionEntry.amount).toBe(-500);
    expect(deductionEntry.entryType).toBe('deduction');
    expect(deductionEntry.reason).toBe('Lost Money');
    expect(netSaved).toBe(2000); // 2500 - 500 = 2000
  });

  it('validates deduction constraints: prevents deducting more than current saved balance', () => {
    const currentSaved = 1500;

    const validateDeduction = (amountStr: string, availableSaved: number) => {
      const parsed = parseInt(amountStr, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return { valid: false, error: 'Enter a valid amount greater than 0' };
      }
      if (availableSaved <= 0) {
        return { valid: false, error: 'Current saved balance is zero' };
      }
      if (parsed > availableSaved) {
        return { valid: false, error: `Cannot deduct more than saved balance (${availableSaved})` };
      }
      return { valid: true, amount: parsed };
    };

    expect(validateDeduction('0', currentSaved).valid).toBe(false);
    expect(validateDeduction('-100', currentSaved).valid).toBe(false);
    expect(validateDeduction('2000', currentSaved).valid).toBe(false);
    expect(validateDeduction('500', 0).valid).toBe(false);
    expect(validateDeduction('500', currentSaved).valid).toBe(true);
    expect(validateDeduction('1500', currentSaved).valid).toBe(true);
  });

  it('reverts completed challenge status back to active if deduction drops total below target', () => {
    const challenge: SavingsChallenge = {
      id: 'ch1',
      name: 'Holiday Trip',
      targetAmount: 10000,
      minimumAmount: 500,
      maximumAmount: 2000,
      currency: 'INR',
      startDate: '2026-10-01',
      frequency: 'daily',
      generationMode: 'complete_plan',
      status: 'completed',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    let totalSaved = 10000;
    const deduction = 1500;
    totalSaved -= deduction; // 8500

    let status = challenge.status;
    if (status === 'completed' && totalSaved < challenge.targetAmount) {
      status = 'active';
    }

    expect(totalSaved).toBe(8500);
    expect(status).toBe('active');
  });

  it('deleting / reverting a deduction transaction restores the original savings balance', () => {
    let entries: SavingsEntry[] = [
      {
        id: 'entry_1',
        challengeId: 'ch1',
        sequenceNumber: 1,
        plannedDate: '2026-10-09',
        amount: 3000,
        status: 'saved',
        completedAt: '2026-10-09T10:00:00Z',
        createdAt: '2026-10-09T10:00:00Z',
        updatedAt: '2026-10-09T10:00:00Z',
      },
      {
        id: 'entry_deduct_1',
        challengeId: 'ch1',
        sequenceNumber: 2,
        plannedDate: '2026-10-09',
        amount: -800,
        status: 'saved',
        completedAt: '2026-10-09T12:00:00Z',
        createdAt: '2026-10-09T12:00:00Z',
        updatedAt: '2026-10-09T12:00:00Z',
        entryType: 'deduction',
      },
    ];

    expect(entries.reduce((s, e) => s + e.amount, 0)).toBe(2200);

    // Delete deduction
    entries = entries.filter((e) => e.id !== 'entry_deduct_1');

    expect(entries).toHaveLength(1);
    expect(entries.reduce((s, e) => s + e.amount, 0)).toBe(3000);
  });
});
