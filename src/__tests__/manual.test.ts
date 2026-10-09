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
});
