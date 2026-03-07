import apiClient from './client';
import type { KiteProfile, Position, Holding, Margin } from '../types';

export const portfolioApi = {
  getProfile: async () => {
    return apiClient.get<{ success: boolean; data: KiteProfile }>('/portfolio/profile');
  },
  getPositions: async () => {
    return apiClient.get<{ success: boolean; data: { net: Position[]; day: Position[] } }>('/portfolio/positions');
  },
  getHoldings: async () => {
    return apiClient.get<{ success: boolean; data: Holding[] }>('/portfolio/holdings');
  },
  getMargins: async () => {
    return apiClient.get<{ success: boolean; data: Margin }>('/portfolio/margins');
  },
  clearPositions: async () => {
    return apiClient.delete<{ success: boolean; message: string }>('/trade/positions');
  },
};
