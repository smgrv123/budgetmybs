/**
 * Date and time utility functions using dayjs
 */

import dayjs from 'dayjs';

// ============================================
// RECURRING KEY FORMAT
// ============================================

/**
 * Generate a dedup key for recurring transactions
 * Format: "sourceType:sourceId"
 */
export const makeRecurringKey = (sourceType: string, sourceId: string): string => `${sourceType}:${sourceId}`;

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Get current month in YYYY-MM format
 * @returns Current month string (e.g., "2025-12")
 */
export const getCurrentMonth = (): string => {
  return dayjs().format('YYYY-MM');
};

/**
 * Format a date as YYYY-MM-DD
 * @param date - Date to format (defaults to current date)
 * @returns Formatted date string (e.g., "2025-12-28")
 */
export const formatDate = (date?: Date | string | dayjs.Dayjs): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns Current date string
 */
export const getCurrentDate = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

/**
 * Get month from a date string
 * @param date - Date string in YYYY-MM-DD format
 * @returns Month string in YYYY-MM format
 */
export const getMonthFromDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM');
};

/**
 * Get the first day of a month
 * @param month - Month string in YYYY-MM format
 * @returns Date string in YYYY-MM-DD format
 */
export const getFirstDayOfMonth = (month: string): string => {
  return dayjs(month).startOf('month').format('YYYY-MM-DD');
};

/**
 * Get the last day of a month
 * @param month - Month string in YYYY-MM format
 * @returns Date string in YYYY-MM-DD format
 */
export const getLastDayOfMonth = (month: string): string => {
  return dayjs(month).endOf('month').format('YYYY-MM-DD');
};

/**
 * Get previous month in YYYY-MM format
 * @param month - Month string in YYYY-MM format (defaults to current month)
 * @returns Previous month string
 */
export const getPreviousMonth = (month?: string): string => {
  return dayjs(month).subtract(1, 'month').format('YYYY-MM');
};

/**
 * Get next month in YYYY-MM format
 * @param month - Month string in YYYY-MM format (defaults to current month)
 * @returns Next month string
 */
export const getNextMonth = (month?: string): string => {
  return dayjs(month).add(1, 'month').format('YYYY-MM');
};

/**
 * Check if a date is in the current month
 * @param date - Date string in YYYY-MM-DD format
 * @returns True if date is in current month
 */
export const isCurrentMonth = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), 'month');
};

/**
 * Get human-readable month name
 * @param month - Month string in YYYY-MM format
 * @returns Month name (e.g., "December 2025")
 */
export const getMonthName = (month: string): string => {
  return dayjs(month).format('MMMM YYYY');
};

/**
 * Get short month name
 * @param month - Month string in YYYY-MM format
 * @returns Short month name (e.g., "Dec 2025")
 */
export const getShortMonthName = (month: string): string => {
  return dayjs(month).format('MMM YYYY');
};

export const generateUUID = (): string => {
  // Preferred path (modern browsers + Node 16.17+)
  try {
    const cryptoObj = globalThis.crypto as Crypto | undefined;
    if (cryptoObj?.randomUUID) {
      return cryptoObj.randomUUID();
    }
  } catch {
    console.error('crypto.randomUUID not supported');
  }

  // Fallback: RFC 4122 UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = (Math.random() * 16) | 0;
    const v = char === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
