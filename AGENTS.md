# TableFlow Restaurant Platform

## Layout

Two independent apps (no monorepo tooling), run both during dev:

- `backend/` — Express.js API (entry: `server.js`, port 5000)
- `frontend/` — Next.js 16 App Router (entry: `src/app/layout.js`, port 3000)

## Commands

| Directory | Command | Action |
|-----------|---------|--------|
| `backend/` | `npm run dev` | Start API on :5000 |
| `backend/` | `npm run seed` | Seed MongoDB with sample data |
| `frontend/` | `npm run dev` | Dev server on :3000 |
| `frontend/` | `npm run build` | Prod build |
| `frontend/` | `npm run lint` | ESLint flat config |

## Auth architecture

Two auth methods coexist:

1. **Clerk OAuth** — Clerk session on frontend, verified by backend via `@clerk/express` `clerkClient.verifyToken()`.
2. **Email/password** — `POST /api/auth/login` returns a JWT signed with `JWT_SECRET`. Users stored in MongoDB with bcrypt-hashed passwords.

**`AuthContext`** (`src/context/AuthContext.js`):
- Clerk users: syncs to MongoDB via `/api/auth/sync`, stores Clerk token on `window.__clerk_token`, refreshes every 50s.
- Local users: stores JWT + user in `localStorage` (`auth_token`, `auth_user`), restores on page load.
- `loading` is derived (`!authLoadDone || (clerkUser && !dbUser)`) — no state management in effects.

**API client** (`src/lib/api.js`): Axios instance → `http://localhost:5000/api`, auto-injects Bearer token from `window.__clerk_token`.

**Backend auth** (`backend/middleware/auth.js`): tries Clerk first (`clerkClient.verifyToken()`), falls back to JWT (`jwt.verify`). Looks up MongoDB `User` by `clerkUserId` (Clerk) or `_id` (JWT). Role gating via `authorize(...roles)`.

**Public routes** (`src/middleware.js`): `/`, `/restaurants(.*)`, `/login`, `/register`, `/api(.*)`, `/admin(.*)`, `/superadmin(.*)`, `/waiter(.*)`.

## Backend structure

`backend/controllers/` — logic extracted from routes (MVC pattern). All 10 route files delegate to corresponding controllers.

## Style & config quirks

- **`@/` imports** → `src/*` (via `jsconfig.json`, no TypeScript).
- **Tailwind CSS v4** via `@tailwindcss/postcss` (not the classic tailwind.config approach).
- **ESLint 9 flat config** (`eslint.config.mjs`) with `eslint-config-next/core-web-vitals`.
- **No tests** anywhere in either project.

## Seed credentials

`npm run seed` in `backend/` populates:

- Super Admin: `admin@tableflow.com` / `admin123`
- Owner 1: `rajesh@spicegarden.com` / `owner123`
- Owner 2: `marco@bellavista.com` / `owner123`
- Customer: `john@example.com` / `customer123`
- Waiter 1 (Spice Garden): `vikram@spicegarden.com` / `waiter123`
- Waiter 2 (Spice Garden): `amit@spicegarden.com` / `waiter123`
- Waiter 3 (Bella Vista): `luigi@bellavista.com` / `waiter123`

## Backend API routes

`http://localhost:5000/api/`:
`auth`, `restaurants`, `menu`, `bookings`, `orders`, `employees`, `attendance`, `leaves`, `shifts`, `admin`, `health`

## Waiter role

Role `waiter` added to `User` model enum. Waiters have `restaurantId` set (same as owners). Frontend pages under `/waiter`:
- `/waiter` — Dashboard with table occupancy stats
- `/waiter/orders/new` — Place order (select table, browse menu, cart)
- `/waiter/orders` — Active orders list with status progression (pending → preparing → ready → served → completed)

Waiters can `GET /api/orders/restaurant/:id` and `PUT /api/orders/:id`.

## Important

- Backend `.env` is **not** gitignored (contains live credentials). Frontend `.env.local` is gitignored.
- No CI, no pre-commit, no formatter config exists.
- Both `package-lock.json` files use lockfileVersion 3.
