import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';

export interface AuthUser {
    id: string;
    email: string;
    accessToken?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
             // We can also add request ID here if we want consistent logging later
            requestId?: string; 
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError(401, ErrorCode.AUTH_HEADER_MISSING, 'Authorization header missing or invalid format'));
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUser;
        req.user = decoded;

        // Check Trading Mode
        const mode = req.headers['x-trading-mode'] as string || 'MOCK';

        // Always attempt to fetch the Kite Access Token for the user if available
        // This is needed because Market Data fetching requires a Real token even in MOCK execution mode.
         (async () => {
            try {
                // Lazy load Prisma to avoid circular/init issues if any, or just use global
                const prisma = new (require('@prisma/client').PrismaClient)();
                
                // Only fetch if we need to? Yes, we always need it for MarketService.
                const user = await prisma.user.findUnique({ 
                    where: { id: decoded.id },
                    select: { kiteAccessToken: true } 
                });
                
                if (user?.kiteAccessToken) {
                     try {
                         const decryptedToken = require('../utils/crypto').decrypt(user.kiteAccessToken);
                         const { context } = require('../utils/context');
                         const store = context.getStore();
                         if (store) {
                             store.accessToken = decryptedToken;
                         }
                         if (req.user) {
                             req.user.accessToken = decryptedToken;
                         }
                     } catch (decryptionError) {
                         // Token garbage/invalid key. Log and proceed (User will fail later if they need it)
                     }
                } else {
                    // No token found. 
                    if (mode === 'REAL') {
                         // Check strictly only if REAL mode requested? 
                         // For now, next() proceeds. Controller checks explicitly if needed.
                    }
                }
                next();
            } catch (dbError) {
                if (dbError instanceof AppError) next(dbError);
                else next(new AppError(500, ErrorCode.DB_ERROR, 'Failed to retrieve trading session context'));
            }
         })();
    } catch (error: any) {
        // Pass error to global handler
        next(error); 
    }
};
