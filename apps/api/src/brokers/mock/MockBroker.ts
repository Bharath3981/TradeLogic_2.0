import { IBroker, OrderParams } from '../interfaces/IBroker';
import { logger } from '../../utils/logger';
import { nanoid } from 'nanoid';

export class MockBroker implements IBroker {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    async getProfile() {
        return { user_id: this.userId, user_type: 'mock', email: 'mock@tradelogic.com' };
    }

    async getHoldings() {
        // Return Data from Holding table if we kept it?
        // For now, return empty or mock.
        return [];
    }

    async getPositions() {
        return { net: [], day: [] };
    }

    async placeOrder(params: OrderParams) {
        logger.info({ msg: '[MockBroker] Order Placed', params });
        // Simulate Price: Use params.price (if Limit) or random close to 100 (if Market)
        const filledPrice = params.price || (100 + Math.random() * 5); 
        return { 
            order_id: `mock_order_${nanoid(15)}`,
            average_price: filledPrice 
        };
    }

    async modifyOrder(orderId: string, params: Partial<OrderParams>) {
        logger.info({ msg: '[MockBroker] Order Modified', orderId, params });
        return { order_id: orderId };
    }

    async cancelOrder(orderId: string) {
        logger.info({ msg: '[MockBroker] Order Cancelled', orderId });
        return { order_id: orderId };
    }

    async getOrders() {
        return [];
    }

    async getOrderHistory(orderId: string) {
        return [];
    }

    async getTrades(orderId: string) {
        return [];
    }

    async getMargins() {
        return {
            equity: {
                enabled: true,
                net: 100000,
                available: {
                    cash: 100000,
                    intraday_payin: 0,
                    adhoc_margin: 0,
                    collateral: 0,
                    live_balance: 100000
                },
                utilised: {
                    debits: 0,
                    exposure: 0,
                    m2m_realised: 0,
                    m2m_unrealised: 0,
                    option_premium: 0,
                    payout: 0,
                    span: 0,
                    holding_sales: 0,
                    turnover: 0
                }
            },
            commodity: {
                enabled: false,
                net: 0,
                available: { cash: 0 },
                utilised: {}
             }
        };
    }

    async getInstruments(exchange?: string) {
        return []; 
    }

    async getQuote(instruments: string[]) {
        const result: any = {};
        instruments.forEach(inst => {
            result[inst] = {
                instrument_token: 0,
                timestamp: new Date(),
                last_price: 100,
                ohlc: { open: 100, high: 105, low: 95, close: 100 },
                depth: { buy: [], sell: [] }
            };
        });
        return result;
    }

    async getLTP(instruments: string[]) {
        const result: any = {};
        instruments.forEach(inst => {
             result[inst] = {
                 instrument_token: 0,
                 last_price: 100 + Math.random() * 5
             };
        });
        return result;
    }
}
