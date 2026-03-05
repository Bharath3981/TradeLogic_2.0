import client from './client';
import type { Order, OrderParams } from '../types';

export const ordersApi = {
    getOrders: () => 
        client.get<{ success: boolean; data: Order[] }>('/orders'),

    placeOrder: (order: OrderParams) =>
        client.post<{ order_id: string }>('/orders', order),

    modifyOrder: (orderId: string, params: Partial<OrderParams>) =>
        client.put<{ order_id: string }>(`/orders/${orderId}`, params),

    cancelOrder: (orderId: string) =>
        client.delete<{ order_id: string }>(`/orders/${orderId}`),

    clearOrders: () =>
        client.delete<{ success: boolean; message: string }>('/trade/orders')
};
