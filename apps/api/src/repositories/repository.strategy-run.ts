
import { PrismaClient, StrategyRunMode } from '@prisma/client';

const prisma = new PrismaClient();

export const StrategyRunRepository = {
    
    async createRunWithState(runId: string, strategyId: string, userId: string, mode: StrategyRunMode) {
        return await prisma.$transaction(async (tx) => {
            const run = await tx.strategyRun.create({
                data: {
                    id: runId,
                    strategyId,
                    status: 'CREATED',
                    mode,
                    startedAt: new Date()
                }
            });

            await tx.strategyRunState.create({
                data: {
                    runId,
                    stateJson: { user_id: userId, status: 'CREATED' },
                    stateVersion: 0
                }
            });
            
            return run;
        });
    },

    async getState(runId: string) {
        const stateRow = await prisma.strategyRunState.findUnique({ where: { runId } });
        return stateRow?.stateJson as any || {};
    },

    async updateState(runId: string, newState: any) {
        return await prisma.strategyRunState.update({
            where: { runId },
            data: {
                stateJson: newState,
                stateVersion: { increment: 1 }
            }
        });
    },

    async updateStatus(runId: string, status: any, errorMessage?: string) {
        return await prisma.strategyRun.update({
            where: { id: runId },
            data: { 
                status, 
                errorMessage,
                endedAt: (status === 'PAUSED' || status === 'EXITED' || status === 'ERROR') ? new Date() : undefined
            }
        });
    },

    async saveEvents(events: any[]) {
        if (events.length === 0) return;
        return await prisma.strategyRunEvent.createMany({
            data: events
        });
    },

    async savePositions(positions: any[]) {
        if (positions.length === 0) return;
        return await prisma.strategyRunPosition.createMany({
            data: positions
        });
    },

    async saveOrders(orders: any[]) {
        if (orders.length === 0) return;
        return await prisma.strategyRunOrder.createMany({
            data: orders
        });
    },

    async closePosition(runId: string, leg: any, strike: number, expiryDate: Date, exitPrice: number, reason: string) {
        // Find the open position first
        const position = await prisma.strategyRunPosition.findFirst({
            where: {
                runId,
                leg: leg, // Enum OptionLeg
                strike,
                expiryDate,
                status: 'OPEN'
            }
        });

        if (!position) {
            return null; // No matching open position found
        }

        return await prisma.strategyRunPosition.update({
            where: { id: position.id },
            data: {
                status: 'CLOSED',
                exitPrice,
                closedAt: new Date(),
                closedReason: reason
            }
        });
    },

    async getOpenPositions(runId: string) {
        return await prisma.strategyRunPosition.findMany({
            where: {
                runId,
                status: 'OPEN'
            }
        });
    },

    async getAllPositions(runId: string) {
        return await prisma.strategyRunPosition.findMany({
            where: { runId }
        });
    },

    async findById(runId: string) {
        return await prisma.strategyRun.findUnique({
             where: { id: runId },
             include: { state: true }
        });
    },

    async clearHistoryForStrategy(strategyId: string) {
        return await prisma.$transaction(async (tx) => {
            const runs = await tx.strategyRun.findMany({
                where: { strategyId },
                select: { id: true }
            });
            
            const runIds = runs.map(r => r.id);

            if (runIds.length > 0) {
                await tx.strategyRunOrder.deleteMany({ where: { runId: { in: runIds } } });
                await tx.strategyRunPosition.deleteMany({ where: { runId: { in: runIds } } });
                await tx.strategyRunEvent.deleteMany({ where: { runId: { in: runIds } } });
                await tx.strategyRunState.deleteMany({ where: { runId: { in: runIds } } });
                await tx.strategyRun.deleteMany({ where: { id: { in: runIds } } });
            }
            
            return runIds.length;
        });
    },

    async getPositionsByStrategy(strategyId?: string) {
        let whereClause: any = {};
        
        if (strategyId) {
            // Fetch runs for the strategy
            const runs = await prisma.strategyRun.findMany({
                where: { strategyId },
                select: { id: true }
            });
            const runIds = runs.map(r => r.id);
            if (runIds.length === 0) return [];
            whereClause = { runId: { in: runIds } };
        }

        // Fetch positions
        return await prisma.strategyRunPosition.findMany({
            where: whereClause,
            orderBy: { openedAt: 'desc' },
            include: { run: { select: { strategyId: true, mode: true } } } // Include run details for context
        });
    }
};
