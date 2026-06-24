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
import { Assets, Worker } from 'alchemy/cloudflare'
import { CloudflareStateStore } from 'alchemy/state'

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
 * Catch-all host Worker. Deploys to a workers.dev URL; attach the custom-domain
 * route (`<domain>/*`) manually in the Cloudflare dashboard — Workers & Pages →
 * this worker → Settings → Domains & Routes → Add route. See docs/domain-setup.md.
 */
export const worker = await Worker('worker', {
  name: `${app.name}-${app.stage}`,
  entrypoint: './server/src/index.ts',
  bindings: {
    ASSETS: staticAssets,
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
console.log(`⚡ Worker: ${worker.name}`)
console.log(`🌐 URL: ${worker.url}`)
