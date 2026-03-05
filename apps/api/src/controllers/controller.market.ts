import { Request, Response, NextFunction } from 'express';
import { MarketService } from '../services/service.market';
import { UserMode } from '../brokers/BrokerFactory';

import { getContext } from '../utils/http.context';

export const MarketController = {
    async getInstruments(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, mode, accessToken } = getContext(req);
            const exchange = req.query.exchange as string;
            const result = await MarketService.getInstruments(userId, mode, accessToken, exchange);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async getQuote(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, mode, accessToken } = getContext(req);
            const instruments = (req.query.instruments as string || '').split(',');
            const result = await MarketService.getQuote(userId, mode, accessToken, instruments);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async getLTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, mode, accessToken } = getContext(req);
            const instruments = (req.query.instruments as string || '').split(',');
            const result = await MarketService.getLTP(userId, mode, accessToken, instruments);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
};
