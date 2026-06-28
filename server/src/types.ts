/**
 * Cloudflare Workers environment bindings for the host (catch-all) Worker.
 *
 * The host serves the landing-grid SPA, and now also acts as an admin console: it has
 * its OWN D1 (operator allowlist, used to gate the console) plus direct bindings to each
 * managed child app's D1 (where it flips `users.is_admin`). The child databases are
 * adopted by name in alchemy.run.ts / wrangler.toml and live in the same Cloudflare
 * account. The ASSETS binding is handled by Alchemy's Worker `assets` config.
 */
export interface Env {
  /** Host's own D1 — stores the operator allowlist (`users.is_admin`) that gates the console. */
  DB: D1Database
  /** Managed child app D1s, adopted by name. Keys must match server/src/admin-apps.ts. */
  DB_EVENTS: D1Database
  DB_LIBRARY: D1Database
  /** Comma-separated DID allowlist for bootstrapping the first host admin(s). */
  ADMIN_DIDS?: string
}
