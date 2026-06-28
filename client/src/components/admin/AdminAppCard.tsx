/**
 * One managed mini app's user list with admin actions. Each card owns its own
 * loading / error / empty / loaded state so one app failing (not deployed, missing
 * endpoint, 403) never breaks the others.
 */
import { useCallback, useEffect, useState } from 'react'
import type { MiniApp } from '../../apps'
import { adminApi, type AdminResult, type AdminUser } from '../../lib/adminApi'

type Status = 'loading' | 'error' | 'empty' | 'loaded'

function fmtError(r: { status: number; error: string }): string {
  return `${r.status || ''} ${r.error}`.trim()
}

/** Shorten a DID for display: did:key:z6Mk…AbCd */
function shortDid(did: string): string {
  if (did.length <= 24) return did
  return `${did.slice(0, 16)}…${did.slice(-6)}`
}

export function AdminAppCard({ app }: { app: MiniApp }) {
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [busy, setBusy] = useState<string | null>(null) // did currently mutating, or '__add__'
  const [newDid, setNewDid] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    const r = await adminApi.listUsers(app.slug)
    if (r.ok) {
      const list = r.data?.users ?? []
      setUsers(list)
      setStatus(list.length ? 'loaded' : 'empty')
    } else {
      setError(fmtError(r))
      setStatus('error')
    }
  }, [app.slug])

  useEffect(() => {
    load()
  }, [load])

  // Run a mutation, surface any error, then refetch so the list reflects reality.
  async function act(key: string, action: () => Promise<AdminResult<unknown>>) {
    setBusy(key)
    setError('')
    const r = await action()
    setBusy(null)
    if (!r.ok) setError(fmtError(r))
    await load()
  }

  async function addByDid(e: React.FormEvent) {
    e.preventDefault()
    const did = newDid.trim()
    if (!did) return
    await act('__add__', () => adminApi.grantAdmin(app.slug, did))
    setNewDid('')
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {app.icon}
        </span>
        <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
        <button
          onClick={load}
          className="ml-auto text-sm text-gray-400 hover:text-gray-700"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {status === 'loading' && <p className="mt-4 text-sm text-gray-500">Loading…</p>}

      {status === 'error' && (
        <p className="mt-4 text-sm text-gray-500">
          Admin API unavailable for {app.name}.{' '}
          <button onClick={load} className="text-primary hover:text-primary-hover underline">
            Retry
          </button>
        </p>
      )}

      {(status === 'loaded' || status === 'empty') && (
        <>
          {status === 'empty' ? (
            <p className="mt-4 text-sm text-gray-500">No users yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {users.map((u) => (
                <li key={u.did} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {u.name || 'Unnamed'}
                      {u.isAdmin && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          admin
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-xs text-gray-400" title={u.did}>
                      {shortDid(u.did)}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 gap-2">
                    {u.isAdmin ? (
                      <button
                        disabled={busy === u.did}
                        onClick={() => act(u.did, () => adminApi.revokeAdmin(app.slug, u.did))}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Revoke admin
                      </button>
                    ) : (
                      <button
                        disabled={busy === u.did}
                        onClick={() => act(u.did, () => adminApi.grantAdmin(app.slug, u.did))}
                        className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        Make admin
                      </button>
                    )}
                    <button
                      disabled={busy === u.did}
                      onClick={() => act(u.did, () => adminApi.blockUser(app.slug, u.did))}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Block
                    </button>
                    <button
                      disabled={busy === u.did}
                      onClick={() => act(u.did, () => adminApi.removeUser(app.slug, u.did))}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addByDid} className="mt-4 flex gap-2">
            <input
              value={newDid}
              onChange={(e) => setNewDid(e.target.value)}
              placeholder="did:key:z… — make admin by DID"
              className="min-w-0 flex-1 rounded-full border border-gray-200 px-4 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy === '__add__' || !newDid.trim()}
              className="btn-primary shrink-0 px-4 py-1.5 text-sm disabled:opacity-50"
            >
              Add admin
            </button>
          </form>
        </>
      )}
    </div>
  )
}
