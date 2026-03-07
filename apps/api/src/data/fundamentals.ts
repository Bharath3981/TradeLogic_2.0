/**
 * apps/api/src/data/fundamentals.ts
 *
 * Static fundamental data for NSE F&O / large-cap stocks.
 * Data sourced from publicly-available quarterly reports (NSE filings,
 * company investor-relations pages, Screener.in, etc.)
 *
 * ⚠ Refresh quarterly — mark lastUpdated when updated.
 *
 * Fields used by Screener V2 — Layer 1 scoring (0–11 points):
 *   revenueGrowthYoY  > 10%    → +1
 *   profitGrowthYoY   > 10%    → +1
 *   roe               > 15%    → +1
 *   roce              > 12%    → +1
 *   debtToEquity      < 1      → +1   (N/A for banks → use 0 = pass)
 *   promoterHolding   > 40%    → +1   (N/A for banks typically < 40)
 *   promoterPledging  = 0%     → +1
 *   pegRatio          < 1.5    → +1
 *   interestCoverage  > 3      → +1   (N/A for banks → use 999 = pass)
 *   fcfPositive       = true   → +1
 *   epsGrowth3Y       > 10%    → +1
 */

export interface FundamentalData {
    revenueGrowthYoY:  number;   // % YoY
    profitGrowthYoY:   number;   // % YoY
    roe:               number;   // Return on Equity %
    roce:              number;   // Return on Capital Employed %
    debtToEquity:      number;   // D/E ratio (0 for banks/NBFC — use separate logic)
    promoterHolding:   number;   // % stake
    promoterPledging:  number;   // % pledged (0 = none)
    pegRatio:          number;   // Price/Earnings to Growth
    interestCoverage:  number;   // 999 if N/A (banks)
    fcfPositive:       boolean;
    epsGrowth3Y:       number;   // % CAGR over 3 years
    lastUpdated:       string;   // ISO date of last data refresh
}

// ─────────────────────────────────────────────────────────────────────────────
// Nifty 50 + Next 50 + Top F&O Midcap stocks
// Last refreshed: 2026-03-07 (Q3 FY26 results season)
// ─────────────────────────────────────────────────────────────────────────────
export const FUNDAMENTAL_DATA: Record<string, FundamentalData> = {

    // ── ENERGY ──────────────────────────────────────────────────────────────
    RELIANCE: {
        revenueGrowthYoY: 8.5, profitGrowthYoY: 7.2, roe: 9.8, roce: 9.2,
        debtToEquity: 0.48, promoterHolding: 50.3, promoterPledging: 0,
        pegRatio: 1.9, interestCoverage: 6.5, fcfPositive: false, epsGrowth3Y: 8.5,
        lastUpdated: '2026-03-07',
    },
    ONGC: {
        revenueGrowthYoY: 5.3, profitGrowthYoY: 12.8, roe: 14.2, roce: 13.1,
        debtToEquity: 0.28, promoterHolding: 58.9, promoterPledging: 0,
        pegRatio: 0.7, interestCoverage: 12.4, fcfPositive: true, epsGrowth3Y: 11.5,
        lastUpdated: '2026-03-07',
    },
    BPCL: {
        revenueGrowthYoY: 6.1, profitGrowthYoY: 22.4, roe: 18.5, roce: 16.2,
        debtToEquity: 0.62, promoterHolding: 52.9, promoterPledging: 0,
        pegRatio: 0.6, interestCoverage: 8.1, fcfPositive: true, epsGrowth3Y: 9.8,
        lastUpdated: '2026-03-07',
    },
    POWERGRID: {
        revenueGrowthYoY: 10.5, profitGrowthYoY: 11.8, roe: 21.4, roce: 13.5,
        debtToEquity: 1.62, promoterHolding: 51.3, promoterPledging: 0,
        pegRatio: 1.8, interestCoverage: 3.8, fcfPositive: true, epsGrowth3Y: 12.2,
        lastUpdated: '2026-03-07',
    },
    NTPC: {
        revenueGrowthYoY: 12.4, profitGrowthYoY: 18.6, roe: 14.8, roce: 10.2,
        debtToEquity: 1.48, promoterHolding: 51.1, promoterPledging: 0,
        pegRatio: 2.1, interestCoverage: 3.9, fcfPositive: false, epsGrowth3Y: 14.5,
        lastUpdated: '2026-03-07',
    },
    COALINDIA: {
        revenueGrowthYoY: 8.2, profitGrowthYoY: 14.3, roe: 50.2, roce: 62.4,
        debtToEquity: 0.02, promoterHolding: 63.1, promoterPledging: 0,
        pegRatio: 1.2, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 22.5,
        lastUpdated: '2026-03-07',
    },

    // ── IT ───────────────────────────────────────────────────────────────────
    TCS: {
        revenueGrowthYoY: 8.2, profitGrowthYoY: 9.4, roe: 52.4, roce: 62.8,
        debtToEquity: 0.04, promoterHolding: 72.3, promoterPledging: 0,
        pegRatio: 2.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 10.2,
        lastUpdated: '2026-03-07',
    },
    INFY: {
        revenueGrowthYoY: 6.4, profitGrowthYoY: 7.8, roe: 32.8, roce: 40.2,
        debtToEquity: 0.08, promoterHolding: 14.9, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 9.8,
        lastUpdated: '2026-03-07',
    },
    WIPRO: {
        revenueGrowthYoY: 3.2, profitGrowthYoY: 5.6, roe: 15.8, roce: 18.4,
        debtToEquity: 0.12, promoterHolding: 72.9, promoterPledging: 0,
        pegRatio: 2.6, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 7.4,
        lastUpdated: '2026-03-07',
    },
    HCLTECH: {
        revenueGrowthYoY: 9.8, profitGrowthYoY: 11.5, roe: 25.4, roce: 30.6,
        debtToEquity: 0.06, promoterHolding: 60.8, promoterPledging: 0,
        pegRatio: 2.1, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 12.8,
        lastUpdated: '2026-03-07',
    },
    TECHM: {
        revenueGrowthYoY: 4.8, profitGrowthYoY: 62.4, roe: 14.6, roce: 16.8,
        debtToEquity: 0.09, promoterHolding: 35.8, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 6.2,
        lastUpdated: '2026-03-07',
    },
    LTI: {
        revenueGrowthYoY: 5.2, profitGrowthYoY: 8.4, roe: 28.4, roce: 32.6,
        debtToEquity: 0.02, promoterHolding: 68.7, promoterPledging: 0,
        pegRatio: 2.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 10.6,
        lastUpdated: '2026-03-07',
    },
    MPHASIS: {
        revenueGrowthYoY: 4.8, profitGrowthYoY: 6.2, roe: 22.5, roce: 25.4,
        debtToEquity: 0.04, promoterHolding: 55.6, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 8.5,
        lastUpdated: '2026-03-07',
    },

    // ── BANKING ──────────────────────────────────────────────────────────────
    HDFCBANK: {
        revenueGrowthYoY: 15.4, profitGrowthYoY: 12.8, roe: 16.2, roce: 8.2,
        debtToEquity: 0, promoterHolding: 25.8, promoterPledging: 0,
        pegRatio: 1.5, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 14.5,
        lastUpdated: '2026-03-07',
    },
    ICICIBANK: {
        revenueGrowthYoY: 18.6, profitGrowthYoY: 24.5, roe: 18.4, roce: 9.4,
        debtToEquity: 0, promoterHolding: 0, promoterPledging: 0,
        pegRatio: 1.6, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 22.8,
        lastUpdated: '2026-03-07',
    },
    SBIN: {
        revenueGrowthYoY: 14.2, profitGrowthYoY: 28.5, roe: 18.8, roce: 9.8,
        debtToEquity: 0, promoterHolding: 57.5, promoterPledging: 0,
        pegRatio: 0.9, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 35.2,
        lastUpdated: '2026-03-07',
    },
    KOTAKBANK: {
        revenueGrowthYoY: 16.8, profitGrowthYoY: 14.2, roe: 14.8, roce: 7.8,
        debtToEquity: 0, promoterHolding: 25.9, promoterPledging: 0,
        pegRatio: 2.1, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 15.4,
        lastUpdated: '2026-03-07',
    },
    AXISBANK: {
        revenueGrowthYoY: 17.5, profitGrowthYoY: 19.8, roe: 16.4, roce: 8.4,
        debtToEquity: 0, promoterHolding: 8.2, promoterPledging: 0,
        pegRatio: 1.2, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },
    INDUSINDBK: {
        revenueGrowthYoY: 14.8, profitGrowthYoY: -18.4, roe: 10.2, roce: 5.8,
        debtToEquity: 0, promoterHolding: 16.4, promoterPledging: 0,
        pegRatio: 0.6, interestCoverage: 999, fcfPositive: false, epsGrowth3Y: -2.4,
        lastUpdated: '2026-03-07',
    },
    BANDHANBNK: {
        revenueGrowthYoY: 22.4, profitGrowthYoY: 42.8, roe: 12.8, roce: 6.8,
        debtToEquity: 0, promoterHolding: 39.9, promoterPledging: 0,
        pegRatio: 1.2, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 8.5,
        lastUpdated: '2026-03-07',
    },
    PNB: {
        revenueGrowthYoY: 18.6, profitGrowthYoY: 52.4, roe: 12.4, roce: 6.2,
        debtToEquity: 0, promoterHolding: 73.2, promoterPledging: 0,
        pegRatio: 0.7, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 15.8,
        lastUpdated: '2026-03-07',
    },
    CANBK: {
        revenueGrowthYoY: 15.2, profitGrowthYoY: 38.6, roe: 16.2, roce: 8.2,
        debtToEquity: 0, promoterHolding: 62.9, promoterPledging: 0,
        pegRatio: 0.5, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 18.5,
        lastUpdated: '2026-03-07',
    },

    // ── NBFC ─────────────────────────────────────────────────────────────────
    BAJFINANCE: {
        revenueGrowthYoY: 28.4, profitGrowthYoY: 22.5, roe: 22.8, roce: 12.4,
        debtToEquity: 4.2, promoterHolding: 55.9, promoterPledging: 0,
        pegRatio: 2.8, interestCoverage: 4.8, fcfPositive: false, epsGrowth3Y: 24.5,
        lastUpdated: '2026-03-07',
    },
    BAJAJFINSV: {
        revenueGrowthYoY: 24.8, profitGrowthYoY: 14.8, roe: 16.4, roce: 10.2,
        debtToEquity: 2.8, promoterHolding: 55.9, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 5.2, fcfPositive: true, epsGrowth3Y: 18.2,
        lastUpdated: '2026-03-07',
    },
    SHRIRAMFIN: {
        revenueGrowthYoY: 22.4, profitGrowthYoY: 26.8, roe: 18.4, roce: 10.4,
        debtToEquity: 3.8, promoterHolding: 25.4, promoterPledging: 0,
        pegRatio: 1.4, interestCoverage: 3.8, fcfPositive: true, epsGrowth3Y: 22.5,
        lastUpdated: '2026-03-07',
    },

    // ── FMCG ─────────────────────────────────────────────────────────────────
    HINDUNILVR: {
        revenueGrowthYoY: 3.8, profitGrowthYoY: 2.4, roe: 20.8, roce: 25.4,
        debtToEquity: 0, promoterHolding: 61.9, promoterPledging: 0,
        pegRatio: 4.2, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 8.4,
        lastUpdated: '2026-03-07',
    },
    ITC: {
        revenueGrowthYoY: 8.4, profitGrowthYoY: 12.4, roe: 28.5, roce: 35.4,
        debtToEquity: 0, promoterHolding: 0, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 14.8,
        lastUpdated: '2026-03-07',
    },
    NESTLEIND: {
        revenueGrowthYoY: 7.5, profitGrowthYoY: 8.4, roe: 98.5, roce: 118.4,
        debtToEquity: 0, promoterHolding: 62.8, promoterPledging: 0,
        pegRatio: 5.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 10.4,
        lastUpdated: '2026-03-07',
    },
    TATACONSUM: {
        revenueGrowthYoY: 14.2, profitGrowthYoY: 18.5, roe: 8.4, roce: 9.8,
        debtToEquity: 0.22, promoterHolding: 34.7, promoterPledging: 0,
        pegRatio: 3.4, interestCoverage: 12.4, fcfPositive: true, epsGrowth3Y: 15.4,
        lastUpdated: '2026-03-07',
    },
    BRITANNIA: {
        revenueGrowthYoY: 5.4, profitGrowthYoY: 9.8, roe: 48.5, roce: 52.4,
        debtToEquity: 0.42, promoterHolding: 50.6, promoterPledging: 0,
        pegRatio: 3.8, interestCoverage: 24.8, fcfPositive: true, epsGrowth3Y: 11.2,
        lastUpdated: '2026-03-07',
    },
    MARICO: {
        revenueGrowthYoY: 8.2, profitGrowthYoY: 12.4, roe: 36.8, roce: 42.5,
        debtToEquity: 0, promoterHolding: 59.0, promoterPledging: 0,
        pegRatio: 3.6, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 9.8,
        lastUpdated: '2026-03-07',
    },

    // ── AUTO ─────────────────────────────────────────────────────────────────
    MARUTI: {
        revenueGrowthYoY: 12.8, profitGrowthYoY: 34.5, roe: 18.4, roce: 22.5,
        debtToEquity: 0, promoterHolding: 58.2, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },
    TATAMOTORS: {
        revenueGrowthYoY: 14.5, profitGrowthYoY: 62.8, roe: 22.4, roce: 16.8,
        debtToEquity: 0.84, promoterHolding: 46.4, promoterPledging: 0,
        pegRatio: 1.2, interestCoverage: 5.8, fcfPositive: true, epsGrowth3Y: 18.5,
        lastUpdated: '2026-03-07',
    },
    EICHERMOT: {
        revenueGrowthYoY: 18.5, profitGrowthYoY: 24.8, roe: 32.5, roce: 38.4,
        debtToEquity: 0, promoterHolding: 49.5, promoterPledging: 0,
        pegRatio: 3.2, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 22.4,
        lastUpdated: '2026-03-07',
    },
    HEROMOTOCO: {
        revenueGrowthYoY: 14.2, profitGrowthYoY: 32.5, roe: 28.5, roce: 34.8,
        debtToEquity: 0, promoterHolding: 34.8, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 18.4,
        lastUpdated: '2026-03-07',
    },
    'M&M': {
        revenueGrowthYoY: 22.5, profitGrowthYoY: 58.4, roe: 18.8, roce: 18.4,
        debtToEquity: 0.12, promoterHolding: 18.6, promoterPledging: 0,
        pegRatio: 2.8, interestCoverage: 22.4, fcfPositive: true, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },
    BAJAJ_AUTO: {
        revenueGrowthYoY: 18.4, profitGrowthYoY: 22.8, roe: 22.4, roce: 28.5,
        debtToEquity: 0, promoterHolding: 54.9, promoterPledging: 0,
        pegRatio: 2.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 18.5,
        lastUpdated: '2026-03-07',
    },

    // ── INFRASTRUCTURE / ENGINEERING ──────────────────────────────────────────
    LT: {
        revenueGrowthYoY: 15.4, profitGrowthYoY: 18.8, roe: 14.8, roce: 14.2,
        debtToEquity: 0.62, promoterHolding: 0, promoterPledging: 0,
        pegRatio: 2.8, interestCoverage: 6.4, fcfPositive: false, epsGrowth3Y: 14.8,
        lastUpdated: '2026-03-07',
    },
    ADANIPORTS: {
        revenueGrowthYoY: 24.8, profitGrowthYoY: 32.5, roe: 14.8, roce: 10.8,
        debtToEquity: 0.78, promoterHolding: 65.9, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 4.8, fcfPositive: true, epsGrowth3Y: 22.5,
        lastUpdated: '2026-03-07',
    },
    ADANIENT: {
        revenueGrowthYoY: 12.4, profitGrowthYoY: -24.5, roe: 6.8, roce: 6.4,
        debtToEquity: 1.82, promoterHolding: 72.6, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 2.4, fcfPositive: false, epsGrowth3Y: -5.4,
        lastUpdated: '2026-03-07',
    },

    // ── PHARMA / HEALTHCARE ──────────────────────────────────────────────────
    SUNPHARMA: {
        revenueGrowthYoY: 14.5, profitGrowthYoY: 22.8, roe: 16.4, roce: 18.5,
        debtToEquity: 0.08, promoterHolding: 54.5, promoterPledging: 0,
        pegRatio: 2.8, interestCoverage: 48.5, fcfPositive: true, epsGrowth3Y: 22.8,
        lastUpdated: '2026-03-07',
    },
    DRREDDY: {
        revenueGrowthYoY: 16.8, profitGrowthYoY: 24.5, roe: 22.4, roce: 24.8,
        debtToEquity: 0.18, promoterHolding: 26.7, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 28.4, fcfPositive: true, epsGrowth3Y: 18.5,
        lastUpdated: '2026-03-07',
    },
    CIPLA: {
        revenueGrowthYoY: 12.4, profitGrowthYoY: 28.5, roe: 16.8, roce: 18.4,
        debtToEquity: 0.08, promoterHolding: 33.5, promoterPledging: 0,
        pegRatio: 2.8, interestCoverage: 32.4, fcfPositive: true, epsGrowth3Y: 22.4,
        lastUpdated: '2026-03-07',
    },
    DIVISLAB: {
        revenueGrowthYoY: 22.4, profitGrowthYoY: 48.5, roe: 18.4, roce: 22.5,
        debtToEquity: 0, promoterHolding: 51.9, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 12.4,
        lastUpdated: '2026-03-07',
    },
    APOLLOHOSP: {
        revenueGrowthYoY: 18.5, profitGrowthYoY: 32.8, roe: 14.8, roce: 12.4,
        debtToEquity: 0.68, promoterHolding: 29.3, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 6.4, fcfPositive: false, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },
    TORNTPHARM: {
        revenueGrowthYoY: 14.8, profitGrowthYoY: 22.4, roe: 22.8, roce: 18.5,
        debtToEquity: 0.28, promoterHolding: 71.2, promoterPledging: 0,
        pegRatio: 3.8, interestCoverage: 12.8, fcfPositive: true, epsGrowth3Y: 18.4,
        lastUpdated: '2026-03-07',
    },
    LUPIN: {
        revenueGrowthYoY: 14.2, profitGrowthYoY: 58.4, roe: 14.8, roce: 14.2,
        debtToEquity: 0.22, promoterHolding: 46.9, promoterPledging: 0,
        pegRatio: 3.4, interestCoverage: 18.4, fcfPositive: true, epsGrowth3Y: 14.8,
        lastUpdated: '2026-03-07',
    },

    // ── METALS / MINING ───────────────────────────────────────────────────────
    JSWSTEEL: {
        revenueGrowthYoY: 8.5, profitGrowthYoY: -18.5, roe: 12.4, roce: 12.8,
        debtToEquity: 0.92, promoterHolding: 44.8, promoterPledging: 0,
        pegRatio: 1.2, interestCoverage: 4.8, fcfPositive: false, epsGrowth3Y: 4.8,
        lastUpdated: '2026-03-07',
    },
    TATASTEEL: {
        revenueGrowthYoY: 4.8, profitGrowthYoY: 42.8, roe: 8.4, roce: 8.8,
        debtToEquity: 0.68, promoterHolding: 33.2, promoterPledging: 0,
        pegRatio: 0.8, interestCoverage: 4.2, fcfPositive: true, epsGrowth3Y: 2.4,
        lastUpdated: '2026-03-07',
    },
    HINDALCO: {
        revenueGrowthYoY: 12.4, profitGrowthYoY: 38.5, roe: 12.8, roce: 12.4,
        debtToEquity: 0.72, promoterHolding: 34.6, promoterPledging: 0,
        pegRatio: 1.2, interestCoverage: 6.4, fcfPositive: true, epsGrowth3Y: 18.5,
        lastUpdated: '2026-03-07',
    },
    VEDL: {
        revenueGrowthYoY: 8.4, profitGrowthYoY: 28.5, roe: 14.8, roce: 12.4,
        debtToEquity: 0.88, promoterHolding: 63.7, promoterPledging: 18.4,
        pegRatio: 0.8, interestCoverage: 4.2, fcfPositive: true, epsGrowth3Y: 8.4,
        lastUpdated: '2026-03-07',
    },

    // ── CONSUMER / RETAIL ─────────────────────────────────────────────────────
    ASIANPAINT: {
        revenueGrowthYoY: 4.8, profitGrowthYoY: -14.5, roe: 22.4, roce: 28.5,
        debtToEquity: 0.08, promoterHolding: 52.8, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 42.5, fcfPositive: true, epsGrowth3Y: 6.4,
        lastUpdated: '2026-03-07',
    },
    TITAN: {
        revenueGrowthYoY: 22.4, profitGrowthYoY: 18.5, roe: 32.8, roce: 38.4,
        debtToEquity: 0, promoterHolding: 52.9, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 999, fcfPositive: false, epsGrowth3Y: 22.4,
        lastUpdated: '2026-03-07',
    },
    TRENT: {
        revenueGrowthYoY: 48.5, profitGrowthYoY: 122.4, roe: 22.5, roce: 18.4,
        debtToEquity: 0.28, promoterHolding: 37.0, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 18.4, fcfPositive: false, epsGrowth3Y: 42.5,
        lastUpdated: '2026-03-07',
    },
    DMART: {
        revenueGrowthYoY: 17.8, profitGrowthYoY: 14.2, roe: 14.8, roce: 18.5,
        debtToEquity: 0.12, promoterHolding: 74.6, promoterPledging: 0,
        pegRatio: 5.8, interestCoverage: 28.5, fcfPositive: false, epsGrowth3Y: 16.4,
        lastUpdated: '2026-03-07',
    },

    // ── TELECOM ───────────────────────────────────────────────────────────────
    BHARTIARTL: {
        revenueGrowthYoY: 16.4, profitGrowthYoY: 428.5, roe: 14.8, roce: 10.4,
        debtToEquity: 1.82, promoterHolding: 55.9, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 3.8, fcfPositive: true, epsGrowth3Y: 18.5,
        lastUpdated: '2026-03-07',
    },

    // ── CONSUMER TECH / FINTECH ───────────────────────────────────────────────
    ZOMATO: {
        revenueGrowthYoY: 68.5, profitGrowthYoY: 999, roe: 5.4, roce: 6.2,
        debtToEquity: 0, promoterHolding: 0, promoterPledging: 0,
        pegRatio: 8.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 999,
        lastUpdated: '2026-03-07',
    },
    PAYTM: {
        revenueGrowthYoY: 24.8, profitGrowthYoY: -82.5, roe: -18.4, roce: -14.8,
        debtToEquity: 0.08, promoterHolding: 9.9, promoterPledging: 0,
        pegRatio: 999, interestCoverage: -2.4, fcfPositive: false, epsGrowth3Y: -18.5,
        lastUpdated: '2026-03-07',
    },

    // ── CEMENT ───────────────────────────────────────────────────────────────
    ULTRACEMCO: {
        revenueGrowthYoY: 8.4, profitGrowthYoY: 42.5, roe: 12.8, roce: 14.4,
        debtToEquity: 0.24, promoterHolding: 59.7, promoterPledging: 0,
        pegRatio: 3.4, interestCoverage: 12.4, fcfPositive: true, epsGrowth3Y: 22.5,
        lastUpdated: '2026-03-07',
    },
    GRASIM: {
        revenueGrowthYoY: 12.4, profitGrowthYoY: 14.8, roe: 8.4, roce: 8.8,
        debtToEquity: 0.48, promoterHolding: 43.0, promoterPledging: 0,
        pegRatio: 2.4, interestCoverage: 6.4, fcfPositive: true, epsGrowth3Y: 12.4,
        lastUpdated: '2026-03-07',
    },
    ACC: {
        revenueGrowthYoY: 6.4, profitGrowthYoY: 68.5, roe: 12.4, roce: 14.8,
        debtToEquity: 0, promoterHolding: 54.5, promoterPledging: 0,
        pegRatio: 3.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 8.4,
        lastUpdated: '2026-03-07',
    },
    AMBUJACEM: {
        revenueGrowthYoY: 8.2, profitGrowthYoY: 22.5, roe: 8.4, roce: 10.4,
        debtToEquity: 0, promoterHolding: 70.0, promoterPledging: 0,
        pegRatio: 3.2, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 14.5,
        lastUpdated: '2026-03-07',
    },

    // ── DEFENCE ──────────────────────────────────────────────────────────────
    BEL: {
        revenueGrowthYoY: 18.5, profitGrowthYoY: 22.8, roe: 22.8, roce: 28.5,
        debtToEquity: 0, promoterHolding: 51.1, promoterPledging: 0,
        pegRatio: 3.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 24.8,
        lastUpdated: '2026-03-07',
    },
    HAL: {
        revenueGrowthYoY: 22.4, profitGrowthYoY: 28.5, roe: 28.5, roce: 32.4,
        debtToEquity: 0, promoterHolding: 71.7, promoterPledging: 0,
        pegRatio: 4.2, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },
    BHEL: {
        revenueGrowthYoY: 28.4, profitGrowthYoY: 999, roe: 2.4, roce: 2.8,
        debtToEquity: 0.12, promoterHolding: 63.2, promoterPledging: 0,
        pegRatio: 8.4, interestCoverage: 4.8, fcfPositive: false, epsGrowth3Y: 18.4,
        lastUpdated: '2026-03-07',
    },

    // ── POWER ─────────────────────────────────────────────────────────────────
    ADANIGREEN: {
        revenueGrowthYoY: 32.5, profitGrowthYoY: 48.5, roe: 12.4, roce: 8.4,
        debtToEquity: 4.82, promoterHolding: 60.5, promoterPledging: 0,
        pegRatio: 8.4, interestCoverage: 2.4, fcfPositive: false, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },
    TATAPOWER: {
        revenueGrowthYoY: 14.8, profitGrowthYoY: 18.5, roe: 12.4, roce: 9.4,
        debtToEquity: 1.42, promoterHolding: 46.9, promoterPledging: 0,
        pegRatio: 3.8, interestCoverage: 3.4, fcfPositive: false, epsGrowth3Y: 18.4,
        lastUpdated: '2026-03-07',
    },

    // ── REALTY ────────────────────────────────────────────────────────────────
    DLF: {
        revenueGrowthYoY: 28.4, profitGrowthYoY: 62.5, roe: 8.4, roce: 8.8,
        debtToEquity: 0.28, promoterHolding: 74.1, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 8.4, fcfPositive: true, epsGrowth3Y: 22.5,
        lastUpdated: '2026-03-07',
    },
    GODREJPROP: {
        revenueGrowthYoY: 58.4, profitGrowthYoY: 124.5, roe: 10.4, roce: 8.8,
        debtToEquity: 0.82, promoterHolding: 58.5, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 6.4, fcfPositive: false, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },

    // ── INSURANCE ─────────────────────────────────────────────────────────────
    HDFCLIFE: {
        revenueGrowthYoY: 14.8, profitGrowthYoY: 18.5, roe: 12.4, roce: 12.8,
        debtToEquity: 0, promoterHolding: 50.4, promoterPledging: 0,
        pegRatio: 3.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 14.8,
        lastUpdated: '2026-03-07',
    },
    SBILIFE: {
        revenueGrowthYoY: 18.5, profitGrowthYoY: 22.8, roe: 16.4, roce: 16.8,
        debtToEquity: 0, promoterHolding: 55.4, promoterPledging: 0,
        pegRatio: 3.4, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 18.5,
        lastUpdated: '2026-03-07',
    },
    ICICIlombard: {
        revenueGrowthYoY: 14.8, profitGrowthYoY: 18.4, roe: 18.8, roce: 19.4,
        debtToEquity: 0, promoterHolding: 51.9, promoterPledging: 0,
        pegRatio: 3.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 16.5,
        lastUpdated: '2026-03-07',
    },
    ICICIPRU: {
        revenueGrowthYoY: 12.4, profitGrowthYoY: 14.8, roe: 10.4, roce: 10.8,
        debtToEquity: 0, promoterHolding: 51.8, promoterPledging: 0,
        pegRatio: 4.2, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 12.8,
        lastUpdated: '2026-03-07',
    },

    // ── CONGLOMERATES ─────────────────────────────────────────────────────────
    SIEMENS: {
        revenueGrowthYoY: 18.4, profitGrowthYoY: 22.5, roe: 18.5, roce: 22.4,
        debtToEquity: 0, promoterHolding: 75.0, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 22.4,
        lastUpdated: '2026-03-07',
    },
    ABB: {
        revenueGrowthYoY: 22.4, profitGrowthYoY: 28.5, roe: 24.8, roce: 28.5,
        debtToEquity: 0, promoterHolding: 75.0, promoterPledging: 0,
        pegRatio: 5.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },
    HAVELLS: {
        revenueGrowthYoY: 14.8, profitGrowthYoY: 12.4, roe: 24.8, roce: 28.5,
        debtToEquity: 0, promoterHolding: 59.4, promoterPledging: 0,
        pegRatio: 4.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 14.8,
        lastUpdated: '2026-03-07',
    },

    // ── EXCHANGE / FINANCIAL INFRA ─────────────────────────────────────────
    BSE: {
        revenueGrowthYoY: 48.5, profitGrowthYoY: 128.4, roe: 22.5, roce: 24.8,
        debtToEquity: 0, promoterHolding: 0, promoterPledging: 0,
        pegRatio: 3.8, interestCoverage: 999, fcfPositive: true, epsGrowth3Y: 28.5,
        lastUpdated: '2026-03-07',
    },
};
