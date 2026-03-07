import { Request, Response, NextFunction } from 'express';
import { UserMode } from '../brokers/BrokerFactory';
import { sendSuccess } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';
import { ScreenerService } from '../services/service.screener';
import { InstrumentRepository } from '../repositories/repository.instrument';
import { logger } from '../utils/logger';

export const ScreenerController = {

    async runScan(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id || 'guest';
            // injectKiteToken middleware sets KITE_ACCESS_TOKEN from env on req.user.accessToken
            const accessToken = req.user?.accessToken;

            if (!accessToken) {
                throw new AppError(401, ErrorCode.KITE_TOKEN_MISSING, 'Kite session not found. Please connect Kite first.');
            }

            const { sector, minScore, limit, trend, holdingMonths } = req.body;
            logger.info({ msg: 'Screener scan requested', userId, sector, minScore, limit, trend, holdingMonths });

            const result = await ScreenerService.runScan(userId, accessToken, {
                sector,
                minScore:      minScore      ? Number(minScore)      : 40,
                limit:         limit         ? Number(limit)         : 20,
                trend:         trend         || 'ALL',
                holdingMonths: holdingMonths ? Number(holdingMonths) : 3,
            });

            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    },

    async getSectors(req: Request, res: Response, next: NextFunction) {
        try {
            const sectors = ScreenerService.getSectors();
            sendSuccess(res, sectors);
        } catch (error) {
            next(error);
        }
    },

    async getUpcomingFutures(req: Request, res: Response, next: NextFunction) {
        try {
            const symbol = String(req.params.symbol);
            const futures = await InstrumentRepository.findUpcomingFutures(symbol);
            sendSuccess(res, futures);
        } catch (error) {
            next(error);
        }
    },
};