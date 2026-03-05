# TradeLogic 2.0 — Claude Code Instructions

## Architecture
- Monorepo with pnpm workspaces + Turborepo
- apps/api  → Express + TypeScript + Prisma + Kite Connect
- apps/web  → React + TypeScript + Vite + Zustand + MUI
- packages/shared → all shared types and constants

## API Patterns
- Controllers use sendSuccess(res, data) from utils/ApiResponse
- AppError signature: new AppError(statusCode, ErrorCode.X, 'message')
- Auth middleware attaches kite token at req.user.accessToken
- All routes go through authenticate middleware

## UI Patterns  
- State management: Zustand stores in src/store/
- API calls: axios client in src/api/client.ts
- verbatimModuleSyntax: true → always use `import type` for types
- Styling: MUI components + inline styles for custom pages

## Database
- Prisma with PostgreSQL
- User model has kiteAccessToken (encrypted)

## Never Do
- Never hardcode instrument tokens (fetch dynamically)
- Never import ApiResponse as a class (use sendSuccess/sendError)
- Never use localStorage in React components
```

### Phase 4 — Upgrade with Claude Code (ongoing)

With full repo context, Claude Code can now tackle much bigger features:
```
"Add WebSocket real-time P&L updates across the entire stack —
 update the Prisma schema, create the WS service in api, 
 and connect it to the positions page in web"
```

---

## What Claude Code Can Build for TradeLogic 2.0

With full monorepo context, here's what becomes easy to build:

**Trading Features**
- Options chain viewer with Greeks
- Algo strategy backtester
- Auto stop-loss trigger via Kite orders
- Paper trading mode with virtual P&L

**Infrastructure**
- Redis caching for screener results
- Bull queue for background scans
- Prisma migrations for new features
- End-to-end TypeScript with zero drift between API and UI

**Developer Experience**
- Shared ESLint + Prettier config
- Vitest for unit tests
- GitHub Actions CI/CD
- Docker compose for local dev

---

## Immediate Next Steps After Getting Claude Pro
```
1. Install Claude Code          npm install -g @anthropic-ai/claude-code
2. Install VS Code extension    Search "Claude Code" by Anthropic
3. Create monorepo structure    (as above)
4. Write CLAUDE.md              Describe your patterns
5. Open folder in VS Code       code TradeLogic/
6. Start Claude Code session    Click ✦ in sidebar
7. Say: "Read CLAUDE.md and understand the full codebase, 
         then migrate both apps into the monorepo structure"