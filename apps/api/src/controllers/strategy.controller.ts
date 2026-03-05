
import { Request, Response, NextFunction } from 'express';
import { StrategyRunMode } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';
import { StrategyRunner } from '../services/runners/strategy.runner';
import { StrategyRepository } from '../repositories/repository.strategy';
import { StrategyRunRepository } from '../repositories/repository.strategy-run';

// For MVP, single global runner instance
const globalRunner = new StrategyRunner();

import { getContext } from '../utils/http.context';

export const startStrategyRun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { userId, mode, accessToken } = getContext(req);

    if (!req.user) {
         throw new AppError(401, ErrorCode.AUTH_UNAUTHORIZED, 'User not authenticated');
    }

    // Verify Strategy Exists
    const finalStrategy = await StrategyRepository.findByIdOrCode(id);
    
    if (!finalStrategy) {
         throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
    }
    
    const strategyId = finalStrategy.id;
    
    const runId = await globalRunner.startRun(strategyId, userId, mode as StrategyRunMode, accessToken);

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
        return next(new AppError(409, ErrorCode.RESOURCE_CONFLICT, 'Strategy runner is already active'));
    }
    next(error);
  }
};

export const stopStrategyRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string }; // This is active runId
        
        const stopped = await globalRunner.stopRun(id);
        
        if (!stopped) {
            throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Run not found or not active');
        }

        res.json({
            success: true,
            data: { message: `Run ${id} stopped` }
        });
    } catch (error) {
        next(error);
    }
};

export const getStrategies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategies = await StrategyRepository.findAll();

    res.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    next(error);
  }
};

export const getStrategyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    
    const strategy = await StrategyRepository.findByIdOrCodeWithDetails(id); // I need to add this method in repo

    if (!strategy) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
    }

    res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    next(error);
  }
};

export const clearHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };

        // Resolve Strategy ID
        const finalStrategy = await StrategyRepository.findByIdOrCode(id);
        
        if (!finalStrategy) {
             throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
        }
        
        const strategyId = finalStrategy.id;

        await StrategyRunRepository.clearHistoryForStrategy(strategyId);

        res.json({
            success: true,
            data: { message: `History cleared for strategy ${finalStrategy.code} (${strategyId})` }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteStrategy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };

        // Check if exists
        const finalStrategy = await StrategyRepository.findByIdOrCode(id);
        if (!finalStrategy) {
             throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
        }

        // Delete
        await StrategyRepository.delete(finalStrategy.id);

        res.json({
            success: true,
            data: { message: `Strategy ${finalStrategy.code} (${finalStrategy.id}) and all associated data deleted.` }
        });
    } catch (error) {
        next(error);
    }
};

export const getPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const strategyId = req.query.strategyId as string | undefined;

        if (strategyId) {
            // Verify Strategy Exists if ID provided
            const finalStrategy = await StrategyRepository.findByIdOrCode(strategyId);
             if (!finalStrategy) {
                 throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Strategy not found');
            }
            // Use resolved ID (in case code was passed)
            const positions = await StrategyRunRepository.getPositionsByStrategy(finalStrategy.id);
            return res.json({ success: true, data: positions });
        }

        // Fetch all (or filtered by user? Currently all for MVP)
        const positions = await StrategyRunRepository.getPositionsByStrategy();

        res.json({
            success: true,
            data: positions
        });
    } catch (error) {
        next(error);
    }
};


