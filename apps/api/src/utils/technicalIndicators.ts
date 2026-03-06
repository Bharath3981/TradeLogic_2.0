/**
 * Technical Indicators Utility
 * Pure functions — no dependencies, no side effects.
 * Includes: RSI (Wilder), MACD (with histogram momentum), EMA, Bollinger Bands,
 *           ADX (+DI/-DI directional), Volume (with direction analysis),
 *           Support/Resistance, Pivot Points, Stochastic,
 *           ATR, Candlestick Patterns, Trend Confirmation
 *
 * Scoring system is optimised for bullish TREND detection, not mean-reversion.
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
    strength: 'strong' | 'moderate' | 'weak';
    touchCount: number;
}

export interface PivotPoints {
    pp:  number;
    r1:  number;
    r2:  number;
    r3:  number;
    s1:  number;
    s2:  number;
    s3:  number;
}

export interface IndicatorResult {
    rsi:            { value: number; signal: 'bullish' | 'neutral' | 'bearish' };
    macd:           { value: number; signal_line: number; histogram: number; momentum: 'expanding' | 'contracting' | 'flat'; signal: 'bullish' | 'neutral' | 'bearish' };
    ema:            { ema20: number; ema50: number; ema200: number; signal: 'bullish' | 'neutral' | 'bearish' };
    bollingerBands: { upper: number; middle: number; lower: number; signal: 'bullish' | 'neutral' | 'bearish' };
    adx:            { value: number; plusDI: number; minusDI: number; signal: 'strong_bullish' | 'strong_bearish' | 'moderate_bullish' | 'weak' };
    volume:         { avg20: number; current: number; direction: 'accumulation' | 'distribution' | 'neutral'; signal: 'surge' | 'normal' | 'low' };
    fiftyTwoWeek:   { high: number; low: number; currentPct: number; isBreakout: boolean; signal: 'near_high' | 'mid' | 'near_low' };
    stochastic:     { k: number; d: number; signal: 'bullish' | 'neutral' | 'bearish' };
    atr:            { value: number; pct: number };
    supportResistance: {
        levels:             SupportResistanceLevel[];
        nearestSupport:     number;
        nearestResistance:  number;
        riskRewardRatio:    number;
        pricePosition:      'at_support' | 'mid_range' | 'at_resistance';
        signal:             'bullish' | 'neutral' | 'bearish';
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

// ─── RSI (Wilder Smoothing) ───────────────────────────────────────────────────
// Proper Wilder's smoothed moving average instead of simple average — more
// accurate RSI values, especially for trend-following assessment.

function calculateRSI(closes: number[], period = 14): number {
    if (closes.length < period + 1) return 50;

    // Seed with simple average for first period
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
    }
    avgGain /= period;
    avgLoss /= period;

    // Wilder smoothing for remaining bars
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? Math.abs(diff) : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    return 100 - 100 / (1 + avgGain / avgLoss);
}

// ─── MACD (with histogram momentum) ──────────────────────────────────────────

function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number; momentum: 'expanding' | 'contracting' | 'flat' } {
    if (closes.length < 35) return { macd: 0, signal: 0, histogram: 0, momentum: 'flat' };

    const e12      = emaArr(closes, 12);
    const e26      = emaArr(closes, 26);
    const offset   = e12.length - e26.length;
    const macdLine = e26.map((v, i) => e12[i + offset] - v);
    const sigLine  = emaArr(macdLine, 9);

    const last     = macdLine[macdLine.length - 1];
    const lastSig  = sigLine[sigLine.length - 1];
    const currHist = last - lastSig;

    // Compare to previous histogram bar to detect momentum direction
    const prevHist = macdLine.length >= 2 && sigLine.length >= 2
        ? (macdLine[macdLine.length - 2] - sigLine[sigLine.length - 2])
        : currHist;

    const momentum: 'expanding' | 'contracting' | 'flat' =
        Math.abs(currHist - prevHist) < 0.001 ? 'flat' :
        currHist > prevHist ? 'expanding' : 'contracting';

    return { macd: last, signal: lastSig, histogram: currHist, momentum };
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

// ─── ADX with Directional Indicators (+DI / -DI) ─────────────────────────────
// Returns ADX value plus +DI and -DI so we can confirm bullish direction
// (strong ADX with +DI > -DI = confirmed bullish trend strength).

function calculateADXWithDI(candles: Candle[], period = 14): { adx: number; plusDI: number; minusDI: number } {
    if (candles.length < period * 2 + 1) return { adx: 0, plusDI: 0, minusDI: 0 };

    const recent = candles.slice(-(period * 2 + 1));
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

    // Wilder smoothing for DM and TR
    const smoothed = (arr: number[]) => {
        let sum = arr.slice(0, period).reduce((a, b) => a + b, 0);
        const result = [sum];
        for (let i = period; i < arr.length; i++) {
            sum = sum - sum / period + arr[i];
            result.push(sum);
        }
        return result;
    };

    const smTR     = smoothed(trs);
    const smPlusDM = smoothed(plusDM);
    const smMinusDM = smoothed(minusDM);

    const dxValues: number[] = [];
    for (let i = 0; i < smTR.length; i++) {
        if (smTR[i] === 0) continue;
        const pdi = (smPlusDM[i] / smTR[i]) * 100;
        const mdi = (smMinusDM[i] / smTR[i]) * 100;
        const sum = pdi + mdi;
        if (sum === 0) continue;
        dxValues.push((Math.abs(pdi - mdi) / sum) * 100);
    }

    const adx = dxValues.length > 0
        ? dxValues.slice(-period).reduce((a, b) => a + b, 0) / Math.min(dxValues.length, period)
        : 0;

    // Final period DI values
    const lastIdx  = smTR.length - 1;
    const plusDI   = smTR[lastIdx] > 0 ? (smPlusDM[lastIdx] / smTR[lastIdx]) * 100 : 0;
    const minusDI  = smTR[lastIdx] > 0 ? (smMinusDM[lastIdx] / smTR[lastIdx]) * 100 : 0;

    return { adx, plusDI, minusDI };
}

// ─── Stochastic ───────────────────────────────────────────────────────────────

function calculateStochastic(candles: Candle[], kPeriod = 14, dPeriod = 3): { k: number; d: number } {
    if (candles.length < kPeriod) return { k: 50, d: 50 };
    const recent        = candles.slice(-kPeriod);
    const highestHigh   = Math.max(...recent.map(c => c.high));
    const lowestLow     = Math.min(...recent.map(c => c.low));
    const currentClose  = candles[candles.length - 1].close;
    const k = highestHigh === lowestLow ? 50
        : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    const kValues: number[] = [];
    for (let i = candles.length - dPeriod; i < candles.length; i++) {
        if (i < kPeriod) continue;
        const slice = candles.slice(i - kPeriod + 1, i + 1);
        const hh    = Math.max(...slice.map(c => c.high));
        const ll    = Math.min(...slice.map(c => c.low));
        const kVal  = hh === ll ? 50 : ((candles[i].close - ll) / (hh - ll)) * 100;
        kValues.push(kVal);
    }
    const d = kValues.length > 0 ? kValues.reduce((a, b) => a + b, 0) / kValues.length : k;
    return { k, d };
}

// ─── Volume Direction (Accumulation / Distribution) ──────────────────────────
// Compares average volume on up-close days vs down-close days over last N bars.
// Accumulation = institutions buying → bullish confirmation.

function calculateVolumeDirection(candles: Candle[], period = 14): 'accumulation' | 'distribution' | 'neutral' {
    const recent = candles.slice(-period);
    let upVolume = 0, downVolume = 0, upDays = 0, downDays = 0;
    for (const c of recent) {
        if (c.close > c.open) { upVolume += c.volume; upDays++; }
        else if (c.close < c.open) { downVolume += c.volume; downDays++; }
    }
    if (upDays === 0 || downDays === 0) return 'neutral';
    const avgUpVol   = upVolume   / upDays;
    const avgDownVol = downVolume / downDays;
    if (avgUpVol > avgDownVol * 1.3) return 'accumulation';
    if (avgDownVol > avgUpVol * 1.3) return 'distribution';
    return 'neutral';
}

// ─── Pivot Points (Standard) ──────────────────────────────────────────────────

function calculatePivotPoints(candles: Candle[]): PivotPoints {
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
    const lookback  = Math.min(candles.length, 120);
    const recent    = candles.slice(-lookback);
    const tolerance = currentPrice * 0.015;

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

    for (const { price } of [{ price: ema20 }, { price: ema50 }, { price: ema200 }]) {
        if (price <= 0) continue;
        levels.push({
            price:      round2(price),
            type:       price < currentPrice ? 'support' : 'resistance',
            source:     'ema',
            strength:   'moderate',
            touchCount: 1,
        });
    }

    const roundStep  = currentPrice > 5000 ? 500
                     : currentPrice > 1000 ? 100
                     : currentPrice > 500  ? 50
                     : currentPrice > 100  ? 25 : 10;
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

    const c0 = candles[candles.length - 1];
    const c1 = candles[candles.length - 2];
    const c2 = candles[candles.length - 3];

    const body0   = Math.abs(c0.close - c0.open);
    const body1   = Math.abs(c1.close - c1.open);
    const range0  = c0.high - c0.low;
    const isBull0 = c0.close > c0.open;
    const isBear0 = c0.close < c0.open;
    const isBull1 = c1.close > c1.open;
    const isBear1 = c1.close < c1.open;

    // Doji
    if (body0 < range0 * 0.1) return { pattern: 'Doji', signal: 'neutral' };

    // Bullish Marubozu — large bull body, tiny wicks (strong buying pressure)
    const lowerWick0 = isBull0 ? c0.open - c0.low  : c0.close - c0.low;
    const upperWick0 = isBull0 ? c0.high - c0.close : c0.high  - c0.open;
    if (isBull0 && body0 > range0 * 0.85 && lowerWick0 < body0 * 0.05 && upperWick0 < body0 * 0.05) {
        return { pattern: 'Bullish Marubozu', signal: 'bullish' };
    }

    // Three White Soldiers — three consecutive bullish candles, each closing higher
    if (candles.length >= 3 && isBull0 && isBull1 && c2.close > c2.open
        && c0.close > c1.close && c1.close > c2.close
        && c0.open  > c1.open  && c1.open  > c2.open) {
        return { pattern: 'Three White Soldiers', signal: 'bullish' };
    }

    // Hammer (bullish reversal) — small body at top, long lower wick
    if (lowerWick0 > body0 * 2 && upperWick0 < body0 * 0.3 && isBear1) {
        return { pattern: 'Hammer', signal: 'bullish' };
    }

    // Shooting Star (bearish reversal)
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

    const last20      = candles.slice(-20);
    const bullishBars = last20.filter(c => c.close > c.open).length;
    const bullishPct  = bullishBars / 20;

    const bullishEMA = currentPrice > ema20 && ema20 > ema50 && ema50 > ema200;
    const bearishEMA = currentPrice < ema20 && ema20 < ema50 && ema50 < ema200;

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

export function analyzeStock(candles: Candle[], holdingMonths: number = 3): IndicatorResult {
    if (candles.length < 50) return emptyResult();

    const closes       = candles.map(c => c.close);
    const volumes      = candles.map(c => c.volume);
    const currentPrice = closes[closes.length - 1];
    const currentVol   = volumes[volumes.length - 1];
    const lastCandle   = candles[candles.length - 1];

    // ── Core indicators
    const rsiValue   = calculateRSI(closes);
    const macdData   = calculateMACD(closes);
    const bb         = calculateBB(closes);
    const atrValue   = calculateATR(candles);
    const stoch      = calculateStochastic(candles);
    const pivots     = calculatePivotPoints(candles);
    const pattern    = detectCandlePattern(candles);
    const { adx: adxValue, plusDI, minusDI } = calculateADXWithDI(candles);

    // ── EMA
    const ema20Arr  = emaArr(closes, 20);
    const ema50Arr  = emaArr(closes, 50);
    const ema200Arr = closes.length >= 200 ? emaArr(closes, 200) : emaArr(closes, closes.length);
    const ema20     = ema20Arr[ema20Arr.length   - 1];
    const ema50     = ema50Arr[ema50Arr.length   - 1];
    const ema200    = ema200Arr[ema200Arr.length - 1];

    // ── Trend & Volume
    const trend           = calculateTrendStrength(candles, ema20, ema50, ema200, adxValue);
    const volumeDirection = calculateVolumeDirection(candles);

    // ── Support & Resistance
    const srLevels  = calculateSupportResistance(candles, currentPrice, ema20, ema50, ema200);
    const supports  = srLevels.filter(l => l.type === 'support' && l.price < currentPrice)
                               .sort((a, b) => b.price - a.price);
    const resistances = srLevels.filter(l => l.type === 'resistance' && l.price > currentPrice)
                                 .sort((a, b) => a.price - b.price);

    const nearestSupport    = supports[0]?.price    || round2(currentPrice * 0.95);
    const nearestResistance = resistances[0]?.price || round2(currentPrice * 1.05);

    const distToSupport    = currentPrice - nearestSupport;
    const distToResistance = nearestResistance - currentPrice;
    const riskRewardRatio  = distToSupport > 0 ? round2(distToResistance / distToSupport) : 1;

    const srRange      = nearestResistance - nearestSupport;
    const priceInRange = srRange > 0 ? (currentPrice - nearestSupport) / srRange : 0.5;
    const pricePosition: 'at_support' | 'mid_range' | 'at_resistance' =
        priceInRange <= 0.25 ? 'at_support' :
        priceInRange >= 0.75 ? 'at_resistance' : 'mid_range';

    const srSignal: 'bullish' | 'neutral' | 'bearish' =
        pricePosition === 'at_support'    && riskRewardRatio >= 1.5 ? 'bullish' :
        pricePosition === 'at_resistance'                           ? 'bearish' : 'neutral';

    // ── Signal classification

    // RSI: bullish momentum zone 55-75; mild bullish 50-55; overbought >75 (caution)
    const rsiSignal: 'bullish' | 'neutral' | 'bearish' =
        rsiValue >= 55 && rsiValue <= 75 ? 'bullish' :
        rsiValue > 75 || rsiValue >= 50  ? 'neutral' : 'bearish';

    const macdSignal: 'bullish' | 'neutral' | 'bearish' =
        macdData.histogram > 0 && macdData.macd > macdData.signal ? 'bullish' :
        macdData.histogram < 0 ? 'bearish' : 'neutral';

    // EMA: full stack alignment with EMA200 for long-term uptrend confirmation
    const emaSignal: 'bullish' | 'neutral' | 'bearish' =
        currentPrice > ema20 && ema20 > ema50 && ema50 > ema200 ? 'bullish' :
        currentPrice < ema20 && ema20 < ema50                   ? 'bearish' : 'neutral';

    // Bollinger: for trend-following, price riding upper band is bullish
    // (breakout mode), not lower band bounce (which is mean-reversion)
    const bbPos    = bb.upper > bb.lower ? (currentPrice - bb.lower) / (bb.upper - bb.lower) : 0.5;
    const bbSignal: 'bullish' | 'neutral' | 'bearish' =
        bbPos >= 0.6 ? 'bullish' :   // Price in upper 40% of BB = upward momentum
        bbPos < 0.2  ? 'bearish' : 'neutral';

    const adxSig: 'strong_bullish' | 'strong_bearish' | 'moderate_bullish' | 'weak' =
        adxValue >= 25 && plusDI > minusDI  ? 'strong_bullish' :
        adxValue >= 25 && minusDI > plusDI  ? 'strong_bearish' :
        adxValue >= 20 && plusDI > minusDI  ? 'moderate_bullish' : 'weak';

    const avg20Vol = sma(volumes.slice(0, -1), 20);
    const volRatio = avg20Vol > 0 ? currentVol / avg20Vol : 1;
    const volSignal: 'surge' | 'normal' | 'low' =
        volRatio >= 1.5 ? 'surge' : volRatio >= 0.8 ? 'normal' : 'low';

    const yearCandles = candles.slice(-252);
    const high52      = Math.max(...yearCandles.map(c => c.high));
    const low52       = Math.min(...yearCandles.map(c => c.low));
    const pctFromHigh = ((currentPrice - high52) / high52) * 100;
    const pctFromLow  = ((currentPrice - low52)  / low52)  * 100;
    const isBreakout  = pctFromHigh >= -2;  // Within 2% of 52-week high = breakout zone
    const ftwSignal: 'near_high' | 'mid' | 'near_low' =
        pctFromHigh >= -15 ? 'near_high' : pctFromHigh <= -40 ? 'near_low' : 'mid';

    // Stochastic: trend-following signal = K & D both above 50, K > D
    // Reversal signal = K < 30 with K rising above D (smaller weight)
    const stochSignal: 'bullish' | 'neutral' | 'bearish' =
        stoch.k > 50 && stoch.d > 50 && stoch.k > stoch.d ? 'bullish' :
        stoch.k < 30 && stoch.k > stoch.d                  ? 'bullish' :
        stoch.k > 70 && stoch.k < stoch.d                  ? 'bearish' : 'neutral';

    // ── Composite Score — Bullish Trend Detection (0–100)
    // ─────────────────────────────────────────────────────
    // CATEGORY 1: Trend Direction (max 33 pts base)
    // CATEGORY 2: Momentum        (max 30 pts base)
    // CATEGORY 3: Breakout        (max 20 pts base)
    // CATEGORY 4: Volume          (max 10 pts base)
    // CATEGORY 5: Entry Signals   (max 8 pts base)
    // ─────────────────────────────────────────────────────
    // Holding-period multipliers shift emphasis per category:
    // Short-term (1-2mo) → momentum & entry weighted up
    // Long-term  (6mo)   → trend & breakout weighted up
    // ─────────────────────────────────────────────────────
    const HOLDING_MULTIPLIERS: Record<number, [number, number, number, number, number]> = {
        //  [Trend, Momentum, Breakout, Volume, Entry]
        1:  [0.6,   1.4,      0.8,      1.2,    1.4],
        2:  [0.8,   1.2,      1.0,      1.1,    1.2],
        3:  [1.0,   1.0,      1.0,      1.0,    1.0],
        6:  [1.3,   0.7,      1.3,      1.0,    0.7],
    };

    let trendScore    = 0;
    let momentumScore = 0;
    let breakoutScore = 0;
    let volumeScore   = 0;
    let entryScore    = 0;
    let penalties     = 0;
    const signals: string[] = [];

    // ── CATEGORY 1: Trend Direction (33 pts max base)

    if (currentPrice > ema20 && ema20 > ema50 && ema50 > ema200) {
        trendScore += 20;
        signals.push('Full EMA stack aligned (price > EMA20 > EMA50 > EMA200) — confirmed uptrend');
    } else if (currentPrice > ema20 && ema20 > ema50) {
        trendScore += 12;
        signals.push('EMA20/50 aligned — short-term uptrend');
    } else if (currentPrice > ema50) {
        trendScore += 5;
        signals.push('Price above EMA50 — mild bullish');
    }

    if (adxSig === 'strong_bullish') {
        trendScore += 13;
        signals.push(`ADX ${adxValue.toFixed(0)} — strong trend, +DI ${plusDI.toFixed(0)} > -DI ${minusDI.toFixed(0)} (bullish direction confirmed)`);
    } else if (adxSig === 'moderate_bullish') {
        trendScore += 7;
        signals.push(`ADX ${adxValue.toFixed(0)} — moderate bullish trend momentum`);
    }

    // ── CATEGORY 2: Momentum (30 pts max base)

    if (macdSignal === 'bullish' && macdData.momentum === 'expanding') {
        momentumScore += 12;
        signals.push('MACD bullish with expanding histogram — momentum accelerating');
    } else if (macdSignal === 'bullish') {
        momentumScore += 8;
        signals.push('MACD bullish crossover — above signal line');
    } else if (macdData.momentum === 'expanding' && macdData.histogram < 0) {
        momentumScore += 3;
        signals.push('MACD histogram recovering — nascent bullish momentum');
    }

    if (rsiValue >= 55 && rsiValue <= 75) {
        momentumScore += 10;
        signals.push(`RSI ${rsiValue.toFixed(0)} — bullish momentum zone (55–75)`);
    } else if (rsiValue >= 50 && rsiValue < 55) {
        momentumScore += 5;
        signals.push(`RSI ${rsiValue.toFixed(0)} — above midline, mild bullish`);
    } else if (rsiValue > 75) {
        momentumScore += 3;
        signals.push(`RSI ${rsiValue.toFixed(0)} — overbought (strong but use caution)`);
    }

    if (stoch.k > 50 && stoch.d > 50 && stoch.k > stoch.d) {
        momentumScore += 8;
        signals.push(`Stochastic ${stoch.k.toFixed(0)}/${stoch.d.toFixed(0)} — bullish momentum above midline`);
    } else if (stoch.k < 30 && stoch.k > stoch.d) {
        momentumScore += 4;
        signals.push(`Stochastic ${stoch.k.toFixed(0)} — oversold bounce (reversal signal)`);
    }

    // ── CATEGORY 3: Breakout & 52-Week High Proximity (20 pts max base)

    if (isBreakout) {
        breakoutScore += 20;
        signals.push(`52-week HIGH BREAKOUT — price within ${Math.abs(pctFromHigh).toFixed(1)}% of yearly high`);
    } else if (pctFromHigh >= -5) {
        breakoutScore += 15;
        signals.push(`Near 52-week high: ${Math.abs(pctFromHigh).toFixed(1)}% below — strong bullish momentum`);
    } else if (pctFromHigh >= -15) {
        breakoutScore += 8;
        signals.push(`Within ${Math.abs(pctFromHigh).toFixed(1)}% of 52-week high`);
    }

    // ── CATEGORY 4: Volume Confirmation (10 pts max base)

    if (volSignal === 'surge' && lastCandle.close > lastCandle.open) {
        volumeScore += 10;
        signals.push(`Volume surge ${volRatio.toFixed(1)}x on bullish candle — institutional accumulation`);
    } else if (volSignal === 'surge') {
        volumeScore += 5;
        signals.push(`Volume surge ${volRatio.toFixed(1)}x avg`);
    } else if (volumeDirection === 'accumulation') {
        volumeScore += 5;
        signals.push('Volume accumulation pattern — avg up-day volume exceeds down-day volume');
    }

    // ── CATEGORY 5: Entry Confluence (8 pts max base)

    if (srSignal === 'bullish' && riskRewardRatio >= 2.0) {
        entryScore += 5;
        signals.push(`Near support ₹${nearestSupport} — favourable R:R ${riskRewardRatio}x`);
    } else if (srSignal === 'bullish') {
        entryScore += 3;
        signals.push(`Near support ₹${nearestSupport} — R:R ${riskRewardRatio}x`);
    }

    if (pattern.signal === 'bullish') {
        entryScore += 3;
        signals.push(`${pattern.pattern} — bullish candlestick signal`);
    }

    // ── PENALTIES (bearish or trend-contrary — unscaled by holding period)

    if (currentPrice < ema50)                                              penalties -= 10;
    if (currentPrice < ema200)                                             penalties -= 5;
    if (adxSig === 'strong_bearish')                                       penalties -= 10;
    if (macdSignal === 'bearish' && macdData.momentum === 'expanding')     penalties -= 8;
    if (macdSignal === 'bearish')                                          penalties -= 4;
    if (pctFromLow <= 20)                                                  penalties -= 5;
    if (pattern.signal === 'bearish')                                      penalties -= 5;
    if (volumeDirection === 'distribution')                                penalties -= 3;

    // ── Apply holding-period multipliers and compute final score
    const [mT, mM, mB, mV, mE] = HOLDING_MULTIPLIERS[holdingMonths] ?? HOLDING_MULTIPLIERS[3];

    let score = (trendScore * mT)
              + (momentumScore * mM)
              + (breakoutScore * mB)
              + (volumeScore * mV)
              + (entryScore * mE)
              + penalties;

    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
        rsi:            { value: round2(rsiValue), signal: rsiSignal },
        macd:           { value: round2(macdData.macd), signal_line: round2(macdData.signal), histogram: round2(macdData.histogram), momentum: macdData.momentum, signal: macdSignal },
        ema:            { ema20: round2(ema20), ema50: round2(ema50), ema200: round2(ema200), signal: emaSignal },
        bollingerBands: { upper: round2(bb.upper), middle: round2(bb.middle), lower: round2(bb.lower), signal: bbSignal },
        adx:            { value: round2(adxValue), plusDI: round2(plusDI), minusDI: round2(minusDI), signal: adxSig },
        volume:         { avg20: round2(avg20Vol), current: currentVol, direction: volumeDirection, signal: volSignal },
        fiftyTwoWeek:   { high: round2(high52), low: round2(low52), currentPct: round2(pctFromHigh), isBreakout, signal: ftwSignal },
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
    return {
        rsi:            { value: 50, signal: 'neutral' },
        macd:           { value: 0, signal_line: 0, histogram: 0, momentum: 'flat', signal: 'neutral' },
        ema:            { ema20: 0, ema50: 0, ema200: 0, signal: 'neutral' },
        bollingerBands: { upper: 0, middle: 0, lower: 0, signal: 'neutral' },
        adx:            { value: 0, plusDI: 0, minusDI: 0, signal: 'weak' },
        volume:         { avg20: 0, current: 0, direction: 'neutral', signal: 'normal' },
        fiftyTwoWeek:   { high: 0, low: 0, currentPct: 0, isBreakout: false, signal: 'mid' },
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
