'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package2, Users, UserCog,
  Settings, LogOut, ShoppingCart,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { UserRole } from '@/types'
import { ROLE_ROUTES } from '@/lib/permissions'
import { ArrowLeftRight } from 'lucide-react'
import { Boxes } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { NotificationsPanel } from '@/components/layout/notifications-panel'

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/ordenes', label: 'Órdenes', icon: ShoppingCart },
  { href: '/dashboard/inventario', label: 'Inventario', icon: Boxes },
  { href: '/dashboard/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/dashboard/productos', label: 'Productos', icon: Package2 },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/usuarios', label: 'Usuarios', icon: UserCog },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

interface SidebarProps {
  userName: string
  userRole: UserRole
  isSuperAdmin?: boolean
  companyName?: string
}

export function Sidebar({ userName, userRole, isSuperAdmin = false, companyName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications(userRole)

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Filtrar nav items según rutas permitidas del rol
  const allowedRoutes = ROLE_ROUTES[userRole] ?? []
  const visibleItems = ALL_NAV_ITEMS.filter(item =>
    allowedRoutes.includes(item.href)
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    vendedor: 'Vendedor',
    almacen: 'Almacén',
    facturacion: 'Facturación',
  }

  return (
    <aside
      className="relative flex flex-col h-screen transition-all duration-300 flex-shrink-0"
      style={{
        width: collapsed ? 64 : 220,
        background: '#031926',
        borderRight: '1px solid rgba(244,233,205,0.08)',
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
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid rgba(244,233,205,0.08)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#468189' }}
        >
          <Package2 className="w-4 h-4" style={{ color: '#F4E9CD' }} />
        </div>
        {!collapsed && (
          <div>
            <span
              className="font-bold text-base tracking-wide block"
              style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}
            >
              Ordeon
            </span>
            {companyName && (
              <span className="text-xs block" style={{ color: 'rgba(244,233,205,0.45)', whiteSpace: 'nowrap' }}>
                {companyName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href
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

        {isSuperAdmin && !collapsed && (
          <Link
            href="/superadmin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mt-4 transition-all"
            style={{
              background: 'rgba(217,79,79,0.1)',
              border: '1px solid rgba(217,79,79,0.3)',
              color: '#d94f4f',
            }}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-bold whitespace-nowrap">Panel SuperAdmin</span>
          </Link>
        )}
      </nav>

      {/* User */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid rgba(244,233,205,0.08)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: '#468189', color: '#F4E9CD' }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate" style={{ color: '#F4E9CD' }}>
                {userName}
              </p>
              <p className="text-xs" style={{ color: 'rgba(244,233,205,0.45)' }}>
                {ROLE_LABELS[userRole] ?? userRole}
              </p>
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <NotificationsPanel
          notifications={notifications}
          unreadCount={unreadCount}
          open={notifOpen}
          onOpen={() => setNotifOpen(true)}
          onClose={() => setNotifOpen(false)}
          onMarkAllRead={markAllRead}
          onClearAll={clearAll}
          collapsed={collapsed}
        />

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