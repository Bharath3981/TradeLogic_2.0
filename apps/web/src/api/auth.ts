import apiClient from './client';
import type { User } from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    return apiClient.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', credentials);
  },
  register: async (data: { email: string; password: string; name: string }) => {
    return apiClient.post<{ user: User; token: string }>('/auth/register', data);
  },
  logout: async () => {
    return apiClient.post('/logout');
  },
  disconnectKite: async () => {
    return apiClient.post('/kite/disconnect');
  },
  kiteCallback: async (params: { request_token: string }) => {
    return apiClient.post('/kite/login/callback', params);
  },
};
