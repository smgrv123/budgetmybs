// Shared Intl.NumberFormat instance for Indian locale
const indianNumberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
});

const indianCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

/**
 * Format a number with Indian comma separators
 * @param amount - Number or string to format
 * @param includeCurrencySymbol - Whether to include ₹ symbol (default: false)
 * @returns Formatted string (e.g., "10,00,000" or "₹10,00,000.00")
 */
export const formatIndianNumber = (amount: number | string, includeCurrencySymbol = false): string => {
  if (amount === '' || amount == null) return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';

  return includeCurrencySymbol ? indianCurrencyFormatter.format(num) : indianNumberFormatter.format(num);
};

/**
 * Alias for formatIndianNumber with currency symbol
 * Use this for display contexts (ItemCard, summaries, etc.)
 */
export const formatCurrency = (amount: number): string => {
  return formatIndianNumber(amount, true);
};

/**
 * Parse a formatted string back to a number
 * Removes commas and currency symbols
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value) return 0;
  // Remove currency symbol and commas
  const cleaned = value.replace(/[₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
};
