
import { StrategyModule, RunnerContext, ModuleResult } from '../../services/runners/types';
import { logger } from '../../utils/logger';
import { StrategyRunRepository } from '../../repositories/repository.strategy-run';

export class ExitModule implements StrategyModule {
  private config: any;

  async init(config: any): Promise<void> {
    this.config = config;
  }

  async execute(context: RunnerContext): Promise<ModuleResult> {
    const { state, runId } = context;

    // 1. Check Signal
    if (state.signal !== 'EXIT_ALL') {
        return { statePatch: {} };
    }

    logger.info(`[ExitModule] Processing EXIT_ALL Signal. Reason: ${state.signal_reason}`);

    // 2. Fetch Open Positions
    // Use state.market_data.positions if reliable (Monitor updates it), 
    // but safer to filter state.market_data.positions for 'OPEN' status or fetch from DB if needed.
    // Monitor just ran, so state.market_data.positions should be fresh.
    
    const positions = state.market_data?.positions || [];
    const openPositions = positions.filter((p: any) => p.status === 'OPEN');

    if (openPositions.length === 0) {
        logger.warn(`[ExitModule] Signal EXIT_ALL received but no open positions found.`);
        return { statePatch: {} }; 
    }

    // Idempotency: Check if we already have pending EXIT_ALL orders in queue
    // This prevents double generation if Phase 1 generated them but they weren't executed yet.
    if (state.orders_queue && state.orders_queue.some((o: any) => o.tag === 'EXIT_ALL')) {
        logger.info(`[ExitModule] Pending EXIT_ALL orders found in queue. Skipping generation.`);
        return { statePatch: {} };
    }

    // 3. Generate Exit Orders
    const exitOrders = openPositions.map((p: any) => {
        // Determine Side: 
        // If qty < 0 (Short), Exit is BUY.
        // If qty > 0 (Long), Exit is SELL.
        const isShort = p.qty < 0;
        const exitSide = isShort ? 'BUY' : 'SELL';

        return {
            symbol: p.tradingsymbol,
            instrumentToken: p.instrumentToken,
            exchange: p.exchange,
            transaction_type: exitSide,
            quantity: Math.abs(p.qty), // Order Qty is always positive
            product: 'NRML', 
            order_type: 'MARKET', // Exit immediately
            tag: 'EXIT_ALL',
            validity: 'DAY',
            // Pass fields required by OrderExecutor to identify the position
            leg: p.leg,
            strike: p.strike,
            expiry: p.expiryDate,
            price: p.ltp // Pass LTP as 'price' so MockBroker can use it as execution price 
        };
    });

    logger.info(`[ExitModule] Generated ${exitOrders.length} generic exit orders.`);

    // 4. Update State
    // Push to order queue.
    // Reset signal to WAIT so Executor picks it up and Runner continues (or stops after execution).
    // Note: Runner loop breaks if signal is EXIT_ALL *after* pipeline execution.
    // Wait, if I reset signal to WAIT here, Runner loop in StrategyRunner might NOT stop!
    
    // StrategyRunner Logic:
    // if (result.statePatch?.signal === 'EXIT_ALL') { ... stops loop ... }
    
    // IF I reset to WAIT here, StrategyRunner won't see EXIT_ALL in the patch *returned by Orchestrator* 
    // (since Orchestrator merges patches).
    // Actually, Orchestrator execution returns a `ModuleResult`.
    
    // Problem: 
    // Monitor sets EXIT_ALL.
    // ExitModule consumes it, acts, and sets WAIT.
    // Result of Pipeline: signal = WAIT.
    // Runner loop checks `result.statePatch.signal`. It sees WAIT.
    // Loop continues.
    
    // User Intent: Stop Loss -> Exit All -> Stop Strategy?
    // Usually yes.
    
    // If I want to STOP the runner, I should NOT reset to WAIT?
    // But if I don't reset to WAIT, Executor (next module) might not know it's "done" handling it?
    // Executor just looks at `orders_queue`.
    
    // Re-verification of StrategyRunner logic:
    // `if (result.statePatch?.signal === 'EXIT_ALL')`
    
    // Design Choice:
    // ExitModule should *process* the exit (generate orders).
    // It should probably leave the signal as `EXIT_ALL` so the Runner knows to stop?
    // OR, we use a different flag `status: 'EXITED'`?
    
    // If I leave `signal: EXIT_ALL`, does `ADJUSTMENT_ENGINE` trigger?
    // Pipeline order: Monitor -> Adjustment -> Exit -> Executor.
    // Monitor sets EXIT_ALL.
    // Adjustment checks `if (signal !== 'ADJUST') return`. -> Skips.
    // Exit checks `if (signal !== 'EXIT_ALL') return`. -> Runs. Generates Orders.
    // Executor runs (unconditional). Executes Orders.
    
    // So if ExitModule returns `statePatch: { orders_queue: [...] }` (and DOES NOT change signal),
    // The final state of signal remains `EXIT_ALL` (from Monitor's patch).
    // Runner sees `EXIT_ALL` -> Stops Loop.
    
    // CORRECT APPROACH: Do NOT reset signal to WAIT in ExitModule.
    // Just append orders.
    // Let Runner handle the stop condition.
    
    return {
        statePatch: {
            orders_queue: [...(state.orders_queue || []), ...exitOrders],
        },
        events: [
            { 
                 eventType: 'EXIT_TRIGGERED', 
                 payloadJson: { 
                     reason: state.signal_reason, 
                     orders_count: exitOrders.length 
                 } 
            }
        ]
    };
  }
}
