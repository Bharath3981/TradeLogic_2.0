-- CreateEnum
CREATE TYPE "strategy_run_status" AS ENUM ('CREATED', 'ENTRY_PLACING', 'ENTRY_CONFIRMING', 'ACTIVE', 'ADJUSTING', 'EXITING', 'EXITED', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "strategy_run_mode" AS ENUM ('MOCK', 'REAL');

-- CreateEnum
CREATE TYPE "option_leg" AS ENUM ('CE', 'PE');

-- CreateEnum
CREATE TYPE "position_status" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "order_side" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('MARKET', 'LIMIT');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('CREATED', 'PLACED', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "module_exec_status" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'RETRYING');
