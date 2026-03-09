import { UserRole } from '@/types'

// Rutas permitidas por rol
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: [
    '/dashboard',
    '/dashboard/productos',
    '/dashboard/clientes',
    '/dashboard/ordenes',
    '/dashboard/ordenes/nueva',
    '/dashboard/usuarios',
    '/dashboard/configuracion',
    '/dashboard/movimientos',
    '/dashboard/inventario',
    '/dashboard/facturacion',
    '/dashboard/facturacion/nueva',
    '/dashboard/facturacion/config',
    '/dashboard/bodegas',
    '/dashboard/contabilidad',
    '/dashboard/contabilidad/cuentas',
    '/dashboard/contabilidad/diario',
    '/dashboard/contabilidad/diario/nuevo',
    '/dashboard/contabilidad/mayor',
    '/dashboard/contabilidad/comprobacion',
    '/dashboard/contabilidad/balance',
    '/dashboard/contabilidad/resultados',
    '/dashboard/contabilidad/periodos',
    '/dashboard/contabilidad/impuestos',
    '/dashboard/compras',
    '/dashboard/compras/nueva',
    '/dashboard/compras/proveedores',
  ],
  supervisor: [
    '/dashboard',
    '/dashboard/productos',
    '/dashboard/clientes',
    '/dashboard/ordenes',
    '/dashboard/ordenes/nueva',
  ],
  vendedor: [
    '/dashboard',
    '/dashboard/ordenes',
    '/dashboard/ordenes/nueva',
    '/dashboard/clientes',
  ],
  almacen: [
    '/dashboard',
    '/dashboard/ordenes',
    '/dashboard/ordenes/nueva',
    '/dashboard/clientes',
  ],
  facturacion: [
    '/dashboard',
    '/dashboard/ordenes',
  ],
}

// Mapa de módulos → rutas que controlan
export const MODULE_ROUTES: Record<string, string[]> = {
  core: [
    '/dashboard',
    '/dashboard/productos',
    '/dashboard/inventario',
    '/dashboard/movimientos',
    '/dashboard/usuarios',
    '/dashboard/configuracion',
  ],
  ventas: [
    '/dashboard/ordenes',
    '/dashboard/ordenes/nueva',
  ],
  clientes: [
    '/dashboard/clientes',
  ],
  reportes: [
    '/dashboard/reportes',
  ],
  compras: [
    '/dashboard/compras',
    '/dashboard/compras/nueva',
    '/dashboard/compras/proveedores',
  ],
  facturacion: [
    '/dashboard/facturacion',
    '/dashboard/facturacion/nueva',
    '/dashboard/facturacion/config',
  ],
  logistica: [
    '/dashboard/logistica',
  ],
  multi_bodega: [
    '/dashboard/bodegas',
  ],
  contabilidad: [
    '/dashboard/contabilidad',
    '/dashboard/contabilidad/cuentas',
    '/dashboard/contabilidad/diario',
    '/dashboard/contabilidad/diario/nuevo',
    '/dashboard/contabilidad/mayor',
    '/dashboard/contabilidad/comprobacion',
    '/dashboard/contabilidad/balance',
    '/dashboard/contabilidad/resultados',
    '/dashboard/contabilidad/periodos',
    '/dashboard/contabilidad/impuestos',
  ],
}

// Verificar si una ruta está permitida según módulos activos
export function canAccessModule(modules: string[], pathname: string): boolean {
  if (modules.includes('superadmin')) return true

  for (const [module, routes] of Object.entries(MODULE_ROUTES)) {
    if (!modules.includes(module)) continue
    const match = routes.some(route => route === pathname)
    if (match) return true
  }

  // Permitir subrutas dinámicas como /dashboard/ordenes/[id]
  // pero solo si la ruta base está en un módulo activo
  for (const [module, routes] of Object.entries(MODULE_ROUTES)) {
    if (!modules.includes(module)) continue
    const match = routes.some(route =>
      route !== '/dashboard' && pathname.startsWith(route + '/')
    )
    if (match) return true
  }

  return false
}

// Verificar si un rol puede acceder a una ruta
export function canAccess(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_ROUTES[role] ?? []
  return allowed.some(route => {
    if (route === pathname) return true
    if (route !== '/dashboard' && pathname.startsWith(route + '/')) return true
    return false
  })
}

// Acciones permitidas por rol
export const ROLE_ACTIONS: Record<UserRole, {
  canCreateOrder: boolean
  canCancelOrder: boolean
  canManageProducts: boolean
  canManageClients: boolean
  canManageUsers: boolean
  canInvoice: boolean
  canViewAllOrders: boolean
}> = {
  admin: {
    canCreateOrder: true,
    canCancelOrder: true,
    canManageProducts: true,
    canManageClients: true,
    canManageUsers: true,
    canInvoice: true,
    canViewAllOrders: true,
  },
  supervisor: {
    canCreateOrder: true,
    canCancelOrder: true,
    canManageProducts: true,
    canManageClients: true,
    canManageUsers: false,
    canInvoice: true,
    canViewAllOrders: true,
  },
  vendedor: {
    canCreateOrder: true,
    canCancelOrder: true,
    canManageProducts: false,
    canManageClients: false,
    canManageUsers: false,
    canInvoice: false,
    canViewAllOrders: false,
  },
  almacen: {
    canCreateOrder: true,
    canCancelOrder: true,
    canManageProducts: false,
    canManageClients: false,
    canManageUsers: false,
    canInvoice: false,
    canViewAllOrders: true,
  },
  facturacion: {
    canCreateOrder: false,
    canCancelOrder: false,
    canManageProducts: false,
    canManageClients: false,
    canManageUsers: false,
    canInvoice: true,
    canViewAllOrders: true,
  },
}