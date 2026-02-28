'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package2, Users, UserCog,
  Settings, LogOut, ShoppingCart, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { UserRole } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, roles: ['admin','supervisor','vendedor','almacen','facturacion'] },
  { href: '/productos',   label: 'Productos',   icon: Package2,        roles: ['admin','supervisor'] },
  { href: '/clientes',    label: 'Clientes',    icon: Users,           roles: ['admin','supervisor','vendedor'] },
  { href: '/ordenes',     label: 'Órdenes',     icon: ShoppingCart,    roles: ['admin','supervisor','vendedor','almacen','facturacion'] },
  { href: '/usuarios',    label: 'Usuarios',    icon: UserCog,         roles: ['admin'] },
  { href: '/configuracion', label: 'Configuración', icon: Settings,    roles: ['admin'] },
]

interface SidebarProps {
  userName: string
  userRole: UserRole
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(userRole)
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="relative flex flex-col h-screen transition-all duration-300 flex-shrink-0"
      style={{
        width: collapsed ? 64 : 220,
        background: '#031926',
        borderRight: '1px solid rgba(244,233,205,0.08)'
      }}
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: '#468189', color: '#F4E9CD', border: '2px solid #031926' }}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid rgba(244,233,205,0.08)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#468189' }}>
          <Package2 className="w-4 h-4" style={{ color: '#F4E9CD' }} />
        </div>
        {!collapsed && (
          <span className="font-bold text-base tracking-wide"
            style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>
            Ordeon
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
              style={{
                background: active ? 'rgba(68,129,137,0.3)' : 'transparent',
                border: active ? '1px solid rgba(68,129,137,0.4)' : '1px solid transparent',
                color: active ? '#F4E9CD' : 'rgba(244,233,205,0.55)',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(244,233,205,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: '#468189', color: '#F4E9CD' }}>
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate" style={{ color: '#F4E9CD' }}>
                {userName}
              </p>
              <p className="text-xs capitalize" style={{ color: 'rgba(244,233,205,0.45)' }}>
                {userRole}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all text-sm"
          style={{ color: 'rgba(244,233,205,0.45)' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}