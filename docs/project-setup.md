# Project Setup

This guide explains how to rename and configure the mini-app-starter template at the start of your project.

## Quick Start

Run the setup script with your app name in kebab-case:

```bash
pnpm setup-project [app-name]
```

## What the Script Does

The setup script (`scripts/setup.ts`) updates the following files:

### 1. `wrangler.toml`
- `name` → `{app-name}-dev`
- `database_name` → `{app-name}-dev-db`
- `script_name` → `{app-name}-dev`

### 2. `alchemy.run.ts`
- Changes `alchemy('mini-app-starter', {` to `alchemy('{app-name}', {`

### 3. `client/public/local-first-auth-manifest.json`
- `name` → Title-cased version of app name (e.g., `shopping-list` → `Shopping List`)
- `description` → `A {Title Name} mini app`
