/**
 * Persists the current user's own profile into the host's D1 via the public
 * `/api/add-user` + `/api/add-avatar` endpoints (the same contract child mini apps use).
 *
 * The JWTs are minted from the Local First Auth API: `getProfileDetails()` returns the
 * profile (name + socials) as a signed JWT, and `getAvatar()` returns the avatar as a
 * signed JWT or `null`. The server derives the DID from the verified signature, so a
 * caller can only ever upsert their own row.
 */
import type { LocalFirstAuth } from 'local-first-auth'

function getApi(): LocalFirstAuth | undefined {
  return (window as unknown as { localFirstAuth?: LocalFirstAuth }).localFirstAuth
}

async function addUserToDatabase(profileJwt: string): Promise<void> {
  const res = await fetch('/api/add-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileJwt }),
  })
  if (!res.ok) throw new Error('Failed to add user')
}

async function addAvatarToDatabase(avatarJwt: string): Promise<void> {
  const res = await fetch('/api/add-avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatarJwt }),
  })
  if (!res.ok) throw new Error('Failed to add avatar')
}

/**
 * Upsert the current Local First Auth profile into the host DB. Best-effort: errors are
 * logged, never thrown, so they don't block the Settings UI. Avatar is optional.
 */
export async function syncProfileToDatabase(): Promise<void> {
  const api = getApi()
  if (!api) return
  try {
    await addUserToDatabase(await api.getProfileDetails())
    const avatarJwt = await api.getAvatar()
    if (avatarJwt) await addAvatarToDatabase(avatarJwt)
  } catch (err) {
    console.error('Error syncing profile to database:', err)
  }
}
