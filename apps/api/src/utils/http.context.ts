
import { Request } from 'express';
import { UserMode } from '../brokers/BrokerFactory';

export const getContext = (req: Request) => {
    const userId = req.user?.id || 'guest';
    // Handle both headers (case-insensitive usually, but node express uses lowercase)
    // Actually express headers are lowercase in req.headers
    const modeHeaderRaw = req.headers['x-trading-mode'] as string;
    const modeHeader = modeHeaderRaw ? modeHeaderRaw.toUpperCase() : undefined;
    
    const mode = (modeHeader === 'REAL' || modeHeader === 'MOCK') 
        ? (modeHeader as UserMode) 
        : UserMode.MOCK;
    
    // 1. Query Param (Highest Priority - Override)
    let accessToken: string | undefined = undefined;
    if (req.query.access_token) {
        accessToken = String(req.query.access_token);
    } 
    // 2. Req User (Middleware Populated)
    else if (req.user?.accessToken) {
        accessToken = req.user.accessToken;
    }

    // Return empty string if undefined to match previous behavior? 
    // MarketController used let accessToken = ''.
    return { userId, mode, accessToken: accessToken || '' };
};
