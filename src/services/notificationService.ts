import dayjs from 'dayjs';
import * as Notifications from 'expo-notifications';

import { NotificationScenario, type NotificationScenarioType } from '@/src/constants/notifications.strings';
import { formatCurrency } from '@/src/utils/format';
import {
  computeCreditCardDueDate,
  computeTriggerDates,
  getRandomTime,
  pickNotificationCopy,
} from '@/src/utils/notificationUtils';
import type { CreditCard, Debt, FixedExpense } from '@/db/schema-types';

// Show notifications as banners even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ============================================
// SCHEDULING HELPERS
// ============================================

const applyTimeToDate = (date: dayjs.Dayjs, hour: number, minute: number): Date =>
  date.hour(hour).minute(minute).second(0).millisecond(0).toDate();

const scheduleItemNotifications = async ({
  id,
  type,
  dayOf,
  twoDayBefore,
  twoDayScenario,
  dayOfScenario,
  copyParams,
}: {
  id: string;
  type: string;
  dayOf: dayjs.Dayjs;
  twoDayBefore: dayjs.Dayjs;
  twoDayScenario: NotificationScenarioType;
  dayOfScenario: NotificationScenarioType;
  copyParams: { name?: string; amount?: string };
}): Promise<void> => {
  const [twoDayCopy, dayOfCopy] = await Promise.all([
    pickNotificationCopy(twoDayScenario, copyParams),
    pickNotificationCopy(dayOfScenario, copyParams),
  ]);

  const { hour: h2, minute: m2 } = getRandomTime();
  const { hour: hD, minute: mD } = getRandomTime();

  await Promise.all([
    Notifications.scheduleNotificationAsync({
      identifier: `${type}-${id}-2day`,
      content: { title: twoDayCopy.title, body: twoDayCopy.body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: applyTimeToDate(twoDayBefore, h2, m2) },
    }),
    Notifications.scheduleNotificationAsync({
      identifier: `${type}-${id}-dayof`,
      content: { title: dayOfCopy.title, body: dayOfCopy.body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: applyTimeToDate(dayOf, hD, mD) },
    }),
  ]);
};

// ============================================
// MAIN ENTRY POINT
// ============================================

export interface ScheduleNotificationsParams {
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  creditCards: CreditCard[]; // used in Phase 4
}

/**
 * Cancels all scheduled notifications and reschedules from scratch.
 * Called on app open and whenever relevant query data changes.
 */
export const scheduleAllNotifications = async ({
  fixedExpenses,
  debts,
  creditCards, // Phase 4
}: ScheduleNotificationsParams): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const today = dayjs();

  // Fixed expenses
  for (const expense of fixedExpenses) {
    if (!expense.isActive || expense.dayOfMonth == null) continue;
    const { dayOf, twoDayBefore } = computeTriggerDates(expense.dayOfMonth, today);
    await scheduleItemNotifications({
      id: expense.id,
      type: 'fixed',
      dayOf,
      twoDayBefore,
      twoDayScenario: NotificationScenario.FIXED_EXPENSE_2DAY,
      dayOfScenario: NotificationScenario.FIXED_EXPENSE_DAY_OF,
      copyParams: { name: expense.name, amount: formatCurrency(expense.amount) },
    });
  }

  // Debt EMIs
  for (const debt of debts) {
    if (!debt.isActive || debt.dayOfMonth == null) continue;
    const { dayOf, twoDayBefore } = computeTriggerDates(debt.dayOfMonth, today);
    await scheduleItemNotifications({
      id: debt.id,
      type: 'debt',
      dayOf,
      twoDayBefore,
      twoDayScenario: NotificationScenario.DEBT_EMI_2DAY,
      dayOfScenario: NotificationScenario.DEBT_EMI_DAY_OF,
      copyParams: { name: debt.name, amount: formatCurrency(debt.emiAmount) },
    });
  }

  // Credit cards
  for (const card of creditCards) {
    if (!card.isActive) continue;
    const { dayOf, twoDayBefore } = computeCreditCardDueDate(card.statementDayOfMonth, card.paymentBufferDays, today);
    await scheduleItemNotifications({
      id: card.id,
      type: 'cc',
      dayOf,
      twoDayBefore,
      twoDayScenario: NotificationScenario.CREDIT_CARD_2DAY,
      dayOfScenario: NotificationScenario.CREDIT_CARD_DAY_OF,
      copyParams: { name: card.nickname },
    });
  }

  // Monthly check-in — repeating on 1st of every month
  const monthlyCheckinCopy = await pickNotificationCopy(NotificationScenario.MONTHLY_CHECKIN, {});
  const { hour: checkinHour, minute: checkinMinute } = getRandomTime();
  await Notifications.scheduleNotificationAsync({
    identifier: 'monthly-checkin',
    content: { title: monthlyCheckinCopy.title, body: monthlyCheckinCopy.body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      day: 1,
      hour: checkinHour,
      minute: checkinMinute,
    },
  });
};
