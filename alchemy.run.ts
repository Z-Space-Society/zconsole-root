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
 * Managed child app D1s, REFERENCED by UUID (NOT created, adopted, or migrated here — each
 * child app owns and migrates its own schema). The host only needs the database id to bind it
 * and write `users.is_admin` directly. Because this is a plain reference object (not a managed
 * `D1Database()` resource), the host can never create/replace/delete the child's database — it
 * just points at the existing one. This requires every app to live in the same pinned
 * Cloudflare account (see docs/domain-setup.md §3).
 *
 * One Worker binding per `MANAGED_APPS` entry — the registry in `@starter/shared` is the single
 * source of truth (including each DB's `databaseId`), shared with server/src/admin-apps.ts.
 * Keep wrangler.toml's dev bindings in sync with it.
 */
const managedDbBindings = Object.fromEntries(
  MANAGED_APPS.map((managedApp) => [
    managedApp.bindingKey,
    {
      type: 'd1',
      id: managedApp.databaseId,
      name: managedApp.dbName,
      dev: { id: managedApp.databaseId, remote: false },
    } satisfies D1Database,
  ]),
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
