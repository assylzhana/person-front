import { api } from './client';
import type { Notification } from '../types';

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications');
    return res.data;
  },

  getUnread: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications/unread');
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/notifications/unread/count');
    return res.data.count;
  },

  markRead: async (notificationId: number): Promise<Notification> => {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
