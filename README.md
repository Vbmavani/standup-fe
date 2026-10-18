# Standup Board — Web

React frontend for **Standup Board**, a team async-standup and kanban board. The API lives in a separate repo, [standup-be](https://github.com/Vbmavani/standup-be) (clone it next to this one as `../standup-be`); the full contract is in [`docs/PLAN.md`](docs/PLAN.md).

## Quickstart

Requires Node 22 and pnpm 11.

1. Start the API first (it listens on `http://localhost:4000` and needs Redis):
   ```bash
   cd ../standup-be
   pnpm install
   pnpm dev
   ```
2. In this folder:
   ```bash
   pnpm install
   pnpm dev
   ```
3. Open <http://localhost:5173>, sign up, create a team and share its invite code.

The Vite dev server proxies `/api` (including the Server-Sent Events stream) to port 4000, so the session cookie stays same-origin.

## Scripts

| Command          | What it does                          |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Vite dev server on port 5173          |
| `pnpm build`     | Type-check and build to `dist/`       |
| `pnpm preview`   | Serve the build (also proxies `/api`) |
| `pnpm typecheck` | `tsc --noEmit` for app and config     |
| `pnpm test`      | Vitest unit tests                     |

## Stack

React 18 · Vite · TypeScript (strict) · React Router 6 · TanStack Query 5 · Tailwind CSS v4 · dnd-kit · Vitest
