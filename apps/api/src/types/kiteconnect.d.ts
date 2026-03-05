declare module 'kiteconnect' {
    export class KiteConnect {
        constructor(params: { api_key: string; access_token?: string; debug?: boolean });
        setSessionExpiryHook(cb: Function): void;
        getLoginURL(): string;
        generateSession(request_token: string, api_secret: string): Promise<any>;
        getProfile(): Promise<any>;
        placeOrder(variety: string, params: any): Promise<any>;
        modifyOrder(variety: string, order_id: string, params: any): Promise<any>;
        cancelOrder(variety: string, order_id: string, parent_order_id?: string): Promise<any>;
        getOrders(): Promise<any[]>;
        getOrderHistory(order_id: string): Promise<any[]>;
        getTrades(order_id: string): Promise<any[]>;
        getPositions(): Promise<any>;
        getHoldings(): Promise<any>;
        getMargins(segment?: string): Promise<any>;
        getInstruments(exchange?: string): Promise<any>;
        getQuote(instruments: string[]): Promise<any>;
        getOHLC(instruments: string[]): Promise<any>;
        getLTP(instruments: string[]): Promise<any>;
        getHistoricalData(instrument_token: any, interval: any, from_date: any, to_date: any, continuous: any, oi: any): Promise<any>;
        invalidateAccessToken(access_token?: any): Promise<any>;
    }

    export class KiteTicker {
        constructor(params: { api_key: string; access_token: string; reconnect_max_delay?: number; reconnect_max_tries?: number; root?: string });
        connect(): void;
        disconnect(): void;
        subscribe(tokens: number[]): void;
        unsubscribe(tokens: number[]): void;
        setMode(mode: string, tokens: number[]): void;
        on(event: string, callback: Function): void;
        modeFull: string;
        modeQuote: string;
        modeLTP: string;
    }
}
