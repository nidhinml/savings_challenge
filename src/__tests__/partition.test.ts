import { describe, it, expect } from 'vitest';
import {
  validatePartitionFeasibility,
  generateConstrainedPartition,
  generateNextSurpriseAmount,
} from '../lib/partition';

describe('Constrained Partition Algorithm & Validation', () => {
  describe('validatePartitionFeasibility', () => {
    it('accepts valid standard configuration', () => {
      const res = validatePartitionFeasibility(10000, 100, 1500);
      expect(res.isValid).toBe(true);
      expect(res.minDays).toBeDefined();
      expect(res.maxDays).toBeDefined();
      expect(res.minDays!).toBeLessThanOrEqual(res.maxDays!);
    });

    it('rejects non-positive targets', () => {
      expect(validatePartitionFeasibility(0, 100, 500).isValid).toBe(false);
      expect(validatePartitionFeasibility(-500, 100, 500).isValid).toBe(false);
    });

    it('rejects target smaller than minimum amount', () => {
      const res = validatePartitionFeasibility(50, 100, 500);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('cannot be smaller than minimum');
    });

    it('rejects maximum smaller than minimum', () => {
      const res = validatePartitionFeasibility(1000, 500, 200);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('cannot be less than minimum');
    });

    it('identifies impossible targets in interval gaps and offers suggestions', () => {
      // min=100, max=120:
      // k=1 => [100, 120]
      // k=2 => [200, 240]
      // 150 cannot be represented as sum of integers in [100, 120]
      const res = validatePartitionFeasibility(150, 100, 120);
      expect(res.isValid).toBe(false);
      expect(res.suggestedTarget).toBeDefined();
    });
  });

  describe('generateConstrainedPartition', () => {
    it('generates partition where sum strictly equals target ₹10,000', () => {
      const target = 10000;
      const min = 100;
      const max = 1500;
      const plan = generateConstrainedPartition(target, min, max);

      const sum = plan.reduce((a, b) => a + b, 0);
      expect(sum).toBe(target);

      // Verify every element is within [min, max] and is whole integer
      for (const amt of plan) {
        expect(amt).toBeGreaterThanOrEqual(min);
        expect(amt).toBeLessThanOrEqual(max);
        expect(Number.isInteger(amt)).toBe(true);
      }
    });

    it('handles custom targets: ₹5,000, ₹25,000, ₹50,000, ₹1,00,000', () => {
      const testCases = [
        { target: 5000, min: 50, max: 500 },
        { target: 25000, min: 200, max: 2000 },
        { target: 50000, min: 500, max: 3000 },
        { target: 100000, min: 1000, max: 5000 },
      ];

      for (const tc of testCases) {
        const plan = generateConstrainedPartition(tc.target, tc.min, tc.max);
        const sum = plan.reduce((a, b) => a + b, 0);
        expect(sum).toBe(tc.target);

        for (const amt of plan) {
          expect(amt).toBeGreaterThanOrEqual(tc.min);
          expect(amt).toBeLessThanOrEqual(tc.max);
          expect(Number.isInteger(amt)).toBe(true);
        }
      }
    });

    it('generates different random permutations across multiple calls', () => {
      const p1 = generateConstrainedPartition(10000, 100, 1500);
      const p2 = generateConstrainedPartition(10000, 100, 1500);

      // Both must sum to 10000
      expect(p1.reduce((a, b) => a + b, 0)).toBe(10000);
      expect(p2.reduce((a, b) => a + b, 0)).toBe(10000);

      // Sequences should not be identical (with extremely high probability)
      const identical = p1.length === p2.length && p1.every((v, i) => v === p2[i]);
      expect(identical).toBe(false);
    });

    it('handles boundary condition when target equals minAmount', () => {
      const plan = generateConstrainedPartition(500, 500, 1000);
      expect(plan).toEqual([500]);
    });
  });

  describe('generateNextSurpriseAmount (Mode B)', () => {
    it('generates next amount within bounds that keeps future target feasible', () => {
      let remaining = 10000;
      const min = 100;
      const max = 1500;
      const collected: number[] = [];

      while (remaining > 0) {
        const next = generateNextSurpriseAmount(remaining, min, max);
        expect(next).toBeGreaterThanOrEqual(min);
        expect(next).toBeLessThanOrEqual(max);
        expect(next).toBeLessThanOrEqual(remaining);
        expect(Number.isInteger(next)).toBe(true);

        collected.push(next);
        remaining -= next;

        if (remaining > 0) {
          const v = validatePartitionFeasibility(remaining, min, max);
          expect(v.isValid).toBe(true);
        }
      }

      const total = collected.reduce((a, b) => a + b, 0);
      expect(total).toBe(10000);
      expect(remaining).toBe(0);
    });

    it('finishes remaining target directly when within [min, max]', () => {
      const next = generateNextSurpriseAmount(450, 100, 1500);
      expect(next).toBe(450);
    });
  });
});
