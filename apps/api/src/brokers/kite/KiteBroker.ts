import { IBroker, OrderParams } from '../interfaces/IBroker';
import { getUserKiteClient } from '../../clients';

export class KiteBroker implements IBroker {
    private client: any;

    constructor(accessToken: string) {
        this.client = getUserKiteClient(accessToken);
    }

    async getProfile()                                          { return await this.client.getProfile(); }
    async getHoldings()                                         { return await this.client.getHoldings(); }
    async getPositions()                                        { return await this.client.getPositions(); }
    async placeOrder(params: OrderParams)                       { return await this.client.placeOrder('regular', params); }
    async modifyOrder(orderId: string, params: Partial<OrderParams>) { return await this.client.modifyOrder('regular', orderId, params); }
    async cancelOrder(orderId: string)                          { return await this.client.cancelOrder('regular', orderId); }
    async getOrders()                                           { return await this.client.getOrders(); }
    async getOrderHistory(orderId: string)                      { return await this.client.getOrderHistory(orderId); }
    async getTrades(orderId: string)                            { return await this.client.getTrades(orderId); }
    async getMargins()                                          { return await this.client.getMargins(); }
    async getInstruments(exchange?: string)                     { return await this.client.getInstruments(exchange); }
    async getQuote(instruments: string[])                       { return await this.client.getQuote(instruments); }
    async getLTP(instruments: string[])                         { return await this.client.getLTP(instruments); }

    /**
     * Kite SDK signature:
     * getHistoricalData(instrument_token, interval, from_date, to_date, continuous, oi)
     *
     * instrument_token — numeric token (e.g. 738561 for RELIANCE)
     * interval         — "day" | "minute" | "5minute" etc.
     * from_date        — Date object or "YYYY-MM-DD HH:mm:ss"
     * to_date          — Date object or "YYYY-MM-DD HH:mm:ss"
     * continuous       — false for equities
     * oi               — false unless you want open interest
     */
    async getHistoricalData(
        instrumentToken: number,
        fromDate: Date,
        toDate: Date,
        interval: 'day' | 'minute' | '3minute' | '5minute' | '10minute' | '15minute' | '30minute' | '60minute' = 'day',
        continuous: boolean = false,
        oi: boolean = false
    ) {
        return await this.client.getHistoricalData(
            instrumentToken,
            interval,
            fromDate,
            toDate,
            continuous,
            oi
        );
    }
}