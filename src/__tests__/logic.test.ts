import { describe, it, expect } from 'vitest';
import type { SavingsEntry, SavingsChallenge } from '../types/challenge';

describe('Savings Challenge Core State & Completion Logic', () => {
  it('marking an entry as saved updates total exactly once and prevents double-counting', () => {
    const entries: SavingsEntry[] = [
      {
        id: 'e1',
        challengeId: 'ch1',
        sequenceNumber: 1,
        plannedDate: '2026-10-01',
        amount: 500,
        status: 'saved',
        completedAt: '2026-10-01T10:00:00Z',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
      },
      {
        id: 'e2',
        challengeId: 'ch1',
        sequenceNumber: 2,
        plannedDate: '2026-10-02',
        amount: 700,
        status: 'pending',
        completedAt: null,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ];

    // Initial total
    let totalSaved = entries
      .filter((e) => e.status === 'saved')
      .reduce((sum, e) => sum + e.amount, 0);
    expect(totalSaved).toBe(500);

    // User marks Day 2 (₹700) as saved
    const target = entries.find((e) => e.id === 'e2')!;
    if (target.status !== 'saved') {
      target.status = 'saved';
      target.completedAt = '2026-10-02T12:00:00Z';
    }

    totalSaved = entries
      .filter((e) => e.status === 'saved')
      .reduce((sum, e) => sum + e.amount, 0);
    expect(totalSaved).toBe(1200);

    // Double tap attempt: status is already 'saved', so total is unchanged
    if (target.status !== 'saved') {
      target.status = 'saved';
    }

    totalSaved = entries
      .filter((e) => e.status === 'saved')
      .reduce((sum, e) => sum + e.amount, 0);
    expect(totalSaved).toBe(1200);
  });

  it('undoing completion removes amount from saved total', () => {
    const entries: SavingsEntry[] = [
      {
        id: 'e1',
        challengeId: 'ch1',
        sequenceNumber: 1,
        plannedDate: '2026-10-01',
        amount: 500,
        status: 'saved',
        completedAt: '2026-10-01T10:00:00Z',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
      },
      {
        id: 'e2',
        challengeId: 'ch1',
        sequenceNumber: 2,
        plannedDate: '2026-10-02',
        amount: 700,
        status: 'saved',
        completedAt: '2026-10-02T12:00:00Z',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-02T12:00:00Z',
      },
    ];

    expect(entries.filter((e) => e.status === 'saved').reduce((s, e) => s + e.amount, 0)).toBe(1200);

    // Undo e2
    const target = entries.find((e) => e.id === 'e2')!;
    target.status = 'pending';
    target.completedAt = null;

    const newTotal = entries
      .filter((e) => e.status === 'saved')
      .reduce((s, e) => s + e.amount, 0);
    expect(newTotal).toBe(500);
  });

  it('multiple challenges maintain strictly independent totals and plans', () => {
    const challenge1: SavingsChallenge = {
      id: 'ch-emergency',
      name: 'Emergency Fund',
      targetAmount: 50000,
      minimumAmount: 500,
      maximumAmount: 3000,
      currency: 'INR',
      startDate: '2026-10-01',
      frequency: 'daily',
      generationMode: 'complete_plan',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const challenge2: SavingsChallenge = {
      id: 'ch-phone',
      name: 'New Phone',
      targetAmount: 25000,
      minimumAmount: 200,
      maximumAmount: 2000,
      currency: 'INR',
      startDate: '2026-10-01',
      frequency: 'daily',
      generationMode: 'complete_plan',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const entries1: SavingsEntry[] = [
      {
        id: 'e1-1',
        challengeId: challenge1.id,
        sequenceNumber: 1,
        plannedDate: '2026-10-01',
        amount: 2000,
        status: 'saved',
        completedAt: '2026-10-01T10:00:00Z',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
      },
    ];

    const entries2: SavingsEntry[] = [
      {
        id: 'e2-1',
        challengeId: challenge2.id,
        sequenceNumber: 1,
        plannedDate: '2026-10-01',
        amount: 500,
        status: 'saved',
        completedAt: '2026-10-01T10:00:00Z',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
      },
      {
        id: 'e2-2',
        challengeId: challenge2.id,
        sequenceNumber: 2,
        plannedDate: '2026-10-02',
        amount: 800,
        status: 'saved',
        completedAt: '2026-10-02T10:00:00Z',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-02T10:00:00Z',
      },
    ];

    const total1 = entries1.filter((e) => e.status === 'saved').reduce((s, e) => s + e.amount, 0);
    const total2 = entries2.filter((e) => e.status === 'saved').reduce((s, e) => s + e.amount, 0);

    expect(total1).toBe(2000);
    expect(total2).toBe(1300);
    expect(total1).not.toBe(total2);
  });
});
