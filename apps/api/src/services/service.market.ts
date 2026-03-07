import { logger } from '../utils/logger';
import { BrokerFactory, UserMode } from '../brokers/BrokerFactory';
import { TickerService } from './service.ticker';

export const MarketService = {
    async getInstruments(userId: string, mode: UserMode, accessToken: string | undefined, exchange?: string) {
        try {
            // Market Data always comes from REAL broker (Kite)
            // Even if user is in MOCK mode, we need real market data.
            // Requirement from User: "even if user pass x-trading-mode as mock it should pick real data only"
            const broker = BrokerFactory.getBroker(UserMode.REAL, userId, accessToken);
            return await broker.getInstruments(exchange);
        } catch (error) {
            logger.error({ msg: 'Failed to fetch instruments', error });
            throw error;
        }
    },

    async getQuote(userId: string, mode: UserMode, accessToken: string | undefined, instruments: string[]) {
        try {
            const broker = BrokerFactory.getBroker(UserMode.REAL, userId, accessToken);
            return await broker.getQuote(instruments);
        } catch (error) {
            logger.error({ msg: 'Failed to fetch quote', error, instruments });
            throw error;
        }
    },

    async getLTP(userId: string, mode: UserMode, accessToken: string | undefined, instruments: string[]) {
        try {
            // OPTIMIZATION: Try to fetch from TickerService Cache first (0 API Calls)
            // This is critical for high-frequency monitoring loop
            const result: any = {};
            const missingInstruments: string[] = [];

             instruments.forEach(token => {
                const cachedPrice = TickerService.getLTP(token);
                if (cachedPrice !== undefined) {
                    result[token] = { last_price: cachedPrice, instrument_token: Number(token) };
                } else {
                    missingInstruments.push(token);
                }
            });

            // If we found everything in cache, return immediately
            if (missingInstruments.length === 0) {
                 return result;
            }

            // Fallback: Fetch missing from API
            if (missingInstruments.length > 0) {
                 // Market Data always comes from REAL broker (Kite)
                const broker = BrokerFactory.getBroker(UserMode.REAL, userId, accessToken);
                const apiData = await broker.getLTP(missingInstruments);
                
                // Merge API data into result
                Object.assign(result, apiData);
                
                // Optional: Auto-subscribe to missing tokens so next time they are cached?
                // TickerService.subscribe(missingInstruments.map(Number));
            }

            return result;

        } catch (error) {
            logger.error({ msg: 'Failed to fetch LTP', error, instruments });
            throw error;
        }
    }
};
