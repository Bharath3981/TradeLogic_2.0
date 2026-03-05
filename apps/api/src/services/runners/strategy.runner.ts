

import { StrategyRunMode } from '@prisma/client';
import { ModuleOrchestrator } from './module.orchestrator';
import { RunnerContext, ModuleResult } from './types';
import { nanoid } from 'nanoid';
import { StrategyRunRepository } from '../../repositories/repository.strategy-run';
import { MarketUtils } from '../../utils/market.utils';
import { TickerService } from '../service.ticker';
import { logger } from '../../utils/logger';

const SLEEP_MS = 1000; // 0.1 second loop interval for faster monitoring

export class StrategyRunner {
  private orchestrator: ModuleOrchestrator;
  private isRunning: boolean = false;

  private activeRunId: string | null = null;

  constructor() {
    this.orchestrator = new ModuleOrchestrator();
  }

  async startRun(strategyId: string, userId: string, mode: StrategyRunMode = 'MOCK', accessToken?: string): Promise<string> {
    if (this.isRunning) {
        throw new Error('Runner is already running');
    }
    
    // 1. Generate IDs
    const runId = nanoid(15);
    logger.info(`[Runner] Bootstrapping Run ${runId} for ${strategyId}`);

    // 2. Create DB Records via Repository
    await StrategyRunRepository.createRunWithState(runId, strategyId, userId, mode);

    // 3. Load Pipeline
    await this.orchestrator.loadPipeline(strategyId);

    // 4. Start Execution (Async)
    this.isRunning = true;
    this.activeRunId = runId;
    this.runBootstrapPhase(runId, strategyId, userId, mode, accessToken).catch(e => {
        logger.error({ err: e }, `[Runner] Bootstrap Error`);
        this.isRunning = false;
        this.activeRunId = null;
    });

    return runId;
  }

  private async runBootstrapPhase(runId: string, strategyId: string, userId: string, mode: StrategyRunMode, accessToken?: string) {
      logger.info(`[Runner] Starting Phase 1: Initialization for ${runId}`);
      
      // Load current state
      const currentState = await StrategyRunRepository.getState(runId);

      const context: RunnerContext = {
          runId,
          strategyId,
          userId,
          trade_mode: mode,
          state: currentState,
          logger: logger,
          accessToken
      };

      // Initialize TickerService if accessToken is available (Phase 2 readiness)
      if (accessToken) {
          TickerService.init(accessToken);
      }

      try {
          // Execute Pipeline (SharedConfig should run here)
          const result = await this.orchestrator.executePipeline(context);

          // Save Resulting State
          if (Object.keys(result.statePatch || {}).length > 0) {
              const newState = { ...currentState, ...result.statePatch };
              await StrategyRunRepository.updateState(runId, newState);
              context.state = newState; // Update local context
          }

          // Save Events
           if (result.events && result.events.length > 0) {
              await StrategyRunRepository.saveEvents(result.events.map((e, idx) => ({
                  id: nanoid(15),
                  runId,
                  seq: BigInt(Date.now() * 1000 + idx), 
                  eventType: e.eventType,
                  payloadJson: e.payloadJson || {},
              })));
          }
          
          logger.info(`[Runner] Phase 1 Complete. Config Applied. Starting Phase 2: Monitoring for ${runId}`);
          
          // REMOVED: Immediate Exit Check.
          // We MUST enter Phase 2 loop to allow OrderExecutor to process any Exit Orders generated in Phase 1.
          // The loop (Iteration 1) will:
          // 1. Run Executor (closes positions).
          // 2. Check Signal (EXIT_ALL).
          // 3. Stop.

          await StrategyRunRepository.updateStatus(runId, 'ACTIVE');
          
          // Start Phase 2: Monitoring Loop
          await this.runMonitoringLoop(context);

      } catch (e: any) {
          logger.error({ err: e }, `[Runner] Execution Failed`);
          await StrategyRunRepository.updateStatus(runId, 'ERROR', e.message);
          this.isRunning = false;
          this.activeRunId = null;
      }
  }

  private async runMonitoringLoop(context: RunnerContext) {
      const { runId } = context;
      
      while (this.isRunning && this.activeRunId === runId) {
          try {
              // 1. Check Status from DB (incase it was stopped via API)
              const run = await StrategyRunRepository.findById(runId);
              if (!run || run.status !== 'ACTIVE') {
                  logger.info(`[Runner] Run ${runId} status is ${run?.status || 'NOT_FOUND'}. Stopping loop.`);
                  break;
              }

              // 2. Check Market Hours
              if (!MarketUtils.isMarketOpen() && !MarketUtils.shouldBypassMarketHours()) {
                  logger.debug(`[Runner] Market Closed. Sleeping...`);
                  await new Promise(resolve => setTimeout(resolve, 60000)); // Sleep 1 min
                  continue;
              }

              // 3. Execute Pipeline (MARKET_MONITOR, etc.) - Only Monitoring Phase Modules
              const MONITORING_MODULES = ['MARKET_MONITOR', 'ADJUSTMENT_ENGINE', 'EXIT_MODULE', 'ORDER_EXECUTOR'];
              const result = await this.orchestrator.executePipeline(context, MONITORING_MODULES);

              // DEBUG: Log the Patch
              if (result.statePatch?.signal) {
                  logger.info(`[Runner] Pipeline returned Signal: ${result.statePatch.signal}`);
              }

              // 4. Save Results
              if (Object.keys(result.statePatch || {}).length > 0) {
                  const newState = { ...context.state, ...result.statePatch };
                  await StrategyRunRepository.updateState(runId, newState);
                  context.state = newState;
              }

              // Save Events
              if (result.events && result.events.length > 0) {
                  await StrategyRunRepository.saveEvents(result.events.map((e, idx) => ({
                      id: nanoid(15),
                      runId,
                      seq: BigInt(Date.now() * 1000 + idx),
                      eventType: e.eventType,
                      payloadJson: e.payloadJson || {},
                  })));
              }

              // 5. Check for Signal based Exits (MARKET_MONITOR might emit SIGNAL_EXIT_ALL)
              // We check the AUTHORITATIVE STATE (context.state.signal) not just the patch.
              // If patch didn't change it, it remains what it was (e.g. from Phase 1).
              if (context.state.signal === 'EXIT_ALL') {
                  logger.info(`[Runner] Exit Signal detected in State. Stopping loop. Reason: ${context.state.signal_reason}`);
                  await StrategyRunRepository.updateStatus(runId, 'EXITED', context.state.signal_reason);
                  break;
              }

              // 6. Sleep for next iteration
              await new Promise(resolve => setTimeout(resolve, SLEEP_MS));

          } catch (error: any) {
              logger.error({ err: error, runId }, `[Runner] Monitoring Loop Error`);
              // Decide: continue or abort? For now, sleep and retry.
              await new Promise(resolve => setTimeout(resolve, 5000)); 
          }
      }

      logger.info(`[Runner] Monitoring Loop Finished for ${runId}`);
      this.isRunning = false;
      this.activeRunId = null;
  }

  async stopRun(runId: string) {
      if (this.activeRunId === runId || this.activeRunId === null) { 
         logger.info(`[Runner] Stopping run ${runId}`);
         this.isRunning = false;
         this.activeRunId = null;
         
         await StrategyRunRepository.updateStatus(runId, 'PAUSED');
         return true;
      }
      return false;
  }
}
