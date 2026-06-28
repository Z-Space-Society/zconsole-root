# Hosting a mini app at a subpath

Each mini app is an **independent Cloudflare Worker** (its own repo, its own D1 + Durable
Object) that claims a path on the shared hostname. This host repo serves the landing grid
at `/` and a catch-all for everything else; a child app on `/<slug>` overrides the
catch-all because Cloudflare resolves the **most-specific route first**.

This is the contract a starter-based app must follow to live at `https://<domain>/<slug>`.
(The current single-app starter does **not** follow it out of the box — `base` is unset,
the router `basename` is `/`, and API calls are absolute `/api/...`. Use this as the
conversion checklist.)

Throughout, replace `guestbook` with your app's slug.

## 1. Vite base path

`client/vite.config.ts`:

```ts
export default defineConfig({
  base: '/guestbook/', // rewrites every built asset URL under the subpath
  plugins: [react(), tailwindcss()],
})
```

## 2. React Router basename

`client/src/routes/index.tsx`:

```ts
export const router = createBrowserRouter(
  [/* ...routes... */],
  { basename: import.meta.env.BASE_URL }, // = '/guestbook/' in this build
)
```

Use relative `<Link>`s as usual — the basename is applied automatically.

## 3. Client API + WebSocket calls must be base-relative

The child Worker is reached at `/guestbook/...`, so API calls must include the base.
`import.meta.env.BASE_URL` is `'/guestbook/'` (note the trailing slash):

```ts
// REST
await fetch(`${import.meta.env.BASE_URL}api/users`)        // -> /guestbook/api/users

// WebSocket
const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
const ws = new WebSocket(`${proto}//${location.host}${import.meta.env.BASE_URL}api/ws`)
// -> wss://<domain>/guestbook/api/ws
```

## 4. Server (Hono) must account for the path prefix

The Worker is bound to `/guestbook*`, so it receives the full path including the prefix.
Mount the whole app under the base path so your existing `/api/...` handlers match:

```ts
// receives /guestbook/api/users -> matches app.get('/api/users', ...)
const app = new Hono<{ Bindings: Env }>().basePath('/guestbook')
```

## 5. Alchemy routes (two patterns) + own infrastructure

In the child app's `alchemy.run.ts`, bind **both** the bare path and the subtree, and keep
the SPA fallback. Give the app its **own** D1 and Durable Object (full isolation):

```ts
export const worker = await Worker('worker', {
  name: `${app.name}-${app.stage}`,
  entrypoint: './server/src/index.ts',
  bindings: { DB: database, DURABLE_OBJECT: durableObject, ASSETS: staticAssets },
  assets: { html_handling: 'auto-trailing-slash', not_found_handling: 'single-page-application' },
  routes: [
    'example.com/guestbook',
    'example.com/guestbook/*',
  ],
})
```

The two patterns matter: `/guestbook` (no trailing slash, the entry link) and
`/guestbook/*` (assets + in-app routes).

## 6. Manifest

Give the app a unique `name` in `client/public/local-first-auth-manifest.json`.

## 7. Register with the host

Add an entry to **this repo's** `client/src/apps.ts` and redeploy the host so the app
shows up in the grid:

```ts
{ slug: 'guestbook', name: 'Guestbook', description: '…', path: '/guestbook', icon: '📖', accent: 'from-rose-400 to-orange-300' }
```

## 8. Admin console — host binds each app's D1 directly

The host's Settings → Admin section lets an operator manage users across **every** managed
mini app (grant/revoke admin, block, remove). Rather than each app exposing an HTTP admin
surface, the **host Worker binds each app's D1 database directly** and writes
`users.is_admin` itself. This is simpler to operate (no per-app admin endpoints to build)
at the cost of one hard requirement:

> **All apps must live in the same pinned Cloudflare account** (`CLOUDFLARE_ACCOUNT_ID`,
> see [`docs/domain-setup.md`](./domain-setup.md) §3). D1 bindings are account-scoped, so a
> Worker can only bind databases in its own account.

What this means for a child app:

- **Keep the standard `users` table** with a `did` primary key and an `is_admin` column
  (the starter schema already has this). Grant/revoke/remove/list need no change.
- **Block needs a `blocked` column.** The starter schema does **not** ship one. If you want
  the console's "Block" action to work for your app, add a `blocked` integer column to your
  `users` table; otherwise Block returns an error (the other actions still work).
- **Note your D1 database name.** The host references it by name. After deploying, run
  `pnpm wrangler d1 list` and give the name to whoever maintains the host so they can wire
  it in `alchemy.run.ts`, `wrangler.toml`, and `server/src/admin-apps.ts`.

Authorization lives entirely on the host: it verifies the operator's JWT with
`decodeAndVerifyJWT` and checks the issuer DID against its own `is_admin` allowlist /
`ADMIN_DIDS` (see [`docs/admin-setup.md`](./admin-setup.md)). Child apps don't authorize
these writes — they simply own the schema the host writes to.
