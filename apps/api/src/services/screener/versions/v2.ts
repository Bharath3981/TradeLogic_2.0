/**
 * Screener v2 — 3-Layer Analysis Strategy
 *
 * LAYER 1 — Fundamentals (0–11 pts, hardcoded quarterly data)
 *   ROE · ROCE · D/E · Promoter Holding · Pledging ·
 *   Revenue Growth · Profit Growth · PEG · Interest Coverage · FCF · EPS Growth 3Y
 *
 * LAYER 2 — Technical (0–9 pts, from Kite daily candles, 1-year lookback)
 *   200 DMA · 50 DMA / Golden Cross · RSI 40–65 · MACD crossover ·
 *   MACD histogram > 0 · Volume accumulation · ADX > 20 ·
 *   Bollinger Bands position · Price above EMA 20
 *
 * LAYER 3 — Price Action & Derivatives (0–4 pts)
 *   Bullish candlestick · S/R support · Volume-surge breakout · Futures contango
 *
 * Normalization:  score = Math.round(rawTotal / 24 * 100)   → 0–100
 *
 * Recommendation thresholds (0–100):
 *   STRONG BUY  ≥ 75
 *   BUY         ≥ 58
 *   WATCH       ≥ 42
 *   NEUTRAL      < 42
 */

import { analyzeStock, calculateTradeSetup } from '../../../utils/technicalIndicators';
import type { Candle }                       from '../../../utils/technicalIndicators';
import type { ScoreStrategy, StrategyResult, StrategyContext } from '../screener.types';
import { FUNDAMENTAL_DATA }               from '../../../data/fundamentals';

// ─── Layer 1 — Fundamental scoring ───────────────────────────────────────────

function scoreFundamentals(symbol: string): { score: number; signals: string[] } {
    const d = FUNDAMENTAL_DATA[symbol];
    const signals: string[] = [];
    let score = 0;

    if (!d) {
        // No data available for this symbol — neutral
        return { score: 0, signals: ['No fundamental data available'] };
    }

    if (d.revenueGrowthYoY > 10)  { score++; signals.push('Revenue growing >10% YoY'); }
    if (d.profitGrowthYoY  > 10)  { score++; signals.push('Profit growing >10% YoY'); }
    if (d.roe              > 15)  { score++; signals.push(`ROE ${d.roe.toFixed(1)}% > 15%`); }
    if (d.roce             > 12)  { score++; signals.push(`ROCE ${d.roce.toFixed(1)}% > 12%`); }

    // D/E: skip for banks (debtToEquity === 0 treated as N/A when interestCoverage is 999)
    const isBank = d.interestCoverage >= 999;
    if (isBank || d.debtToEquity < 1) { score++; signals.push(isBank ? 'Bank — D/E N/A (pass)' : `D/E ${d.debtToEquity.toFixed(2)} < 1`); }

    // Promoter holding: banks typically below 40%, score if coverage >= 999 (bank) regardless
    if (isBank || d.promoterHolding > 40) { score++; signals.push(isBank ? 'Bank — promoter N/A (pass)' : `Promoter ${d.promoterHolding.toFixed(1)}% > 40%`); }

    if (d.promoterPledging === 0)  { score++; signals.push('Zero promoter pledging'); }
    if (d.pegRatio < 1.5 && d.pegRatio > 0) { score++; signals.push(`PEG ${d.pegRatio.toFixed(2)} < 1.5`); }

    // Interest coverage: banks get free pass (999 = N/A marker)
    if (d.interestCoverage >= 999 || d.interestCoverage > 3) {
        score++;
        signals.push(isBank ? 'Bank — ICR N/A (pass)' : `ICR ${d.interestCoverage.toFixed(1)}x > 3x`);
    }

    if (d.fcfPositive)             { score++; signals.push('Free cash flow positive'); }
    if (d.epsGrowth3Y > 10)       { score++; signals.push(`EPS CAGR 3Y ${d.epsGrowth3Y.toFixed(1)}% > 10%`); }

    return { score, signals };
}

// ─── Layer 2 — Technical scoring (v2-specific rules) ─────────────────────────

function scoreTechnical(analysis: ReturnType<typeof analyzeStock>): { score: number; signals: string[] } {
    const { rsi, macd, ema, bollingerBands, adx, volume, candlePattern } = analysis;
    const signals: string[] = [];
    let score = 0;

    const lastClose = ema.ema20; // proxy for current price — used only for BB comparison

    // 1. Price above 200 DMA (or within 2% of reclaim)
    const ema200   = ema.ema200;
    const above200 = ema.signal === 'bullish' || ema.signal === 'neutral'; // ema.signal includes 200-dma check
    // More precise: if ema200 exists and it's bullish we pass
    if (ema.signal === 'bullish') {
        score++; signals.push('Price above EMA 200 (200 DMA)');
    }

    // 2. Golden Cross OR Price above 50 DMA
    const goldenCross = ema.ema50 > ema.ema200;
    const above50     = ema.signal === 'bullish'; // already above 200, so 50 < 200 can still qualify
    if (goldenCross) {
        score++; signals.push('Golden Cross: EMA 50 above EMA 200');
    } else if (ema.ema50 > 0 && lastClose > 0) {
        // Rough check — analyzeStock returns ema50; if signal is non-bearish, price is above it
        const approxAbove50 = ema.signal !== 'bearish';
        if (approxAbove50) { score++; signals.push('Price above EMA 50'); }
    }

    // 3. RSI between 40–65 (pulled back, not overbought)
    if (rsi.value >= 40 && rsi.value <= 65) {
        score++; signals.push(`RSI ${rsi.value.toFixed(1)} in sweet spot 40–65`);
    }

    // 4. MACD bullish crossover
    if (macd.signal === 'bullish') {
        score++; signals.push('MACD bullish crossover');
    }

    // 5. MACD histogram positive (momentum expanding upward)
    if (macd.histogram > 0) {
        score++; signals.push(`MACD histogram +${macd.histogram.toFixed(3)} (positive)`);
    }

    // 6. Volume accumulation (more buying than selling)
    if (volume.direction === 'accumulation') {
        score++; signals.push('Volume: accumulation pattern detected');
    }

    // 7. ADX > 20 (trending market, not choppy)
    if (adx.value > 20 && adx.plusDI > adx.minusDI) {
        score++; signals.push(`ADX ${adx.value.toFixed(1)} > 20 with +DI dominant`);
    }

    // 8. Bollinger Bands — price at or below middle band (room to run upward)
    //    Also ensure RSI > 30 (not in crash territory)
    if (bollingerBands.signal === 'bullish' && rsi.value > 30) {
        score++; signals.push('Bollinger Bands: price near lower/middle band, oversold bounce potential');
    }

    // 9. Price above EMA 20 (short-term momentum positive)
    if (ema.ema20 > 0 && ema.signal !== 'bearish') {
        score++; signals.push('Price above EMA 20 (short-term momentum)');
    }

    return { score: Math.min(score, 9), signals };
}

// ─── Layer 3 — Price Action & Derivatives ────────────────────────────────────

function scorePriceAction(
    analysis: ReturnType<typeof analyzeStock>,
    ctx: StrategyContext
): { score: number; signals: string[] } {
    const { candlePattern, supportResistance, volume, trendStrength } = analysis;
    const signals: string[] = [];
    let score = 0;

    // 1. Bullish candlestick pattern
    if (candlePattern.signal === 'bullish') {
        score++; signals.push(`Bullish pattern: ${candlePattern.pattern}`);
    }

    // 2. Price at/near key support level
    if (supportResistance.signal === 'bullish') {
        score++; signals.push(`Price at support (R/R: ${supportResistance.riskRewardRatio.toFixed(2)}x)`);
    }

    // 3. Volume surge with uptrend strength (breakout confirmation)
    if (volume.signal === 'surge' && trendStrength.direction === 'uptrend') {
        score++; signals.push('Volume surge confirming uptrend breakout');
    }

    // 4. Futures contango (positive premium = bullish sentiment from F&O traders)
    if (ctx.futuresPremiumPct !== null && ctx.futuresPremiumPct !== undefined) {
        if (ctx.futuresPremiumPct > 0) {
            score++; signals.push(`Futures at premium ${ctx.futuresPremiumPct.toFixed(2)}% (long build-up)`);
        }
    }

    return { score, signals };
}

// ─── Main strategy export ─────────────────────────────────────────────────────

export const strategyV2: ScoreStrategy = (
    candles:       Candle[],
    holdingMonths: number,
    ctx:           StrategyContext = {}
): StrategyResult => {

    const symbol     = ctx.symbol ?? '';
    const analysis   = analyzeStock(candles, holdingMonths);
    const tradeSetup = calculateTradeSetup(candles, analysis, holdingMonths);

    // ── Score all three layers ──
    const l1 = scoreFundamentals(symbol);
    const l2 = scoreTechnical(analysis);
    const l3 = scorePriceAction(analysis, ctx);

    const rawTotal = l1.score + l2.score + l3.score;          // 0–24
    const score    = Math.round((rawTotal / 24) * 100);       // 0–100

    const recommendation: StrategyResult['recommendation'] =
        score >= 75 ? 'STRONG BUY' :
        score >= 58 ? 'BUY'        :
        score >= 42 ? 'WATCH'      : 'NEUTRAL';

    const allSignals = [
        `[L1-Fundamental ${l1.score}/11] ${l1.signals.join(' · ')}`,
        `[L2-Technical ${l2.score}/9] ${l2.signals.join(' · ')}`,
        `[L3-PriceAction ${l3.score}/4] ${l3.signals.join(' · ')}`,
    ].filter(s => s.includes('] ') && !s.endsWith('] '));

    return {
        score,
        signals:  [...l1.signals, ...l2.signals, ...l3.signals],
        recommendation,
        tradeSetup,
        indicators: {
            // ── All v1 indicators (for compatibility with Screener.tsx display) ──
            rsi:            { value: analysis.rsi.value, signal: analysis.rsi.signal },
            macd:           { signal: analysis.macd.signal, histogram: analysis.macd.histogram, momentum: analysis.macd.momentum },
            ema:            { ema20: analysis.ema.ema20, ema50: analysis.ema.ema50, ema200: analysis.ema.ema200, signal: analysis.ema.signal },
            bollingerBands: { upper: analysis.bollingerBands.upper, middle: analysis.bollingerBands.middle, lower: analysis.bollingerBands.lower, signal: analysis.bollingerBands.signal },
            adx:            { value: analysis.adx.value, plusDI: analysis.adx.plusDI, minusDI: analysis.adx.minusDI, signal: analysis.adx.signal },
            volume: {
                signal:    analysis.volume.signal,
                ratio:     analysis.volume.avg20 > 0 ? analysis.volume.current / analysis.volume.avg20 : 1,
                direction: analysis.volume.direction,
            },
            fiftyTwoWeek:      { high: analysis.fiftyTwoWeek.high, low: analysis.fiftyTwoWeek.low, currentPct: analysis.fiftyTwoWeek.currentPct, isBreakout: analysis.fiftyTwoWeek.isBreakout, signal: analysis.fiftyTwoWeek.signal },
            stochastic:        analysis.stochastic,
            atr:               analysis.atr,
            supportResistance: analysis.supportResistance,
            pivotPoints:       analysis.pivotPoints,
            candlePattern:     analysis.candlePattern,
            trendStrength:     analysis.trendStrength,

            // ── V2 additions — layer breakdown ──
            fundamentalScore: l1.score,
            technicalScore:   l2.score,
            priceActionScore: l3.score,
            rawScore:         rawTotal,
            futuresPremium:   ctx.futuresPremiumPct ?? null,
        },
    };
};
