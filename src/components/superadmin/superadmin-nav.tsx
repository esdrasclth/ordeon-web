'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/superadmin',         label: '📊 Dashboard' },
  { href: '/superadmin/empresas', label: '🏢 Empresas'  },
  { href: '/superadmin/pagos',    label: '💰 Pagos'     },
]

export function SuperAdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-52 min-h-screen pt-6 pr-4">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(70,129,137,0.15)' : 'transparent',
                color:      active ? '#468189' : '#777',
                border:     active ? '1px solid rgba(70,129,137,0.2)' : '1px solid transparent',
              }}>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}