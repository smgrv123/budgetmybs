import dayjs from 'dayjs';

import {
  computeCreditCardDueDate,
  computeFrivolousBudgetAlert,
  computeTriggerDates,
  getRandomTime,
  pickNotificationCopy,
} from '@/src/utils/notificationUtils';
import { NotificationCopies, NotificationScenario } from '@/src/constants/notifications.strings';

// ============================================
// Mock AsyncStorage
// ============================================

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: (...args: unknown[]) => mockSetItem(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSetItem.mockResolvedValue(undefined);
});

// ============================================
// computeTriggerDates
// ============================================

describe('computeTriggerDates', () => {
  it('schedules in current month when dayOfMonth is strictly in the future', () => {
    const today = dayjs('2026-03-10');
    const { dayOf, twoDayBefore } = computeTriggerDates(15, today);

    expect(dayOf.isSame(dayjs('2026-03-15'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-03-13'), 'day')).toBe(true);
  });

  it('rolls to next month when dayOfMonth has already passed', () => {
    const today = dayjs('2026-03-20');
    const { dayOf, twoDayBefore } = computeTriggerDates(15, today);

    expect(dayOf.isSame(dayjs('2026-04-15'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-04-13'), 'day')).toBe(true);
  });

  it('rolls to next month when today is exactly the due day', () => {
    const today = dayjs('2026-03-15');
    const { dayOf, twoDayBefore } = computeTriggerDates(15, today);

    expect(dayOf.isSame(dayjs('2026-04-15'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-04-13'), 'day')).toBe(true);
  });

  it('handles 2-day-before crossing a month boundary', () => {
    const today = dayjs('2026-03-10');
    // dayOfMonth=2 has already passed (March 2 < March 10), so → April 2
    const { dayOf, twoDayBefore } = computeTriggerDates(2, today);

    expect(dayOf.isSame(dayjs('2026-04-02'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-03-31'), 'day')).toBe(true);
  });

  it('clamps dayOfMonth to the last day of the month when month is shorter', () => {
    const today = dayjs('2026-04-10');
    // April has 30 days, dayOfMonth=31 clamps to 30
    const { dayOf, twoDayBefore } = computeTriggerDates(31, today);

    expect(dayOf.isSame(dayjs('2026-04-30'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-04-28'), 'day')).toBe(true);
  });

  it('rolls to next month when dayOfMonth=1 and today is past the 1st', () => {
    const today = dayjs('2026-03-05');
    const { dayOf, twoDayBefore } = computeTriggerDates(1, today);

    expect(dayOf.isSame(dayjs('2026-04-01'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-03-30'), 'day')).toBe(true);
  });
});

// ============================================
// computeCreditCardDueDate
// ============================================

describe('computeCreditCardDueDate', () => {
  it('computes due date correctly within same month', () => {
    const today = dayjs('2026-03-10');
    // Statement closes March 20, buffer 5 days → due March 25
    const { dayOf, twoDayBefore } = computeCreditCardDueDate(20, 5, today);

    expect(dayOf.isSame(dayjs('2026-03-25'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-03-23'), 'day')).toBe(true);
  });

  it('handles buffer days overflowing into next month', () => {
    const today = dayjs('2026-03-10');
    // Statement closes March 25, buffer 15 days → due April 9
    const { dayOf, twoDayBefore } = computeCreditCardDueDate(25, 15, today);

    expect(dayOf.isSame(dayjs('2026-04-09'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-04-07'), 'day')).toBe(true);
  });

  it('rolls to next cycle when due date has already passed', () => {
    const today = dayjs('2026-03-28');
    // Statement closes March 20, buffer 5 → due March 25 (already passed)
    // Next cycle: closes April 20, buffer 5 → due April 25
    const { dayOf, twoDayBefore } = computeCreditCardDueDate(20, 5, today);

    expect(dayOf.isSame(dayjs('2026-04-25'), 'day')).toBe(true);
    expect(twoDayBefore.isSame(dayjs('2026-04-23'), 'day')).toBe(true);
  });

  it('uses current cycle when due date is today', () => {
    const today = dayjs('2026-03-25');
    // Statement closes March 20, buffer 5 → due March 25 (today, not strictly after)
    // Rolls to next cycle: April 20 + 5 = April 25
    const { dayOf } = computeCreditCardDueDate(20, 5, today);

    expect(dayOf.isSame(dayjs('2026-04-25'), 'day')).toBe(true);
  });
});

// ============================================
// getRandomTime
// ============================================

describe('getRandomTime', () => {
  it('always returns hour between 12 and 20 inclusive', () => {
    for (let i = 0; i < 200; i++) {
      const { hour } = getRandomTime();
      expect(hour).toBeGreaterThanOrEqual(12);
      expect(hour).toBeLessThanOrEqual(20);
    }
  });

  it('always returns minute between 0 and 59 inclusive', () => {
    for (let i = 0; i < 200; i++) {
      const { minute } = getRandomTime();
      expect(minute).toBeGreaterThanOrEqual(0);
      expect(minute).toBeLessThanOrEqual(59);
    }
  });
});

// ============================================
// pickNotificationCopy
// ============================================

describe('pickNotificationCopy', () => {
  it('returns a valid title and body', async () => {
    mockGetItem.mockResolvedValue(null);

    const result = await pickNotificationCopy(NotificationScenario.FIXED_EXPENSE_2DAY, {
      name: 'Rent',
      amount: '₹15,000',
    });

    expect(result.title).toBeTruthy();
    expect(result.body).toBeTruthy();
    expect(typeof result.title).toBe('string');
    expect(typeof result.body).toBe('string');
  });

  it('does not return the same copy as the last used index', async () => {
    // Set last used index to 0
    mockGetItem.mockResolvedValue('0');

    const pool = NotificationCopies[NotificationScenario.FIXED_EXPENSE_2DAY];
    const firstCopyTitle = pool[0].title;

    // Run multiple times to account for randomness
    let differentPickCount = 0;
    for (let i = 0; i < 10; i++) {
      const result = await pickNotificationCopy(NotificationScenario.FIXED_EXPENSE_2DAY, {
        name: 'Rent',
        amount: '₹15,000',
      });
      if (result.title !== firstCopyTitle) differentPickCount++;
    }

    // All picks should be different from index 0's title
    expect(differentPickCount).toBe(10);
  });

  it('persists the picked index to AsyncStorage', async () => {
    mockGetItem.mockResolvedValue(null);

    await pickNotificationCopy(NotificationScenario.DEBT_EMI_2DAY, { name: 'Home Loan', amount: '₹22,000' });

    expect(mockSetItem).toHaveBeenCalledWith(expect.stringContaining('DEBT_EMI_2DAY'), expect.any(String));
  });

  it('interpolates name and amount into the body', async () => {
    mockGetItem.mockResolvedValue(null);

    const result = await pickNotificationCopy(NotificationScenario.FIXED_EXPENSE_2DAY, {
      name: 'Rent',
      amount: '₹15,000',
    });

    expect(result.body).toContain('Rent');
    expect(result.body).toContain('₹15,000');
  });

  it('works for MONTHLY_CHECKIN scenario without name or amount', async () => {
    mockGetItem.mockResolvedValue(null);

    const result = await pickNotificationCopy(NotificationScenario.MONTHLY_CHECKIN, {});

    expect(result.title).toBeTruthy();
    expect(result.body).toBeTruthy();
  });
});

// ============================================
// computeFrivolousBudgetAlert
// ============================================

describe('computeFrivolousBudgetAlert', () => {
  it('returns null when under 80%', () => {
    expect(computeFrivolousBudgetAlert(700, 1000)).toBeNull();
  });

  it('returns null at exactly 79.9%', () => {
    expect(computeFrivolousBudgetAlert(799, 1000)).toBeNull();
  });

  it('returns warning at exactly 80%', () => {
    expect(computeFrivolousBudgetAlert(800, 1000)).toBe('warning');
  });

  it('returns warning between 80% and 100%', () => {
    expect(computeFrivolousBudgetAlert(950, 1000)).toBe('warning');
  });

  it('returns warning at exactly 100%', () => {
    expect(computeFrivolousBudgetAlert(1000, 1000)).toBe('warning');
  });

  it('returns error when over 100%', () => {
    expect(computeFrivolousBudgetAlert(1001, 1000)).toBe('error');
  });

  it('returns error well over 100%', () => {
    expect(computeFrivolousBudgetAlert(2000, 1000)).toBe('error');
  });

  it('returns null when totalFrivolousBudget is zero', () => {
    expect(computeFrivolousBudgetAlert(500, 0)).toBeNull();
  });
});
