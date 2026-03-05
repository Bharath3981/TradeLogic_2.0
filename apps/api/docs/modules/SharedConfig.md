# SharedConfig Module Design

## Responsibilities

### 1. Define Trading Scope

- **Index**: `NIFTY`, `BANKNIFTY`, etc.
- **Segment**: `NFO-OPT` (Future scope: others).
- **Lot Size**: Define fixed lot size (e.g., 65 for NIFTY currently, or dynamic).

### 2. Expiry Policy

- **Configuration**:
  - `type`: `WEEKLY` | `MONTHLY`
  - `weekOffset`: `0` (current), `1` (next), etc.
  - `expiryDayCutoffTime`: Time to switch to next expiry (e.g., "12:00" on expiry day).
- **Resolution**:
  - Logic to calculate the _concrete_ expiry date based on current time and policy.
  - Example: If today is expiry day and time > 12:00, resolve to next week.

### 3. Trading Window

- **Configuration**:
  - `startTime`: When strategy is allowed to start entering (e.g., "09:15").
  - `endTime`: When strategy stops taking new entries (e.g., "15:15").
  - `hardExitTime`: When all positions must be squared off (e.g., "15:25").
  - `daysToTrade`: Optional (e.g., only Wed/Thu).

### 4. State Publishing (Output)

This module writes to the shared state. It does _not_ read signals.

- **Target State Paths**:
  - `state.instrument`: `{ symbol, expiryDate, lotSize, segment }`
  - `state.session`: `{ startTime, endTime, hardExitTime, isExpiryDay }`

### 5. Execution Policy

- **Frequency**: **Run ONCE at strategy start.**
  - It does _not_ need to run on every tick.
  - Exceptions: If config allows dynamic expiry rollover mid-run (advanced).
- **Constraints**:
  - **NO** Orders.
  - **NO** API calls to broker (unless resolving dynamic lot sizes, but typically static config).
  - **NO** Logic dependent on premiums/PNL.

## Inputs (Config Schema)

```json
{
  "index": "NIFTY",
  "segment": "NFO-OPT",
  "lotSize": 65,
  "expiryPolicy": {
    "type": "WEEKLY",
    "weekOffset": 0,
    "expiryDayCutoffTime": "12:00",
    "afterCutoffChoose": "NEXT_WEEK"
  },
  "tradingWindow": {
    "startTime": "09:15",
    "endTime": "15:30",
    "hardExitTime": "15:25"
  }
}
```

## Logic Flow

1.  **Validate**: Check format of times (HH:mm), valid index enum.
2.  **Resolve Expiry**:
    - Get `today`.
    - Find "current" expiry for `index`.
    - Apply `weekOffset`.
    - Check `expiryDayCutoffTime`.
    - Set `state.instrument.expiryDate`.
3.  **Publish Session**:
    - Copy window configs to `state.session`.
    - Set `state.session.isExpiryDay = (today == expiryDate)`.
4.  **Return**: Patch `state` with new objects.
