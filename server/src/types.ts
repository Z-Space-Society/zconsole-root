/**
 * Cloudflare Workers environment bindings for the host (catch-all) Worker.
 *
 * The host serves the landing-grid SPA, and now also acts as an admin console: it has
 * its OWN D1 (operator allowlist, used to gate the console) plus direct bindings to each
 * managed child app's D1 (where it flips `users.is_admin`). The child databases are
 * referenced by UUID in alchemy.run.ts / wrangler.toml (the child apps own them) and live
 * in the same Cloudflare account. The ASSETS binding is handled by Alchemy's Worker `assets` config.
 */
import type { ChildBindingKey } from '@starter/shared'

/**
 * Managed child app D1s are referenced by UUID and keyed by `ChildBindingKey` from
 * `@starter/shared` (the single source of truth for the registry), so the binding keys
 * here can't drift from server/src/admin-apps.ts or alchemy.run.ts.
 */
export type Env = {
  /** Host's own D1 — stores the operator allowlist (`users.is_admin`) that gates the console. */
  DB: D1Database
} & Record<ChildBindingKey, D1Database>
