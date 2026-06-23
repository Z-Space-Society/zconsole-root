# Mini App Starter

## Overview

This repo is a starter template to help you easily build and self-host your own mini apps for your in-person events, social clubs, game nights, etc.

### Key Benefits
- **Signup/Login built-in** - You don't have to write any auth code. 
- **Simple full-stack app ready to go** - REST API, SQLite database, and real-time updates via WebSocket, are already set up, so you can focus on building your app.
- **Examples** - We provide examples of mini apps that you can use as a reference, so you don't have to start from scratch. See [`docs/mini-app-examples.md`](./docs/mini-app-examples.md).
- **Free Hosting** - Easily deploy to Cloudflare. We use Cloudflare because their free tier is more than enough for multiple mini apps.

## Getting Started

### 1. Get a visual mockup of the app you want to build.

For example, open up [claude.ai](https://claude.ai) and use the **frontend-design skill** to create a visual mockup of the app you want to build.

Here is an example prompt for creating a scavenger hunt mini app for my coworking space:
```
Use the frontend design skill, I want to create a scavenger hunt mini app. This is for my coworking space, all 16 members will be given a QR code and asked to hide it somewhere in the space. We should show a leaderboard that displays everyone that has found a QR code. Our goal with the app is to have people at the coworking space have fun by looking around to find the hidden QR codes. 

Focus on the UI/visual design, not the app logic. Focus on mobile-first design. Use placeholder data, mock profiles and avatars and mock states if needed. Skip signup/auth screens entirely. Skip QR scanning screens, we are going to use native camera app. 

Before designing, ask me questions to clarify what I want to build.
```

### 2. Create your own copy of this repo and install dependencies.

Click the "Use this template" button -> "Create a new repository" to create a new repo for your app.

Then follow these steps below to download the repo locally and install dependencies.

```bash
git clone https://github.com/your-username/your-app-name.git your-app-name
cd your-app-name
pnpm install  # Install dependencies
pnpm setup-project  # setup your app name inside wrangler.toml, alchemy.run.ts (See docs/project-setup.md)
```

This project uses pnpm as the package manager, if you don't have it installed, you can install it with `brew install pnpm`.

### 3. Create a technical implementation of your app based on the mockup.

Open up Claude Code or a similar tool to create a technical implementation. Here is an example prompt for creating a technical implementation of the scavenger hunt mini app:
```
Create a technical implementation of the app based on this mockup: [[Attach mockup]]

Here are some key points to consider: [[Taken from conversation that created the mockup above]].

**Core Mechanics:**
- Each member hides their own QR code somewhere in the space
- Members scan codes with native camera app
- Finding your own code doesn't count toward your score (max 15 points)

**Design Direction:**
- Playful + minimal aesthetic

**Screens Built:**
- Home/Leaderboard — Main focus is the ranked leaderboard; personal progress card at top
- User Detail — Tap any user to see which of the 16 QR codes they've found or not found (organized by who hid it)

**Excluded:**
- No time limit
- No prizes
- No activity feed
- No easter eggs/achievements

The mockup may mock profiles and avatars, for our implementation, we are using the 'local-first-auth' library to handle signup and authentication, so users will have a profile and avatar after they complete the onboarding flow.

Look up examples of other mini apps inside `docs/mini-app-examples.md` to see if you can learn anything from them, bring them into your implementation.

Lastly, I need some admin features to set up scavenger hunt.

Ask me questions if you need to clarify anything.
```

### 4. Run database migrations.
```bash
pnpm db:run-migrations    # Initialize / run migrations on local D1 database
```

### 5. Test your app locally.
```bash
pnpm dev                  # Start development server
pnpm dev:simulator        # or start development server with a test user account
```

### 6. Deploy your app to Cloudflare.

We use the Alchemy to easily deploy to Cloudflare. If you don't have it installed, you can install it with `brew install alchemy`.

Configure a Cloudflare API token to use with Alchemy (see [Alchemy CLI Documentation](https://alchemy.run/docs/cli/configuration)):
```bash
pnpm alchemy configure
```

Copy `.env.example` to `.env` and update `ALCHEMY_STATE_TOKEN`. This is used to store the state of the deployment in a remote state store.

To deploy the app:
```bash
pnpm run deploy:cloudflare
```

Yay! You've deployed your app. If you ran into any issues or have any feedback, create an issue in this repo so we understand what we can improve. Thanks!

## Project Structure

This is a monorepo with three packages:
- `client/` - React frontend
- `server/` - Cloudflare Workers, D1 (SQLite), Durable Objects
- `shared/` - Shared utilities (JWT verification)

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guide for Claude Code
- [Local First Auth Specification](./docs/local-first-auth-spec.md) - Local First Auth Specification used for authentication
- [Mini App Examples](./docs/mini-app-examples.md) - Examples of mini apps that you can use as a reference