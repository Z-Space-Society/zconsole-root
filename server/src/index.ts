/**
 * Catch-all host Worker.
 *
 * This repo is the HOST for many independent mini apps served on one hostname via
 * Cloudflare path-based routing. This Worker is bound to the zone root (`<domain>/*`)
 * and serves the landing-grid SPA plus an SPA fallback for any path not claimed by a
 * more-specific child app Worker.
 *
 * Static asset serving + SPA fallback are handled by the Worker's `assets` binding
 * (configured in alchemy.run.ts), so this script only needs a tiny API surface.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('/*', cors({ origin: '*' }))

/**
 * GET /api - health check
 */
app.get('/api', (c) => c.text('😁'))

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },
}
