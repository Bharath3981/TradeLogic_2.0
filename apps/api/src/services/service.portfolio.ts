import { config } from '../config/config';
import { logger } from '../utils/logger';
import { BrokerFactory, UserMode } from '../brokers/BrokerFactory';

export const PortfolioService = {
    /**
     * Fetch holdings using Broker Abstraction
     */
    async getHoldings(userId: string, mode: UserMode, accessToken?: string) {
        try {
            const broker = BrokerFactory.getBroker(mode, userId, accessToken);
            return await broker.getHoldings();
        } catch (error) {
            logger.error({ msg: 'Failed to fetch holdings', error });
            throw error;
        }
    },

    async getProfile(userId: string, mode: UserMode, accessToken?: string) {
        try {
            const broker = BrokerFactory.getBroker(mode, userId, accessToken);
            return await broker.getProfile();
        } catch (error) {
            logger.error({ msg: 'Failed to fetch profile', error });
            throw error;
        }
    },

    async getPositions(userId: string, mode: UserMode, accessToken?: string) {
        try {
            const broker = BrokerFactory.getBroker(mode, userId, accessToken);
            return await broker.getPositions();
        } catch (error) {
            logger.error({ msg: 'Failed to fetch positions', error });
            throw error;
        }
    },

    async getMargins(userId: string, mode: UserMode, accessToken?: string) {
        try {
            const broker = BrokerFactory.getBroker(mode, userId, accessToken);
            return await broker.getMargins();
        } catch (error) {
            logger.error({ msg: 'Failed to fetch margins', error });
            throw error;
        }
    }
};
