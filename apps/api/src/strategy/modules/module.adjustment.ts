
import { StrategyModule, RunnerContext, ModuleResult } from '../../services/runners/types';
import { MarketService } from '../../services/service.market';
import { logger } from '../../utils/logger';
import { UserMode } from '../../brokers/BrokerFactory';
import { StrategyRunRepository } from '../../repositories/repository.strategy-run';

export class AdjustmentEngineModule implements StrategyModule {
  private config: any;

  async init(config: any): Promise<void> {
    this.config = config;
  }

  async execute(context: RunnerContext): Promise<ModuleResult> {
    const { state, runId, userId, trade_mode, accessToken } = context;

    // 1. Check Signal
    if (state.signal !== 'ADJUST') {
        return { statePatch: {} };
    }

    logger.info(`[AdjustmentEngine] Processing ADJUST Signal. Reason: ${state.signal_reason}`);

    // 2. Get Open Positions (Latest from Monitor or DB)
    // Monitor updates state.market_data.positions, so use that reliability
    const positions = state.market_data?.positions || [];
    const openPositions = positions.filter((p: any) => p.status === 'OPEN');

    if (openPositions.length < 2) {
        logger.warn(`[AdjustmentEngine] Cannot adjust. Less than 2 legs open.`);
        return { statePatch: { signal: 'WAIT' } };
    }

    // 3. Identify Winner and Loser
    // Winner = Lower LTP (Profit/Less Loss), Loser = Higher LTP (Loss/Risk)
    // Providing we are SHORT. (For Long, Winner is Higher LTP).
    // Assuming SHORT STRANGLE Strategy logic here.
    
    // Sort by LTP descending
    const sortedLegs = [...openPositions].sort((a, b) => b.ltp - a.ltp);
    const loserLeg = sortedLegs[0]; // Highest LTP
    const winnerLeg = sortedLegs[sortedLegs.length - 1]; // Lowest LTP

    logger.info(`[AdjustmentEngine] Loser: ${loserLeg.tradingsymbol} (${loserLeg.ltp}), Winner: ${winnerLeg.tradingsymbol} (${winnerLeg.ltp})`);

    // 4. Calculate Target Premium for Roll
    // "Target Premium = Loser Leg LTP * 0.9"
    const targetPremium = loserLeg.ltp * 0.9;
    logger.info(`[AdjustmentEngine] Target Premium for New Leg: ${targetPremium.toFixed(2)}`);

    // 5. Generate Orders
    const newOrders: any[] = [];

    // A. EXIT WINNER (BUY)
    newOrders.push({
        symbol: winnerLeg.tradingsymbol,
        instrumentToken: winnerLeg.instrumentToken,
        exchange: winnerLeg.exchange,
        transaction_type: 'BUY', // Closing Short
        quantity: winnerLeg.qty,
        product: 'NRML', // Assuming carry forward
        order_type: 'LIMIT', // Or MARKET
        price: winnerLeg.ltp, // Market/Limit price
        tag: 'ADJUST_EXIT',
        validity: 'DAY'
    });

    // B. ENTER NEW LEG (SELL)
    // Need to find strike closest to targetPremium on the Winner's Side (CE/PE)
    // We need Option Chain for the SAME Expiry.
    
    const expiry = winnerLeg.expiryDate ? new Date(winnerLeg.expiryDate) : null;
    const legType = winnerLeg.leg; // 'CE' or 'PE'
    
    // Fetch Option Chain/Instruments
    // We need to fetch instruments for the same Underlying and Expiry.
    // Assuming 'NIFTY' or derived from symbol.
    
    // Hack: We don't have full option chain in state usually.
    // We need to fetch instruments from MarketService or use StrikeFetcher logic.
    // Let's use MarketService to get instruments for the specific exchange/segment/symbol pattern?
    // Broker API usually gives all instruments. Filtering is heavy.
    // Optimization: Use `state.config.shared.expiry_day` logic if available?
    
    // Let's assume we can call a helper or get Quote for a range?
    // No, we need to SELECT a strike.
    // Strategy: Fetch Master Contract (filtered) -> Find Strike.
    // This is "STRIKE_FETCHER" role.
    
    // For now, I will implement a lightweight lookup if possible, or assume Fetcher data is available?
    // Phase 2 loop doesn't run Fetcher.
    // I MUST Fetch fresh chain data.
    
    try {
        // Fetch ALL options for the underlying (e.g. NIFTY)
        // This is expensive (thousands of rows).
        // Ideally, we search 10-20 strikes around ATM or around Winner Strike?
        // Winner is far OTM (low premium). We roll INWARDS (towards ATM) to get higher premium.
        // So we search strikes closer to ATM than the Winner Strike.
        
        // Let's use `MarketService.getInstruments` (cached usually?)
        // Or if we have a DB cache of instruments?
        
        // Simpler: Use `StrikeSelector` logic IF we can invoke it. 
        // But logic is specific here (Target Premium).
        
        // fetching instruments
        // We know the symbol format/underlying from winnerLeg.tradingsymbol
        // e.g., "NIFTY23OCT..."
        // Lets assume we fetch NFO instruments.
        
        const instruments = await MarketService.getInstruments(userId, UserMode.REAL, accessToken, 'NFO');
        
        // Filter: Same Name, Same Expiry, Same Type (CE/PE)
        // winnerLeg.expiryDate is standard Date object/string
        // Parse expiry correctly.
        
        // Helper to match expiry
        const relevantInstruments = instruments.filter((inst: any) => {
             return inst.name === winnerLeg.name // "NIFTY"
                 && inst.instrument_type === legType // "CE"
                 && new Date(inst.expiry).getTime() === new Date(winnerLeg.expiryDate).getTime();
        });

        // Now we need LTPs for these to find the closest match.
        // We can't fetch LTP for ALL.
        // Heuristic: Filter strikes between Winner Strike and ATM (Loser Strike is proxy for ATM/ITM side?).
        // Winner Strike (e.g. 2650 PE). Loser (2700 CE).
        // Roll PE Up towards 2700.
        // So strikes > 2650.
        // Reduce list.
        
        // Optimization: Pick 20 strikes around the expected strike?
        // Hard to guess expected strike without Delta/LTP.
        // BUT, we know Target Premium.
        // Fetch LTPs for candidates.
        
        // Simplification: Fetch quotes for all relevant instruments? 
        // Nifty weekly expiry has ~50-100 strikes. 
        // Fetching 100 LTPs is acceptable for Kite.
        
        const verificationTokens = relevantInstruments.map((i: any) => String(i.instrument_token));
        const quotes = await MarketService.getLTP(userId, UserMode.REAL, accessToken, verificationTokens);
        
        // Find closest to targetPremium
        let bestMatch: any = null;
        let minDiff = Number.MAX_VALUE;

        for (const inst of relevantInstruments) {
            const ltp = quotes[String(inst.instrument_token)]?.last_price;
            if (ltp) {
                const diff = Math.abs(ltp - targetPremium);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestMatch = { ...inst, ltp };
                }
            }
        }

        if (bestMatch) {
             logger.info(`[Adjustment] Selected New Strike: ${bestMatch.tradingsymbol} (${bestMatch.strike}) @ ${bestMatch.ltp}`);
             newOrders.push({
                symbol: bestMatch.tradingsymbol,
                instrumentToken: Number(bestMatch.instrument_token),
                exchange: bestMatch.exchange,
                transaction_type: 'SELL', // Opening New Short
                quantity: winnerLeg.qty,
                product: 'NRML',
                order_type: 'LIMIT',
                price: bestMatch.ltp,
                tag: 'ADJUST_ENTRY',
                validity: 'DAY'
            });
        } else {
            logger.error(`[Adjustment] Could not find suitable strike for Target Premium ${targetPremium}`);
            // Abort adjustment or partial?
            // Safer to WAIT
            return { statePatch: { signal: 'WAIT', signal_reason: 'Adjustment Failed: No Strike Found' } };
        }

    } catch (e: any) {
        logger.error({ err: e }, `[Adjustment] Error fetching options chain`);
        return { statePatch: { signal: 'WAIT', signal_reason: 'Adjustment Failed: Data Error' } }; // Retry next loop
    }

    // 6. Update State
    // Reset signal to WAIT (Executor will handle orders)
    // Actually, if we set WAIT, does Executor run?
    // Yes, Executor runs if orders_queue has items.
    // Signal state is mostly for Monitor/Orchestrator flow control.

    return {
        statePatch: {
            orders_queue: [...(state.orders_queue || []), ...newOrders],
            signal: 'WAIT',
            signal_reason: 'Adjustment Orders Generated'
        },
         events: [
            { 
                eventType: 'ADJUSTMENT_TRIGGERED', 
                payloadJson: { 
                    loser: loserLeg.tradingsymbol, 
                    winner: winnerLeg.tradingsymbol,
                    target_premium: targetPremium,
                    new_leg: newOrders[1]?.symbol
                } 
            }
        ]
    };
  }
}
