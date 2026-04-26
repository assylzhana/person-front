import { api } from './client';
import type { UserProfile, UpdateProfileRequest, FriendRecord, PsychTest, TestResult, TestStats, Goal, AnalyticsOverview, UserFullProfile } from '../types';

export const usersApi = {
  getMe: async (): Promise<UserProfile> => {
    const res = await api.get('/users/me');
    return res.data;
  },

  updateMe: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const res = await api.put('/users/me', data);
    return res.data;
  },

  getAll: async (): Promise<UserProfile[]> => {
    const res = await api.get('/users');
    return res.data;
  },

  getById: async (userId: number): Promise<UserProfile> => {
    const res = await api.get(`/users/${userId}`);
    return res.data;
  },

  sendFriendRequest: async (addresseeId: number): Promise<FriendRecord> => {
    const res = await api.post(`/users/friends/request/${addresseeId}`);
    return res.data;
  },

  acceptFriendRequest: async (friendshipId: number): Promise<FriendRecord> => {
    const res = await api.put(`/users/friends/${friendshipId}/accept`);
    return res.data;
  },

  removeFriend: async (friendId: number): Promise<void> => {
    await api.delete(`/users/friends/${friendId}`);
  },

  getFriends: async (): Promise<FriendRecord[]> => {
    const res = await api.get('/users/friends');
    return res.data;
  },

  getPendingRequests: async (): Promise<FriendRecord[]> => {
    const res = await api.get('/users/friends/pending');
    return res.data;
  },

  getUserGoals: async (userId: number): Promise<Goal[]> => {
    const res = await api.get(`/users/${userId}/goals`);
    return res.data;
  },

  getUserAnalytics: async (userId: number): Promise<AnalyticsOverview> => {
    const res = await api.get(`/users/${userId}/analytics`);
    return res.data;
  },

  getTests: async (): Promise<PsychTest[]> => {
    const res = await api.get('/users/tests');
    return res.data;
  },

  getTest: async (testId: number): Promise<PsychTest> => {
    const res = await api.get(`/users/tests/${testId}`);
    return res.data;
  },

  takeTest: async (testId: number, answers: Record<string, number>): Promise<TestResult> => {
    const res = await api.post('/users/tests/take', { testId, answers });
    return res.data;
  },

  getTestResults: async (): Promise<TestResult[]> => {
    const res = await api.get('/users/tests/results');
    return res.data;
  },

  getTestStats: async (): Promise<TestStats> => {
    const res = await api.get('/users/tests/stats');
    return res.data;
  },

  getFullProfile: async (userId: number): Promise<UserFullProfile> => {
    const res = await api.get(`/users/${userId}/full-profile`);
    return res.data;
  },
};
