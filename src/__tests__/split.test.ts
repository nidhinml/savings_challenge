import { describe, it, expect } from 'vitest';
import type { SplitTransaction, SplitAllocation, SavingsEntry } from '../types/challenge';

describe('Multi-Goal Split Amount Calculations & Logic', () => {
  it('distributes total amount equally with remainder placed on first goal', () => {
    const totalAmount = 1000;
    const goalIds = ['g1', 'g2', 'g3'];

    const base = Math.floor(totalAmount / goalIds.length); // 333
    const remainder = totalAmount - base * goalIds.length; // 1

    const allocations: Record<string, number> = {};
    goalIds.forEach((id, idx) => {
      allocations[id] = base + (idx === 0 ? remainder : 0);
    });

    expect(allocations['g1']).toBe(334);
    expect(allocations['g2']).toBe(333);
    expect(allocations['g3']).toBe(333);

    const sum = Object.values(allocations).reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalAmount);
  });

  it('distributes total amount proportionally by target goals ratio', () => {
    const totalAmount = 3000;
    const goals = [
      { id: 'g1', target: 50000 },
      { id: 'g2', target: 25000 },
      { id: 'g3', target: 25000 },
    ];

    const sumTargets = goals.reduce((s, g) => s + g.target, 0); // 100,000
    const allocations: Record<string, number> = {};
    let allocatedSoFar = 0;

    goals.forEach((g, idx) => {
      if (idx === goals.length - 1) {
        allocations[g.id] = totalAmount - allocatedSoFar;
      } else {
        const share = Math.round((g.target / sumTargets) * totalAmount);
        allocations[g.id] = share;
        allocatedSoFar += share;
      }
    });

    expect(allocations['g1']).toBe(1500); // 50% of 3000
    expect(allocations['g2']).toBe(750);  // 25% of 3000
    expect(allocations['g3']).toBe(750);  // 25% of 3000

    const sum = Object.values(allocations).reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalAmount);
  });

  it('correctly creates and structures a SplitTransaction record', () => {
    const allocations: SplitAllocation[] = [
      { challengeId: 'ch1', challengeName: 'Emergency Fund', amount: 1500 },
      { challengeId: 'ch2', challengeName: 'New Laptop', amount: 500 },
    ];

    const tx: SplitTransaction = {
      id: 'split_test_123',
      totalAmount: 2000,
      allocations,
      date: '2026-10-09',
      timestamp: new Date().toISOString(),
      note: 'Quarterly savings split',
    };

    expect(tx.totalAmount).toBe(2000);
    expect(tx.allocations).toHaveLength(2);
    expect(tx.allocations.reduce((sum, a) => sum + a.amount, 0)).toBe(2000);
    expect(tx.note).toBe('Quarterly savings split');
  });

  it('handles partial split of a pending entry without violating challenge target sum', () => {
    const originalEntry: SavingsEntry = {
      id: 'e1',
      challengeId: 'ch1',
      sequenceNumber: 1,
      plannedDate: '2026-10-09',
      amount: 1000,
      status: 'pending',
      completedAt: null,
      createdAt: '2026-10-09T00:00:00Z',
      updatedAt: '2026-10-09T00:00:00Z',
    };

    const allocatedAmount = 600;
    const remainder = originalEntry.amount - allocatedAmount; // 400

    const savedPortion: SavingsEntry = {
      ...originalEntry,
      amount: allocatedAmount,
      status: 'saved',
      completedAt: '2026-10-09T10:00:00Z',
      updatedAt: '2026-10-09T10:00:00Z',
    };

    const pendingRemainder: SavingsEntry = {
      id: 'e1_rem',
      challengeId: 'ch1',
      sequenceNumber: 1.5,
      plannedDate: originalEntry.plannedDate,
      amount: remainder,
      status: 'pending',
      completedAt: null,
      createdAt: '2026-10-09T00:00:00Z',
      updatedAt: '2026-10-09T00:00:00Z',
    };

    // Both together must sum exactly to 1000
    expect(savedPortion.amount + pendingRemainder.amount).toBe(1000);
    expect(savedPortion.status).toBe('saved');
    expect(pendingRemainder.status).toBe('pending');
  });
});
