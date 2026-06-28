import { createBrowserRouter } from 'react-router-dom'
import { App } from '../app'
import { Home } from './home'
import { NotFound } from './not-found'
import { Settings } from './settings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
