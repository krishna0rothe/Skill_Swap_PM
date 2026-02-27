import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '../../utils/authStorage'

function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
