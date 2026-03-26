// ============================================
// IN-APP BUDGET ALERT STRINGS
// ============================================

export const BUDGET_ALERT_STRINGS = {
  warning: {
    message: "You've used 80% of your fun money — tread lightly from here.",
  },
  error: {
    message: 'Your discretionary budget is gone. Anything more is going over.',
  },
} as const;

// ============================================
// OS NOTIFICATION COPY POOLS
// ============================================

/**
 * Notification scenario identifiers
 * One pool of copy variants per scenario
 */
export const NotificationScenario = {
  FIXED_EXPENSE_2DAY: 'FIXED_EXPENSE_2DAY',
  FIXED_EXPENSE_DAY_OF: 'FIXED_EXPENSE_DAY_OF',
  DEBT_EMI_2DAY: 'DEBT_EMI_2DAY',
  DEBT_EMI_DAY_OF: 'DEBT_EMI_DAY_OF',
  CREDIT_CARD_2DAY: 'CREDIT_CARD_2DAY',
  CREDIT_CARD_DAY_OF: 'CREDIT_CARD_DAY_OF',
  MONTHLY_CHECKIN: 'MONTHLY_CHECKIN',
} as const;

export type NotificationScenarioType = (typeof NotificationScenario)[keyof typeof NotificationScenario];

export type NotificationCopyTemplate = {
  title: string;
  body: (name?: string, amount?: string) => string;
};

/**
 * Copy pools per scenario.
 * - Tone: casual & friendly for 2-day reminders, witty/urgent for day-of
 * - Amounts shown for fixed expenses and debts; omitted for credit cards
 * - Monthly check-in ignores name and amount
 */
export const NotificationCopies: Record<NotificationScenarioType, NotificationCopyTemplate[]> = {
  [NotificationScenario.FIXED_EXPENSE_2DAY]: [
    {
      title: "Heads up, your wallet's about to take a hit",
      body: (name, amount) => `${name} is due in 2 days${amount ? ` — ${amount} on its way out` : ''}`,
    },
    {
      title: 'A gentle nudge before it hurts',
      body: (name, amount) => `${name} is coming up in 2 days${amount ? ` — that's ${amount} going out` : ''}`,
    },
    {
      title: 'Just so you know...',
      body: (name, amount) => `${name} hits in 2 days${amount ? ` (${amount})` : ''}. You've got this.`,
    },
    {
      title: 'Tick tock — 2 days to go',
      body: (name, amount) => `${name} is due soon${amount ? `. ${amount} on the way out` : ''}`,
    },
  ],

  [NotificationScenario.FIXED_EXPENSE_DAY_OF]: [
    {
      title: "Today's the day, no escaping it 😬",
      body: (name, amount) => `${name} is due today${amount ? `. ${amount}. You know the drill.` : '.'}`,
    },
    {
      title: "It's bill o'clock",
      body: (name, amount) => `${name} is due today${amount ? ` — ${amount} needs to leave the building` : ''}`,
    },
    {
      title: 'No more snoozing this one',
      body: (name, amount) => `${amount ? `${amount} for ` : ''}${name} is due today.`,
    },
    {
      title: 'Your wallet called. It knows.',
      body: (name, amount) => `${name} is due today${amount ? ` — ${amount}` : ''}. Handle it!`,
    },
  ],

  [NotificationScenario.DEBT_EMI_2DAY]: [
    {
      title: 'Future you will thank you for this',
      body: (name, amount) => `${name} EMI${amount ? ` of ${amount}` : ''} is due in 2 days`,
    },
    {
      title: 'Almost time to chip away at that debt',
      body: (name, amount) => `${name} payment${amount ? ` of ${amount}` : ''} is due in 2 days`,
    },
    {
      title: '2 days to stay on track',
      body: (name, amount) => `Your ${name} EMI${amount ? ` (${amount})` : ''} is due in 2 days`,
    },
    {
      title: "Debt doesn't wait — but you have 2 days",
      body: (name, amount) => `${name} payment${amount ? ` of ${amount}` : ''} is coming up in 2 days`,
    },
  ],

  [NotificationScenario.DEBT_EMI_DAY_OF]: [
    {
      title: "EMI day. Let's get it done.",
      body: (name, amount) => `Your ${name} payment${amount ? ` of ${amount}` : ''} is due today`,
    },
    {
      title: 'One step closer to debt-free',
      body: (name, amount) => `${name} EMI${amount ? ` — ${amount}` : ''} is due today. Keep going.`,
    },
    {
      title: 'Today you pay your future self',
      body: (name, amount) => `${name} payment${amount ? ` of ${amount}` : ''} is due today`,
    },
    {
      title: 'The debt clock is ticking',
      body: (name, amount) => `${name} EMI${amount ? ` of ${amount}` : ''} due today. Don't miss it.`,
    },
  ],

  [NotificationScenario.CREDIT_CARD_2DAY]: [
    {
      title: 'Your credit card bill is lurking nearby',
      body: (name) => `${name} bill due in 2 days — don't let it sneak up on you`,
    },
    {
      title: '2 days before your CC bill lands',
      body: (name) => `${name} payment is coming up. Stay ahead of it.`,
    },
    {
      title: 'Almost time to settle up',
      body: (name) => `Your ${name} bill is due in 2 days. Plan accordingly.`,
    },
    {
      title: 'CC bill approaching — eyes open',
      body: (name) => `${name} credit card payment is due in 2 days`,
    },
  ],

  [NotificationScenario.CREDIT_CARD_DAY_OF]: [
    {
      title: "Bill's here. No more snoozing this one.",
      body: (name) => `${name} credit card payment is due today`,
    },
    {
      title: 'Your CC bill has arrived — time to deal',
      body: (name) => `${name} payment is due today. Don't rack up interest.`,
    },
    {
      title: "Today's your last chance",
      body: (name) => `${name} bill is due today. Pay it off!`,
    },
    {
      title: 'The bill stops here',
      body: (name) => `${name} credit card payment needs your attention today`,
    },
  ],

  [NotificationScenario.MONTHLY_CHECKIN]: [
    {
      title: 'New month, new budget, same you 👋',
      body: () => "Check your rollover and start logging this month's expenses",
    },
    {
      title: "Fresh month — let's set it up right",
      body: () => 'Your budget just reset. Review your rollover and kick off the month.',
    },
    {
      title: "It's a new month — don't sleep on it",
      body: () => 'Jump in and review what rolled over from last month',
    },
    {
      title: 'Month 1, Day 1 — time to budget',
      body: () => 'Open up and see how your budget looks for this month',
    },
  ],
};
