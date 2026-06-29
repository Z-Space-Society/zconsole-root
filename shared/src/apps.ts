/**
 * Registry of the managed mini apps the host admin console can manage — the single source
 * of truth shared by alchemy.run.ts (creates/adopts each child D1 and binds it) and
 * server/src/admin-apps.ts (resolves a slug to its bound D1). Keep wrangler.toml's dev
 * bindings in sync with the bindingKey values here.
 */
export type ChildBindingKey = 'DB_EVENTS' | 'DB_PARTY_PICS'

export interface ManagedApp {
  /** URL slug, matches an entry in client/src/apps.ts. */
  slug: string
  /** Key on the host Worker Env for this child app's D1 binding. */
  bindingKey: ChildBindingKey
  /** Cloudflare D1 database name, adopted by alchemy.run.ts. */
  dbName: string
}

export const MANAGED_APPS: ManagedApp[] = [
  { slug: 'events', bindingKey: 'DB_EVENTS', dbName: 'zconsole-events-mini-app-prod-db' },
  { slug: 'party-pics', bindingKey: 'DB_PARTY_PICS', dbName: 'party-pics-mini-app-prod-db' },
]
