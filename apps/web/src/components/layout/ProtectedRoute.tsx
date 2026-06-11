import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { temAcesso, type Modulo } from '../../lib/permissions'
import type { UserRole } from '@ctnc/shared'

interface Props {
  children: React.ReactNode
  modulo?: Modulo
}

export function ProtectedRoute({ children, modulo }: Props) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (modulo && profile && !temAcesso(profile.role as UserRole, modulo)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
