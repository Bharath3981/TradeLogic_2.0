
import { StrategyModule, RunnerContext, ModuleResult, ModuleConstructor } from './types';
import { SharedConfigModule } from '../../strategy/modules/module.shared-config';
import { StrikeFetcherModule } from '../../strategy/modules/module.strike-fetcher';
import { StrikeSelectorModule } from '../../strategy/modules/module.strike-selector';
import { OrderGeneratorModule } from '../../strategy/modules/module.order-generator';
import { OrderExecutorModule } from '../../strategy/modules/module.order-executor';
import { MarketMonitorModule } from '../../strategy/modules/module.monitor';
import { AdjustmentEngineModule } from '../../strategy/modules/module.adjustment';
import { ExitModule } from '../../strategy/modules/module.exit';
import { StrategyRepository } from '../../repositories/repository.strategy';
import { logger } from '../../utils/logger';

const MODULE_REGISTRY: Record<string, ModuleConstructor> = {
  'SHARED_CONFIG': SharedConfigModule,
  'STRIKE_FETCHER': StrikeFetcherModule,
  'STRIKE_SELECTOR': StrikeSelectorModule,
  'ORDER_GENERATOR': OrderGeneratorModule,
  'ORDER_EXECUTOR': OrderExecutorModule,
  'MARKET_MONITOR': MarketMonitorModule,
  'ADJUSTMENT_ENGINE': AdjustmentEngineModule,
  'EXIT_MODULE': ExitModule
};

export class ModuleOrchestrator {
  private pipeline: { module: StrategyModule; moduleKey: string }[] = [];

  constructor() {}

  async loadPipeline(strategyId: string): Promise<void> {
    const configs = await StrategyRepository.findModuleConfigs(strategyId);

    this.pipeline = [];
    for (const cfg of configs) {
      const ModuleClass = MODULE_REGISTRY[cfg.moduleKey];
      if (ModuleClass) {
        const instance = new ModuleClass();
        await instance.init(cfg.moduleConfigJson);
        this.pipeline.push({ module: instance, moduleKey: cfg.moduleKey });
      } else {
        logger.warn(`Module implementation not found or not registered: ${cfg.moduleKey}`);
      }
    }
    
    logger.info(`Pipeline Loaded: ${this.pipeline.map(p => p.moduleKey).join(' -> ')}`);
  }

  async executePipeline(context: RunnerContext, moduleFilter?: string[]): Promise<ModuleResult> {
    let aggregatedResult: ModuleResult = {
        statePatch: {},
        events: [],
        commands: []
    };

    for (const item of this.pipeline) {
        // Apply Filter if provided
        if (moduleFilter && !moduleFilter.includes(item.moduleKey)) {
            continue;
        }

        try {
            const result = await item.module.execute(context);
            
            // Merge results
            if (result.statePatch) {
                context.state = { ...context.state, ...result.statePatch };
                aggregatedResult.statePatch = { ...aggregatedResult.statePatch, ...result.statePatch };
            }
            if (result.events) {
                aggregatedResult.events = [...(aggregatedResult.events || []), ...result.events];
            }
            if (result.commands) {
                aggregatedResult.commands = [...(aggregatedResult.commands || []), ...result.commands];
            }
            // If explicit status change, capture it (last one wins)
            if (result.nextStatus) {
                aggregatedResult.nextStatus = result.nextStatus;
            }

        } catch (e: any) {
            logger.error({ err: e, module: item.moduleKey }, `Error executing module ${item.moduleKey}`);
            // Decide: Abort pipeline or continue? 
            // Phase 1 failure = Abort.
            // For now, rethrow triggers runner error handler.
            throw e;
        }
    }

    return aggregatedResult;
  }
}
