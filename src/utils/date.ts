import dayjs from 'dayjs';

export const formatDate = (date?: string | Date | number, formatStr: string = 'dddd, D MMMM'): string => {
  return dayjs(date).format(formatStr);
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const formatLocalDateToISO = (date: Date): string => dayjs(date).format('YYYY-MM-DD');

export const isISODateString = (value: string): boolean => {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
};

export const parseISOToLocalDate = (iso: string): Date => {
  if (!isISODateString(iso)) {
    return new Date();
  }

  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
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
