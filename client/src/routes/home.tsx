import { Link } from 'react-router-dom'
import { apps, type MiniApp } from '../apps'

/** Card classes shared by external (cross-document) and internal (host route) links. */
const cardClasses =
  'card group block h-full p-6 transition-all hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'

export function Home() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <header className="text-center mb-10 sm:mb-14">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
          Welcome to ZSpace
        </h1>
      </header>

      {apps.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          No apps yet. Add one in <code className="font-mono">client/src/apps.ts</code>.
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map((app) => (
            <li key={app.slug}>
              {/* Internal cards (e.g. Settings) are host routes → client-side Link.
                  External cards are separate Workers/documents → real anchor so the
                  browser does a full navigation. */}
              {app.internal ? (
                <Link to={app.path} className={cardClasses}>
                  <CardBody app={app} />
                </Link>
              ) : (
                <a href={app.path} className={cardClasses}>
                  <CardBody app={app} />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Shared inner markup for both internal and external app cards. */
function CardBody({ app }: { app: MiniApp }) {
  return (
    <>
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${app.accent} text-3xl shadow-sm`}
      >
        <span aria-hidden="true">{app.icon}</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary">
        {app.name}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{app.description}</p>
    </>
  )
}
