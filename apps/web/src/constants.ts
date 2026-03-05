export const TradingMode = {
  REAL: 'REAL',
  MOCK: 'MOCK'
} as const;

export type TradingMode = typeof TradingMode[keyof typeof TradingMode];
