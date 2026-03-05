export interface OrderParams {
    exchange: string;
    tradingsymbol: string;
    transaction_type: 'BUY' | 'SELL';
    quantity: number;
    product: 'CNC' | 'MIS' | 'NRML';
    order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    price?: number;
    trigger_price?: number;
    validity?: string;
    tag?: string;
    instrument_token?: string;
}

export interface IBroker {
    getProfile(): Promise<any>;
    getHoldings(): Promise<any>;
    getPositions(): Promise<any>;
    placeOrder(params: OrderParams): Promise<any>;
    modifyOrder(orderId: string, params: Partial<OrderParams>): Promise<any>;
    cancelOrder(orderId: string): Promise<any>;
    getOrders(): Promise<any[]>;
    getOrderHistory(orderId: string): Promise<any[]>;
    getTrades(orderId: string): Promise<any[]>;
    getMargins(): Promise<any>;
    
    // Market Data (Snapshot)
    getInstruments(exchange?: string): Promise<any[]>;
    getQuote(instruments: string[]): Promise<any>;
    getLTP(instruments: string[]): Promise<any>;
}
