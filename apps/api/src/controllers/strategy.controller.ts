import type { Request, Response, NextFunction } from 'express';
import type { StrategyRunMode } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';
import { StrategyRunner } from '../services/runners/strategy.runner';
import { StrategyRepository } from '../repositories/repository.strategy';
import { StrategyRunRepository } from '../repositories/repository.strategy-run';
import { getContext } from '../utils/http.context';
import { sendSuccess } from '../utils/ApiResponse';

// Per-user runner registry — each user gets at most one active runner
const runnerRegistry = new Map<string, StrategyRunner>();

const getOrCreateRunner = (userId: string): StrategyRunner => {
    if (!runnerRegistry.has(userId)) {
        runnerRegistry.set(userId, new StrategyRunner());
    }
    return runnerRegistry.get(userId)!;
};

export const startStrategyRun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { userId, mode, accessToken } = getContext(req);

    if (!req.user) {
         throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'User not authenticated');
    }

    const finalStrategy = await StrategyRepository.findByIdOrCode(id);

    if (!finalStrategy) {
         throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
    }

    const strategyId = finalStrategy.id;
    const runner = getOrCreateRunner(userId);

    const runId = await runner.startRun(strategyId, userId, mode as StrategyRunMode, accessToken);

    res.status(201).json({
      success: true,
      data: {
        message: 'Strategy run initiated',
        runId,
        strategyId,
        mode: mode || 'MOCK'
      }
    });
  } catch (error: any) {
    if (error.message === 'Runner is already running') {
        return next(new AppError(409, ErrorCode.RESOURCE_CONFLICT, 'A strategy is already running for your account'));
    }
    next(error);
  }
};

export const stopStrategyRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };
        const { userId } = getContext(req);

        const runner = runnerRegistry.get(userId);

        if (!runner) {
            throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'No active runner found for your account');
        }

        const stopped = await runner.stopRun(id);

        if (!stopped) {
            throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Run not found or not active');
        }

        sendSuccess(res, { message: `Run ${id} stopped` });
    } catch (error) {
        next(error);
    }
};

export const getStrategies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategies = await StrategyRepository.findAll();
    sendSuccess(res, strategies);
  } catch (error) {
    next(error);
  }
};

export const getStrategyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const strategy = await StrategyRepository.findByIdOrCodeWithDetails(id);

    if (!strategy) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
    }

    sendSuccess(res, strategy);
  } catch (error) {
    next(error);
  }
};

export const clearHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };

        const finalStrategy = await StrategyRepository.findByIdOrCode(id);

        if (!finalStrategy) {
             throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
        }

        await StrategyRunRepository.clearHistoryForStrategy(finalStrategy.id);

        sendSuccess(res, { message: `History cleared for strategy ${finalStrategy.code} (${finalStrategy.id})` });
    } catch (error) {
        next(error);
    }
};

export const deleteStrategy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };

        const finalStrategy = await StrategyRepository.findByIdOrCode(id);
        if (!finalStrategy) {
             throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
        }

        await StrategyRepository.delete(finalStrategy.id);

        sendSuccess(res, { message: `Strategy ${finalStrategy.code} (${finalStrategy.id}) and all associated data deleted.` });
    } catch (error) {
        next(error);
    }
};

export const getPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const strategyId = req.query.strategyId as string | undefined;

        if (strategyId) {
            const finalStrategy = await StrategyRepository.findByIdOrCode(strategyId);
             if (!finalStrategy) {
                 throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
            }
            const positions = await StrategyRunRepository.getPositionsByStrategy(finalStrategy.id);
            return sendSuccess(res, positions);
        }

        const positions = await StrategyRunRepository.getPositionsByStrategy();
        sendSuccess(res, positions);
    } catch (error) {
        next(error);
    }
};
