
import { StrategyModule, RunnerContext, ModuleResult } from '../../services/runners/types';
import { MarketService } from '../../services/service.market';
import { logger } from '../../utils/logger';
import { UserMode } from '../../brokers/BrokerFactory';

export class StrikeSelectorModule implements StrategyModule {
  private config: any;

  async init(config: any): Promise<void> {
    this.config = config;
  }

  async execute(context: RunnerContext): Promise<ModuleResult> {
    const { atm_instrument_token, exchange, fetch_ltp_length } = this.config;
    const { state, userId, trade_mode, accessToken } = context;
    const { options_chain, target_premium } = state.config ? state.config : state; 
    
    const optionsChain = state.options_chain as any[];
    const globalConfig = state.config;

    if (!optionsChain || optionsChain.length === 0) {
        throw new Error('No options_chain found in state. Ensure STRIKE_FETCHER ran.');
    }
    if (!globalConfig || !globalConfig.target_premium) {
        throw new Error('target_premium not found in state config.');
    }

    const searchLength = fetch_ltp_length || 10;

    logger.info(`[StrikeSelector] Finding ATM for ${atm_instrument_token} (${exchange}). Target Premium: ${target_premium}`);

    // 1. Fetch Underlying LTP directly using Token
    if (!atm_instrument_token) {
        throw new Error('atm_instrument_token is missing in module config');
    }

    // MarketService requires Real mode to fetch data usually, or respects trade_mode if supported.
    // User requirement: "even if user pass x-trading-mode as mock it should pick real data only"
    // So we pass UserMode.REAL always for data fetching.
    const ltpMap = await MarketService.getLTP(userId, UserMode.REAL, accessToken, [String(atm_instrument_token)]);
    
    const underlyingLTP = ltpMap[String(atm_instrument_token)]?.last_price;
    if (!underlyingLTP) {
        throw new Error(`Failed to fetch LTP for underlying token ${atm_instrument_token}`);
    }

    logger.info(`[StrikeSelector] Underlying LTP: ${underlyingLTP}`);

    // 3. Determine ATM Strike
    // We need strike step. We can infer from options chain.
    // Assuming optionsChain is sorted by strike locally if not guaranteed by fetching
    // Sort just in case
    optionsChain.sort((a, b) => a.strike - b.strike);
    
    // Infer step
    let step = 50; // default Nifty
    if (optionsChain.length >= 2) {
        step = Math.abs(optionsChain[1].strike - optionsChain[0].strike);
    }
    // Handle duplicates (same strike different type)? 
    // Options chain has CE and PE. sorted by strike.
    // 25000 CE, 25000 PE, 25100 CE... 
    // If adjacent strikes are same, skip.
    for(let i=0; i<optionsChain.length-1; i++) {
        const diff = optionsChain[i+1].strike - optionsChain[i].strike;
        if (diff > 0) {
            step = diff;
            break;
        }
    }

    const atmStrike = Math.round(underlyingLTP / step) * step;
    logger.info(`[StrikeSelector] Calculated ATM: ${atmStrike} (Step: ${step})`);

    // 4. Filter Candidate Instruments around ATM
    // We need options "around" ATM. 
    // For CE and PE separately or together? 
    // Usually we want strikes around ATM to find matching premium. 
    // The target premium (e.g. 100) could be OTM or ITM? 
    // Usually for Strangle/Straddle we look for *nearest to premium*.
    
    // Let's gather all unique strikes from chain
    const uniqueStrikes = Array.from(new Set(optionsChain.map(i => i.strike))).sort((a, b) => a - b);
    
    // Find index of ATM in uniqueStrikes
    // If exact ATM not found, find closest
    let atmIndex = -1;
    let minDiff = Number.MAX_VALUE;
    
    uniqueStrikes.forEach((s, idx) => {
        const diff = Math.abs(s - atmStrike);
        if (diff < minDiff) {
            minDiff = diff;
            atmIndex = idx;
        }
    });

    // Select range: atmIndex +/- searchLength
    const startIdx = Math.max(0, atmIndex - searchLength);
    const endIdx = Math.min(uniqueStrikes.length - 1, atmIndex + searchLength);
    
    const candidateStrikes = uniqueStrikes.slice(startIdx, endIdx + 1);
    
    // Filter options matching these strikes
    const candidateOptions = optionsChain.filter(opt => candidateStrikes.includes(opt.strike));
    
    // 5. Fetch LTP for Candidates
    const tokensToFetch = candidateOptions.map(o => String(o.instrument_token));
    const optionLtpMap = await MarketService.getLTP(userId, UserMode.REAL, accessToken, tokensToFetch);

    // 6. Select Best Matches
    let selectedCE: any = null;
    let selectedPE: any = null;
    let minDiffCE = Number.MAX_VALUE;
    let minDiffPE = Number.MAX_VALUE;

    candidateOptions.forEach(opt => {
        const price = optionLtpMap[String(opt.instrument_token)]?.last_price;
        if (price === undefined) return; // Skip if no price

        const diff = Math.abs(price - target_premium);
        
        if (opt.instrument_type === 'CE') {
            if (diff < minDiffCE) {
                minDiffCE = diff;
                selectedCE = { ...opt, ltp: price };
            }
        } else if (opt.instrument_type === 'PE') {
            if (diff < minDiffPE) {
                minDiffPE = diff;
                selectedPE = { ...opt, ltp: price };
            }
        }
    });

    if (!selectedCE || !selectedPE) {
        logger.warn(`[StrikeSelector] Could not find suitable strikes near premium ${target_premium}`);
    } else {
        logger.info(`[StrikeSelector] Selected CE: ${selectedCE.tradingsymbol} (${selectedCE.ltp}), PE: ${selectedPE.tradingsymbol} (${selectedPE.ltp})`);
    }

    const selectedLegs = [];
    if (selectedCE) selectedLegs.push({ ...selectedCE, leg: 'CE' });
    if (selectedPE) selectedLegs.push({ ...selectedPE, leg: 'PE' });

    return {
        statePatch: {
            selected_legs: selectedLegs, 
            selected_strike_ce: selectedCE,
            selected_strike_pe: selectedPE,
            atm_strike: atmStrike,
            underlying_ltp: underlyingLTP
        },
        events: [
            { 
                eventType: 'STRIKES_SELECTED', 
                payloadJson: { 
                    ce: selectedCE ? selectedCE.tradingsymbol : null, 
                    pe: selectedPE ? selectedPE.tradingsymbol : null,
                    atm: atmStrike
                } 
            }
        ]
    };
  }
}
