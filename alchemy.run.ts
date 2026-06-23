/**
 * Alchemy Configuration for Local First Auth Starter
 *
 * Deploys the starter mini-app to Cloudflare:
 * - D1 Database for user storage
 * - Durable Object for real-time WebSocket broadcasting
 * - Worker for API and static asset serving
 */

import alchemy from 'alchemy'
import { Assets, D1Database, DurableObjectNamespace, Worker } from 'alchemy/cloudflare'
import { CloudflareStateStore } from 'alchemy/state'
import type { Broadcaster } from './server/src/durable-object'

// Initialize Alchemy app with remote state store
const app = await alchemy('mini-app-starter', {
  stateStore: (scope) => new CloudflareStateStore(scope),
})

/**
 * D1 Database
 * Stores user information
 */
const database = await D1Database(`${app.name}-${app.stage}-db`, {
  name: `${app.name}-${app.stage}-db`,
  migrationsDir: './server/src/db/migrations',
  adopt: true,
})

/**
 * Static Assets
 * Client build directory containing the React app
 */
const staticAssets = await Assets({
  path: './client/dist',
})

/**
 * Durable Object Namespace
 * Manages real-time WebSocket connections for broadcasting user updates
 */
const durableObject = DurableObjectNamespace<Broadcaster>(`${app.name}-${app.stage}-durable-object`, {
  className: 'Broadcaster',
  sqlite: true,
})

/**
 * Cloudflare Worker
 * Handles API routes, WebSocket upgrades, and serves static client assets
 */
export const worker = await Worker('worker', {
  name: `${app.name}-${app.stage}`,
  entrypoint: './server/src/index.ts',
  bindings: {
    DB: database,
    DURABLE_OBJECT: durableObject,
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
console.log(`🗄️  D1 Database: ${database.name}`)
console.log(`🔄 Durable Object: ${durableObject.className}`)
console.log(`⚡ Worker: ${worker.name}`)
console.log(`🌐 URL: ${worker.url}`)
