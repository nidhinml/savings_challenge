import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency, getCurrencySymbol } from '../lib/currency';

describe('Currency Formatter', () => {
  describe('INR Formatting', () => {
    it('formats Indian Rupee with currency symbol and grouping', () => {
      const formatted10k = formatCurrency(10000, 'INR');
      expect(formatted10k).toContain('10,000');
      expect(formatted10k).toContain('₹');

      const formatted1L = formatCurrency(100000, 'INR');
      // Indian system groups 1,00,000
      expect(formatted1L).toContain('1,00,000');
      expect(formatted1L).toContain('₹');
    });

    it('formats compact representations correctly', () => {
      expect(formatCompactCurrency(10000, 'INR')).toBe('₹10k');
      expect(formatCompactCurrency(100000, 'INR')).toBe('₹1L');
      expect(formatCompactCurrency(10000000, 'INR')).toBe('₹1Cr');
    });
  });

  describe('Multi-currency formatting', () => {
    it('formats USD and GBP correctly', () => {
      const usd = formatCurrency(5000, 'USD');
      expect(usd).toContain('5,000');
      expect(usd).toContain('$');

      const gbp = formatCurrency(5000, 'GBP');
      expect(gbp).toContain('5,000');
      expect(gbp).toContain('£');
    });

    it('returns proper currency symbols', () => {
      expect(getCurrencySymbol('INR')).toBe('₹');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
    });
  });
});
