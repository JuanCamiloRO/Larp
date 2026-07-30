// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <p>Cargando...</p>  // wait for session check
  if (!user) return <Navigate to="/login" />  // not logged in → redirect

  return children  // logged in → show the page
}

export default ProtectedRoute