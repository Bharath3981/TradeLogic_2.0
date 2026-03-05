import { WatchlistRepository } from '../repositories/repository.watchlist';
import { CreateWatchlistItemInput } from '../dtos/dto.watchlist';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';
import { logger } from '../utils/logger';

export const WatchlistService = {
    async addItem(userId: string, input: CreateWatchlistItemInput) {
        try {
            // Check if item already exists in this set for this user
            const existing = await WatchlistRepository.findItem(userId, input.watchlist_set, input.instrument_token);

            if (existing) {
                // Ignore or throw? Let's ignore/return existing to be idempotent
                return existing;
            }
            
            // Map input fields (snake_case from DTO) to Prisma fields (camelCase)
            // Repository handles ID generation
            const item = await WatchlistRepository.createItem(userId, {
                watchlistSet: input.watchlist_set,
                instrumentToken: input.instrument_token,
                exchangeToken: input.exchange_token,
                tradingsymbol: input.tradingsymbol,
                name: input.name,
                lastPrice: input.last_price || 0,
                expiry: input.expiry,
                strike: input.strike || 0,
                tickSize: input.tick_size || 0,
                lotSize: input.lot_size || 0,
                instrumentType: input.instrument_type,
                segment: input.segment,
                exchange: input.exchange
            });

            return item;
        } catch (error) {
            logger.error({ msg: 'Failed to add watchlist item', error, userId, input });
            throw new AppError(500, ErrorCode.DB_ERROR, 'Failed to add item to watchlist');
        }
    },

    async deleteItem(userId: string, id: string) {
        try {
            // Ensure item belongs to user
            const existing = await WatchlistRepository.findItemById(userId, id);

            if (!existing) {
                throw new AppError(404, ErrorCode.VALIDATION_ERROR, 'Watchlist item not found');
            }

            const deleted = await WatchlistRepository.deleteItem(id);

            return deleted;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error({ msg: 'Failed to delete watchlist item', error, userId, id });
            throw new AppError(500, ErrorCode.DB_ERROR, 'Failed to delete watchlist item');
        }
    },
    
    async getWatchlist(userId: string) {
         return await WatchlistRepository.getWatchlist(userId);
    }
};
