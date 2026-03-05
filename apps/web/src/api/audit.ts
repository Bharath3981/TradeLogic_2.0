
import apiClient from './client';
import type { AuditLog, AuditParams } from '../types';

export const auditApi = {
  getAuditLogs: (params: AuditParams) => 
    apiClient.get<{ success: boolean; data: AuditLog[] }>('/audit', { params })
};
