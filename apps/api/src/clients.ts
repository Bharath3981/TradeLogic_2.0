import { KiteConnect } from 'kiteconnect';
import { config } from './config/config';

/**
 * System-level Kite Client
 * Used for generating Login URLs and exchanging tokens (Auth Flow).
 */
export const systemKiteClient = new KiteConnect({
    api_key: config.KITE_API_KEY,
    debug: config.LOG_LEVEL === 'debug'
});

/**
 * User-level Kite Client Factory
 * Used for operations requiring a user's access token (Holdings, Orders).
 * @param accessToken User's specific access token
 */
export const getUserKiteClient = (accessToken: string) => {
    return new KiteConnect({
        api_key: config.KITE_API_KEY,
        access_token: accessToken,
        debug: config.LOG_LEVEL === 'debug'
    });
};
