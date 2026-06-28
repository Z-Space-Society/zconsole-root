import { useEffect, useState } from 'react'
import {
  Onboarding,
  EditProfile,
  useOnboarding,
  getCurrentProfile,
  clearProfile,
  getFullURL,
  getPlatformDisplayName,
  type Profile,
  type SocialLink,
} from 'local-first-auth/react'
import { decodeJWT, type LocalFirstAuth } from 'local-first-auth'
import { Link } from 'react-router-dom'
import { AdminSection } from '../components/admin/AdminSection'
import { syncProfileToDatabase } from '../lib/userApi'

/**
 * True only when running inside a real native Local First Auth host (e.g. Antler),
 * where the profile is host-owned and read-only.
 *
 * We can't use `isLocalFirstAuth()` (mere `window.localFirstAuth` presence): the
 * library injects a *web* mock onto `window` as a side effect of `createProfile()`
 * / `EditProfile`, so a browser user who has made a profile would otherwise be
 * misdetected as native and locked out of editing. The web mock reports
 * `getAppDetails().platform === 'browser'`; real hosts report `'ios'` / `'android'`.
 */
function isNativeHost(): boolean {
  const api = (window as unknown as { localFirstAuth?: LocalFirstAuth }).localFirstAuth
  if (!api) return false
  try {
    return api.getAppDetails().platform !== 'browser'
  } catch {
    return false
  }
}

/** Page chrome shared by every state of the Settings screen. */
function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <span aria-hidden="true">←</span> Back
      </Link>
      <header className="text-center mb-8 sm:mb-10 mt-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">Settings</h1>
      </header>
      {children}
    </div>
  )
}

export function Settings() {
  const { isLoading } = useOnboarding()

  if (isLoading) {
    return (
      <SettingsLayout>
        <div className="card p-10 text-center text-gray-500">Loading…</div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout>
      <ProfileSection />
      {/* Self-gating: renders nothing unless the current user is a host admin. */}
      <AdminSection />
    </SettingsLayout>
  )
}

/** The user's own profile — full create/edit/logout on web, read-only in a native host. */
function ProfileSection() {
  // Inside a native Local First Auth app the profile is owned by the host — it can
  // be read but not created, edited, or cleared from here.
  return isNativeHost() ? <NativeProfileView /> : <WebProfileSettings />
}

/* ---------------------------------------------------------------------------
 * Web (browser) — full create / edit / logout against a localStorage profile.
 * ------------------------------------------------------------------------- */

type Mode = 'view' | 'edit' | 'create'

function WebProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(() => getCurrentProfile())
  const [mode, setMode] = useState<Mode>('view')
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  function handleLogout() {
    clearProfile()
    setProfile(null)
    setMode('view')
    setConfirmingLogout(false)
  }

  if (mode === 'create') {
    return (
      <div className="card p-6 sm:p-8">
        <Onboarding
          skipSocialStep={true}
          onComplete={(p) => {
            setProfile(p)
            setMode('view')
            void syncProfileToDatabase() // best-effort upsert into the host DB
          }}
        />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-600">You don't have a profile yet.</p>
        <button onClick={() => setMode('create')} className="btn-primary mt-5 px-6 py-2.5">
          Create your profile
        </button>
      </div>
    )
  }

  if (mode === 'edit') {
    return (
      <div className="card p-6 sm:p-8">
        <EditProfile
          onComplete={(p) => {
            setProfile(p) // same did — EditProfile runs CreateAccountFlow in 'edit' mode
            setMode('view')
            void syncProfileToDatabase() // best-effort upsert into the host DB
          }}
          onBack={() => setMode('view')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-gray-900">Your Profile</h2>
        <ProfileCard
          name={profile.name}
          socials={profile.socials}
          avatar={profile.avatar}
          action={
            <button
              onClick={() => setMode('edit')}
              className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 transition-colors hover:bg-gray-50 sm:px-8"
            >
              <span>Edit profile</span>
              <span aria-hidden="true" className="text-xl text-gray-400">
                →
              </span>
            </button>
          }
        />
      </section>

      {confirmingLogout ? (
        <div className="space-y-3 border-t border-gray-200 pt-6">
          <p className="text-gray-700">Are you sure you want to log out?</p>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="rounded-full px-6 py-2.5 font-semibold text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
            <button
              onClick={() => setConfirmingLogout(false)}
              className="rounded-full px-6 py-2.5 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => setConfirmingLogout(true)}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Native app — read-only view of the host-provided profile.
 * ------------------------------------------------------------------------- */

function NativeProfileView() {
  const [profile, setProfile] = useState<{ name: string; socials?: SocialLink[] } | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const api = (window as unknown as { localFirstAuth?: LocalFirstAuth }).localFirstAuth
    if (!api) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const jwt = await api.getProfileDetails()
        const data = decodeJWT(jwt).payload.data as { name: string; socials?: SocialLink[] }
        if (!cancelled) setProfile(data)
        try {
          const a = await api.getAvatar()
          // Only render values the browser can display directly (a data/URL string).
          if (!cancelled && a && /^(data:|https?:)/.test(a)) setAvatar(a)
        } catch {
          /* avatar is optional */
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <div className="card p-10 text-center text-gray-500">Loading…</div>
  }

  function handleDone() {
    const api = (window as unknown as { localFirstAuth?: LocalFirstAuth }).localFirstAuth
    api?.close() // returns to the QR scanner in a real host; no-op in the web mock
  }

  return (
    <div className="space-y-4">
      <ProfileCard name={profile?.name ?? 'Unknown'} socials={profile?.socials} avatar={avatar} />
      <p className="text-center text-sm text-gray-500">
        Your profile lives in the Local First Auth app. To change your name, avatar, or links,
        edit it there.
      </p>
      <div className="flex justify-center">
        <button onClick={handleDone} className="btn-primary px-6 py-2.5">
          Done
        </button>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Shared read-only profile card.
 * ------------------------------------------------------------------------- */

function ProfileCard({
  name,
  socials,
  avatar,
  action,
}: {
  name: string
  socials?: SocialLink[]
  avatar?: string | null
  /** Optional full-width action row rendered below the identity, inside the card. */
  action?: React.ReactNode
}) {
  return (
    <div className="card overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-16 w-16 rounded-full object-cover ring-1 ring-gray-200"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-400">
              {name.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-gray-900">{name}</h2>
        </div>

        {socials && socials.length > 0 && (
          <ul className="mt-5 space-y-2">
            {socials.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">
                  {getPlatformDisplayName(s.platform)}
                </span>
                <a
                  href={getFullURL(s.platform, s.handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-hover underline"
                >
                  {s.handle}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {action && <div className="border-t border-gray-200">{action}</div>}
    </div>
  )
}
