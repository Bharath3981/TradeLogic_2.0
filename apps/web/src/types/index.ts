import { TradingMode } from '../constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface KiteProfile {
  user_id: string;
  user_type: string;
  email: string;
  user_name: string;
  user_shortname: string;
  broker: string;
  exchanges: string[];
  products: string[];
  order_types: string[];
  avatar_url: string | null;
  meta: {
    demat_consent: string;
  };
}

export interface KiteSession {
  access_token: string;
  [key: string]: unknown;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  kiteToken: string | null;
  kiteSession: KiteSession | null; // Storing full callback response
  kiteProfile: KiteProfile | null; // Storing portfolio profile
  isKiteConnected: boolean; // Global connection flag
  tradingMode: TradingMode;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setKiteToken: (token: string | null) => void;
  setKiteSession: (session: KiteSession | null) => void;
  setKiteProfile: (profile: KiteProfile | null) => void;
  disconnectKite: () => void;
  setTradingMode: (mode: TradingMode) => void;
  fetchKiteProfile: () => Promise<void>;
  fetchInstruments: () => Promise<void>;
  instruments: Instrument[];
}

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
  change?: number; // Optional, computed or from specialized tick
  volume_traded?: number; // Optional, available in full/quote modes
  depth?: Record<string, unknown>; // For full mode if needed later
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

// Order Types
export type TransactionType = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type ProductType = 'CNC' | 'MIS' | 'NRML';
export type Validity = 'DAY' | 'IOC';
export type OrderStatus = 'COMPLETE' | 'REJECTED' | 'CANCELLED' | 'OPEN' | 'PENDING';

export interface OrderParams {
  exchange: string;
  tradingsymbol: string;
  transaction_type: TransactionType;
  quantity: number;
  product: ProductType;
  order_type: OrderType;
  price?: number;
  trigger_price?: number;
  validity?: Validity;
  tag?: string;
}

export interface Order {
  order_id: string;
  parent_order_id?: string;
  exchange_order_id?: string;
  placed_by?: string;
  variety?: string;
  status: OrderStatus;
  tradingsymbol: string;
  exchange: string;
  instrument_token?: number;
  transaction_type: TransactionType;
  order_type: OrderType;
  product: ProductType;
  validity: Validity;
  price?: number;
  quantity: number;
  trigger_price?: number;
  average_price?: number;
  filled_quantity?: number;
  pending_quantity?: number;
  cancelled_quantity?: number;
  order_timestamp?: string;
  exchange_timestamp?: string;
  status_message?: string;
  tag?: string;
}

export interface Position {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  product: ProductType;
  quantity: number;
  overnight_quantity: number;
  multiplier: number;
  average_price: number;
  close_price: number;
  last_price: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
  buy_quantity: number;
  buy_price: number;
  buy_value: number;
  sell_quantity: number;
  sell_price: number;
  sell_value: number;
  day_buy_quantity: number;
  day_buy_price: number;
  day_buy_value: number;
  day_sell_quantity: number;
  day_sell_price: number;
  day_sell_value: number;
}

export interface Holding {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  isin: string;
  product: ProductType;
  price: number; // Average price
  quantity: number;
  used_quantity: number;
  t1_quantity: number;
  realised_quantity: number;
  authorised_quantity: number;
  opening_quantity: number;
  collateral_quantity: number;
  collateral_type: string;
  discrepancy: boolean;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface Margin {
  equity: {
    enabled: boolean;
    net: number;
    available: {
      adhoc_margin: number;
      cash: number;
      opening_balance: number;
      live_balance: number;
      collateral: number;
      intraday_payin: number;
    };
    utilised: {
      debits: number;
      exposure: number;
      m2m_realised: number;
      m2m_unrealised: number;
      option_premium: number;
      payout: number;
      span: number;
      holding_sales: number;
      turnover: number;
      liquid_collateral: number;
      stock_collateral: number;
      delivery: number;
    };
  };
  commodity: {
    enabled: boolean;
    net: number;
    available: {
      adhoc_margin: number;
      cash: number;
      opening_balance: number;
      live_balance: number;
      collateral: number;
      intraday_payin: number;
    };
    utilised: {
      debits: number;
      exposure: number;
      m2m_realised: number;
      m2m_unrealised: number;
      option_premium: number;
      payout: number;
      span: number;
      holding_sales: number;
      turnover: number;
      liquid_collateral: number;
      stock_collateral: number;
      delivery: number;
    };
  };
}

export interface PortfolioResponse {
  net: Position[];
  day: Position[];
}

export interface WatchlistItem {
  id: string; // Changed to string
  watchlistSet: number; // Changed to camelCase
  instrumentToken: string; // Changed to camelCase
  exchangeToken: string; // Changed to camelCase
  tradingsymbol: string;
  name?: string;
  lastPrice?: number; // Changed to camelCase
  expiry?: string;
  strike?: string; // string or number? responding with 0, so maybe number but usually strike is number. API says 0. Let's keep existing but loose? No, explicitly number is safer if it's 0. But previously was defined as string in Instrument... let's check validation. The user response says "strike": 0. So it is number.
  tickSize?: number; // Changed to camelCase
  lotSize?: number; // Changed to camelCase
  instrumentType?: string; // Changed to camelCase
  segment?: string;
  exchange: string;
  userId?: string; // Added from response
  createdAt?: string; // Added from response
}

