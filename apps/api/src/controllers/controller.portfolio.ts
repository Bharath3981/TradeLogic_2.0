import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from '../services/service.portfolio';
import { logger } from '../utils/logger';
import { UserMode } from '../brokers/BrokerFactory';
import { sendSuccess } from '../utils/ApiResponse';

const getContext = (req: Request) => {
    const userId = req.user?.id || 'guest';
    const mode = (req.headers['x-trading-mode'] as UserMode) || UserMode.MOCK;
    let accessToken = '';
    if (mode === UserMode.REAL && req.query.access_token) {
        accessToken = String(req.query.access_token);
    }
    return { userId, mode, accessToken };
};

export const PortfolioController = {
    async getHoldings(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, mode, accessToken } = getContext(req);
            const holdings = await PortfolioService.getHoldings(userId, mode, accessToken);
            sendSuccess(res, holdings);
        } catch (error) {
            next(error);
        }
    },

    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, mode, accessToken } = getContext(req);
            const profile = await PortfolioService.getProfile(userId, mode, accessToken);
            sendSuccess(res, profile);
        } catch (error) {
            next(error);
        }
    },

    async getPositions(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, mode, accessToken } = getContext(req);
            const result = await PortfolioService.getPositions(userId, mode, accessToken);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    },

    async getMargins(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, mode, accessToken } = getContext(req);
            const result = await PortfolioService.getMargins(userId, mode, accessToken);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }
};
