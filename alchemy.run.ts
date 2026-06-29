/**
 * Alchemy configuration for the multi-app HOST.
 *
 * This repo is the catch-all Worker: it serves the landing-grid SPA and an SPA
 * fallback for any path not claimed by a more-specific child app Worker. Child
 * mini apps live in their own repos, are deployed independently, and bind their
 * own route patterns (`<domain>/<slug>` + `<domain>/<slug>/*`). Cloudflare resolves
 * the most-specific route first, so child apps automatically override this catch-all.
 *
 * Path-based routes only work on a Cloudflare zone (a custom domain), NOT on
 * *.workers.dev. This script always deploys to a workers.dev URL via `url: true`; the
 * custom-domain route is attached manually in the Cloudflare dashboard once the zone +
 * a proxied DNS record exist (see docs/domain-setup.md).
 */

import alchemy from 'alchemy'
import { Assets, D1Database, Worker } from 'alchemy/cloudflare'
import { CloudflareStateStore } from 'alchemy/state'
import { MANAGED_APPS } from '@starter/shared'

// Initialize Alchemy app with remote state store
const app = await alchemy('zconsole', {
  stateStore: (scope) => new CloudflareStateStore(scope),
})

/**
 * Static Assets — the built landing-grid client.
 */
const staticAssets = await Assets({
  path: './client/dist',
})

/**
 * Host's own D1 — stores the operator allowlist (`users.is_admin`) that gates the admin
 * console. The host owns this schema, so it applies its own migrations.
 */
const database = await D1Database(`${app.name}-${app.stage}-db`, {
  name: `${app.name}-${app.stage}-db`,
  migrationsDir: './server/src/db/migrations',
  adopt: true,
})

/**
 * Managed child app D1s, adopted by name (NOT created or migrated here — each child app
 * owns its schema). The host writes `users.is_admin` directly. This requires every app to
 * live in the same pinned Cloudflare account (see docs/domain-setup.md §3).
 *
 * One adopted-by-name database + Worker binding per `MANAGED_APPS` entry — the registry in
 * `@starter/shared` is the single source of truth, shared with server/src/admin-apps.ts.
 * Keep wrangler.toml's dev bindings in sync with it.
 */
const managedDbBindings = Object.fromEntries(
  await Promise.all(
    MANAGED_APPS.map(async (managedApp) => [
      managedApp.bindingKey,
      await D1Database(managedApp.dbName, {
        name: managedApp.dbName,
        adopt: true,
      }),
    ]),
  ),
)

/**
 * Catch-all host Worker. Deploys to a workers.dev URL; attach the custom-domain
 * route (`<domain>/*`) manually in the Cloudflare dashboard — Workers & Pages →
 * this worker → Settings → Domains & Routes → Add route. See docs/domain-setup.md.
 */
export const worker = await Worker('worker', {
  name: `${app.name}-${app.stage}`,
  entrypoint: './server/src/index.ts',
  bindings: {
    ASSETS: staticAssets,
    DB: database,
    ...managedDbBindings,
  },
  assets: {
    html_handling: 'auto-trailing-slash',
    not_found_handling: 'single-page-application',
  },
  url: true,
})

// Finalize deployment
await app.finalize()

console.log('✅ Alchemy deployment complete')
console.log(`📦 App: ${app.name}`)
console.log(`🌍 Stage: ${app.stage}`)
console.log(`🗄️  Host D1: ${database.name}`)
console.log(`⚡ Worker: ${worker.name}`)
console.log(`🌐 URL: ${worker.url}`)
