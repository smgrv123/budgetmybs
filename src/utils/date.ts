import dayjs from 'dayjs';

export const formatDate = (date?: string | Date | number, formatStr: string = 'dddd, D MMMM'): string => {
  return dayjs(date).format(formatStr);
};

export const getCurrentDateFormatted = (formatStr: string = 'dddd, D MMMM'): string => {
  return dayjs().format(formatStr);
};
