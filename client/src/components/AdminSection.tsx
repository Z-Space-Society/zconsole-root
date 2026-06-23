import { useState } from 'react'

interface AdminSectionProps {
  getProfileJwt: () => Promise<string | undefined>
  onReset: () => void
}

export function AdminSection({ getProfileJwt, onReset }: AdminSectionProps) {
  const [message, setMessage] = useState('Thanks for joining! See you next time.')
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleReset = async () => {
    const profileJwt = await getProfileJwt()
    if (!profileJwt) {
      setError('No profile JWT available')
      return
    }

    setIsResetting(true)
    setError(null)

    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileJwt, message }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset')
      }

      onReset()
    } catch (err) {
      console.error('Error resetting:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset')
    } finally {
      setIsResetting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="mt-12 bg-red-50 border border-red-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-red-100 transition-colors"
      >
        <h3 className="text-lg font-semibold text-red-800">Admin Controls</h3>
        <svg
          className={`w-5 h-5 text-red-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reset Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Message to show all attendees..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 rounded text-red-800 text-sm">
                {error}
              </div>
            )}

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reset
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-700 font-medium">
                  Are you sure? This will remove all non-admin users.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors"
                  >
                    {isResetting ? 'Resetting...' : 'Yes, Reset'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
