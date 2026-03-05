import { IBroker } from './interfaces/IBroker';
import { KiteBroker } from './kite/KiteBroker';
import { MockBroker } from './mock/MockBroker';
import { getAccessToken } from '../utils/context';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants';

export enum UserMode {
    REAL = 'REAL',
    MOCK = 'MOCK'
}

export const BrokerFactory = {
    getBroker(mode: UserMode, userId: string, accessToken?: string): IBroker {
        if (mode === UserMode.REAL) {
            // Try explicit token -> ALS token -> Error
            const token = accessToken || getAccessToken();
            if (!token) throw new AppError(400, ErrorCode.KITE_TOKEN_MISSING, 'Access Token required for Real Trading. Please Login to Kite.');
            return new KiteBroker(token);
        } else {
            return new MockBroker(userId);
        }
    }
};
