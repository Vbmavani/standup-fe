# standup-fe: Standup Board web app

React single-page app for **Standup Board**, a team async-standup and kanban board. Users sign up, create or join teams with an invite code, post daily standups, drag tasks on a board, and see teammates' changes live.

- **Backend:** separate repo `../standup-be` (Fastify + Redis, port 4000) – https://github.com/Vbmavani/standup-be
- **Spec + API contract:** `docs/PLAN.md`. Every request and response type here must match it.

> **IMPORTANT:** `docs/PLAN.md` exists in both repos and must stay identical. Never change how the app calls the API without first changing the contract in both repos. The backend is the source of truth for behaviour.

## Quick facts

|               |                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------- |
| Runtime       | Node 22 (`.nvmrc`), pnpm 11 (pinned in `package.json`)                                   |
| Stack         | React 18, Vite 8, TypeScript strict, React Router 6, TanStack Query 5                    |
| Styling       | Tailwind CSS v4 via `@tailwindcss/vite`; classes sorted by `prettier-plugin-tailwindcss` |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable`                                                    |
| Tests         | Vitest + jsdom + Testing Library (`src/**/*.test.ts(x)`)                                 |
| Ports         | Web `http://localhost:5173` (strict). Vite proxies `/api` → `http://localhost:4000`      |

## Commands

```bash
pnpm install            # also installs Husky git hooks (prepare script)
pnpm dev                # vite on :5173. The API must be running on :4000
pnpm test               # vitest run
pnpm typecheck          # tsc (TypeScript 7) for app + node configs
pnpm lint               # eslint .        | pnpm lint:fix to autofix
pnpm format             # prettier --write | pnpm format:check to verify
pnpm check              # lint + format:check + typecheck + test + build
pnpm build && pnpm preview   # preview on :4173, also proxies /api
```

If port 5173 is busy, run `pnpm exec vite --port 5180`. The proxy means no backend change is needed.

## Definition of done

Before you say a task is finished:

1. `pnpm check` passes. The pre-push hook runs the same command, so a failing check blocks the push.
2. Pure logic in `src/lib/` or `src/hooks/` has a co-located `*.test.ts`.
3. UI changes are checked in a real browser against the running API: the page loads, there are no console errors, and the flow works.

## Where things live

```
src/
  main.tsx, App.tsx        providers (QueryClient, Toast) + every route
  api/
    client.ts              api.get/post/put/patch/delete, request(), ApiError, isApiError(). Relative /api URLs, credentials included
    types.ts               shared types copied from docs/PLAN.md. Keep in sync
    queryKeys.ts           qk.* : the ONLY place query keys are defined
    auth.ts teams.ts tasks.ts standups.ts activity.ts   one typed module per resource (e.g. tasksApi.move)
  hooks/
    useAuth.ts             useAuth, useSignIn, useSignUp, useSignOut, useUpdateProfile
    queries.ts             useTeams, useTeam, useTasks, useStandups, useActivity, useSummary
    useTeamEvents.ts       SSE subscription → invalidates queries (keysForEvent maps event → keys)
    useTeamContext.ts      current team + members, provided by TeamLayout
  components/
    ui/                    primitives: Button, Input, Textarea, Select, Card, Modal, ConfirmModal, Avatar, Badge,
                           Spinner, Skeleton, EmptyState, Dropdown, Toast (useToast), icons. Import from 'components/ui'
    layout/                AppShell (PageHeader), AuthLayout, TeamLayout, TeamSwitcher, UserMenu, RouteGuards
    board/                 TaskCard, TaskModal
  pages/                   one file per route (SignIn, SignUp, Teams, Standup, Board, Activity, Summary, Settings, Profile, NotFound)
  lib/
    dates.ts               localToday, weekStart, addDays, toDateKey, timeAgo, format* : local-date helpers
    board.ts               moveTask / replaceTask / removeTask for optimistic board cache updates
    activity.ts            formatActivity: activity item → readable sentence
    format.ts errors.ts queryClient.ts   initials/avatarColor, errorMessage, createQueryClient (401 → signed out)
docs/PLAN.md               product spec + API contract (shared with standup-be)
```

Routes: `/signin`, `/signup`, `/teams`, `/profile`, `/t/:teamId/{standup|board|activity|summary|settings}`. Team pages render inside `TeamLayout`, which loads the team, provides `useTeamContext()` and mounts `useTeamEvents(teamId)`.

## Recipe: add a feature that needs data

1. Confirm the endpoint exists in `docs/PLAN.md`. If not, it has to be built in `standup-be` first.
2. Add or extend the types in `src/api/types.ts`, and add a function to the matching `src/api/<resource>.ts` using `api.*`.
3. Add a query key to `src/api/queryKeys.ts` (`qk.*`), and a `useXxx` hook to `src/hooks/queries.ts` if several components read it.
4. For writes, call `useMutation` and on success `invalidateQueries({ queryKey: qk.xxx(teamId) })`. For drag-style interactions, update the cache optimistically and roll back on error (see `BoardPage.tsx`).
5. If the backend publishes a new live event type, map it in `keysForEvent` in `src/hooks/useTeamEvents.ts` and update its test.
6. Build the UI from `components/ui` primitives, and add the page route in `App.tsx`.
7. Run `pnpm check`, then try it in the browser.

## Rules

**MUST**

- All server data goes through TanStack Query, using keys from `qk`. Never `fetch` directly in components.
- Call the API with relative `/api/...` paths through `src/api/client.ts`, so the session cookie stays same-origin through the proxy.
- Send the user's **local** date (`localToday()`, `weekStart()`) to standup and summary endpoints. Never `new Date().toISOString().slice(0, 10)`.
- Show `ApiError.message` inline in forms, and use `useToast()` for background failures.
- Style with Tailwind utilities, include `dark:` variants, and keep the existing zinc + indigo look. Reuse `components/ui` before creating new primitives.
- Handle loading (Skeleton or Spinner), empty (EmptyState) and error states on every data view.

**NEVER**

- Hard-code `http://localhost:4000` in app code. The proxy handles it.
- Store auth tokens in localStorage. Auth is the httpOnly `sid` cookie only.
- Add CSS files or CSS modules. Global styles live only in `src/index.css`.
- Edit `pnpm-lock.yaml` by hand or commit `dist/` / `.env*`.

## Gotchas

- **TypeScript alias:** `typescript` in `package.json` is aliased to `@typescript/typescript6`, because typescript-eslint needs the TS 6 API. The real compiler is `@typescript/native` (TS 7), which `tsc` runs. Don't "fix" this alias.
- **ESLint exceptions:** `react-refresh/only-export-components` is off for `src/components/ui/**`, because those files export small helpers next to components. One `exhaustive-deps` disable in `StandupPage.tsx` is intentional and commented.
- **Sign-in and sign-out** remove every query except `['me']` and then set it. Clearing the whole cache breaks the route guards.
- **SSE** opens only after the team loads successfully, to avoid reconnect loops on 403/404. After a reconnect it refetches team data.
- A **401** from any query or mutation sets `['me']` to `null`. `ProtectedRoute` then redirects to `/signin` and remembers where the user was going.

## Git

- Work on a branch (currently `agent-playground`). Use conventional commit messages: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `style:`.
- Husky hooks: **pre-commit** runs lint-staged (eslint --fix + prettier on staged files), **pre-push** runs `pnpm check`.
- Personal, uncommitted notes go in `CLAUDE.local.md`, which is gitignored.
