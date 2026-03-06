import dayjs from 'dayjs';

export const formatDate = (date?: string | Date | number, formatStr: string = 'dddd, D MMMM'): string => {
  return dayjs(date).format(formatStr);
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Converts a "YYYY-MM" string to a human-readable label e.g. "March 2026"
 */
export const formatMonthLabel = (yyyyMM: string): string => {
  const [year, month] = yyyyMM.split('-');
  const monthName = MONTH_NAMES[parseInt(month, 10) - 1] ?? month;
  return `${monthName} ${year}`;
};
