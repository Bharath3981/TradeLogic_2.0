/*
  Warnings:

  - Added the required column `exchange` to the `strategy_run_positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instrument_token` to the `strategy_run_positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tradingsymbol` to the `strategy_run_positions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "strategy_run_positions" ADD COLUMN     "exchange" TEXT NOT NULL,
ADD COLUMN     "instrument_token" TEXT NOT NULL,
ADD COLUMN     "tradingsymbol" TEXT NOT NULL;
