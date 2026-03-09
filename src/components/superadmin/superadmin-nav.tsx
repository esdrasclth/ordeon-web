'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, CreditCard,
  Puzzle, ClipboardList,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/superadmin',              label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/superadmin/empresas',     label: 'Empresas',      icon: Building2       },
  { href: '/superadmin/usuarios',     label: 'Usuarios',      icon: Users           },
  { href: '/superadmin/suscripciones',label: 'Suscripciones', icon: CreditCard      },
  { href: '/superadmin/modulos',      label: 'Módulos',       icon: Puzzle          },
  { href: '/superadmin/auditoria',    label: 'Auditoría',     icon: ClipboardList   },
]

export function SuperAdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen pt-6 pr-4 flex-shrink-0">
      <p className="text-xs font-bold uppercase tracking-widest px-4 mb-3"
        style={{ color: '#9DBEBB', letterSpacing: '0.1em' }}>
        Panel
      </p>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const Icon   = item.icon
          const active = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(70,129,137,0.15)' : 'transparent',
                color:      active ? '#468189' : '#555',
                border:     active ? '1px solid rgba(70,129,137,0.2)' : '1px solid transparent',
              }}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}