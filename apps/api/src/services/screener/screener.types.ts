import type { Candle } from '../../utils/technicalIndicators';

// ─── Version Metadata ─────────────────────────────────────────────────────────
export interface ScreenerVersion {
    id:          string;   // 'v1', 'v2', ...
    label:       string;   // display name in dropdown
    description: string;   // short one-liner shown in UI
    docUrl:      string;   // GitHub .md link opened by the doc icon
    isLatest:    boolean;
}

// ─── Scoring Contract — what every version strategy must return ───────────────
export interface StrategyResult {
    score:          number;
    signals:        string[];
    indicators:     Record<string, any>;   // same shape as ScreenerStock.indicators
    recommendation: 'STRONG BUY' | 'BUY' | 'WATCH' | 'NEUTRAL';
}

export type ScoreStrategy = (candles: Candle[], holdingMonths: number) => StrategyResult;
