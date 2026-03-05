import { logger } from './logger';
import { context } from './context';

export interface AuditConfig {
    action: string;
    // Functions to extract data from arguments or result
    getEntityId?: (args: any[], result: any) => string | undefined;
    getEntityType?: (args: any[]) => string;
    getStrategyId?: (args: any[]) => string | undefined;
    getExecutionId?: (args: any[]) => string | undefined;
    getTradeMode?: (args: any[]) => string;
    
    fetchState?: (args: any[]) => Promise<any>;
    fetchAfter?: (args: any[], result: any) => Promise<any>;
}

export const withAudit = (fn: Function, config: AuditConfig) => {
    return async (...args: any[]) => {
        // 1. CONTEXT EXTRACTION
        const ctx = context.getStore();
        const userId = ctx?.userId; 

        // Just execute and log, no DB persistence
        try {
            if (userId) {
                // logger.info(`[Audit] Action: ${config.action} User: ${userId}`);
            }
            const result = await fn(...args);
            return result;
        } catch (error: any) {
            if (userId) {
               logger.error(`[Audit] Action: ${config.action} Failed. Error: ${error.message}`);
            }
            throw error;
        }
    };
};
