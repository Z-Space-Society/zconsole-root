import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'

async function initializeApp() {
  // Initialize Local First Auth Simulator when in dev mode and simulator is enabled
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_FIRST_AUTH_SIMULATOR === 'true') {
    const simulator = await import('local-first-auth-simulator')
    simulator.enableLocalFirstAuthSimulator()
  }

  const root = createRoot(document.getElementById('app')!)
  root.render(<RouterProvider router={router} />)
}

initializeApp()
