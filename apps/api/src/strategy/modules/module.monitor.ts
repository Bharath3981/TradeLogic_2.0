
import { StrategyModule, RunnerContext, ModuleResult } from '../../services/runners/types';
import { StrategyRunRepository } from '../../repositories/repository.strategy-run';
import { MarketService } from '../../services/service.market';
import { TickerService } from '../../services/service.ticker';
import { logger } from '../../utils/logger';
import { UserMode } from '../../brokers/BrokerFactory';

export class MarketMonitorModule implements StrategyModule {
  private config: any;

  async init(config: any): Promise<void> {
    this.config = config;
  }

  async execute(context: RunnerContext): Promise<ModuleResult> {
    const { runId, userId, trade_mode, accessToken } = context;
    const { interval_ms = 0, target_profit_percent, stop_loss_percent, adjustment_threshold } = this.config;

    // 0. Interval Throttling
    const lastCheck = context.state.market_data?.last_updated;
    if (lastCheck) {
        const timeDiff = Date.now() - new Date(lastCheck).getTime();
        logger.info(`[MarketMonitor] TimeDiff: ${timeDiff}ms`);
        if (timeDiff < interval_ms) {
            // Skip execution if called too soon
            return { statePatch: {} };
        }
    }

    // 1. Fetch ALL Positions (Open + Closed) for P&L
    const allPositions: any[] = await StrategyRunRepository.getAllPositions(runId);
    
    logger.info(`[MarketMonitor] Positions Found: ${allPositions?.length || 0}`);

    if (!allPositions || allPositions.length === 0) {
        // No positions yet, nothing to monitor
        logger.info(`[MarketMonitor] No positions to monitor.`);
        return { statePatch: { market_data: { last_updated: new Date(), total_pnl: 0, positions: [] } } };
    }

    const openPositions = allPositions.filter((p: any) => p.status === 'OPEN');
    logger.info(`[MarketMonitor] Open Positions: ${openPositions.length}`);

    // 2. Fetch Live Prices for Open Positions
    const tokens = openPositions
        .filter((p: any) => p.instrumentToken)
        .map((p: any) => String(p.instrumentToken));

    let ltpMap: Record<string, any> = {};
    if (tokens.length > 0) {
        // Ensure tokens are subscribed to TickerService for future cycles
        TickerService.subscribe(tokens.map(Number));

        try {
            ltpMap = await MarketService.getLTP(userId, trade_mode as unknown as UserMode, accessToken, tokens);
            logger.info(`[MarketMonitor] LTP Fetched for ${Object.keys(ltpMap).length} tokens`);
        } catch (error) {
            logger.error(`[MarketMonitor] Failed to fetch LTP. Skipping cycle.`);
            return { statePatch: {} };
        }
    }

    // 3. Calculate P&L
    let totalRealizedPnL = 0;
    let totalUnrealizedPnL = 0;
    
    // Track Entry Premium for Logic Checks (assuming Short Strangle sell credit)
    let totalEntryPremium = 0; 
    let activeEntryPremium = 0; // Only open legs
    let totalQty = 0;

    // Group open legs for logic checks
    let ceLeg: any = null;
    let peLeg: any = null;

    // Process Closed Positions
    allPositions.filter(p => p.status === 'CLOSED').forEach(p => {
        const entry = Number(p.entryPrice);
        const exit = Number(p.exitPrice);
        const qty = p.qty; // Can be negative for Shorts
        // Logic: (Exit - Entry) * Qty
        // Short (Qty -50): (90 - 100) * -50 = -10 * -50 = 500 (Profit)
        const pnl = (exit - entry) * qty;
        totalRealizedPnL += pnl;
        totalEntryPremium += (entry * Math.abs(qty));
    });

    // Process Open Positions
    const positionsWithLTP = openPositions.map((p: any) => {
        const ltp = ltpMap[String(p.instrumentToken)]?.last_price || 0;
        const entry = Number(p.entryPrice);
        const qty = p.qty; // Can be negative for Shorts
        
        // Unrealized P&L: (Current - Entry) * Qty
        const pnl = (ltp - entry) * qty;
        totalUnrealizedPnL += pnl;
        
        // Identify Legs
        if (ltp > 0) {
            if (p.leg === 'CE') ceLeg = { ...p, ltp, pnl, entry };
            if (p.leg === 'PE') peLeg = { ...p, ltp, pnl, entry };
        }

        totalEntryPremium += (entry * Math.abs(qty));
        activeEntryPremium += (entry * Math.abs(qty));
        
        totalQty = Math.max(totalQty, Math.abs(qty));

        return {
            ...p,
            ltp,
            pnl
        };
    });

    const totalPnL = totalRealizedPnL + totalUnrealizedPnL;
    
    logger.info(`[MarketMonitor] P&L: ${totalPnL.toFixed(2)} (Real: ${totalRealizedPnL.toFixed(2)}, Unreal: ${totalUnrealizedPnL.toFixed(2)})`);


    // 4. Check Conditions
    // Initialize signal: If EXIT_ALL is already set, PRESERVE IT. Do not reset to WAIT.
    let signal = context.state.signal === 'EXIT_ALL' ? 'EXIT_ALL' : 'WAIT';
    let signalReason = context.state.signal_reason || '';

    // A. STOP LOSS (User Logic: Narrow Range <= 50)
    if (ceLeg && peLeg && stop_loss_percent) {
        const strikeDiff = Math.abs(ceLeg.strike - peLeg.strike);
        
        if (strikeDiff <= 50) {
            // User Logic: "Ce premium + pe premium = total active premium... calculate stop_loss_percent on this"
            // Example: (300 + 310) = 610. 10% = 61.
            // Total SL Amount = 61 * Qty (e.g., 65).
            
            const basisPremium = Number(ceLeg.entry) + Number(peLeg.entry);
            const slPoints = basisPremium * stop_loss_percent;
            const maxLossAmt = slPoints * totalQty; 
            
            // Check Current MTM Loss
            // totalUnrealizedPnL is Net P&L. If negative, it's a loss.
            const currentMTMLoss = -totalUnrealizedPnL; 
            
            // Trigger if Loss > Limit
            if (currentMTMLoss > maxLossAmt) { 
                 signal = 'EXIT_ALL';
                 signalReason = `Stop Loss Triggered (Narrow Range ${strikeDiff}). Loss ${currentMTMLoss.toFixed(2)} > Limit ${maxLossAmt.toFixed(2)}`;
            }
        }
    }

    // B. TARGET PROFIT (Premium Decay Logic)
    if (signal === 'WAIT' && target_profit_percent) {
        // Logic: Checks if the ACTIVE positions have decayed by the target percentage.
        // Formula: Current_Active_Premium <= Active_Entry_Premium * (1 - Target%)
        // Example: Entry 200. Target 80% (0.8). Exit when Premium <= 40.
        
        // Ensure we have active entry recorded
        if (activeEntryPremium > 0) {
             const currentActivePremium = (ceLeg ? ceLeg.ltp * Math.abs(ceLeg.qty) : 0) + (peLeg ? peLeg.ltp * Math.abs(peLeg.qty) : 0);
             const remainingDataThreshold = activeEntryPremium * (1 - target_profit_percent);
             
             // Check if Current Premium has melted down to the threshold
             if (currentActivePremium <= remainingDataThreshold) {
                 signal = 'EXIT_ALL';
                 signalReason = `Target Profit Hit (Premium Decay). Current ${currentActivePremium.toFixed(2)} <= Limit ${remainingDataThreshold.toFixed(2)} (Entry: ${activeEntryPremium.toFixed(2)})`;
             }
        }
    }

    // C. ADJUSTMENT (Ratio Logic)
    if (signal === 'WAIT' && ceLeg && peLeg && adjustment_threshold) {
         // User Logic: "if one of the premium is double or more of the second premium then will start adjustment"
         // Example: PE 80, CE 40. 80 >= 2*40.
         
         const ceLtp = ceLeg.ltp;
         const peLtp = peLeg.ltp;
         
         if (ceLtp > 0 && peLtp > 0) {
             if (ceLtp >= 2 * peLtp) {
                 signal = 'ADJUST';
                 signalReason = `Adjustment Trigger: CE (${ceLtp}) is >= 2x PE (${peLtp})`;
             } else if (peLtp >= 2 * ceLtp) {
                 signal = 'ADJUST';
                 signalReason = `Adjustment Trigger: PE (${peLtp}) is >= 2x CE (${ceLtp})`;
             }
         }
    }

    if (signal !== 'WAIT') {
        logger.warn(`[MarketMonitor] SIGNAL Generated: ${signal} | ${signalReason}`);
    }

    return {
        statePatch: {
            market_data: {
                last_updated: new Date(),
                total_pnl: totalPnL,
                total_premium: totalEntryPremium, 
                positions: positionsWithLTP
            },
            signal,
            signal_reason: signalReason
        },
        events: [
            { 
                eventType: 'MARKET_UPDATE', 
                payloadJson: { pnl: totalPnL, signal, reason: signalReason } 
            }
        ]
    };
  }
}
