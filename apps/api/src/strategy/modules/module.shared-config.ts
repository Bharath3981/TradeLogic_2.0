
import { StrategyModule, RunnerContext, ModuleResult } from '../../services/runners/types';

export class SharedConfigModule implements StrategyModule {
  private config: any;

  async init(config: any): Promise<void> {
    this.config = config;
  }

  async execute(context: RunnerContext): Promise<ModuleResult> {
    
    // Idempotency check
    if (context.state.config && context.state.session) {
        return {}; 
    }

    const { 
       index, 
       segment, 
       expiry_type, 
       expiry_day,
       offset,
       target_premium,
       trading_window 
    } = this.config;

    // Simplified Responsibility: Just load config into state
    const statePatch = {
        config: {
            index,
            segment,
            expiry_type,
            expiry_day,
            offset,
            target_premium,
            trade_mode: context.trade_mode
        },
        session: {
            start_time: trading_window?.start_time || '09:15',
            end_time: trading_window?.end_time || '15:30',
            hard_exit_time: trading_window?.hard_exit_time || '15:25',
            initialized_at: new Date().toISOString()
        }
    };

    return {
        statePatch,
        events: [
            { eventType: 'SHARED_CONFIG_APPLIED', payloadJson: { index } }
        ]
    };
  }
}
