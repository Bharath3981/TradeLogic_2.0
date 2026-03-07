
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
