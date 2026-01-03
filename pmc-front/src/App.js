
// src/App.js
import React, { Suspense, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'

import ErrorBoundary from './components/ErrorBoundary'

// Layout & pages
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const Login         = React.lazy(() => import('./views/pages/login/Login'))
const Register      = React.lazy(() => import('./views/pages/register/Register'))
const Page404       = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500       = React.lazy(() => import('./views/pages/page500/Page500'))

// Route guard
import ProtectedRoute from './components/ProtectedRoute'

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const params = new URLSearchParams(window.location.href.split('?')[1])
    const theme  = params.get('theme')?.match(/^[A-Za-z0-9\s]+/)?.[0]
    if (theme) setColorMode(theme)
    else if (!isColorModeSet()) setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="pt-3 text-center">
              <CSpinner color="primary" variant="grow" />
            </div>
          }
        >
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<Login    />} />
            <Route path="/register" element={<Register />} />
            <Route path="/404"      element={<Page404  />} />
            <Route path="/500"      element={<Page500  />} />

            {/* Protected: all other paths */}
            <Route element={<ProtectedRoute />}>
              <Route path="/*" element={<DefaultLayout />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </HashRouter>
  )
}

export default App