import { api } from './client';
import type { MonthlyPlan, IncomeRecord, ExpenseRecord, FinanceStats, IncomeType, ExpenseCategory } from '../types';

export const financeApi = {
  createMonthly: async (data: { year: number; month: number; baseIncome: number }): Promise<MonthlyPlan> => {
    const res = await api.post('/finance/monthly', data);
    return res.data;
  },

  getAllMonthly: async (): Promise<MonthlyPlan[]> => {
    const res = await api.get('/finance/monthly');
    return res.data;
  },

  getCurrentMonthly: async (): Promise<MonthlyPlan> => {
    const res = await api.get('/finance/monthly/current');
    return res.data;
  },

  getMonthlyById: async (financeId: number): Promise<MonthlyPlan> => {
    const res = await api.get(`/finance/monthly/${financeId}`);
    return res.data;
  },

  addIncome: async (
    financeId: number,
    data: { amount: number; type: IncomeType; date: string; description?: string }
  ): Promise<IncomeRecord> => {
    const res = await api.post(`/finance/monthly/${financeId}/income`, data);
    return res.data;
  },

  addExpense: async (
    financeId: number,
    data: { amount: number; category: ExpenseCategory; date: string; description?: string }
  ): Promise<ExpenseRecord> => {
    const res = await api.post(`/finance/monthly/${financeId}/expense`, data);
    return res.data;
  },

  getStats: async (): Promise<FinanceStats> => {
    const res = await api.get('/finance/stats');
    return res.data;
  },
};
