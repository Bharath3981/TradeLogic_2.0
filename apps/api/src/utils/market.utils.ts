export const MarketUtils = {
    /**
     * Checks if the market is currently open.
     * Market Hours: 09:15 - 15:30 IST (UTC+5:30)
     * Markets are closed on Saturday and Sunday.
     * Note: Does not check for specific market holidays.
     */
    isMarketOpen(): boolean {
        // Get current time in IST regardless of server timezone
        const nowIST = new Date(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
        );

        const day = nowIST.getDay(); // 0 = Sunday, 6 = Saturday
        if (day === 0 || day === 6) {
            return false;
        }

        const hh = nowIST.getHours();
        const mm = nowIST.getMinutes();
        const totalMinutes = hh * 60 + mm;

        const openMinutes  = 9 * 60 + 15;  // 09:15
        const closeMinutes = 15 * 60 + 30; // 15:30

        return totalMinutes >= openMinutes && totalMinutes <= closeMinutes;
    },

    /**
     * Bypass market hours check during testing.
     */
    shouldBypassMarketHours(): boolean {
        return process.env.BYPASS_MARKET_HOURS === 'true';
    }
};
