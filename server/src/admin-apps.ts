/**
 * Registry of the mini apps whose users the host admin console can manage.
 *
 * Each manageable app is an independent child Worker with its own D1 database. The host
 * Worker binds to those databases directly (adopted by name in alchemy.run.ts /
 * wrangler.toml) — this only works because every app deploys to the same pinned
 * Cloudflare account (see docs/domain-setup.md §3). This map ties a URL slug (matching
 * client/src/apps.ts) to the host's binding key for that child's D1.
 *
 * NOTE: `dbName` values are PLACEHOLDERS. Replace `<stage>` and the prefixes with the
 * real database names from `pnpm wrangler d1 list`, then mirror them in alchemy.run.ts
 * and wrangler.toml. The host never migrates these — the child apps own their schema.
 */
import type { Env } from './types'

type ChildBindingKey = 'DB_EVENTS' | 'DB_LIBRARY'

export interface ManagedApp {
  /** URL slug, matches an entry in client/src/apps.ts. */
  slug: string
  /** Key on Env for this child app's D1 binding. */
  bindingKey: ChildBindingKey
  /** Cloudflare D1 database name (for docs/wrangler) — PLACEHOLDER, see note above. */
  dbName: string
}

export const MANAGED_APPS: ManagedApp[] = [
  { slug: 'events', bindingKey: 'DB_EVENTS', dbName: 'events-<stage>-db' },
  { slug: 'library', bindingKey: 'DB_LIBRARY', dbName: 'library-<stage>-db' },
]

/** Resolve a slug to its child D1 binding, or null if the slug isn't managed/bound. */
export function dbForSlug(env: Env, slug: string): D1Database | null {
  const app = MANAGED_APPS.find((a) => a.slug === slug)
  if (!app) return null
  return env[app.bindingKey] ?? null
}
