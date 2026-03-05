import { z } from 'zod';

export const PlaceOrderDto = z.object({
    exchange: z.enum(['NSE', 'BSE', 'NFO', 'MCX']),
    tradingsymbol: z.string().min(1),
    transaction_type: z.enum(['BUY', 'SELL']),
    quantity: z.number().positive(),
    product: z.enum(['CNC', 'MIS', 'NRML']),
    order_type: z.enum(['MARKET', 'LIMIT', 'SL', 'SL-M']),
    price: z.number().min(0).optional(),
    trigger_price: z.number().min(0).optional(),
    validity: z.enum(['DAY', 'IOC']).optional(),
    tag: z.string().optional()
}).refine(data => {
    if ((data.order_type === 'LIMIT' || data.order_type === 'SL') && !data.price) {
        return false;
    }
    return true;
}, {
    message: "Price is required for LIMIT and SL orders",
    path: ["price"]
}).refine(data => {
    if ((data.order_type === 'SL' || data.order_type === 'SL-M') && !data.trigger_price) {
        return false;
    }
    return true;
}, {
    message: "Trigger Price is required for SL and SL-M orders",
    path: ["trigger_price"]
});

export const ModifyOrderDto = z.object({
    quantity: z.number().positive().optional(),
    price: z.number().min(0).optional(),
    order_type: z.enum(['MARKET', 'LIMIT', 'SL', 'SL-M']).optional(),
    trigger_price: z.number().min(0).optional(),
    validity: z.enum(['DAY', 'IOC']).optional()
});

export const CancelOrderParams = z.object({
    id: z.string().min(1)
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderDto>;
export type ModifyOrderInput = z.infer<typeof ModifyOrderDto>;
