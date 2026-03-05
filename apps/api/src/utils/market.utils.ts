import { format, isSaturday, isSunday, parse } from 'date-fns';

export const MarketUtils = {
    /**
     * Checks if the market is currently open.
     * Market Hours: 09:15 - 15:30 IST
     * Markets are closed on Saturday and Sunday.
     * Note: Does not currently check for specific market holidays.
     */
    isMarketOpen(): boolean {
        // 1. Check Weekend
        const now = new Date();
        if (isSaturday(now) || isSunday(now)) {
            return false;
        }

        // 2. Check Time (09:15 - 15:30)
        // Note: This logic assumes server time is in IST or we adjust accordingly.
        // For local development on user's machine (mac), we use local time.
        const currentTime = format(now, 'HH:mm');
        const openTime = '09:15';
        const closeTime = '15:30';

        return currentTime >= openTime && currentTime <= closeTime;
    },

    /**
     * Mock helper to bypass market hours during testing if needed.
     */
    shouldBypassMarketHours(): boolean {
        // Can be driven by environment variable
        return process.env.BYPASS_MARKET_HOURS === 'true';
    }
};
