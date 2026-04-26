import { api } from './client';
import type { AnalyticsOverview, GoalsAnalytics, FinanceAnalytics, ProductivityAnalytics } from '../types';

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },

  getGoals: async (): Promise<GoalsAnalytics> => {
    const res = await api.get('/analytics/goals');
    return res.data;
  },

  getFinance: async (): Promise<FinanceAnalytics> => {
    const res = await api.get('/analytics/finance');
    return res.data;
  },

  getProductivity: async (): Promise<ProductivityAnalytics> => {
    const res = await api.get('/analytics/productivity');
    return res.data;
  },

  getRecommendations: async (): Promise<{ recommendations: string[]; source: string }> => {
    const res = await api.get('/analytics/recommendations');
    return res.data;
  },
};
