/**
 * Server-side resolver for the mini apps whose users the host admin console can manage.
 *
 * Each manageable app is an independent child Worker with its own D1 database. The host
 * Worker binds to those databases directly (adopted by name in alchemy.run.ts /
 * wrangler.toml) — this only works because every app deploys to the same pinned
 * Cloudflare account (see docs/domain-setup.md §3).
 *
 * The registry itself (`MANAGED_APPS`, the slug ↔ binding ↔ db-name mapping) is the single
 * source of truth in `@starter/shared`, shared with alchemy.run.ts. This module re-exports
 * it and adds `dbForSlug`, which resolves a slug to its bound D1 on the host's `Env`.
 */
import type { Env } from './types'
import { MANAGED_APPS } from '@starter/shared'

export { MANAGED_APPS, type ManagedApp, type ChildBindingKey } from '@starter/shared'

/** Resolve a slug to its child D1 binding, or null if the slug isn't managed/bound. */
export function dbForSlug(env: Env, slug: string): D1Database | null {
  const app = MANAGED_APPS.find((a) => a.slug === slug)
  if (!app) return null
  return env[app.bindingKey] ?? null
}
