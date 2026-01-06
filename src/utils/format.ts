/**
 * Format a number as Indian Rupees currency
 */
export const formatCurrency = (amount: number, locale = 'en-IN'): string => {
  return `₹ ${amount.toLocaleString(locale)}`;
};

/**
 * Get label for a type value from options array
 */
export const getTypeLabel = (type: string, options: { value: string; label: string }[]): string => {
  const option = options.find((o) => o.value === type);
  return option?.label || type;
};
