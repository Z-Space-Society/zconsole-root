import { Outlet } from 'react-router-dom'
import { Footer } from './components/Footer'

/**
 * Host shell for the landing grid. This repo is the catch-all Worker that serves
 * the index of mini apps; it intentionally has no auth, QR, or realtime layer —
 * each mini app brings its own (see docs/hosting-a-mini-app.md).
 */
export function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gradient-start to-gradient-end">
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
