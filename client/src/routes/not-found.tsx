import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="w-full max-w-lg px-4 py-12 sm:py-16 mx-auto text-center">
      <div className="card p-8">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Page Not Found</h1>
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
