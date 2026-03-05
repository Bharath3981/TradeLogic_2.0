
import { StrategyRunMode } from '@prisma/client';

export interface RunnerContext {
  runId: string;
  strategyId: string;
  userId: string;
  trade_mode: StrategyRunMode;
  state: Record<string, any>;
  logger: any;
  accessToken?: string;
}

export interface ModuleResult {
  statePatch?: Record<string, any>;
  events?: {
    eventType: string;
    payloadJson?: any;
    correlationId?: string;
  }[];
  nextStatus?: string; // e.g. 'RUNNING', 'EXITED'
  commands?: any[];   // For later phases
}

export interface StrategyModule {
  init(config: any): Promise<void>;
  execute(context: RunnerContext): Promise<ModuleResult>;
}

export type ModuleConstructor = new () => StrategyModule;

export interface StrategyCommand {
  type: string;
  payload: any;
}
