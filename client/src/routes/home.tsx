import { useLocalFirstAuth } from '../hooks/useLocalFirstAuth'
import { AdminSection } from '../components/AdminSection'
import { Avatar } from '../components/Avatar'

export function Home() {
  const { user, setIsOnboardingModalOpen, getProfileJwt } = useLocalFirstAuth()

  return (
    <div className="w-full max-w-md mx-auto">
      {/* User Card */}
      {user && (
        <div className="card p-6 text-center mb-6">
          <Avatar avatar={user.avatar} name={user.name} />
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-500 text-sm mt-1 truncate">{user.did}</p>
        </div>
      )}

      {/* "Add yourself" button - only show on mobile */}
      <button
        onClick={() => setIsOnboardingModalOpen(true)}
        className="w-full btn-primary px-8 py-4 text-lg z-40 md:hidden"
      >
        Add yourself
      </button>

      {/* Admin Section - only show if user is admin */}
      {user?.isAdmin && (
        <AdminSection
          getProfileJwt={getProfileJwt}
          onReset={() => {}}
        />
      )}
    </div>
  )
}

