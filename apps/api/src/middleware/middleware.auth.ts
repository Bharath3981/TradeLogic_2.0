import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';
import { prisma } from '../lib/prisma';
import { decrypt } from '../utils/crypto';
import { context } from '../utils/context';

export interface AuthUser {
    id: string;
    email: string;
    accessToken?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            requestId?: string;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError(401, ErrorCode.AUTH_HEADER_MISSING, 'Authorization header missing or invalid format'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUser;
        req.user = decoded;

        // Fetch the Kite Access Token for the user — always needed for MarketService
        // even in MOCK execution mode.
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { kiteAccessToken: true }
        });

        if (user?.kiteAccessToken) {
            try {
                const decryptedToken = decrypt(user.kiteAccessToken);
                const store = context.getStore();
                if (store) {
                    store.accessToken = decryptedToken;
                }
                req.user.accessToken = decryptedToken;
            } catch {
                // Token is corrupted or key mismatch — proceed without it.
                // Controllers that strictly need the token will throw their own error.
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};
