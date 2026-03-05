
import { StrategyModule, RunnerContext, ModuleResult } from '../../services/runners/types';
import { BrokerFactory, UserMode } from '../../brokers/BrokerFactory';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/AppError';
import { ErrorCode } from '../../constants';
import { nanoid } from 'nanoid';
import { StrategyRunRepository } from '../../repositories/repository.strategy-run';

export class OrderExecutorModule implements StrategyModule {
  private config: any;

  async init(config: any): Promise<void> {
    this.config = config;
  }

  async execute(context: RunnerContext): Promise<ModuleResult> {
    const { state, userId, trade_mode, accessToken, runId } = context;
    const { orders_queue } = state;

    logger.info(`[OrderExecutor] Processing Order Queue. Mode: ${trade_mode}. Items: ${orders_queue?.length || 0}`);

    if (!orders_queue || orders_queue.length === 0) {
        logger.info('[OrderExecutor] No orders in queue.');
        return { statePatch: {} };
    }

    const broker = BrokerFactory.getBroker(trade_mode as unknown as UserMode, userId, accessToken);
    
    const ordersPlaced: any[] = [];
    const positionsOpened: any[] = [];
    const positionsClosed: any[] = [];

    for (const orderRequest of orders_queue) {
        try {
            logger.info(`[OrderExecutor] Placing ${orderRequest.transaction_type} ${orderRequest.leg} Order for ${orderRequest.tradingsymbol}. Qty: ${orderRequest.quantity}`);

            // 1. Place Order via Broker
            const orderResponse = await broker.placeOrder({
                exchange: orderRequest.exchange || 'NFO',
                tradingsymbol: orderRequest.tradingsymbol,
                transaction_type: orderRequest.transaction_type,
                quantity: orderRequest.quantity,
                product: orderRequest.product || 'NRML',
                order_type: orderRequest.order_type || 'MARKET',
                validity: 'DAY',
                tag: orderRequest.tag || 'STRATEGY_EXEC',
                instrument_token: orderRequest.instrument_token,
                // Only pass price if LIMIT order OR NOT Real mode (to simulate price in Mock)
                price: (orderRequest.order_type === 'LIMIT' || trade_mode !== 'REAL') ? orderRequest.price : 0
            });

            logger.info(`[OrderExecutor] Order Placed. ID: ${orderResponse.order_id}`);

            // 2. persist Order Record
            if (runId) {
                const orderRecord = {
                    id: nanoid(15),
                    runId,
                    clientOrderId: orderResponse.order_id || nanoid(10), // Mock broker might return ID, or we gen one
                    brokerOrderId: orderResponse.order_id,
                    side: orderRequest.transaction_type,
                    type: orderRequest.order_type || 'MARKET',
                    status: 'PLACED',
                    qty: orderRequest.quantity,
                    requestedPrice: 0, // Market
                    placedAt: new Date()
                };
                ordersPlaced.push(orderRecord);
            }

            // 3. Handle Position (Open vs Close)
            // Assumption for Short Strangle: SELL = OPEN, BUY = CLOSE.
            // TODO: In future, pass 'intent' explicitly in order request.
            if (runId) {
                if (orderRequest.transaction_type === 'SELL') {
                    // Open New Position
                    let entryPrice = 0;
                    if (trade_mode === 'REAL') {
                        // User Request: "if tradeode is real entryPrice should take from the orderResponse else from orderResponse.price"
                        // Interpretation: REAL -> Trust Broker Response (if available), MOCK/Else -> Trust Request (LTP)
                        // Kite placeOrder usually returns just ID, but maybe user expects augmented response?
                        // We check response first, fallback to 0 (to be updated by TradeWatcher later).
                        entryPrice = orderResponse.average_price || orderResponse.price || 0;
                    } else {
                        // MOCK or others
                        entryPrice = orderRequest.price || 0;
                    }

                    const positionObj = {
                        id: nanoid(15),
                        runId,
                        leg: orderRequest.leg, 
                        strike: orderRequest.strike, 
                        expiryDate: orderRequest.expiry ? new Date(orderRequest.expiry) : new Date(),
                        instrumentToken: String(orderRequest.instrument_token),
                        tradingsymbol: orderRequest.tradingsymbol,
                        exchange: orderRequest.exchange || 'NFO',
                        // User Request: "insert quantity in positive if it is buy else insert quantity as negative if it is sell"
                        qty: orderRequest.transaction_type === 'SELL' ? -1 * Math.abs(orderRequest.quantity) : Math.abs(orderRequest.quantity),
                        entryPrice: Number(entryPrice),
                        status: 'OPEN',
                        openedReason: 'OrderExecutor Entry'
                    };
                    positionsOpened.push(positionObj);
                } else if (orderRequest.transaction_type === 'BUY') {
                    // Close Existing Position
                    let exitPrice = 0;
                    if (trade_mode === 'REAL') {
                        // User Request: "if tradeode is real entryPrice should take from the orderResponse else from orderResponse.price"
                        exitPrice = orderResponse.average_price || orderResponse.price || 0;
                    } else {
                        // MOCK or others
                        // If Limit, use Limit Price. If Market, we ideally need LTP or simulated fill price.
                        // OrderGenerator / ExitModule doesn't pass 'price' for Market orders.
                        // MockBroker might simulate price? If not, fallback to 0 or check if request has 'price' (it might not).
                        exitPrice = orderRequest.price || orderResponse.average_price || orderResponse.price || 0;
                    }

                    const result = await StrategyRunRepository.closePosition(
                        runId,
                        orderRequest.leg, // 'CE' | 'PE'
                        orderRequest.strike,
                        orderRequest.expiry ? new Date(orderRequest.expiry) : new Date(),
                        Number(exitPrice), // Pass Calculated Exit Price
                        'OrderExecutor Exit'
                    );
                    
                    if (result) {
                        positionsClosed.push(result);
                    } else {
                        logger.warn(`[OrderExecutor] Tried to close position but none found for ${orderRequest.tradingsymbol}`);
                    }
                }
            }

        } catch (err: any) {
             logger.error({ err }, `[OrderExecutor] Failed to place order for ${orderRequest.tradingsymbol}`);
             throw new AppError(500, ErrorCode.KITE_API_ERROR, `Failed to execute order: ${err.message}`);
        }
    }

    // 4. Batch Save to DB
    if (ordersPlaced.length > 0) {
        await StrategyRunRepository.saveOrders(ordersPlaced);
        logger.info(`[OrderExecutor] Saved ${ordersPlaced.length} orders.`);
    }
    if (positionsOpened.length > 0) {
        await StrategyRunRepository.savePositions(positionsOpened);
        logger.info(`[OrderExecutor] Opened ${positionsOpened.length} positions.`);
    }
    if (positionsClosed.length > 0) {
        logger.info(`[OrderExecutor] Closed ${positionsClosed.length} positions.`);
    }

    return {
        statePatch: {
            orders_queue: [], // Clear Queue
            executed_orders: ordersPlaced, // Provide history for this run cycle & orchestration
            last_execution_status: 'SUCCESS',
            positions_updated: true
        },
        events: [
            {
                eventType: 'ORDERS_EXECUTED',
                payloadJson: {
                    count: ordersPlaced.length,
                    opened: positionsOpened.length,
                    closed: positionsClosed.length
                }
            }
        ]
    };
  }
}
