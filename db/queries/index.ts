/**
 * Database Queries Index
 * Re-exports all query functions for easy import
 */

// Profile queries
export { getProfile, updateProfile, upsertProfile } from "./profile";

// Fixed expenses queries
export {
  createFixedExpense,
  deleteFixedExpense,
  getFixedExpenses,
  getFixedExpensesByType,
  getTotalFixedExpenses,
  updateFixedExpense,
} from "./fixed-expenses";

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
} from "./debts";

// Categories queries
export {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getCustomCategories,
  getPredefinedCategories,
  updateCategory,
} from "./categories";

// Expenses queries
export {
  createExpense,
  deleteExpense,
  getExpenses,
  getExpensesByMonth,
  getExpensesWithCategory,
  getImpulsePurchaseStats,
  getSpendingByCategory,
  getTotalSpentByMonth,
  updateExpense,
} from "./expenses";

// Savings goals queries
export {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoalById,
  getSavingsGoals,
  getTotalMonthlySavingsTarget,
  updateSavingsGoal,
} from "./savings";

// Monthly snapshot queries
export {
  closeMonth,
  createMonthlySnapshot,
  getMonthlySnapshot,
  getMonthlySummary,
  getPieChartData,
  getRemainingFrivolousBudget,
  initializeCurrentMonth,
  updateMonthlySnapshotBudget,
} from "./monthly";
