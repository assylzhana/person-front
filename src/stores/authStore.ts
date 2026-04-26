import { create } from 'zustand';
import { authApi } from '../api/auth';
import type { LoginRequest, RegisterRequest } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  userEmail: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('accessToken'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  userEmail: localStorage.getItem('userEmail'),
  isLoading: false,

  login: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(data);
      set({ isAuthenticated: true, userId: res.userId, userEmail: res.email });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(data);
      set({ isAuthenticated: true, userId: res.userId, userEmail: res.email });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ isAuthenticated: false, userId: null, userEmail: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    set({
      isAuthenticated: !!token,
      userId: userId ? Number(userId) : null,
      userEmail,
    });
  },
}));
