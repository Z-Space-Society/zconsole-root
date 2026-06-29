/**
 * Registry of the managed mini apps the host admin console can manage — the single source
 * of truth shared by alchemy.run.ts (references each child D1 by UUID and binds it) and
 * server/src/admin-apps.ts (resolves a slug to its bound D1). Keep wrangler.toml's dev
 * bindings in sync with the bindingKey values here.
 *
 * The host only REFERENCES these databases by UUID for its Worker binding — it never
 * provisions or migrates them. Each child app owns and migrates its own D1. `databaseId`
 * is the sync point: if a child app ever replaces its DB (new UUID), update it here.
 */
export type ChildBindingKey = 'DB_EVENTS' // re-add 'DB_PARTY_PICS' when party-pics ships

export interface ManagedApp {
  /** URL slug, matches an entry in client/src/apps.ts. */
  slug: string
  /** Key on the host Worker Env for this child app's D1 binding. */
  bindingKey: ChildBindingKey
  /** Cloudflare D1 database name (the child app owns it). */
  dbName: string
  /** Real Cloudflare D1 UUID (prod). The host references this DB by id; the child app owns/migrates it. */
  databaseId: string
}

export const MANAGED_APPS: ManagedApp[] = [
  {
    slug: 'events',
    bindingKey: 'DB_EVENTS',
    dbName: 'zconsole-events-mini-app-prod-db',
    databaseId: '50100a65-0bab-4b73-9185-2103f804a07f',
  },
  // party-pics intentionally omitted — DB not deployed yet. Add it back here (with its real
  // UUID) and restore 'DB_PARTY_PICS' to ChildBindingKey when the party-pics app ships.
]
