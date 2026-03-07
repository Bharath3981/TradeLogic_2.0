import { strategyV1 } from './versions/v1';
import type { ScreenerVersion, ScoreStrategy } from './screener.types';

// ─── UPDATE THIS to your actual GitHub repo URL ───────────────────────────────
// e.g. https://github.com/bbaisetty/TradeLogic_2.0/blob/main/docs/screener
const DOCS_BASE_URL = 'https://github.com/bbaisetty/TradeLogic_2.0/blob/main/docs/screener';

interface VersionEntry extends ScreenerVersion {
    strategy: ScoreStrategy;
}

// ─── Registry — add new versions here ────────────────────────────────────────
const SCREENER_REGISTRY: Record<string, VersionEntry> = {
    v1: {
        id:          'v1',
        label:       'v1 — Baseline',
        description: 'RSI · MACD · EMA (20/50/200) · Bollinger Bands · ADX · Stochastic · ATR · S/R · Pivot Points · Candlestick Patterns. Daily timeframe, 1-year lookback.',
        docUrl:      `${DOCS_BASE_URL}/v1.md`,
        isLatest:    true,
        strategy:    strategyV1,
    },
    // v2: { id: 'v2', label: 'v2 — ...', description: '...', docUrl: `${DOCS_BASE_URL}/v2.md`, isLatest: false, strategy: strategyV2 },
};

export const DEFAULT_VERSION = 'v1';

/** Returns version metadata list (strips the strategy fn — safe to send to client) */
export function getVersionMeta(): ScreenerVersion[] {
    return Object.values(SCREENER_REGISTRY).map(({ strategy: _strategy, ...meta }) => meta);
}

/** Looks up the scoring strategy for a given version id */
export function getStrategy(versionId: string): ScoreStrategy {
    const entry = SCREENER_REGISTRY[versionId];
    if (!entry) {
        throw new Error(
            `Unknown screener version "${versionId}". Available: ${Object.keys(SCREENER_REGISTRY).join(', ')}`
        );
    }
    return entry.strategy;
}
