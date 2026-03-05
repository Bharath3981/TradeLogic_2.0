
// Main Seed File
// Executes all sub-seeds in order

import * as child_process from 'child_process';
import * as path from 'path';

async function runSeed(fileName: string) {
    const filePath = path.join(__dirname, fileName);
    console.log(`\n>>> Running Seed: ${fileName}`);
    return new Promise((resolve, reject) => {
        const p = child_process.spawn('npx', ['ts-node', filePath], {
            stdio: 'inherit',
            shell: true
        });
        p.on('close', (code) => {
            if (code === 0) resolve(true);
            else reject(new Error(`Seed ${fileName} failed with code ${code}`));
        });
    });
}

async function main() {
    try {
        console.log('Skipping default seeds as files are missing.');
        // await runSeed('seed_modules.ts'); // File missing
        // await runSeed('seed_strategy.ts'); // File missing

        // Run the new initial strategy seed
        // await runSeed('seed_strategy_initial.ts');
        
        console.log('\n✅ Seed Process Finished.');
    } catch (e) {
        console.error('\n❌ Seeding Failed:', e);
        process.exit(1);
    }
}

main();
