import { api } from './client';
import type { Goal, CreateGoalRequest, UpdateGoalRequest, GoalStats, GoalCategory, GoalStatus } from '../types';

export const goalsApi = {
  create: async (data: CreateGoalRequest): Promise<Goal> => {
    const res = await api.post('/goals', data);
    return res.data;
  },

  update: async (goalId: number, data: UpdateGoalRequest): Promise<Goal> => {
    const res = await api.put(`/goals/${goalId}`, data);
    return res.data;
  },

  complete: async (goalId: number): Promise<Goal> => {
    const res = await api.patch(`/goals/${goalId}/complete`);
    return res.data;
  },

  delete: async (goalId: number): Promise<void> => {
    await api.delete(`/goals/${goalId}`);
  },

  getAll: async (params?: { category?: GoalCategory; status?: GoalStatus }): Promise<Goal[]> => {
    const res = await api.get('/goals', { params });
    return res.data;
  },

  getById: async (goalId: number): Promise<Goal> => {
    const res = await api.get(`/goals/${goalId}`);
    return res.data;
  },

  getStats: async (): Promise<GoalStats> => {
    const res = await api.get('/goals/stats');
    return res.data;
  },
};
