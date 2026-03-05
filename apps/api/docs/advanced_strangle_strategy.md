# Advanced Strangle Strategy Architecture (Modular & Robust)

## Goal

Implement an automated Short Strangle strategy with dynamic adjustments, strictly adhering to the **Single Responsibility Principle** to ensure modules are reusable for future strategies.

## Core Modules & Responsibilities

### 1. `STRIKE_SELECTOR` (Decision Module)

- **Responsibility**: Solely responsible for _selecting_ instruments based on market conditions (ATM, Delta, Premium).
- **Input**: `SHARED_CONFIG` (Premium Target, Offset).
- **Output**: Updates State with `selected_legs` (Array of candidate instruments).
- **Reusability**: Can be used by any Options Strategy (Iron Condor, Straddle) to find strikes.

### 2. `ORDER_GENERATOR` (Decision -> Action Mapper)

- **Responsibility**: Converts _decisions_ (selected legs) into _intent_ (Orders Queue). It does NOT execute orders.
- **Input**: `selected_legs` from State, `ENTRY_CONFIG` (Qty, Product).
- **Output**: Populates `state.orders_queue` with standard order objects (`{ symbol, side, qty, type, tag }`).
- **Reusability**: Can generate orders for Entry, Exit, or Adjustment phases.

### 3. `ORDER_EXECUTOR` (Execution Module - Formally `ORDER_ENTRY`)

- **Responsibility**: Dumb execution. Processes `state.orders_queue`, places orders via Broker, and confirms execution.
- **Input**: `state.orders_queue`.
- **Output**:
  - Places actual API orders.
  - Captures `Order ID` and `Avg Price`.
  - Inserts records into `strategy_run_orders` and `strategy_run_positions`.
  - Clears `orders_queue`.
- **Reusability**: Universal execution module. Works for ANY strategy that produces a queue.

### 4. `MARKET_MONITOR` (Watcher Module)

- **Responsibility**: Observes live market data for _existing positions_.
- **Logic**:
  - Polls LTP for all Open Positions.
  - Calculates **Total Premium**, **Premium Difference %**, and **Decay %**.
  - Checks **Stop Loss** (Total Premium > 110% of Entry*). (*User defined formula: 10% of combined entry premiums\*)
  - Checks **Target** (Total Premium < 20% of Entry*). (*User defined decay target: 80% decay implied\*)
  - Checks **Adjustment Trigger**:
    - **Standard**: Premium Diff >= 50%.
    - **Near Expiry**: Premium Diff >= 20%.
- **Output**: Sets `state.signal` (e.g., `SIGNAL_ADJUST`, `SIGNAL_EXIT_ALL`, `SIGNAL_STOP_LOSS`).

### 5. `ADJUSTMENT_ENGINE` (Business Logic Module)

- **Responsibility**: Specific business logic for _fixing_ a trade.
- **Trigger**: `state.signal === 'SIGNAL_ADJUST'`.
- **Logic** (The 90% Rule):
  1.  Identify **Win Leg** (Lower Premium) and **Loss Leg** (Higher Premium).
  2.  Queue **Exit Order** for Win Leg.
  3.  Calculate Target Premium for New Leg (90% of Loss Leg's current LTP).
  4.  Search Option Chain (from `state.options_chain`) for Strike closest to Target Premium.
  5.  Queue **Entry Order** for New Leg.
- **Output**: Pushes 2 orders to `state.orders_queue`.

## Workflow (The "Loop")

### Phase 1: Entry

1.  **`STRIKE_FETCHER`**: Gets Option Chain.
2.  **`STRIKE_SELECTOR`**: Picks Initial CE/PE.
3.  **`ORDER_GENERATOR`**: Creates 2 SELL Orders in Queue.
4.  **`ORDER_EXECUTOR`**: Executes Queue -> DB Positions Created.

### Phase 2: Management Loop (Continuous)

5.  **`MARKET_MONITOR`**: Watches LTPs.
    - _Case A: Diff > 50%_ -> Emits `SIGNAL_ADJUST`.
    - _Case B: Stop Loss Hit_ -> Emits `SIGNAL_EXIT_ALL`.
6.  **`ORCHESTRATOR`**: Routes based on Signal.
    - If `SIGNAL_ADJUST` -> Run **`ADJUSTMENT_ENGINE`** -> Run **`ORDER_EXECUTOR`**.
    - If `SIGNAL_EXIT_ALL` -> Run **`EXIT_MODULE`** -> Run **`ORDER_EXECUTOR`**.

## Key Features

- **Decoupled Execution**: `ORDER_EXECUTOR` is generic. It doesn't care if it's opening a strangle or rolling a leg.
- **Robustness**: Specific modules for specific logic (Monitor vs Adjustment).
- **Extensibility**: To change the adjustment logic (e.g., "Roll Test"), you only replace `ADJUSTMENT_ENGINE`.
