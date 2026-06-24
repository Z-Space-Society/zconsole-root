/**
 * Cloudflare Workers environment bindings for the host (catch-all) Worker.
 *
 * The host needs no D1 or Durable Object — those live in each independent child app.
 * The ASSETS binding is handled by Alchemy's Worker `assets` config and is not
 * referenced directly in code, so this interface is intentionally empty.
 */
export interface Env {}
