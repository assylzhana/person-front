import { api, saveTokens, clearTokens } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    saveTokens(res.data.accessToken, res.data.refreshToken);
    localStorage.setItem('userId', String(res.data.userId));
    localStorage.setItem('userEmail', res.data.email);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data);
    saveTokens(res.data.accessToken, res.data.refreshToken);
    localStorage.setItem('userId', String(res.data.userId));
    localStorage.setItem('userEmail', res.data.email);
    return res.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try { await api.post('/auth/logout', { refreshToken }); } catch {}
    }
    clearTokens();
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/refresh', { refreshToken });
    return res.data;
  },
};
