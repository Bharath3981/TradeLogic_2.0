import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const InstrumentRepository = {
    async findExpiries(name: string, segment: string) {
        return await prisma.instrument.findMany({
            where: {
                name: name,
                segment: segment,
                instrument_type: { in: ['CE', 'PE'] },
                expiry: { gt: new Date() }
            },
            distinct: ['expiry'],
            orderBy: { expiry: 'asc' },
            select: { expiry: true }
        });
    },

    async findOptionChain(name: string, segment: string, expiry: Date) {
        return await prisma.instrument.findMany({
            where: {
                name: name,
                segment: segment,
                expiry: expiry,
                instrument_type: { in: ['CE', 'PE'] }
            },
            orderBy: { strike: 'asc' }
        });
    },

    async getRawOptionChain(name: string, segment: string, expiry: Date) {
        return await prisma.instrument.findMany({
            where: {
                name: name,
                segment: segment,
                expiry: expiry,
                instrument_type: { in: ['CE', 'PE'] }
            },
            select: {
                instrument_token: true,
                exchange_token: true,
                tradingsymbol: true,
                expiry: true,
                strike: true,
                lot_size: true,
                instrument_type: true,
                segment: true,
                exchange: true
            }
        });
    },



    async findAll() {
        return await prisma.instrument.findMany();
    },

    async syncInstruments(exchange: string, instruments: any[]) {
        return await prisma.$transaction([
            prisma.instrument.deleteMany({ where: { exchange } }),
            prisma.instrument.createMany({
                data: instruments,
                skipDuplicates: true
            })
        ]);
    },

    async searchInstruments(whereClause: any, take: number) {
        return await prisma.instrument.findMany({
            where: whereClause,
            take: take
        });
    },

    async findInstrument(exchange: string, symbol: string) {
        return await prisma.instrument.findFirst({
            where: {
                exchange: exchange,
                tradingsymbol: symbol
            }
        });
    }
};
