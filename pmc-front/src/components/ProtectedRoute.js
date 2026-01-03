// src/components/ProtectedRoute.js
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import authService from '../services/authService'

/**
 * Route guard for authenticated areas.
 * Renders nested routes via <Outlet/> if authenticated,
 * otherwise redirects to /login.
 */
const ProtectedRoute = () => {
  const isAuth = authService.isAuthenticated()
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute