
import { StrategyModule, RunnerContext, ModuleResult } from '../../services/runners/types';
import { logger } from '../../utils/logger';

export class OrderGeneratorModule implements StrategyModule {
  private config: any;

  async init(config: any): Promise<void> {
    this.config = config;
  }

  async execute(context: RunnerContext): Promise<ModuleResult> {
    const { state } = context;
    const { selected_legs } = state;

    // Config Defaults
    const defaultTxnType = this.config.transaction_type || 'SELL';
    const quantityLots = this.config.quantity_lots || 1;
    const product = this.config.product || 'NRML';
    const orderType = this.config.order_type || 'MARKET';

    logger.info(`[OrderGenerator] Processing ${selected_legs?.length || 0} legs.`);

    if (!selected_legs || selected_legs.length === 0) {
        logger.warn('[OrderGenerator] No selected_legs found in state. Skipping order generation.');
        return { statePatch: {} };
    }

    const ordersQueue: any[] = [];

    for (const leg of selected_legs) {
        // Priority 1: Input Override, Priority 2: Config Default
        const txnType = leg.transaction_type || defaultTxnType;
        
        // Quantity Logic: 
        // If leg has specific qty, use it? Or always use lot_size * multiplier?
        // Usually multiplier logic is safer for consistency.
        // Fallback: if lot_size missing, use 50 (Nifty default) - dangerous assumption though.
        const legLotSize = leg.lot_size || 50; 
        const qty = legLotSize * quantityLots;

        const order = {
            instrument_token: String(leg.instrument_token),
            tradingsymbol: leg.tradingsymbol,
            exchange: leg.exchange || 'NFO',
            transaction_type: txnType,
            quantity: qty,
            price: leg.ltp,
            product: product,
            order_type: orderType,
            tag: 'STRATEGY_ORDER',
            leg: leg.leg, // 'CE' or 'PE'
            strike: leg.strike,
            expiry: leg.expiry // For DB recording
        };

        ordersQueue.push(order);
    }

    logger.info(`[OrderGenerator] Generated ${ordersQueue.length} orders in queue.`);

    return {
        statePatch: {
            orders_queue: ordersQueue
        },
        events: [
            {
                eventType: 'ORDERS_GENERATED',
                payloadJson: { count: ordersQueue.length }
            }
        ]
    };
  }
}
