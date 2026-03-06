import { logger } from '../utils/logger';
import { BrokerFactory, UserMode } from '../brokers/BrokerFactory';
import { analyzeStock, Candle } from '../utils/technicalIndicators';

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
    symbol: string;
    name: string;
    sector: string;
    currentPrice: number;
    score: number;
    signals: string[];
    indicators: {
        rsi:            { value: number; signal: string };
        macd:           { signal: string; histogram: number; momentum: string };
        ema:            { ema20: number; ema50: number; ema200: number; signal: string };
        bollingerBands: { upper: number; middle: number; lower: number; signal: string };
        adx:            { value: number; plusDI: number; minusDI: number; signal: string };
        volume:         { signal: string; ratio: number; direction: string };
        fiftyTwoWeek:   { high: number; low: number; currentPct: number; isBreakout: boolean; signal: string };
        stochastic:     { k: number; d: number; signal: string };
        atr:            { value: number; pct: number };
        supportResistance: {
            levels:             { price: number; type: string; source: string; strength: string; touchCount: number }[];
            nearestSupport:     number;
            nearestResistance:  number;
            riskRewardRatio:    number;
            pricePosition:      string;
            signal:             string;
        };
        pivotPoints:    { pp: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number };
        candlePattern:  { pattern: string; signal: string };
        trendStrength:  { direction: string; strength: string };
    };
    recommendation: 'STRONG BUY' | 'BUY' | 'WATCH' | 'NEUTRAL';
}

export interface ScreenerResult {
    stocks: ScreenerStock[];
    scannedAt: string;
    totalScanned: number;
    scanDurationMs: number;
}

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
        // We want EQ segment only for historical data
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
        options: { sector?: string; minScore?: number; limit?: number } = {}
    ): Promise<ScreenerResult> {

        const startTime = Date.now();
        const { sector, minScore = 40, limit = 20 } = options;
        const broker = BrokerFactory.getBroker(UserMode.REAL, userId, accessToken);

        // Step 1 — get correct instrument tokens from Kite dynamically
        const tokenMap = await getInstrumentTokenMap(broker);

        let stockList = FNO_SYMBOLS;
        if (sector && sector !== 'ALL') {
            stockList = FNO_SYMBOLS.filter(s => s.sector === sector);
        }

        // Step 2 — resolve tokens, skip any symbols not found
        const resolvedStocks = stockList
            .map(s => ({ ...s, token: tokenMap.get(s.symbol) }))
            .filter(s => {
                if (!s.token) {
                    logger.warn({ msg: `Token not found for symbol — skipping`, symbol: s.symbol });
                    return false;
                }
                return true;
            }) as ({ symbol: string; name: string; sector: string; token: number })[];

        logger.info({ msg: 'Screener scan started', total: resolvedStocks.length });

        const results: ScreenerStock[] = [];
        const toDate   = new Date();
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 1);

        // Step 3 — fetch historical data in batches of 3
        const BATCH_SIZE = 3;

        for (let i = 0; i < resolvedStocks.length; i += BATCH_SIZE) {
            const batch = resolvedStocks.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.allSettled(
                batch.map(async (stock) => {
                    try {
                        logger.info({ msg: `Fetching`, symbol: stock.symbol, token: stock.token });

                        const historicalData = await (broker as any).getHistoricalData(
                            stock.token,
                            fromDate,
                            toDate,
                            'day',
                            false
                        );

                        logger.info({ msg: `Candles received`, symbol: stock.symbol, count: historicalData?.length });

                        if (!historicalData || historicalData.length < 50) {
                            logger.warn({ msg: `Insufficient candles — skipping`, symbol: stock.symbol, count: historicalData?.length });
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

                        const analysis    = analyzeStock(candles);
                        const currentPrice = candles[candles.length - 1].close;

                        logger.info({ msg: `Score`, symbol: stock.symbol, score: analysis.score });

                        return {
                            symbol:      stock.symbol,
                            name:        stock.name,
                            sector:      stock.sector,
                            currentPrice,
                            score:       analysis.score,
                            signals:     analysis.signals,
                            indicators: {
                                rsi:            { value: analysis.rsi.value,    signal: analysis.rsi.signal },
                                macd:           { signal: analysis.macd.signal, histogram: analysis.macd.histogram, momentum: analysis.macd.momentum },
                                ema:            { ema20: analysis.ema.ema20,    ema50: analysis.ema.ema50, ema200: analysis.ema.ema200, signal: analysis.ema.signal },
                                bollingerBands: { upper: analysis.bollingerBands.upper, middle: analysis.bollingerBands.middle, lower: analysis.bollingerBands.lower, signal: analysis.bollingerBands.signal },
                                adx:            { value: analysis.adx.value, plusDI: analysis.adx.plusDI, minusDI: analysis.adx.minusDI, signal: analysis.adx.signal },
                                volume: {
                                    signal:    analysis.volume.signal,
                                    ratio:     analysis.volume.avg20 > 0
                                        ? analysis.volume.current / analysis.volume.avg20
                                        : 1,
                                    direction: analysis.volume.direction,
                                },
                                fiftyTwoWeek:   { high: analysis.fiftyTwoWeek.high, low: analysis.fiftyTwoWeek.low, currentPct: analysis.fiftyTwoWeek.currentPct, isBreakout: analysis.fiftyTwoWeek.isBreakout, signal: analysis.fiftyTwoWeek.signal },
                                stochastic:     analysis.stochastic,
                                atr:            analysis.atr,
                                supportResistance: analysis.supportResistance,
                                pivotPoints:    analysis.pivotPoints,
                                candlePattern:  analysis.candlePattern,
                                trendStrength:  analysis.trendStrength,
                            },
                            recommendation:
                                analysis.score >= 75 ? 'STRONG BUY' :
                                analysis.score >= 60 ? 'BUY'        :
                                analysis.score >= 45 ? 'WATCH'      : 'NEUTRAL',
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
            .filter(s => s.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        logger.info({
            msg:            'Screener scan complete',
            totalAnalyzed:  results.length,
            filtered:       filtered.length,
            durationMs:     Date.now() - startTime,
        });

        return {
            stocks:         filtered,
            scannedAt:      new Date().toISOString(),
            totalScanned:   results.length,
            scanDurationMs: Date.now() - startTime,
        };
    },

    // Clear token cache (call if instruments seem stale)
    clearTokenCache() {
        tokenCache = null;
        logger.info({ msg: 'Instrument token cache cleared' });
    },

    getSectors(): string[] {
        return ['ALL', ...Array.from(new Set(FNO_SYMBOLS.map(s => s.sector))).sort()];
    },
};
