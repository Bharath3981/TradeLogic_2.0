import type { Candle, TradeSetup } from '../../utils/technicalIndicators';

export type { TradeSetup };

// ─── Version Metadata ─────────────────────────────────────────────────────────
export interface ScreenerVersion {
    id:          string;   // 'v1', 'v2', ...
    label:       string;   // display name in dropdown
    description: string;   // short one-liner shown in UI
    docUrl:      string;   // GitHub .md link opened by the doc icon
    isLatest:    boolean;
}

// ─── Optional per-stock context passed to v2+ strategies ─────────────────────
export interface StrategyContext {
    /** NSE ticker symbol (used by v2 to look up fundamental data) */
    symbol?:            string;
    /** Futures basis vs equity: +ve = contango (bullish), -ve = backwardation.
     *  null when no futures contract is found in the instruments DB. */
    futuresPremiumPct?: number | null;
}

// ─── Scoring Contract — what every version strategy must return ───────────────
export interface StrategyResult {
    score:          number;
    signals:        string[];
    indicators:     Record<string, any>;   // same shape as ScreenerStock.indicators
    recommendation: 'STRONG BUY' | 'BUY' | 'WATCH' | 'NEUTRAL';
    /** Computed stop loss + target levels — see calculateTradeSetup() */
    tradeSetup:     TradeSetup;
}

// ctx is optional so v1 signature remains backward-compatible
export type ScoreStrategy = (candles: Candle[], holdingMonths: number, ctx?: StrategyContext) => StrategyResult;
