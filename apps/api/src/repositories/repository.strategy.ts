
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const StrategyRepository = {
    async findById(id: string) {
        return await prisma.strategy.findUnique({
            where: { id }
        });
    },

    async findByCode(code: string) {
        return await prisma.strategy.findUnique({
            where: { code }
        });
    },
    
    // Combined find
    async findByIdOrCode(idOrCode: string) {
        let strategy = await prisma.strategy.findUnique({ where: { id: idOrCode } });
        if (!strategy) {
            strategy = await prisma.strategy.findUnique({ where: { code: idOrCode } });
        }
        return strategy;
    },

    async findModuleConfigs(strategyId: string) {
        return await prisma.strategyModuleConfig.findMany({
            where: { strategyId, enabled: true },
            orderBy: { order: 'asc' }
        });
    },

    async findByIdOrCodeWithDetails(idOrCode: string) {
        const include = {
            moduleConfigs: { orderBy: { order: 'asc' } },
            runs: { orderBy: { createdAt: 'desc' }, take: 20 }
        } as const; // Force minimal typing or any

        let strategy = await prisma.strategy.findUnique({
            where: { id: idOrCode },
            include
        });
        if (!strategy) {
            strategy = await prisma.strategy.findUnique({
                where: { code: idOrCode },
                include
            });
        }
        return strategy;
    },

    async findAll() {
        return await prisma.strategy.findMany({
             include: {
                moduleConfigs: { orderBy: { order: 'asc' } },
                runs: { orderBy: { createdAt: 'desc' }, take: 5 }
             }
        });
    },

    async delete(id: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Delete runs? 
            // Dependent relations: moduleConfigs, runs
            // Runs have deep relations (orders, positions, events, state)
            // Strategy has moduleConfigs via Cascade? 
            // In schema: strategy moduleConfigs onDelete: Cascade.
            // In schema: strategy runs onDelete: Restrict.
            // So we MUST delete runs first.

            // Find all runs
            const runs = await tx.strategyRun.findMany({
                where: { strategyId: id },
                select: { id: true }
            });
            const runIds = runs.map(r => r.id);

            if (runIds.length > 0) {
                // Delete Run Relations
                await tx.strategyRunOrder.deleteMany({ where: { runId: { in: runIds } } });
                await tx.strategyRunPosition.deleteMany({ where: { runId: { in: runIds } } });
                await tx.strategyRunEvent.deleteMany({ where: { runId: { in: runIds } } });
                await tx.strategyRunState.deleteMany({ where: { runId: { in: runIds } } });
                // Delete Runs
                await tx.strategyRun.deleteMany({ where: { id: { in: runIds } } });
            }

            // Now delete Strategy (Cascade will handle moduleConfigs)
            return await tx.strategy.delete({
                where: { id }
            });
        });
    }
};
