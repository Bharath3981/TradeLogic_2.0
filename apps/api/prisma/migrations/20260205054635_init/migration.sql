-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "kiteAccessToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "availableCash" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "utilizedMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradingsymbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "instrumentToken" TEXT,
    "quantity" INTEGER NOT NULL,
    "averagePrice" DOUBLE PRECISION NOT NULL,
    "product" TEXT NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchlistSet" INTEGER NOT NULL,
    "instrumentToken" TEXT NOT NULL,
    "exchangeToken" TEXT,
    "tradingsymbol" TEXT NOT NULL,
    "name" TEXT,
    "lastPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expiry" TEXT,
    "strike" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tickSize" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lotSize" INTEGER NOT NULL DEFAULT 0,
    "instrumentType" TEXT,
    "segment" TEXT,
    "exchange" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" SERIAL NOT NULL,
    "instrument_token" INTEGER NOT NULL,
    "exchange_token" TEXT,
    "tradingsymbol" TEXT,
    "name" TEXT,
    "last_price" DOUBLE PRECISION,
    "expiry" TIMESTAMP(3),
    "strike" DOUBLE PRECISION,
    "tick_size" DOUBLE PRECISION,
    "lot_size" INTEGER,
    "instrument_type" TEXT,
    "segment" TEXT,
    "exchange" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Funds_userId_key" ON "Funds"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_instrument_token_key" ON "Instrument"("instrument_token");

-- AddForeignKey
ALTER TABLE "Funds" ADD CONSTRAINT "Funds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
