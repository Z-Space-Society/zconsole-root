import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="w-full max-w-md mx-auto text-center py-12">
      <div className="card p-8">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block btn-primary px-6 py-3"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
