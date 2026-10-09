export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', locale: 'ar-AE', flag: '🇦🇪' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', flag: '🇯🇵' },
];

/**
 * Format currency with proper locale grouping (e.g., ₹1,00,000 for INR, $10,000 for USD)
 */
export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback if environment doesn't support the specific locale
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(currencyCode: string = 'INR'): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  return currency ? currency.symbol : '₹';
}

/**
 * Format numbers with compact notation (e.g. 10k, 1L for Indian, 1M)
 */
export function formatCompactCurrency(amount: number, currencyCode: string = 'INR'): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];

  if (currencyCode === 'INR') {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `₹${amount}`;
  }

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatCurrency(amount, currencyCode);
  }
}
