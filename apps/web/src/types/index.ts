export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
}

export interface Tick {
  instrument_token: number;
  last_price: number;
  mode: string;
  is_tradable: boolean;
  change?: number;
  volume_traded?: number;
  depth?: Record<string, unknown>;
}

export interface Instrument {
  instrument_token: number;
  exchange_token: string;
  tradingsymbol: string;
  name: string;
  last_price: number;
  expiry: string;
  strike: string;
  tick_size: number;
  lot_size: number;
  instrument_type: string;
  segment: string;
  exchange: string;
}
