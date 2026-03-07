import { generateId } from '../utils/id';
import { prisma } from '../lib/prisma';

export const UserRepository = {
    async findByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email }
        });
    },

    async createUser(data: { email: string; password: string; name?: string; isActive: boolean }) {
        return await prisma.user.create({
            data: {
                id: generateId(),
                ...data
            }
        });
    },

    async updateKiteToken(userId: string, encryptedToken: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: { kiteAccessToken: encryptedToken }
        });
    },

    async clearKiteToken(userId: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: { kiteAccessToken: null }
        });
    },

    async findById(id: string) {
         return await prisma.user.findUnique({ where: { id } });
    }
};
