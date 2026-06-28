/**
 * Typed client for the host's admin console API (`/api/admin/*`).
 *
 * Every call mints a FRESH signed JWT from the Local First Auth API and sends it as a
 * Bearer token. `getProfileDetails()` works for both web users (the injected web mock,
 * present once `useOnboarding()` has resolved) and native hosts; the JWT is short-lived
 * (~120s) so we never cache it. Results are returned as a discriminated union so callers
 * can render forbidden / error / empty states instead of catching exceptions.
 */
import type { LocalFirstAuth } from 'local-first-auth'

export interface AdminUser {
  did: string
  name?: string | null
  avatar?: string | null
  socials?: string | null
  isAdmin?: boolean
  createdAt?: number | null
}

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }

/** Mint a fresh signed JWT for the current user (web mock or native host). */
async function getAuthJWT(): Promise<string> {
  const api = (window as unknown as { localFirstAuth?: LocalFirstAuth }).localFirstAuth
  if (!api) throw new Error('No auth context — create a profile first.')
  return api.getProfileDetails()
}

async function call<T>(path: string, init?: RequestInit): Promise<AdminResult<T>> {
  let jwt: string
  try {
    jwt = await getAuthJWT()
  } catch (e) {
    return { ok: false, status: 401, error: (e as Error).message }
  }
  try {
    const res = await fetch(`/api/admin${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${jwt}`, ...(init?.headers ?? {}) },
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
      return { ok: false, status: res.status, error: body.message || body.error || res.statusText }
    }
    // Tolerate empty bodies (e.g. 204 from grant/revoke/remove).
    const data = (res.status === 204 ? undefined : await res.json().catch(() => undefined)) as T
    return { ok: true, data }
  } catch (e) {
    // Network error / app not deployed.
    return { ok: false, status: 0, error: (e as Error).message }
  }
}

const enc = encodeURIComponent

export const adminApi = {
  /** Whether the current user may use the admin console (gates the Settings section). */
  getStatus: () => call<{ isAdmin: boolean }>('/status'),
  listUsers: (slug: string) => call<{ users: AdminUser[] }>(`/apps/${enc(slug)}/users`),
  grantAdmin: (slug: string, did: string) =>
    call<void>(`/apps/${enc(slug)}/users/${enc(did)}/grant-admin`, { method: 'POST' }),
  revokeAdmin: (slug: string, did: string) =>
    call<void>(`/apps/${enc(slug)}/users/${enc(did)}/revoke-admin`, { method: 'POST' }),
  removeUser: (slug: string, did: string) =>
    call<void>(`/apps/${enc(slug)}/users/${enc(did)}`, { method: 'DELETE' }),
  blockUser: (slug: string, did: string) =>
    call<void>(`/apps/${enc(slug)}/users/${enc(did)}/block`, { method: 'POST' }),
}
