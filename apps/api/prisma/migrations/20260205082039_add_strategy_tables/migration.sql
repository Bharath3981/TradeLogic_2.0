-- CreateTable
CREATE TABLE "strategies" (
    "id" VARCHAR(15) NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_modules" (
    "id" VARCHAR(15) NOT NULL,
    "module_key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "input_schema" JSONB,
    "output_schema" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_module_configs" (
    "id" VARCHAR(15) NOT NULL,
    "strategy_id" VARCHAR(15) NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "module_config_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_module_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_runs" (
    "id" VARCHAR(15) NOT NULL,
    "strategy_id" VARCHAR(15) NOT NULL,
    "status" "strategy_run_status" NOT NULL DEFAULT 'CREATED',
    "mode" "strategy_run_mode" NOT NULL DEFAULT 'MOCK',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,
    "lock_owner" TEXT,
    "last_heartbeat_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_run_state" (
    "run_id" VARCHAR(15) NOT NULL,
    "state_json" JSONB NOT NULL,
    "state_version" BIGINT NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_run_state_pkey" PRIMARY KEY ("run_id")
);

-- CreateTable
CREATE TABLE "strategy_run_events" (
    "id" VARCHAR(15) NOT NULL,
    "run_id" VARCHAR(15) NOT NULL,
    "seq" BIGINT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "correlation_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_run_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_run_positions" (
    "id" VARCHAR(15) NOT NULL,
    "run_id" VARCHAR(15) NOT NULL,
    "leg" "option_leg" NOT NULL,
    "strike" INTEGER NOT NULL,
    "expiry_date" DATE NOT NULL,
    "qty" INTEGER NOT NULL,
    "entry_price" DECIMAL(12,4) NOT NULL,
    "exit_price" DECIMAL(12,4),
    "status" "position_status" NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ,
    "opened_reason" TEXT NOT NULL,
    "closed_reason" TEXT,

    CONSTRAINT "strategy_run_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_run_orders" (
    "id" VARCHAR(15) NOT NULL,
    "run_id" VARCHAR(15) NOT NULL,
    "position_id" VARCHAR(15),
    "client_order_id" TEXT NOT NULL,
    "broker_order_id" TEXT,
    "side" "order_side" NOT NULL,
    "type" "order_type" NOT NULL DEFAULT 'MARKET',
    "status" "order_status" NOT NULL DEFAULT 'CREATED',
    "qty" INTEGER NOT NULL,
    "requested_price" DECIMAL(12,4),
    "filled_price" DECIMAL(12,4),
    "placed_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_broker_payload" JSONB,

    CONSTRAINT "strategy_run_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategies_code_key" ON "strategies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "strategy_modules_module_key_key" ON "strategy_modules"("module_key");

-- CreateIndex
CREATE INDEX "idx_strategy_module_configs" ON "strategy_module_configs"("strategy_id", "enabled", "order");

-- CreateIndex
CREATE UNIQUE INDEX "uq_strategy_module" ON "strategy_module_configs"("strategy_id", "module_key");

-- CreateIndex
CREATE UNIQUE INDEX "uq_strategy_order" ON "strategy_module_configs"("strategy_id", "order");

-- CreateIndex
CREATE INDEX "idx_strategy_runs_status" ON "strategy_runs"("status");

-- CreateIndex
CREATE INDEX "idx_strategy_runs_heartbeat" ON "strategy_runs"("last_heartbeat_at");

-- CreateIndex
CREATE INDEX "idx_strategy_run_events" ON "strategy_run_events"("run_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_run_event_seq" ON "strategy_run_events"("run_id", "seq");

-- CreateIndex
CREATE INDEX "idx_strategy_run_positions" ON "strategy_run_positions"("run_id", "status");

-- CreateIndex
CREATE INDEX "idx_strategy_run_orders" ON "strategy_run_orders"("run_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_run_client_order" ON "strategy_run_orders"("run_id", "client_order_id");

-- AddForeignKey
ALTER TABLE "strategy_module_configs" ADD CONSTRAINT "strategy_module_configs_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_runs" ADD CONSTRAINT "strategy_runs_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_run_state" ADD CONSTRAINT "strategy_run_state_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "strategy_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_run_events" ADD CONSTRAINT "strategy_run_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "strategy_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_run_positions" ADD CONSTRAINT "strategy_run_positions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "strategy_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_run_orders" ADD CONSTRAINT "strategy_run_orders_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "strategy_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_run_orders" ADD CONSTRAINT "strategy_run_orders_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "strategy_run_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
