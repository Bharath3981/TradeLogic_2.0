import { Request, Response, NextFunction } from 'express';
import { WatchlistService } from '../services/service.watchlist';
import { CreateWatchlistItemDto } from '../dtos/dto.watchlist';
import { sendSuccess } from '../utils/ApiResponse';

export const WatchlistController = {
    async addItem(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new Error('User context missing'); // Should be caught by auth middleware

            const input = CreateWatchlistItemDto.parse(req.body);
            const result = await WatchlistService.addItem(userId, input);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    },

    async deleteItem(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new Error('User context missing');

            const id = String(req.params.id);
            const result = await WatchlistService.deleteItem(userId, id);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    },

    async getWatchlist(req: Request, res: Response, next: NextFunction) {
        try {
             const userId = req.user?.id;
             if (!userId) throw new Error('User missing');
             const result = await WatchlistService.getWatchlist(userId);
             sendSuccess(res, result);
        } catch (error) {
             next(error);
        }
    }
};
