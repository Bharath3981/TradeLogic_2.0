# V2 Indian Stock Market Screener — Full Context & Specification

## Project Overview

Build a **V2 Stock Screener** web application (React or HTML) for the **Indian stock market (NSE/BSE)** that filters stocks through a **3-layer analysis pipeline**: Fundamental Analysis → Technical Analysis → Price Action & Derivatives Confirmation. The goal is to identify stocks with a higher probability of short-term bullish or bearish moves.

The app should be a single-page dashboard that is visually polished, data-driven, and actionable.

---

## Architecture: 3-Layer Filtering Pipeline

### LAYER 1: Fundamental Filter (Eliminate Weak Companies)

**Purpose:** Narrow the universe from ~4000+ stocks down to ~100–200 quality names.

#### Bullish Fundamental Criteria:
| Parameter | Condition |
|-----------|-----------|
| Revenue Growth (YoY) | > 10% |
| Net Profit Growth (YoY) | > 10% |
| Return on Equity (ROE) | > 15% |
| Return on Capital Employed (ROCE) | > 12% |
| Debt-to-Equity Ratio | < 1 |
| Promoter Holding | > 40% |
| Promoter Pledging | 0% (zero pledging) |
| PEG Ratio | < 1.5 |
| Interest Coverage Ratio | > 3 |
| Free Cash Flow | Positive |
| EPS Growth (3-Year CAGR) | > 10% |

#### Bearish Fundamental Criteria (Stocks to Short/Avoid):
| Parameter | Condition |
|-----------|-----------|
| Revenue Growth (YoY) | Declining for 2+ consecutive quarters |
| Debt-to-Equity | > 2 (high leverage) |
| Free Cash Flow | Negative for 2+ quarters |
| Promoter Holding | Declining trend (falling over last 3 quarters) |
| Promoter Pledging | > 20% |
| Interest Coverage | < 1.5 |
| ROE | < 5% |

#### Data Sources for Fundamentals:
- **Screener.in** API or scraping (primary)
- **Moneycontrol** (secondary)
- **Trendlyne** (alternative)
- **NSE India** corporate filings

---

### LAYER 2: Technical Filter (Find the Right Timing)

**Purpose:** From the fundamentally filtered list, identify stocks at technically attractive entry points.

#### Bullish Technical Criteria:
| Indicator | Condition |
|-----------|-----------|
| 200 DMA | Price above 200 DMA (or reclaiming after dip) |
| 50 DMA | Price above 50 DMA or 50 DMA crossing above 200 DMA (Golden Cross) |
| RSI (14-period) | Between 40–60 (pulled back, not overbought) |
| MACD | Crossover turning positive (MACD line crossing above signal line) |
| MACD Histogram | Turning from negative to positive |
| Volume | Increasing delivery volume on green days (accumulation) |
| ADX | > 20 (trending, not sideways) |
| Bollinger Bands | Price bouncing off lower band with RSI > 30 |
| EMA 20 | Price holding above 20 EMA on pullbacks |

#### Bearish Technical Criteria:
| Indicator | Condition |
|-----------|-----------|
| 200 DMA | Price breaking below 200 DMA with volume |
| 50 DMA | 50 DMA crossing below 200 DMA (Death Cross) |
| RSI (14-period) | Dropping from overbought (70+) territory |
| MACD | Crossover turning negative |
| Volume | Rising volumes on red candles (distribution) |
| ADX | > 20 with -DI above +DI |
| Bollinger Bands | Price rejected from upper band with RSI > 70 |

#### Signal Strength Scoring (for each stock):
```
Each passing indicator = +1 point
Total possible bullish score = 9
Total possible bearish score = 7

Strong Bullish: 7-9 points
Moderate Bullish: 5-6 points
Weak Bullish: 3-4 points

Strong Bearish: 6-7 points
Moderate Bearish: 4-5 points
Weak Bearish: 2-3 points
```

#### Technical Data Sources:
- **Yahoo Finance API** (yfinance Python library for OHLCV data)
- **NSE India** historical data
- **TradingView** widgets (for embedding charts)
- Calculate indicators using **TA-Lib** or **pandas-ta** or in JS using **technicalindicators** library

---

### LAYER 3: Price Action & Derivatives Confirmation

**Purpose:** Final confirmation before trade entry. This layer validates the signal.

#### Price Action Patterns to Detect:

**Bullish Patterns:**
- Higher Highs + Higher Lows (uptrend structure)
- Bullish Engulfing at key support levels
- Hammer / Inverted Hammer at support
- Morning Star pattern
- Breakout from consolidation patterns (Flag, Triangle, Cup & Handle)
- Double Bottom / W-pattern
- Breakout above previous resistance with volume

**Bearish Patterns:**
- Lower Highs + Lower Lows (downtrend structure)
- Bearish Engulfing at resistance
- Shooting Star / Hanging Man at resistance
- Evening Star pattern
- Breakdown from patterns (Head & Shoulders, Rising Wedge)
- Double Top / M-pattern
- Breakdown below previous support with volume

#### Derivatives / Options Data (for F&O stocks only):

| Parameter | Bullish Signal | Bearish Signal |
|-----------|---------------|----------------|
| Futures OI + Price | Both rising (Long Build-up) | Price falling + OI rising (Short Build-up) |
| Futures OI + Price | Price rising + OI falling (Short Covering) | Both falling (Long Unwinding) |
| Put-Call Ratio (PCR) | PCR > 1 at support (puts being written = bullish) | PCR < 0.7 at resistance (calls being written = bearish) |
| Max Pain | Price near or moving toward max pain | Price diverging from max pain |
| Implied Volatility (IV) | IV low = options cheap, good for buying | IV high = options expensive, good for selling |
| IV Percentile | < 30 (low IV environment, buy options) | > 70 (high IV environment, sell options) |
| Change in OI | Heavy put OI build-up at lower strikes = support | Heavy call OI build-up at higher strikes = resistance |

#### Derivatives Data Sources:
- **NSE India** option chain data
- **Sensibull** (reference for PCR, max pain, IV)
- **Dhan / Upstox** open interest data
- **Opstra** for options analytics

---

## Current Market Context (as of March 7, 2026)

This context should be displayed as a **Market Overview Dashboard** at the top of the app.

### Key Market Data Points to Display:

```
INDIA VIX:        ~17.57 (elevated, recently spiked 62% due to US-Iran war, now cooling)
                  Status: "Anxious Watchfulness" — not panic, not calm
                  Interpretation: VIX 12-14 = calm, 15-18 = cautious, 18-22 = fearful, 22+ = panic

NIFTY 50:         ~24,450-24,766
                  Support: 24,500 → 24,200 → 24,000 (psychological)
                  Resistance: 24,900 → 25,000 → 25,300
                  Below 200 DEMA (bearish medium-term)
                  RSI: ~38 (weak but not oversold)
                  MACD: Negative territory

BANK NIFTY:       ~59,000-59,800
                  Support: 58,400 → 58,000 → 57,800
                  Resistance: 59,300 → 59,500 → 60,000
                  RSI: ~mid-30s (weak)

OPTIONS DATA:     Nifty March Expiry (29 Mar)
                  PCR: 1.17
                  Call OI: ~11.36 crore
                  Put OI: ~10.49 crore
                  Max Call OI: 25,000 strike (resistance)
                  Max Put OI: 24,800 strike (support)
                  At-the-Money IV: 15.86 (dropped 13.38%)

FII/DII FLOWS:    FIIs: -₹15,800 Cr (March MTD) — heavy selling
                  DIIs: +₹25,815 Cr (March MTD) — strong absorption
                  Net effect: DII support preventing deeper fall

MACRO RISKS:      - US-Iran war / West Asia geopolitical tensions
                  - Brent Crude: ~$83/barrel (elevated)
                  - Global risk-off sentiment
                  - FPI outflows persistent
                  - USDINR: ~90.02 (under pressure)

MACRO POSITIVES:  - RBI rate cuts underway (supportive monetary policy)
                  - Strong DII/SIP flows cushioning
                  - India GDP growth remains fastest globally
                  - Corporate earnings recovery expected in H2 2026
                  - Jefferies target: Nifty 28,300 by end-2026
```

### Market Bias Indicator:
```
Current Overall Bias: CAUTIOUSLY BEARISH / NEUTRAL

Logic:
- If VIX > 20 AND Nifty below 200 DMA AND FII selling > ₹5000 Cr MTD → "BEARISH"
- If VIX 15-20 AND Nifty near support AND DII buying strong → "CAUTIOUSLY BEARISH"
- If VIX < 15 AND Nifty above 200 DMA AND FII neutral/buying → "BULLISH"
- If VIX < 12 AND Nifty making new highs → "STRONGLY BULLISH"
```

---

## UI/UX Specification

### Dashboard Layout (Single Page App):

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: V2 Stock Screener — Indian Market              │
│  [Market Bias Badge: CAUTIOUSLY BEARISH]                │
├─────────────────────────────────────────────────────────┤
│  MARKET OVERVIEW CARDS (horizontal scroll or grid)       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ VIX  │ │NIFTY │ │BANK  │ │ FII  │ │CRUDE │          │
│  │17.57 │ │24766 │ │NIFTY │ │-15.8K│ │$83   │          │
│  │ ↓15% │ │↑1.17%│ │59840 │ │ Cr   │ │ ↑2.8%│          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
├─────────────────────────────────────────────────────────┤
│  FILTER CONTROLS                                         │
│  [Scan Type: Bullish ▼] [Sector: All ▼]                │
│  [Market Cap: All ▼]   [F&O Only: ☐]                   │
│  [Min Score: 5 ▼]      [🔍 Run Scan]                   │
├─────────────────────────────────────────────────────────┤
│  RESULTS TABLE (sortable columns)                        │
│  ┌────┬────────┬───────┬──────┬──────┬───────┬────────┐ │
│  │ #  │ Stock  │ CMP   │ Fund │ Tech │ Price │ Total  │ │
│  │    │        │       │Score │Score │Action │ Score  │ │
│  ├────┼────────┼───────┼──────┼──────┼───────┼────────┤ │
│  │ 1  │ HDFC   │₹1650  │ 8/11 │ 7/9  │ 3/4   │ 18/24 │ │
│  │ 2  │ L&T    │₹3200  │ 7/11 │ 6/9  │ 3/4   │ 16/24 │ │
│  │ 3  │ BEL    │₹282   │ 9/11 │ 5/9  │ 2/4   │ 16/24 │ │
│  └────┴────────┴───────┴──────┴──────┴───────┴────────┘ │
├─────────────────────────────────────────────────────────┤
│  STOCK DETAIL PANEL (click any row to expand)            │
│  ┌─────────────────┬───────────────────────────────────┐ │
│  │ FUNDAMENTALS     │ TECHNICAL CHART                   │ │
│  │ ROE: 18%         │ [Candlestick chart with          │ │
│  │ D/E: 0.4         │  indicators overlay]              │ │
│  │ EPS Growth: 15%  │                                   │ │
│  │ Revenue Gr: 22%  │                                   │ │
│  ├─────────────────┤                                   │ │
│  │ DERIVATIVES      │                                   │ │
│  │ Futures: Long    │                                   │ │
│  │ Build-up         │                                   │ │
│  │ PCR: 1.2         │                                   │ │
│  │ IV Rank: 25%     │                                   │ │
│  │ Max Pain: ₹1680  │                                   │ │
│  └─────────────────┴───────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  NIFTY OPTIONS HEATMAP                                   │
│  [Visual heatmap showing OI at each strike price]        │
│  Highest Call OI: 25000 CE (resistance ceiling)          │
│  Highest Put OI: 24800 PE (support floor)                │
│  Nifty expected range: 24800 - 25000                     │
└─────────────────────────────────────────────────────────┘
```

### Color Coding:
```
Strongly Bullish (Score 18+/24):  Green (#22c55e)
Moderately Bullish (14-17/24):    Light Green (#86efac)
Neutral (10-13/24):               Yellow (#facc15)
Moderately Bearish (6-9/24):      Orange (#fb923c)
Strongly Bearish (0-5/24):        Red (#ef4444)

VIX Color:
  < 12: Green (calm)
  12-15: Yellow (normal)
  15-18: Orange (cautious)
  18-22: Red (fearful)
  > 22: Dark Red/Pulsing (panic)
```

---

## Scoring System — Consolidated

### Total Score Breakdown:

```
LAYER 1: Fundamental Score     →  /11 points (11 criteria)
LAYER 2: Technical Score       →  /9 points  (9 indicators)
LAYER 3: Price Action Score    →  /4 points  (pattern + derivatives)
                                  ─────────
TOTAL COMPOSITE SCORE          →  /24 points

Classification:
  20-24: ★★★★★ Strong Signal (High Conviction)
  15-19: ★★★★  Good Signal (Moderate Conviction)
  10-14: ★★★   Average Signal (Low Conviction)
   5-9:  ★★    Weak Signal (Avoid or Hedge)
   0-4:  ★     No Signal (Skip)
```

### Layer 3 — Price Action Scoring Detail:
```
+1 point: Bullish/Bearish candlestick pattern detected
+1 point: Key support/resistance level respected
+1 point: Breakout/Breakdown from chart pattern with volume
+1 point: Derivatives confirmation (Long/Short build-up matches direction)
```

---

## Sector Rotation Awareness

The screener should also display **sector-level strength** to identify which sectors are in favor:

### Sectors to Track:
```
Banking & Financials  (Bank Nifty, Nifty Financial Services)
IT / Technology       (Nifty IT)
Pharma / Healthcare   (Nifty Pharma)
Auto                  (Nifty Auto)
FMCG                  (Nifty FMCG)
Metals & Mining       (Nifty Metal)
Energy / Oil & Gas    (Nifty Energy)
Realty                (Nifty Realty)
Infrastructure        (Nifty Infra)
PSU Banks             (Nifty PSU Bank)
Defence               (Nifty Defence - if available)
Media                 (Nifty Media)
```

### Sector Strength Indicator:
```
For each sector index:
- Price vs 50 DMA: Above = Bullish, Below = Bearish
- Price vs 200 DMA: Above = Bullish, Below = Bearish
- Relative Strength vs Nifty 50: Outperforming or Underperforming
- FII/DII flow into sector: Net positive or negative

Display as: Traffic light system (Green/Yellow/Red)
```

### Current Sector Context (March 2026):
```
Strong Sectors:    Cyclicals (Infra, Metals), Defence, Energy
Weak Sectors:      IT (sharp 10%+ decline), Realty, FMCG
Recovering:        Banking (DII support), Auto
Watch:             PSU Banks, Pharma
```

---

## Data Refresh & API Strategy

### Real-time / Near Real-time:
- India VIX, Nifty, Bank Nifty levels
- FII/DII daily data
- Option chain data (OI, PCR, IV)

### Daily (EOD refresh):
- Stock OHLCV data for technical indicators
- Delivery volume data
- Futures OI data

### Weekly/Quarterly:
- Fundamental data (quarterly results, promoter holding changes)
- Sector rotation data

### Suggested Free/Accessible APIs:
```
1. Yahoo Finance (yfinance):     OHLCV, fundamentals for .NS/.BO tickers
2. NSE India website:            Option chain, FII/DII, OI spurts
3. Screener.in:                  Fundamental screening queries
4. Trendlyne:                    SMA crossover screeners, sector data
5. Investing.com:                Technical signals, VIX data
6. TradingView widgets:          Embeddable charts (free tier)
7. Google Finance:               Basic price data
```

### Fallback (If APIs are unavailable):
- Use sample/mock data for demonstration
- Allow manual CSV upload for OHLCV data
- Hardcode current market snapshot data (from context above) as defaults

---

## Implementation Notes for Claude Code

### Tech Stack Recommendation:
```
Frontend:    React (JSX) with Tailwind CSS
             OR plain HTML + CSS + Vanilla JS (simpler)
Charts:      Recharts (React) or Chart.js (HTML)
             Optionally embed TradingView lightweight charts
Data:        Static JSON for demo / API calls for live
Indicators:  Calculate in JS using 'technicalindicators' npm package
             OR pre-calculate in Python and serve as JSON
```

### If Building as a React Artifact:
- Single .jsx file with all components
- Use Tailwind utility classes only
- Use recharts for charts
- Use lucide-react for icons
- Import useState, useEffect, useMemo from React
- Use sample data baked into the component for demonstration
- Allow future API integration points

### Sample Data Structure:
```javascript
const stockData = [
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    sector: "Banking",
    cmp: 1650.50,
    change: 2.1,
    marketCap: "Large",
    isFnO: true,

    // Layer 1: Fundamentals
    fundamentals: {
      revenueGrowth: 18.5,
      profitGrowth: 22.3,
      roe: 17.8,
      roce: 15.2,
      debtToEquity: 0.0,  // banks use different metric
      promoterHolding: 25.5,  // Note: banks have lower promoter holding
      pledging: 0,
      pegRatio: 1.2,
      interestCoverage: null,  // N/A for banks
      fcf: "Positive",
      epsGrowth3Y: 18.0,
      score: 8  // out of 11 (some criteria N/A for banks)
    },

    // Layer 2: Technical
    technical: {
      above200DMA: true,
      above50DMA: true,
      rsi14: 52,
      macdSignal: "Bullish Crossover",
      macdHistogram: "Positive",
      volumeTrend: "Accumulation",
      adx: 25,
      bollingerPosition: "Middle",
      above20EMA: true,
      score: 7  // out of 9
    },

    // Layer 3: Price Action & Derivatives
    priceAction: {
      pattern: "Bullish Engulfing",
      supportRespected: true,
      breakout: false,
      derivativesSignal: "Long Build-up", // OI rising + Price rising
      futuresOIChange: "+5.2%",
      pcr: 1.2,
      ivPercentile: 28,
      maxPain: 1680,
      score: 3  // out of 4
    },

    totalScore: 18,  // out of 24
    signal: "Strong Bullish",
    starRating: 5
  },
  // ... more stocks
];
```

### Key Features to Implement:
1. **Market Overview Dashboard** — VIX, Nifty, BankNifty, FII/DII cards with color coding
2. **Market Bias Badge** — Auto-calculated from VIX + Nifty position + FII data
3. **Filter Controls** — Scan type, sector, market cap, F&O only, min score
4. **Sortable Results Table** — With score breakdown columns
5. **Expandable Stock Detail** — Click a row to see full analysis
6. **Sector Heatmap** — Show which sectors are strong/weak
7. **Nifty Options Heatmap** — Visual OI distribution at strike prices
8. **Signal Summary** — How many stocks are bullish vs bearish
9. **Export** — Download filtered results as CSV
10. **Dark Mode** — Default to dark theme (trader preference)

### Optional Advanced Features:
- Historical backtest: "If this screener ran 30 days ago, what happened?"
- Alert triggers: "Notify when a stock crosses score threshold"
- Watchlist: Save favorite stocks and track score changes
- Comparison mode: Compare 2 stocks side by side

---

## Disclaimer Text (Must Include in App)

```
⚠️ DISCLAIMER: This screener is for educational and informational purposes only.
It does NOT constitute financial advice, stock recommendations, or a solicitation
to buy or sell any securities. Stock market investments are subject to market risks.
Past performance does not guarantee future results. Always consult a SEBI-registered
investment advisor before making any investment decisions. The creator of this tool
is not responsible for any financial losses incurred from using this screener.
```

---

## Summary

This V2 screener combines:
1. **Fundamental quality** (eliminate junk companies)
2. **Technical timing** (enter at the right moment)
3. **Price action + derivatives confirmation** (validate the trade)

All three layers must align for a high-conviction signal. The scoring system (out of 24) gives a quantifiable way to rank and compare opportunities across the Indian stock market.
