import { logger } from '../utils/logger';
import { BrokerFactory, UserMode } from '../brokers/BrokerFactory';
import type { Candle } from '../utils/technicalIndicators';
import { getStrategy, getVersionMeta, DEFAULT_VERSION } from './screener/screener.registry';
import type { ScreenerVersion } from './screener/screener.types';

const FNO_SYMBOLS: { symbol: string; name: string; sector: string }[] = [
    { symbol: 'RELIANCE',   name: 'Reliance Industries',       sector: 'Energy' },
    { symbol: 'TCS',        name: 'Tata Consultancy Services', sector: 'IT' },
    { symbol: 'HDFCBANK',   name: 'HDFC Bank',                 sector: 'Banking' },
    { symbol: 'INFY',       name: 'Infosys',                   sector: 'IT' },
    { symbol: 'ICICIBANK',  name: 'ICICI Bank',                sector: 'Banking' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever',        sector: 'FMCG' },
    { symbol: 'SBIN',       name: 'State Bank of India',       sector: 'Banking' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel',             sector: 'Telecom' },
    { symbol: 'ITC',        name: 'ITC Limited',               sector: 'FMCG' },
    { symbol: 'KOTAKBANK',  name: 'Kotak Mahindra Bank',       sector: 'Banking' },
    { symbol: 'LT',         name: 'Larsen & Toubro',           sector: 'Infrastructure' },
    { symbol: 'AXISBANK',   name: 'Axis Bank',                 sector: 'Banking' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints',              sector: 'Consumer' },
    { symbol: 'MARUTI',     name: 'Maruti Suzuki',             sector: 'Auto' },
    { symbol: 'TITAN',      name: 'Titan Company',             sector: 'Consumer' },
    { symbol: 'SUNPHARMA',  name: 'Sun Pharma',                sector: 'Pharma' },
    { symbol: 'WIPRO',      name: 'Wipro',                     sector: 'IT' },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance',             sector: 'NBFC' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors',               sector: 'Auto' },
    { symbol: 'HCLTECH',    name: 'HCL Technologies',          sector: 'IT' },
    { symbol: 'NTPC',       name: 'NTPC',                      sector: 'Power' },
    { symbol: 'ONGC',       name: 'ONGC',                      sector: 'Energy' },
    { symbol: 'ADANIENT',   name: 'Adani Enterprises',         sector: 'Conglomerate' },
    { symbol: 'ADANIPORTS', name: 'Adani Ports',               sector: 'Infrastructure' },
    { symbol: 'JSWSTEEL',   name: 'JSW Steel',                 sector: 'Metals' },
    { symbol: 'TATASTEEL',  name: 'Tata Steel',                sector: 'Metals' },
    { symbol: 'HINDALCO',   name: 'Hindalco',                  sector: 'Metals' },
    { symbol: 'TECHM',      name: 'Tech Mahindra',             sector: 'IT' },
    { symbol: 'DRREDDY',    name: "Dr. Reddy's Labs",          sector: 'Pharma' },
    { symbol: 'CIPLA',      name: 'Cipla',                     sector: 'Pharma' },
    { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv',             sector: 'NBFC' },
    { symbol: 'EICHERMOT',  name: 'Eicher Motors',             sector: 'Auto' },
    { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp',             sector: 'Auto' },
    { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals',          sector: 'Healthcare' },
    { symbol: 'TATACONSUM', name: 'Tata Consumer',             sector: 'FMCG' },
    { symbol: 'BPCL',       name: 'BPCL',                      sector: 'Energy' },
    { symbol: 'COALINDIA',  name: 'Coal India',                sector: 'Mining' },
    { symbol: 'INDUSINDBK', name: 'IndusInd Bank',             sector: 'Banking' },
    { symbol: 'M&M',        name: 'Mahindra & Mahindra',       sector: 'Auto' },
    { symbol: 'BEL',        name: 'Bharat Electronics',        sector: 'Defence' },
    { symbol: 'HAL',        name: 'Hindustan Aeronautics',     sector: 'Defence' },
    { symbol: 'ZOMATO',     name: 'Zomato',                    sector: 'Consumer Tech' },
    { symbol: 'TRENT',      name: 'Trent',                     sector: 'Retail' },
    { symbol: 'GRASIM',     name: 'Grasim Industries',         sector: 'Cement' },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement',          sector: 'Cement' },
    { symbol: 'DIVISLAB',   name: "Divi's Laboratories",       sector: 'Pharma' },
    { symbol: 'NESTLEIND',  name: 'Nestle India',              sector: 'FMCG' },
    { symbol: 'SHRIRAMFIN', name: 'Shriram Finance',           sector: 'NBFC' },
    { symbol: 'POWERGRID',  name: 'Power Grid Corp',           sector: 'Power' },
    { symbol: 'PAYTM',      name: 'Paytm',                     sector: 'Fintech' },
];

export interface ScreenerStock {
    symbol:         string;
    name:           string;
    sector:         string;
    currentPrice:   number;
    score:          number;
    signals:        string[];
    indicators:     Record<string, any>;
    recommendation: 'STRONG BUY' | 'BUY' | 'WATCH' | 'NEUTRAL';
    version:        string;
}

export interface ScreenerResult {
    stocks:         ScreenerStock[];
    scannedAt:      string;
    totalScanned:   number;
    scanDurationMs: number;
    version:        string;
}

// Re-export so controller can use without reaching into the screener/ subdirectory
export type { ScreenerVersion };

// ─── Token cache — fetched once per process lifetime ─────────────────────────
let tokenCache: Map<string, number> | null = null;

async function getInstrumentTokenMap(broker: any): Promise<Map<string, number>> {
    if (tokenCache && tokenCache.size > 0) {
        logger.info({ msg: 'Using cached instrument tokens', count: tokenCache.size });
        return tokenCache;
    }

    logger.info({ msg: 'Fetching NSE instruments list from Kite...' });
    const instruments = await broker.getInstruments('NSE');

    const map = new Map<string, number>();
    for (const inst of instruments) {
        if (inst.segment === 'NSE' && inst.instrument_type === 'EQ') {
            map.set(inst.tradingsymbol, inst.instrument_token);
        }
    }

    tokenCache = map;
    logger.info({ msg: 'Instrument token map built', count: map.size });
    return map;
}

export const ScreenerService = {

    async runScan(
        userId: string,
        accessToken: string | undefined,
        options: {
            sector?:        string;
            minScore?:      number;
            limit?:         number;
            trend?:         string;
            holdingMonths?: number;
            version?:       string;
        } = {}
    ): Promise<ScreenerResult> {

        const startTime = Date.now();
        const {
            sector,
            minScore      = 40,
            limit         = 20,
            trend         = 'ALL',
            holdingMonths = 3,
            version       = DEFAULT_VERSION,
        } = options;

        // Resolve scoring strategy — throws AppError-compatible if version is unknown
        const strategy = getStrategy(version);

        const broker = BrokerFactory.getBroker(UserMode.REAL, userId, accessToken);

        // Step 1 — resolve instrument tokens
        const tokenMap = await getInstrumentTokenMap(broker);

        let stockList = FNO_SYMBOLS;
        if (sector && sector !== 'ALL') {
            stockList = FNO_SYMBOLS.filter(s => s.sector === sector);
        }

        const resolvedStocks = stockList
            .map(s => ({ ...s, token: tokenMap.get(s.symbol) }))
            .filter(s => {
                if (!s.token) {
                    logger.warn({ msg: 'Token not found for symbol — skipping', symbol: s.symbol });
                    return false;
                }
                return true;
            }) as ({ symbol: string; name: string; sector: string; token: number })[];

        logger.info({ msg: 'Screener scan started', total: resolvedStocks.length, trend, holdingMonths, version });

        const results: ScreenerStock[] = [];
        const toDate   = new Date();
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 1);

        // Step 2 — fetch historical data in batches of 3 (respect Kite rate limits)
        const BATCH_SIZE = 3;

        for (let i = 0; i < resolvedStocks.length; i += BATCH_SIZE) {
            const batch = resolvedStocks.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.allSettled(
                batch.map(async (stock) => {
                    try {
                        logger.info({ msg: 'Fetching', symbol: stock.symbol, token: stock.token });

                        const historicalData = await (broker as any).getHistoricalData(
                            stock.token,
                            fromDate,
                            toDate,
                            'day',
                            false
                        );

                        logger.info({ msg: 'Candles received', symbol: stock.symbol, count: historicalData?.length });

                        if (!historicalData || historicalData.length < 50) {
                            logger.warn({ msg: 'Insufficient candles — skipping', symbol: stock.symbol, count: historicalData?.length });
                            return null;
                        }

                        const candles: Candle[] = historicalData.map((c: any) => ({
                            date:   c.date,
                            open:   Number(c.open),
                            high:   Number(c.high),
                            low:    Number(c.low),
                            close:  Number(c.close),
                            volume: Number(c.volume),
                        }));

                        // ── Delegate scoring to the selected version strategy ──
                        const scored       = strategy(candles, holdingMonths);
                        const currentPrice = candles[candles.length - 1].close;

                        logger.info({ msg: 'Score', symbol: stock.symbol, score: scored.score, version });

                        return {
                            symbol:         stock.symbol,
                            name:           stock.name,
                            sector:         stock.sector,
                            currentPrice,
                            score:          scored.score,
                            signals:        scored.signals,
                            indicators:     scored.indicators,
                            recommendation: scored.recommendation,
                            version,
                        } as ScreenerStock;

                    } catch (err: any) {
                        logger.error({ msg: `Failed to analyze ${stock.symbol}`, error: err?.message || err });
                        return null;
                    }
                })
            );

            batchResults.forEach(r => {
                if (r.status === 'fulfilled' && r.value) results.push(r.value);
            });

            // 400ms between batches to respect Kite rate limits
            if (i + BATCH_SIZE < resolvedStocks.length) {
                await new Promise(res => setTimeout(res, 400));
            }
        }

        const filtered = results
            .filter(s => trend === 'ALL' || s.indicators.trendStrength?.direction === trend)
            .filter(s => s.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        logger.info({
            msg:           'Screener scan complete',
            totalAnalyzed: results.length,
            filtered:      filtered.length,
            durationMs:    Date.now() - startTime,
            version,
        });

        return {
            stocks:         filtered,
            scannedAt:      new Date().toISOString(),
            totalScanned:   results.length,
            scanDurationMs: Date.now() - startTime,
            version,
        };
    },

    getVersions(): ScreenerVersion[] {
        return getVersionMeta();
    },

    clearTokenCache() {
        tokenCache = null;
        logger.info({ msg: 'Instrument token cache cleared' });
    },

    getSectors(): string[] {
        return ['ALL', ...Array.from(new Set(FNO_SYMBOLS.map(s => s.sector))).sort()];
    },
};
