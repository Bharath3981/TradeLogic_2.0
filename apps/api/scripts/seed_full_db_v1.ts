
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Full DB Seed (v1) ---');

    // 1. Seed User & Funds
    console.log('1. Seeding User & Funds...');
    const userId = 'user_default';
    const user = await prisma.user.upsert({
        where: { id: userId },
        create: {
            id: userId,
            email: 'trader@tradelogic.com',
            name: 'Default Trader',
            password: 'hashed_password_placeholder', // in real app use bcrypt
            isActive: true,
            kiteAccessToken: 'enctoken_placeholder'
        },
        update: {}
    });

    await prisma.funds.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            availableCash: 500000,
            utilizedMargin: 0
        },
        update: {
            availableCash: 500000
        }
    });
    console.log(`   User: ${user.name} (${user.id}) created/updated.`);


    // 2. Seed Strategy Catalog (Modules)
    console.log('2. Seeding Strategy Module Catalog...');
    const modulesDef = [
        {
            key: 'SHARED_CONFIG',
            category: 'CONFIG',
            description: 'Shared Configuration (Expiry, Offset, Target Premium)',
        },
        {
            key: 'STRIKE_FETCHER',
            category: 'DATA',
            description: 'Fetches Option Chain Data',
        },
        {
            key: 'STRIKE_SELECTOR',
            category: 'LOGIC',
            description: 'Selects Strikes based on Premium',
        },
        {
            key: 'ORDER_GENERATOR',
            category: 'LOGIC',
            description: 'Generates Orders from Selected Legs',
        },
        {
            key: 'ORDER_EXECUTOR',
            category: 'EXECUTION',
            description: 'Executes Orders via Broker',
        },
        {
            key: 'MARKET_MONITOR',
            category: 'MONITORING',
            description: 'Monitors P&L and Market Conditions',
        },
        {
            key: 'ADJUSTMENT_ENGINE',
            category: 'LOGIC',
            description: 'Calculates Adjustments based on Signals',
        },
        {
            key: 'EXIT_MODULE',
            category: 'EXECUTION',
            description: 'Handles Exits and Stop Loss',
        }
    ];

    for (const mod of modulesDef) {
        await prisma.strategyModule.upsert({
            where: { moduleKey: mod.key },
            create: {
                id: `mod_${mod.key.toLowerCase().substring(0,8)}`.substring(0,15),
                moduleKey: mod.key,
                category: mod.category,
                description: mod.description,
                isActive: true
            },
            update: {
                category: mod.category,
                description: mod.description
            }
        });
        console.log(`   Module: ${mod.key}`);
    }


    // 3. Seed Strategy & Configurations
    console.log('3. Seeding Strategy: Nifty Short Strangle...');
    const strategyId = 'str_nifty_stg';
    const strategy = await prisma.strategy.upsert({
        where: { id: strategyId },
        create: {
            id: strategyId,
            code: 'NIFTY_STRANGLE_V2',
            name: 'Nifty Short Strangle',
            description: 'Automated Nifty Short Strangle with Adjustments',
            isActive: true
        },
        update: {
            name: 'Nifty Short Strangle',
            description: 'Automated Nifty Short Strangle with Adjustments'
        }
    });

    const moduleConfigs = [
        {
            key: 'SHARED_CONFIG',
            order: 1,
            config: {
                index: 'NIFTY',
                segment: 'NFO-OPT',
                expiry_day: 'TUESDAY', 
                offset: 0,
                target_premium: 30, // Premium to match
                options_chain_cache_mins: 15,
                trading_window: {
                    start_time: '09:15',
                    end_time: '15:30',
                    hard_exit_time: '15:25'
                }
            }
        },
        {
            key: 'STRIKE_FETCHER',
            order: 2,
            config: {}
        },
        {
            key: 'STRIKE_SELECTOR',
            order: 3,
            config: {
                atm_instrument_token: 256265, // NIFTY 50 (NSE)
                exchange: 'NSE',
                fetch_ltp_length: 10
            }
        },
        {
            key: 'MARKET_MONITOR',
            order: 4,
            config: {
                interval_ms: 1000, 
                target_profit_percent: 0.8,
                stop_loss_percent: 0.1,
                adjustment_threshold: 0.5
            }
        },
        {
            key: 'ADJUSTMENT_ENGINE',
            order: 5,
            config: {}
        },
        {
            key: 'EXIT_MODULE',
            order: 6,
            config: {}
        },
        {
            key: 'ORDER_EXECUTOR',
            order: 7,
            config: {}
        }
    ];

    for (const mod of moduleConfigs) {
        // Find module def to ensure it exists (though upsert earlier handles it)
        const modDef = await prisma.strategyModule.findUnique({ where: { moduleKey: mod.key } });
        if(!modDef) continue;

        await prisma.strategyModuleConfig.upsert({
            where: {
                strategyId_moduleKey: {
                    strategyId: strategy.id,
                    moduleKey: mod.key
                }
            },
            create: {
                id: `cfg_${mod.key.substring(0,6)}_${Math.floor(Math.random()*100)}`.substring(0,15),
                strategyId: strategy.id,
                moduleKey: mod.key,
                order: mod.order,
                enabled: true,
                moduleConfigJson: mod.config
            },
            update: {
                order: mod.order,
                moduleConfigJson: mod.config,
                enabled: true
            }
        });
        console.log(`   Configured: ${mod.key}`);
    }

    console.log('--- Seed Completed Successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
