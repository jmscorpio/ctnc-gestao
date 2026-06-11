import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Users, LayoutDashboard, LogOut, Menu, X, CalendarDays, DollarSign, Settings } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { temAcesso, ROLE_LABEL, type Modulo } from '../../lib/permissions'
import type { UserRole } from '@ctnc/shared'

const NAV_ITEMS: { to: string; icon: typeof Users; label: string; end?: boolean; modulo: Modulo }[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true, modulo: 'dashboard' },
  { to: '/acolhidos', icon: Users, label: 'Acolhidos', modulo: 'acolhidos' },
  { to: '/atividades', icon: CalendarDays, label: 'Atividades', modulo: 'atividades' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro', modulo: 'financeiro' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações', modulo: 'configuracoes' },
]

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = profile?.role as UserRole | undefined
  const navItems = NAV_ITEMS.filter(item => temAcesso(role, item.modulo))

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-primary-700 text-white' : 'text-primary-200 hover:bg-primary-800 hover:text-white'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 bg-primary-900 text-white flex-col">
        <div className="px-5 py-5 border-b border-primary-700">
          <h2 className="font-bold text-lg">CTNC Gestão</h2>
          <p className="text-primary-300 text-xs mt-0.5 truncate">{profile?.nome}</p>
          {role && (
            <p className="text-primary-400 text-xs mt-0.5">{ROLE_LABEL[role]}</p>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItems />
        </nav>
        <div className="px-3 py-4 border-t border-primary-700">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary-200 hover:bg-primary-800 hover:text-white w-full transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-primary-900 text-white flex items-center justify-between px-4 py-3">
        <h2 className="font-bold">CTNC Gestão</h2>
        <button onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-primary-900 text-white pt-14">
          <nav className="px-4 py-4 space-y-1">
            <NavItems onClick={() => setMobileOpen(false)} />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-primary-200 w-full"
            >
              <LogOut size={20} />
              Sair
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  )
}
