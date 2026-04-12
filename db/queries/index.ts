/**
 * Database Queries Index
 * Re-exports all query functions for easy import
 */

// Profile queries
export { getProfile, updateProfile, upsertProfile } from './profile';

// Fixed expenses queries
export {
  createFixedExpense,
  deleteFixedExpense,
  getFixedExpenses,
  getFixedExpensesByType,
  getTotalFixedExpenses,
  updateFixedExpense,
} from './fixed-expenses';

// Debts queries
export {
  createDebt,
  deleteDebt,
  getDebtById,
  getDebts,
  getTotalMonthlyEmi,
  getTotalRemainingDebt,
  makeEmiPayment,
  updateDebt,
} from './debts';

// Categories queries
export {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getCustomCategories,
  getPredefinedCategories,
  updateCategory,
} from './categories';

// Expenses queries
export {
  buildExpenseValues,
  createExpense,
  createOneOffSaving,
  deleteExpense,
  getAllExpensesWithCategory,
  getExpenseById,
  getExpenses,
  getExpensesByMonth,
  getExpensesWithCategory,
  getImpulsePurchaseStats,
  getLastProcessedRecurringMonth,
  getOneOffSavings,
  getProcessedRecurringByMonth,
  getProcessedRecurringKeys,
  getSpendingByCategory,
  getTotalSavedByMonth,
  getTotalSpentByMonth,
  isRecurringProcessed,
  updateExpense,
} from './expenses';

// Credit cards queries
export {
  archiveCreditCard,
  createCreditCard,
  createCreditCardPayment,
  deleteCreditCard,
  getCreditCardLinkedTransactionCount,
  getCreditCardSummaries,
  getCreditCards,
  unarchiveCreditCard,
  updateCreditCard,
} from './credit-cards';

// Recurring transaction queries
export { getMonthsToProcess, processRecurringTransactions } from './recurring';

// Savings goals queries
export {
  createSavingsGoal,
  deleteSavingsGoal,
  getAdHocSavingsBalances,
  getCompletedSavingsGoals,
  getIncompleteSavingsGoals,
  getMonthlyDepositsByGoal,
  getSavingsBalanceByGoal,
  getSavingsBalancesByAllGoals,
  getSavingsGoalById,
  getSavingsGoals,
  getTotalMonthlySavingsTarget,
  markGoalAsCompleted,
  updateSavingsGoal,
} from './savings';

// Monthly snapshot queries
export {
  closeMonth,
  createMonthlySnapshot,
  getMonthlySnapshot,
  getMonthlySummary,
  getPieChartData,
  getRemainingFrivolousBudget,
  initializeCurrentMonth,
  resetRollover,
  updateMonthlySnapshotBudget,
} from './monthly';

// Financial plan queries
export {
  createFinancialPlan,
  deleteFinancialPlan,
  getActiveFinancialPlan,
  getAllFinancialPlans,
} from './financialPlan';

// Income queries
export {
  createIncome,
  deleteIncome,
  getIncomeById,
  getIncomeByMonth,
  getMonthlyIncomeSum,
  updateIncome,
} from './income';

// Account queries (delete/reset)
export { clearUserData } from './account';

// Splitwise expenses queries
export {
  getSplitwiseExpenseByExpenseId,
  getSplitwiseExpenseBySplitwiseId,
  insertSplitwiseExpense,
  updateSplitwiseExpense,
  upsertSplitwiseExpense,
} from './splitwiseExpenses';

// Chat queries
export {
  clearChatHistory,
  createChatMessage,
  getChatMessageById,
  getChatMessages,
  getRecentChatMessages,
  replaceChatMessageContent,
  updateChatMessageAction,
} from './chat';
