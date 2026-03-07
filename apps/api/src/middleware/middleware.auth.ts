import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';
import { context } from '../utils/context';

export interface AuthUser {
    id: string;
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

/**
 * Lightweight middleware that injects the Kite access token from environment.
 * Replaces the old JWT-based `authenticate` middleware.
 */
export const injectKiteToken = (req: Request, _res: Response, next: NextFunction) => {
    const accessToken = config.KITE_ACCESS_TOKEN;

    if (!accessToken) {
        return next(new AppError(500, ErrorCode.AUTH_HEADER_MISSING, 'KITE_ACCESS_TOKEN not configured in environment'));
    }

    req.user = { id: 'default', accessToken };

    const store = context.getStore();
    if (store) {
        store.accessToken = accessToken;
    }

    next();
};
