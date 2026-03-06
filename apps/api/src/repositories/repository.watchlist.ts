import type { Watchlist } from '@prisma/client';
import { generateId } from '../utils/id';
import { prisma } from '../lib/prisma';

export const WatchlistRepository = {
    async findItem(userId: string, watchlistSet: number, instrumentToken: string) {
        return await prisma.watchlist.findFirst({
            where: {
                userId,
                watchlistSet,
                instrumentToken
            }
        });
    },

    async findItemById(userId: string, id: string) {
        return await prisma.watchlist.findFirst({
            where: { id, userId }
        });
    },

    async createItem(userId: string, data: any) {
        return await prisma.watchlist.create({
            data: {
                id: generateId(),
                userId,
                ...data
            }
        });
    },

    async deleteItem(id: string) {
        return await prisma.watchlist.delete({
            where: { id }
        });
    },

    async getWatchlist(userId: string) {
        return await prisma.watchlist.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
    }
};
