# ZConsole — Mini App Host

## Overview

This repo is the **host** for a collection of ZSpace mini apps. It's a single catch-all
Cloudflare Worker that:

- serves a **landing grid** of mini apps at `/` (driven by `client/src/apps.ts`),
- provides an **SPA fallback** for any path not claimed by a child app, and
- exposes an authed **admin console** (Settings → Admin) for managing users across every
  mini app.

Each mini app is an **independent mini app in its own repo**, bound to
`<domain>/<slug>` (and `<domain>/<slug>/*`). Cloudflare resolves the **most-specific route
first**, so a child app automatically overrides this host's catch-all for its own paths.

## How it works

**Landing grid.** The cards shown at `/` come from `client/src/apps.ts` (the `apps` array).
Each entry links to `/<slug>/` as a real cross-document navigation, so the request lands on
that child app's Worker. Host-served routes (like Settings) are marked `internal` and use
client-side routing instead.

**Child apps.** Mini apps live in separate repos and deploy as their own Workers, each with
its own D1 database and (if needed) Durable Object. They bind two route patterns —
`<domain>/<slug>` and `<domain>/<slug>/*` — which win over the host's `<domain>/*` catch-all.
Path-based routes only work on a **Cloudflare zone** (a custom domain), not `*.workers.dev`.
See [`docs/domain-setup.md`](./docs/domain-setup.md) and
[`docs/hosting-a-mini-app.md`](./docs/hosting-a-mini-app.md).

**Admin console.** The host has its **own** D1 database whose `users.is_admin` column is the
operator allowlist that gates the console. To manage users in a mini app, the host Worker
**binds that app's D1 directly** and flips `users.is_admin` itself — so child apps don't need
to build their own admin endpoints. This requires every app to live in the same pinned
Cloudflare account. The managed-app registry is `shared/src/apps.ts` (`MANAGED_APPS`),
resolved to bound databases by `server/src/admin-apps.ts`. See
[`docs/admin-setup.md`](./docs/admin-setup.md).

## Project Structure

This is a pnpm workspace monorepo with three packages:

| Package | Description |
|---------|-------------|
| `client/` | React landing grid + Settings/admin UI |
| `server/` | Hono host Worker (SPA fallback + `/api/admin/*`) and the host's own D1 |
| `shared/` | JWT verification utilities + the `MANAGED_APPS` registry |

## Getting Started (local dev)

This project uses pnpm. If you don't have it: `brew install pnpm`.

```bash
pnpm install            # Install all workspace dependencies
pnpm db:run-migrations  # Initialize / migrate the local host D1 database
pnpm dev                # Start the host (worker + client)
pnpm dev:simulator      # ...or start with a Local First Auth test user
```

## Adding a mini app to the grid

1. **Deploy the child app Worker** with routes for its slug, following the contract in
   [`docs/hosting-a-mini-app.md`](./docs/hosting-a-mini-app.md) (Vite base path, router
   basename, base-relative API calls, two Alchemy route patterns).
2. **Add an entry to `client/src/apps.ts`** so it shows up in the landing grid.
3. **(Optional) Register it as managed** — if operators should manage its users from the
   admin console, add it to `MANAGED_APPS` in `shared/src/apps.ts` (and the matching dev
   binding in `wrangler.toml`). See [`docs/admin-setup.md`](./docs/admin-setup.md).
4. **Redeploy the host.**

## Deployment

The host deploys to Cloudflare with [Alchemy](https://alchemy.run) (config in
`alchemy.run.ts`). Configure a Cloudflare API token (see the
[Alchemy CLI docs](https://alchemy.run/docs/cli/configuration)):

```bash
pnpm alchemy configure
pnpm run deploy:cloudflare   # build + alchemy deploy
```

A custom domain / Cloudflare zone is a prerequisite for path-based routing — set that up
first per [`docs/domain-setup.md`](./docs/domain-setup.md), then attach the host's
`<domain>/*` route.

## Documentation

- [CLAUDE.md](./CLAUDE.md) — development guide for Claude Code
- [docs/domain-setup.md](./docs/domain-setup.md) — Cloudflare zone + proxied DNS + routes (prerequisite)
- [docs/hosting-a-mini-app.md](./docs/hosting-a-mini-app.md) — child-app subpath contract + admin console binding
- [docs/admin-setup.md](./docs/admin-setup.md) — host operators vs per-app admins
- [docs/project-setup.md](./docs/project-setup.md) — the `pnpm setup-project` script
- [docs/local-first-auth-spec.md](./docs/local-first-auth-spec.md) — Local First Auth specification
- [docs/mini-app-examples.md](./docs/mini-app-examples.md) — reference mini app implementations
- [docs/port-troubleshooting.md](./docs/port-troubleshooting.md) — freeing port 8787
