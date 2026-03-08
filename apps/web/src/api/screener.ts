import apiClient from './client';

export interface TradeSetup {
    stopLoss:        number;
    stopLossPct:     number;
    target1:         number;
    target1Pct:      number;
    target2:         number;
    target2Pct:      number;
    riskRewardRatio: number;
    stopLossBasis:   string;
    targetBasis:     string;
}

export interface ScreenerVersion {
    id:          string;
    label:       string;
    description: string;
    docUrl:      string;
    isLatest:    boolean;
}

export interface ScreenerScanOptions {
    sector?:        string;
    minScore?:      number;
    limit?:         number;
    trend?:         'ALL' | 'uptrend' | 'downtrend' | 'sideways';
    holdingMonths?: number;
    version?:       string;
}

export interface SRLevel {
    price:      number;
    type:       'support' | 'resistance';
    source:     'swing' | 'pivot' | 'ema' | 'round_number';
    strength:   'strong' | 'moderate' | 'weak';
    touchCount: number;
}

export interface ScreenerStockIndicators {
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
        levels:             SRLevel[];
        nearestSupport:     number;
        nearestResistance:  number;
        riskRewardRatio:    number;
        pricePosition:      string;
        signal:             string;
    };
    pivotPoints:   { pp: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number };
    candlePattern: { pattern: string; signal: string };
    trendStrength: { direction: string; strength: string };
}

export interface ScreenerStock {
    symbol:         string;
    name:           string;
    sector:         string;
    currentPrice:   number;
    score:          number;
    signals:        string[];
    indicators:     ScreenerStockIndicators;
    recommendation: 'STRONG BUY' | 'BUY' | 'WATCH' | 'NEUTRAL';
    version:        string;
    tradeSetup:     TradeSetup;
}

export interface ScreenerResult {
    stocks:         ScreenerStock[];
    scannedAt:      string;
    totalScanned:   number;
    scanDurationMs: number;
    version:        string;
}

export interface FuturesContract {
    instrument_token: number;
    tradingsymbol:    string;
    expiry:           string;
    lot_size:         number | null;
    last_price:       number | null;
    segment:          string | null;
    exchange:         string | null;
}

export const screenerApi = {
    getVersions: () =>
        apiClient.get<{ success: boolean; data: ScreenerVersion[] }>('/screener/versions'),
    getIndices: () =>
        apiClient.get<{ success: boolean; data: string[] }>('/screener/indices'),
    runScan: (options: ScreenerScanOptions = {}) =>
        apiClient.post<{ success: boolean; data: ScreenerResult }>('/screener/scan', options),
    getSectors: () =>
        apiClient.get<{ success: boolean; data: string[] }>('/screener/sectors'),
    getUpcomingFutures: (symbol: string) =>
        apiClient.get<{ success: boolean; data: FuturesContract[] }>(`/screener/futures/${symbol}`),
};
