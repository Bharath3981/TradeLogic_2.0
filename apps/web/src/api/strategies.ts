import apiClient from './client';
import type { Strategy } from '../types';

export const strategiesApi = {
  getStrategies: () => {
    return apiClient.get<{ data: Strategy[] }>('/strategies');
  },
  runStrategy: (id: string, params?: unknown) => {
    return apiClient.post(`/strategies/${id}/run`, params);
  },
  deleteStrategy: (id: string) => {
    return apiClient.delete(`/strategies/${id}`);
  },
  deleteExecutionHistory: (id: string) => {
    return apiClient.delete(`/strategies/${id}/history`);
  },
  getStrategyPositions: (strategyId: string) => {
    return apiClient.get<{ data: import('../types').Position[] }>('/strategies/positions', { params: { strategyId } });
  },
};
