
import { StrategyModule, RunnerContext, ModuleResult } from '../../services/runners/types';
import { InstrumentRepository } from '../../repositories/repository.instrument';
import { logger } from '../../utils/logger';
import { calculateTargetExpiry } from '../../utils/date.utils';

export class StrikeFetcherModule implements StrategyModule {
  private config: any;

  async init(config: any): Promise<void> {
    this.config = config;
  }

  async execute(context: RunnerContext): Promise<ModuleResult> {
    const { config } = context.state;

    if (!config || !config.index || !config.segment) {
        throw new Error('Missing required config (index, segment) in state for StrikeFetcherModule');
    }

    const { index, segment, offset, expiry_day, expiry_type } = config;

    logger.info(`[StrikeFetcher] Fetching instruments for ${index} ${segment} (Offset: ${offset}, Day: ${expiry_day})`);

    // 1. Calculate Target Expiry Date
    if (!expiry_day) {
        throw new Error('expiry_day is missing in config');
    }

    const selectedExpiry = calculateTargetExpiry(expiry_day, offset);

    logger.info(`[StrikeFetcher] Calculated Expiry: ${selectedExpiry.toISOString()} (Target: ${expiry_day}, Offset: ${offset})`);

    // 2. Fetch Chain for Specific Expiry
    const optionsChain = await InstrumentRepository.getRawOptionChain(index, segment, selectedExpiry);

    logger.info(`[StrikeFetcher] Fetched ${optionsChain.length} instruments`);

    return {
        statePatch: {
            options_chain: optionsChain,
            current_expiry: selectedExpiry.toISOString()
        },
        events: [
            { eventType: 'OPTION_CHAIN_FETCHED', payloadJson: { count: optionsChain.length, expiry: selectedExpiry } }
        ]
    };
  }
}
