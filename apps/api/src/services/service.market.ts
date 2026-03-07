import { logger } from '../utils/logger';
import { BrokerFactory, UserMode } from '../brokers/BrokerFactory';

export const MarketService = {
    async getInstruments(userId: string, mode: UserMode, accessToken: string | undefined, exchange?: string) {
        try {
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
            const broker = BrokerFactory.getBroker(UserMode.REAL, userId, accessToken);
            return await broker.getLTP(instruments);
        } catch (error) {
            logger.error({ msg: 'Failed to fetch LTP', error, instruments });
            throw error;
        }
    }
};
