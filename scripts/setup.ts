/**
 * Project Setup Script
 *
 * Renames the mini-app-starter template to your app name.
 * Updates wrangler.toml, alchemy.run.ts, and local-first-auth-manifest.json.
 *
 * Usage:
 *   tsx scripts/setup.ts my-app        # Use provided name
 *   tsx scripts/setup.ts               # Use current directory name
 */

import { readFileSync, writeFileSync } from 'fs'
import { basename, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

const appName = process.argv[2] || basename(process.cwd())

// Validate kebab-case
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(appName)) {
  console.error(`❌ Invalid app name: "${appName}"`)
  console.error('   Must be kebab-case (e.g., shopping-list, my-app)')
  process.exit(1)
}

function toTitleCase(kebab: string): string {
  return kebab
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function updateFile(relativePath: string, replacements: [string, string][]): boolean {
  const filePath = join(rootDir, relativePath)
  let content = readFileSync(filePath, 'utf-8')
  const original = content

  for (const [search, replace] of replacements) {
    content = content.replace(search, replace)
  }

  if (content !== original) {
    writeFileSync(filePath, content)
    return true
  }
  return false
}

console.log(`\n🔧 Setting up project as "${appName}"...\n`)

// 1. Update wrangler.toml
const wranglerUpdated = updateFile('wrangler.toml', [
  ['name = "mini-app-starter-dev"', `name = "${appName}-dev"`],
  ['database_name = "mini-app-starter-dev-db"', `database_name = "${appName}-dev-db"`],
  ['script_name = "mini-app-starter-dev"', `script_name = "${appName}-dev"`],
])
console.log(wranglerUpdated ? `✅ wrangler.toml updated` : `⏭️  wrangler.toml (no changes needed)`)

// 2. Update alchemy.run.ts
const alchemyUpdated = updateFile('alchemy.run.ts', [
  [`alchemy('mini-app-starter',`, `alchemy('${appName}',`],
])
console.log(alchemyUpdated ? `✅ alchemy.run.ts updated` : `⏭️  alchemy.run.ts (no changes needed)`)

// 3. Update local-first-auth-manifest.json
const titleName = toTitleCase(appName)
const manifestPath = join(rootDir, 'client/public/local-first-auth-manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
const manifestChanged = manifest.name !== titleName || manifest.description !== `A ${titleName} mini app`
manifest.name = titleName
manifest.description = `A ${titleName} mini app`
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(manifestChanged ? `✅ local-first-auth-manifest.json updated` : `⏭️  local-first-auth-manifest.json (no changes needed)`)

console.log(`\n🎉 Setup complete! Your app is now "${appName}".`)