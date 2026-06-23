import { createBrowserRouter } from 'react-router-dom'
import { App } from '../app'
import { Home } from './home'
import { NotFound } from './not-found'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
