/**
 * Screener v1 — Baseline Strategy
 *
 * Uses the full composite score produced by analyzeStock():
 *   RSI (14) · MACD · EMA 20/50/200 · Bollinger Bands · ADX (14) ·
 *   Stochastic · ATR (14) · Volume · 52-Week Range · Support/Resistance ·
 *   Pivot Points · Candlestick Patterns · Trend Strength
 *
 * Timeframe  : Daily candles
 * Lookback   : 1 year (~252 trading days)
 * Score range: 0–100  (composite, equal-weight across indicators)
 *
 * Recommendation thresholds:
 *   STRONG BUY  ≥ 75
 *   BUY         ≥ 60
 *   WATCH       ≥ 45
 *   NEUTRAL      < 45
 */

import { analyzeStock } from '../../../utils/technicalIndicators';
import type { Candle } from '../../../utils/technicalIndicators';
import type { ScoreStrategy, StrategyResult } from '../screener.types';

export const strategyV1: ScoreStrategy = (candles: Candle[], holdingMonths: number): StrategyResult => {
    const analysis = analyzeStock(candles, holdingMonths);
    const score    = analysis.score;

    const recommendation: StrategyResult['recommendation'] =
        score >= 75 ? 'STRONG BUY' :
        score >= 60 ? 'BUY'        :
        score >= 45 ? 'WATCH'      : 'NEUTRAL';

    return {
        score,
        signals:  analysis.signals,
        recommendation,
        indicators: {
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
        },
    };
};
