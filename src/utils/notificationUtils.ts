import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import { NotificationCopies, type NotificationScenarioType } from '@/src/constants/notifications.strings';

/**
 * Given a dayOfMonth and today, returns the next upcoming day-of and 2-day-before trigger dates.
 * If the day has already passed (or is today), rolls to the following month.
 * Clamps dayOfMonth to the actual number of days in the target month.
 */
export const computeTriggerDates = (dayOfMonth: number, today: dayjs.Dayjs) => {
  const safeDay = Math.min(dayOfMonth, today.daysInMonth());
  const thisMonthTarget = today.date(safeDay);

  let dayOf;

  if (thisMonthTarget.isAfter(today, 'day')) {
    dayOf = thisMonthTarget;
  } else {
    const nextMonth = today.add(1, 'month').startOf('month');
    dayOf = nextMonth.date(Math.min(dayOfMonth, nextMonth.daysInMonth()));
  }

  return { dayOf, twoDayBefore: dayOf.subtract(2, 'day') };
};

/**
 * Given a credit card's statementDayOfMonth and paymentBufferDays, returns the next upcoming
 * payment due date and 2-day-before trigger.
 * Due date = statement close date + buffer days (handles month overflow via dayjs arithmetic).
 * Rolls to the next cycle if the due date has already passed (or is today).
 */
export const computeCreditCardDueDate = (
  statementDayOfMonth: number,
  paymentBufferDays: number,
  today: dayjs.Dayjs
) => {
  const thisMonthClose = today.date(statementDayOfMonth);
  const thisMonthDue = thisMonthClose.add(paymentBufferDays, 'day');

  let dayOf;

  if (thisMonthDue.isAfter(today, 'day')) {
    dayOf = thisMonthDue;
  } else {
    const nextMonthClose = today.add(1, 'month').startOf('month').date(statementDayOfMonth);
    dayOf = nextMonthClose.add(paymentBufferDays, 'day');
  }

  return { dayOf, twoDayBefore: dayOf.subtract(2, 'day') };
};

/**
 * Returns a random hour (12–20) and minute (0–59) for notification delivery.
 * Ensures notifications feel natural rather than scheduled.
 */
export const getRandomTime = (): { hour: number; minute: number } => ({
  hour: Math.floor(Math.random() * 9) + 12,
  minute: Math.floor(Math.random() * 60),
});

/**
 * Computes whether a frivolous budget alert should be shown after adding an expense.
 * Returns 'warning' at ≥80%, 'error' at >100%, or null if below the threshold.
 *
 * Pure function — safe to unit test in isolation.
 */
export const computeFrivolousBudgetAlert = (
  newTotalSpent: number,
  totalFrivolousBudget: number
): 'warning' | 'error' | null => {
  if (totalFrivolousBudget <= 0) return null;
  const ratio = newTotalSpent / totalFrivolousBudget;
  if (ratio > 1) return 'error';
  if (ratio >= 0.8) return 'warning';
  return null;
};

/**
 * Picks a random copy from the given scenario pool, avoiding the last used index.
 * Reads and writes the last-used index via AsyncStorage to prevent immediate repeats.
 */
export const pickNotificationCopy = async (
  scenario: NotificationScenarioType,
  params: { name?: string; amount?: string }
): Promise<{ title: string; body: string }> => {
  const pool = NotificationCopies[scenario];
  const storageKey = `${AsyncStorageKeys.NOTIFICATION_LAST_COPY_PREFIX}${scenario}`;

  const lastIndexStr = await AsyncStorage.getItem(storageKey);
  const lastIndex = lastIndexStr !== null ? parseInt(lastIndexStr, 10) : -1;

  const availableIndices = pool.map((_, i) => i).filter((i) => i !== lastIndex);
  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

  await AsyncStorage.setItem(storageKey, String(randomIndex));

  const template = pool[randomIndex];
  return {
    title: template.title,
    body: template.body(params.name, params.amount),
  };
};
