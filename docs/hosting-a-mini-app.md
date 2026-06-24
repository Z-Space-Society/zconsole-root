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

## 8. Standard admin API (for the future central-admin route)

A planned host route (`/admin`) will let an operator block/remove users across **every**
mini app by calling each app over HTTP. So each app SHOULD expose a conventional, authed
admin surface:

| Method   | Path                                  | Purpose         |
|----------|---------------------------------------|-----------------|
| `GET`    | `/guestbook/api/admin/users`          | list users      |
| `DELETE` | `/guestbook/api/admin/users/:did`     | remove a user   |
| `POST`   | `/guestbook/api/admin/users/:did/block` | block a user  |

**Authorization — admin DID allowlist (reuses existing auth):** verify the caller's JWT
with `decodeAndVerifyJWT` from `@starter/shared`, then check the issuer DID against an
allowlist configured via an `ADMIN_DIDS` env binding.

```ts
import { decodeAndVerifyJWT } from '@starter/shared'

async function requireAdmin(c) {
  const jwt = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!jwt) return c.json({ error: 'Unauthorized' }, 401)
  const payload = await decodeAndVerifyJWT(jwt)
  const adminDids = (c.env.ADMIN_DIDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  if (!adminDids.includes(payload.iss)) return c.json({ error: 'Forbidden' }, 403)
  return null // authorized
}
```

This keeps each app independently deployable while making the future fan-out admin route a
pure client of these endpoints — no service bindings or shared database required.
