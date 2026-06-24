import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'

createRoot(document.getElementById('app')!).render(<RouterProvider router={router} />)
