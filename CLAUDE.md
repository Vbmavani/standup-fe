# Standup Board Web

Frontend for Standup Board, a team async-standup and task board. The backend lives in a separate project, `../standup-be`.

- Full product spec and **API contract**: `docs/PLAN.md`. Keep it in sync with `../standup-be/docs/PLAN.md`.

## Stack

React 18 · Vite · TypeScript (strict) · React Router 6 · TanStack Query 5 · Tailwind CSS · dnd-kit · Vitest

## Ports

- Web: `http://localhost:5173`
- API: `http://localhost:4000`. The Vite dev server proxies `/api` there, so the code always calls relative `/api/...` URLs and the session cookie stays same-origin.

## Commands

```bash
pnpm install
pnpm dev          # vite on 5173 (the API must be running on 4000)
pnpm typecheck
pnpm build && pnpm preview
pnpm test
```

## Layout

```
src/
  main.tsx, App.tsx     # providers + router
  api/client.ts         # fetch wrapper (credentials, JSON, ApiError)
  api/*.ts              # one module per resource, typed to docs/PLAN.md
  api/types.ts          # shared types copied from docs/PLAN.md
  hooks/                # useAuth, useTeamEvents, query hooks
  components/           # UI primitives (Button, Input, Modal, Card, ...) and layout
  pages/                # one file per route
  lib/                  # dates, formatting
```

## Conventions

- All server data goes through TanStack Query. Query keys: `['me']`, `['teams']`, `['team', id]`, `['tasks', id]`, `['standups', id, date]`, `['activity', id]`, `['summary', id, weekStart]`.
- Mutations invalidate their keys. Live updates come from `useTeamEvents`.
- Reusable UI primitives live in `components/ui`. Style with Tailwind utility classes, no CSS modules.
- Always send the user's **local** date (`YYYY-MM-DD`) to standup and summary endpoints.
- Show API error messages inline in forms, and use the toast for everything else.
