/**
 * Technical Indicators Utility
 * Pure functions — no dependencies, no side effects.
 * Includes: RSI, MACD, EMA, Bollinger Bands, ADX, Volume,
 *           Support/Resistance, Pivot Points, Stochastic,
 *           ATR, Candlestick Patterns, Trend Confirmation
 */

export interface Candle {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface SupportResistanceLevel {
    price: number;
    type: 'support' | 'resistance';
    source: 'swing' | 'pivot' | 'ema' | 'round_number';
    strength: 'strong' | 'moderate' | 'weak'; // how many times price tested this level
    touchCount: number;
}

export interface PivotPoints {
    pp:  number; // Pivot Point
    r1:  number; // Resistance 1
    r2:  number; // Resistance 2
    r3:  number; // Resistance 3
    s1:  number; // Support 1
    s2:  number; // Support 2
    s3:  number; // Support 3
}

export interface IndicatorResult {
    rsi:            { value: number; signal: 'bullish' | 'neutral' | 'bearish' };
    macd:           { value: number; signal_line: number; histogram: number; signal: 'bullish' | 'neutral' | 'bearish' };
    ema:            { ema20: number; ema50: number; ema200: number; signal: 'bullish' | 'neutral' | 'bearish' };
    bollingerBands: { upper: number; middle: number; lower: number; signal: 'bullish' | 'neutral' | 'bearish' };
    adx:            { value: number; signal: 'strong' | 'weak' };
    volume:         { avg20: number; current: number; signal: 'surge' | 'normal' | 'low' };
    fiftyTwoWeek:   { high: number; low: number; currentPct: number; signal: 'near_high' | 'mid' | 'near_low' };
    stochastic:     { k: number; d: number; signal: 'bullish' | 'neutral' | 'bearish' };
    atr:            { value: number; pct: number }; // ATR and ATR as % of price
    supportResistance: {
        levels:          SupportResistanceLevel[];
        nearestSupport:  number;
        nearestResistance: number;
        riskRewardRatio: number;  // distance to resistance / distance to support
        pricePosition:   'at_support' | 'mid_range' | 'at_resistance';
        signal:          'bullish' | 'neutral' | 'bearish';
    };
    pivotPoints:    PivotPoints;
    candlePattern:  { pattern: string; signal: 'bullish' | 'bearish' | 'neutral' };
    trendStrength:  { direction: 'uptrend' | 'downtrend' | 'sideways'; strength: 'strong' | 'moderate' | 'weak' };
    score:          number;
    signals:        string[];
}

// ─── Core Math ────────────────────────────────────────────────────────────────

function emaArr(values: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const result: number[] = [];
    let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(prev);
    for (let i = period; i < values.length; i++) {
        prev = values[i] * k + prev * (1 - k);
        result.push(prev);
    }
    return result;
}

function sma(values: number[], period: number): number {
    const slice = values.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

// ─── RSI ──────────────────────────────────────────────────────────────────────

function calculateRSI(closes: number[], period = 14): number {
    if (closes.length < period + 1) return 50;
    const recent = closes.slice(-(period + 1));
    let gains = 0, losses = 0;
    for (let i = 1; i < recent.length; i++) {
        const diff = recent[i] - recent[i - 1];
        if (diff > 0) gains += diff; else losses += Math.abs(diff);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    return 100 - 100 / (1 + avgGain / avgLoss);
}

// ─── MACD ─────────────────────────────────────────────────────────────────────

function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
    if (closes.length < 35) return { macd: 0, signal: 0, histogram: 0 };
    const e12 = emaArr(closes, 12);
    const e26 = emaArr(closes, 26);
    const offset = e12.length - e26.length;
    const macdLine = e26.map((v, i) => e12[i + offset] - v);
    const sigLine  = emaArr(macdLine, 9);
    const last     = macdLine[macdLine.length - 1];
    const lastSig  = sigLine[sigLine.length - 1];
    return { macd: last, signal: lastSig, histogram: last - lastSig };
}

// ─── Bollinger Bands ──────────────────────────────────────────────────────────

function calculateBB(closes: number[], period = 20): { upper: number; middle: number; lower: number } {
    if (closes.length < period) return { upper: 0, middle: 0, lower: 0 };
    const slice  = closes.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    const std    = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period);
    return { upper: middle + 2 * std, middle, lower: middle - 2 * std };
}

// ─── ATR ──────────────────────────────────────────────────────────────────────

function calculateATR(candles: Candle[], period = 14): number {
    if (candles.length < period + 1) return 0;
    const recent = candles.slice(-(period + 1));
    const trs: number[] = [];
    for (let i = 1; i < recent.length; i++) {
        const { high, low } = recent[i];
        const prevClose = recent[i - 1].close;
        trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    }
    return trs.reduce((a, b) => a + b, 0) / trs.length;
}

// ─── ADX ──────────────────────────────────────────────────────────────────────

function calculateADX(candles: Candle[], period = 14): number {
    if (candles.length < period * 2) return 0;
    const recent = candles.slice(-(period * 2));
    const trs: number[] = [], plusDM: number[] = [], minusDM: number[] = [];
    for (let i = 1; i < recent.length; i++) {
        const { high, low } = recent[i];
        const pc = recent[i - 1].close;
        trs.push(Math.max(high - low, Math.abs(high - pc), Math.abs(low - pc)));
        const up = high - recent[i - 1].high;
        const dn = recent[i - 1].low - low;
        plusDM.push(up > dn && up > 0 ? up : 0);
        minusDM.push(dn > up && dn > 0 ? dn : 0);
    }
    const atr    = sma(trs, period);
    const plusDI = (sma(plusDM, period) / atr) * 100;
    const minusDI = (sma(minusDM, period) / atr) * 100;
    return (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
}

// ─── Stochastic ───────────────────────────────────────────────────────────────

function calculateStochastic(candles: Candle[], kPeriod = 14, dPeriod = 3): { k: number; d: number } {
    if (candles.length < kPeriod) return { k: 50, d: 50 };
    const recent = candles.slice(-kPeriod);
    const highestHigh = Math.max(...recent.map(c => c.high));
    const lowestLow   = Math.min(...recent.map(c => c.low));
    const currentClose = candles[candles.length - 1].close;
    const k = highestHigh === lowestLow ? 50
        : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    // D = 3-period SMA of K (simplified: use last 3 K values)
    const kValues: number[] = [];
    for (let i = candles.length - dPeriod; i < candles.length; i++) {
        if (i < kPeriod) continue;
        const slice   = candles.slice(i - kPeriod + 1, i + 1);
        const hh      = Math.max(...slice.map(c => c.high));
        const ll      = Math.min(...slice.map(c => c.low));
        const kVal    = hh === ll ? 50 : ((candles[i].close - ll) / (hh - ll)) * 100;
        kValues.push(kVal);
    }
    const d = kValues.length > 0 ? kValues.reduce((a, b) => a + b, 0) / kValues.length : k;
    return { k, d };
}

// ─── Pivot Points (Standard) ──────────────────────────────────────────────────

function calculatePivotPoints(candles: Candle[]): PivotPoints {
    // Use previous week's high/low/close (last 5 candles as proxy for weekly)
    const recent = candles.slice(-6, -1);
    const high   = Math.max(...recent.map(c => c.high));
    const low    = Math.min(...recent.map(c => c.low));
    const close  = recent[recent.length - 1].close;

    const pp = (high + low + close) / 3;
    const r1 = 2 * pp - low;
    const s1 = 2 * pp - high;
    const r2 = pp + (high - low);
    const s2 = pp - (high - low);
    const r3 = high + 2 * (pp - low);
    const s3 = low  - 2 * (high - pp);

    return {
        pp: round2(pp),
        r1: round2(r1), r2: round2(r2), r3: round2(r3),
        s1: round2(s1), s2: round2(s2), s3: round2(s3),
    };
}

// ─── Support & Resistance via Swing Highs/Lows ───────────────────────────────

function calculateSupportResistance(
    candles: Candle[],
    currentPrice: number,
    ema20: number,
    ema50: number,
    ema200: number
): SupportResistanceLevel[] {

    const levels: SupportResistanceLevel[] = [];
    const lookback = Math.min(candles.length, 120); // last ~6 months
    const recent   = candles.slice(-lookback);
    const tolerance = currentPrice * 0.015; // 1.5% tolerance zone for clustering

    // ── 1. Swing Highs (Resistance) & Swing Lows (Support)
    // A swing high: candle[i].high > candle[i-2..i+2].high
    // A swing low:  candle[i].low  < candle[i-2..i+2].low
    const swingHighs: number[] = [];
    const swingLows:  number[] = [];
    const window = 3;

    for (let i = window; i < recent.length - window; i++) {
        const c = recent[i];
        const isSwingHigh = recent.slice(i - window, i).every(x => x.high <= c.high)
                         && recent.slice(i + 1, i + window + 1).every(x => x.high <= c.high);
        const isSwingLow  = recent.slice(i - window, i).every(x => x.low >= c.low)
                         && recent.slice(i + 1, i + window + 1).every(x => x.low >= c.low);
        if (isSwingHigh) swingHighs.push(c.high);
        if (isSwingLow)  swingLows.push(c.low);
    }

    // Cluster nearby swing levels and count touches for strength
    const clusterLevels = (prices: number[], type: 'support' | 'resistance') => {
        const clusters: { price: number; count: number }[] = [];
        for (const price of prices) {
            const existing = clusters.find(c => Math.abs(c.price - price) <= tolerance);
            if (existing) {
                existing.price = (existing.price * existing.count + price) / (existing.count + 1);
                existing.count++;
            } else {
                clusters.push({ price, count: 1 });
            }
        }
        for (const cl of clusters) {
            levels.push({
                price:      round2(cl.price),
                type,
                source:     'swing',
                strength:   cl.count >= 3 ? 'strong' : cl.count === 2 ? 'moderate' : 'weak',
                touchCount: cl.count,
            });
        }
    };

    clusterLevels(swingHighs, 'resistance');
    clusterLevels(swingLows,  'support');

    // ── 2. EMA levels as dynamic S/R
    const emaLevels = [
        { price: ema20,  label: 'EMA20' },
        { price: ema50,  label: 'EMA50' },
        { price: ema200, label: 'EMA200' },
    ];
    for (const { price } of emaLevels) {
        if (price <= 0) continue;
        levels.push({
            price:      round2(price),
            type:       price < currentPrice ? 'support' : 'resistance',
            source:     'ema',
            strength:   'moderate',
            touchCount: 1,
        });
    }

    // ── 3. Round number levels (psychological S/R)
    // Find round numbers within ±10% of current price
    const roundStep = currentPrice > 5000 ? 500
                    : currentPrice > 1000 ? 100
                    : currentPrice > 500  ? 50
                    : currentPrice > 100  ? 25
                    : 10;

    const lowerBound = currentPrice * 0.9;
    const upperBound = currentPrice * 1.1;
    let roundLevel   = Math.floor(lowerBound / roundStep) * roundStep;

    while (roundLevel <= upperBound) {
        if (Math.abs(roundLevel - currentPrice) > tolerance) {
            levels.push({
                price:      roundLevel,
                type:       roundLevel < currentPrice ? 'support' : 'resistance',
                source:     'round_number',
                strength:   'weak',
                touchCount: 1,
            });
        }
        roundLevel += roundStep;
    }

    return levels;
}

// ─── Candlestick Pattern Detection ───────────────────────────────────────────

function detectCandlePattern(candles: Candle[]): { pattern: string; signal: 'bullish' | 'bearish' | 'neutral' } {
    if (candles.length < 3) return { pattern: 'None', signal: 'neutral' };

    const c0 = candles[candles.length - 1]; // today
    const c1 = candles[candles.length - 2]; // yesterday
    const c2 = candles[candles.length - 3]; // day before

    const body0    = Math.abs(c0.close - c0.open);
    const body1    = Math.abs(c1.close - c1.open);
    const range0   = c0.high - c0.low;
    const isBull0  = c0.close > c0.open;
    const isBear0  = c0.close < c0.open;
    const isBull1  = c1.close > c1.open;
    const isBear1  = c1.close < c1.open;

    // Doji
    if (body0 < range0 * 0.1) return { pattern: 'Doji', signal: 'neutral' };

    // Hammer (bullish reversal) — small body at top, long lower wick
    const lowerWick0 = isBull0 ? c0.open - c0.low : c0.close - c0.low;
    const upperWick0 = isBull0 ? c0.high - c0.close : c0.high - c0.open;
    if (lowerWick0 > body0 * 2 && upperWick0 < body0 * 0.3 && isBear1) {
        return { pattern: 'Hammer', signal: 'bullish' };
    }

    // Shooting Star (bearish reversal) — small body at bottom, long upper wick
    if (upperWick0 > body0 * 2 && lowerWick0 < body0 * 0.3 && isBull1) {
        return { pattern: 'Shooting Star', signal: 'bearish' };
    }

    // Bullish Engulfing
    if (isBull0 && isBear1 && c0.open < c1.close && c0.close > c1.open) {
        return { pattern: 'Bullish Engulfing', signal: 'bullish' };
    }

    // Bearish Engulfing
    if (isBear0 && isBull1 && c0.open > c1.close && c0.close < c1.open) {
        return { pattern: 'Bearish Engulfing', signal: 'bearish' };
    }

    // Morning Star (3-candle bullish reversal)
    const body2   = Math.abs(c2.close - c2.open);
    const isBear2 = c2.close < c2.open;
    if (isBear2 && body1 < body2 * 0.3 && isBull0 && c0.close > (c2.open + c2.close) / 2) {
        return { pattern: 'Morning Star', signal: 'bullish' };
    }

    // Evening Star (3-candle bearish reversal)
    const isBull2 = c2.close > c2.open;
    if (isBull2 && body1 < body2 * 0.3 && isBear0 && c0.close < (c2.open + c2.close) / 2) {
        return { pattern: 'Evening Star', signal: 'bearish' };
    }

    // Strong bullish / bearish candle
    if (isBull0 && body0 > range0 * 0.7) return { pattern: 'Strong Bullish Candle', signal: 'bullish' };
    if (isBear0 && body0 > range0 * 0.7) return { pattern: 'Strong Bearish Candle', signal: 'bearish' };

    return { pattern: 'None', signal: 'neutral' };
}

// ─── Trend Strength ───────────────────────────────────────────────────────────

function calculateTrendStrength(
    candles: Candle[],
    ema20: number,
    ema50: number,
    ema200: number,
    adx: number
): { direction: 'uptrend' | 'downtrend' | 'sideways'; strength: 'strong' | 'moderate' | 'weak' } {
    const currentPrice = candles[candles.length - 1].close;

    // Count how many of last 20 candles are above their open (bullish bars)
    const last20      = candles.slice(-20);
    const bullishBars = last20.filter(c => c.close > c.open).length;
    const bullishPct  = bullishBars / 20;

    // EMA alignment
    const bullishEMA = currentPrice > ema20 && ema20 > ema50 && ema50 > ema200;
    const bearishEMA = currentPrice < ema20 && ema20 < ema50 && ema50 < ema200;

    // Higher highs / higher lows check (last 10 candles)
    const last10    = candles.slice(-10);
    const highs     = last10.map(c => c.high);
    const lows      = last10.map(c => c.low);
    const higherHighs = highs.every((h, i) => i === 0 || h >= highs[i - 1] * 0.998);
    const higherLows  = lows.every((l, i)  => i === 0 || l >= lows[i - 1]  * 0.998);
    const lowerLows   = lows.every((l, i)  => i === 0 || l <= lows[i - 1]  * 1.002);
    const lowerHighs  = highs.every((h, i) => i === 0 || h <= highs[i - 1] * 1.002);

    let direction: 'uptrend' | 'downtrend' | 'sideways';
    if ((bullishEMA || (higherHighs && higherLows)) && bullishPct > 0.55) {
        direction = 'uptrend';
    } else if ((bearishEMA || (lowerLows && lowerHighs)) && bullishPct < 0.45) {
        direction = 'downtrend';
    } else {
        direction = 'sideways';
    }

    const strength: 'strong' | 'moderate' | 'weak' =
        adx >= 30 ? 'strong' :
        adx >= 20 ? 'moderate' : 'weak';

    return { direction, strength };
}

// ─── Main Analyzer ────────────────────────────────────────────────────────────

export function analyzeStock(candles: Candle[]): IndicatorResult {
    if (candles.length < 50) return emptyResult();

    const closes       = candles.map(c => c.close);
    const volumes      = candles.map(c => c.volume);
    const currentPrice = closes[closes.length - 1];
    const currentVol   = volumes[volumes.length - 1];

    // ── Core indicators
    const rsiValue   = calculateRSI(closes);
    const macdData   = calculateMACD(closes);
    const bb         = calculateBB(closes);
    const adxValue   = calculateADX(candles);
    const atrValue   = calculateATR(candles);
    const stoch      = calculateStochastic(candles);
    const pivots     = calculatePivotPoints(candles);
    const pattern    = detectCandlePattern(candles);

    // ── EMA
    const ema20Arr = emaArr(closes, 20);
    const ema50Arr = emaArr(closes, 50);
    const ema200Arr = closes.length >= 200 ? emaArr(closes, 200) : emaArr(closes, closes.length);
    const ema20  = ema20Arr[ema20Arr.length - 1];
    const ema50  = ema50Arr[ema50Arr.length - 1];
    const ema200 = ema200Arr[ema200Arr.length - 1];

    // ── Trend
    const trend = calculateTrendStrength(candles, ema20, ema50, ema200, adxValue);

    // ── Support & Resistance
    const srLevels = calculateSupportResistance(candles, currentPrice, ema20, ema50, ema200);

    // Find nearest support below price and nearest resistance above price
    const supports    = srLevels.filter(l => l.type === 'support' && l.price < currentPrice)
                                .sort((a, b) => b.price - a.price); // closest first
    const resistances = srLevels.filter(l => l.type === 'resistance' && l.price > currentPrice)
                                .sort((a, b) => a.price - b.price); // closest first

    const nearestSupport    = supports[0]?.price    || round2(currentPrice * 0.95);
    const nearestResistance = resistances[0]?.price || round2(currentPrice * 1.05);

    const distToSupport    = currentPrice - nearestSupport;
    const distToResistance = nearestResistance - currentPrice;
    const riskRewardRatio  = distToSupport > 0 ? round2(distToResistance / distToSupport) : 1;

    // Price position relative to S/R range
    const srRange       = nearestResistance - nearestSupport;
    const priceInRange  = srRange > 0 ? (currentPrice - nearestSupport) / srRange : 0.5;
    const pricePosition: 'at_support' | 'mid_range' | 'at_resistance' =
        priceInRange <= 0.25 ? 'at_support' :
        priceInRange >= 0.75 ? 'at_resistance' : 'mid_range';

    // S/R signal — bullish if price near support with good R:R
    const srSignal: 'bullish' | 'neutral' | 'bearish' =
        pricePosition === 'at_support'    && riskRewardRatio >= 1.5 ? 'bullish' :
        pricePosition === 'at_resistance'                           ? 'bearish' : 'neutral';

    // ── Signals
    const rsiSignal: 'bullish' | 'neutral' | 'bearish' =
        rsiValue >= 45 && rsiValue <= 70 ? 'bullish' : rsiValue > 70 ? 'bearish' : 'neutral';

    const macdSignal: 'bullish' | 'neutral' | 'bearish' =
        macdData.histogram > 0 && macdData.macd > macdData.signal ? 'bullish' :
        macdData.histogram < 0 ? 'bearish' : 'neutral';

    const emaSignal: 'bullish' | 'neutral' | 'bearish' =
        currentPrice > ema20 && ema20 > ema50 ? 'bullish' :
        currentPrice < ema20 && ema20 < ema50 ? 'bearish' : 'neutral';

    const bbPos    = (currentPrice - bb.lower) / (bb.upper - bb.lower);
    const bbSignal: 'bullish' | 'neutral' | 'bearish' =
        bbPos < 0.3 ? 'bullish' : bbPos > 0.85 ? 'bearish' : 'neutral';

    const adxSignal: 'strong' | 'weak' = adxValue >= 25 ? 'strong' : 'weak';

    const avg20Vol = sma(volumes.slice(0, -1), 20);
    const volRatio = currentVol / avg20Vol;
    const volSignal: 'surge' | 'normal' | 'low' =
        volRatio >= 1.5 ? 'surge' : volRatio >= 0.8 ? 'normal' : 'low';

    const yearCandles = candles.slice(-252);
    const high52      = Math.max(...yearCandles.map(c => c.high));
    const low52       = Math.min(...yearCandles.map(c => c.low));
    const pctFromHigh = ((currentPrice - high52) / high52) * 100;
    const ftw: 'near_high' | 'mid' | 'near_low' =
        pctFromHigh >= -15 ? 'near_high' : pctFromHigh <= -40 ? 'near_low' : 'mid';

    const stochSignal: 'bullish' | 'neutral' | 'bearish' =
        stoch.k < 30 && stoch.k > stoch.d ? 'bullish' :
        stoch.k > 70 && stoch.k < stoch.d ? 'bearish' : 'neutral';

    // ── Composite Score (0–100)
    let score = 0;
    const signals: string[] = [];

    if (rsiSignal === 'bullish')         { score += 10; signals.push(`RSI ${rsiValue.toFixed(0)} — bullish momentum`); }
    if (macdSignal === 'bullish')        { score += 15; signals.push('MACD bullish crossover'); }
    if (emaSignal === 'bullish')         { score += 10; signals.push('Price > EMA20 > EMA50 — uptrend alignment'); }
    if (bbSignal === 'bullish')          { score += 8;  signals.push('Near Bollinger lower band — bounce zone'); }
    if (adxSignal === 'strong')          { score += 10; signals.push(`ADX ${adxValue.toFixed(0)} — strong trend`); }
    if (volSignal === 'surge')           { score += 10; signals.push(`Volume surge ${volRatio.toFixed(1)}x avg`); }
    if (ftw === 'near_high')             { score += 7;  signals.push(`Within ${Math.abs(pctFromHigh).toFixed(1)}% of 52wk high`); }
    if (srSignal === 'bullish')          { score += 15; signals.push(`Near support ₹${nearestSupport} — R:R ${riskRewardRatio}x`); }
    if (stochSignal === 'bullish')       { score += 8;  signals.push(`Stochastic ${stoch.k.toFixed(0)} — oversold bounce`); }
    if (pattern.signal === 'bullish')    { score += 7;  signals.push(`${pattern.pattern} pattern detected`); }
    if (trend.direction === 'uptrend' && trend.strength !== 'weak') {
                                           score += 0;  } // Already captured in EMA + ADX scores
    // Penalty for bearish signals
    if (macdSignal === 'bearish')        score -= 5;
    if (emaSignal  === 'bearish')        score -= 5;
    if (srSignal   === 'bearish')        score -= 5;
    if (pattern.signal === 'bearish')    score -= 5;

    score = Math.max(0, Math.min(100, score));

    return {
        rsi:            { value: round2(rsiValue), signal: rsiSignal },
        macd:           { value: round2(macdData.macd), signal_line: round2(macdData.signal), histogram: round2(macdData.histogram), signal: macdSignal },
        ema:            { ema20: round2(ema20), ema50: round2(ema50), ema200: round2(ema200), signal: emaSignal },
        bollingerBands: { upper: round2(bb.upper), middle: round2(bb.middle), lower: round2(bb.lower), signal: bbSignal },
        adx:            { value: round2(adxValue), signal: adxSignal },
        volume:         { avg20: round2(avg20Vol), current: currentVol, signal: volSignal },
        fiftyTwoWeek:   { high: round2(high52), low: round2(low52), currentPct: round2(pctFromHigh), signal: ftw },
        stochastic:     { k: round2(stoch.k), d: round2(stoch.d), signal: stochSignal },
        atr:            { value: round2(atrValue), pct: round2((atrValue / currentPrice) * 100) },
        supportResistance: {
            levels:             srLevels.sort((a, b) => b.price - a.price),
            nearestSupport:     round2(nearestSupport),
            nearestResistance:  round2(nearestResistance),
            riskRewardRatio,
            pricePosition,
            signal: srSignal,
        },
        pivotPoints:    pivots,
        candlePattern:  pattern,
        trendStrength:  trend,
        score,
        signals,
    };
}

function emptyResult(): IndicatorResult {
    const empty = { value: 0, signal: 'neutral' as const };
    return {
        rsi:            { value: 50, signal: 'neutral' },
        macd:           { value: 0, signal_line: 0, histogram: 0, signal: 'neutral' },
        ema:            { ema20: 0, ema50: 0, ema200: 0, signal: 'neutral' },
        bollingerBands: { upper: 0, middle: 0, lower: 0, signal: 'neutral' },
        adx:            { value: 0, signal: 'weak' },
        volume:         { avg20: 0, current: 0, signal: 'normal' },
        fiftyTwoWeek:   { high: 0, low: 0, currentPct: 0, signal: 'mid' },
        stochastic:     { k: 50, d: 50, signal: 'neutral' },
        atr:            { value: 0, pct: 0 },
        supportResistance: {
            levels: [], nearestSupport: 0, nearestResistance: 0,
            riskRewardRatio: 1, pricePosition: 'mid_range', signal: 'neutral',
        },
        pivotPoints:    { pp: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 },
        candlePattern:  { pattern: 'None', signal: 'neutral' },
        trendStrength:  { direction: 'sideways', strength: 'weak' },
        score: 0,
        signals: [],
    };
}
