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

// Verificar si un rol puede acceder a una ruta
export function canAccess(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_ROUTES[role] ?? []

  const result = allowed.some(route => {
    // Coincidencia exacta
    if (route === pathname) return true

    // Subrutas dinámicas: solo para rutas que NO son /dashboard raíz
    // Ejemplo: /dashboard/ordenes permite /dashboard/ordenes/[id]
    if (route !== '/dashboard' && pathname.startsWith(route + '/')) return true

    return false
  })

  return result
}

// Acciones permitidas por rol
export const ROLE_ACTIONS: Record<UserRole, {
  canCreateOrder:   boolean
  canCancelOrder:   boolean
  canManageProducts: boolean
  canManageClients:  boolean
  canManageUsers:    boolean
  canInvoice:        boolean
  canViewAllOrders:  boolean
}> = {
  admin: {
    canCreateOrder:    true,
    canCancelOrder:    true,
    canManageProducts: true,
    canManageClients:  true,
    canManageUsers:    true,
    canInvoice:        true,
    canViewAllOrders:  true,
  },
  supervisor: {
    canCreateOrder:    true,
    canCancelOrder:    true,
    canManageProducts: true,
    canManageClients:  true,
    canManageUsers:    false,
    canInvoice:        true,
    canViewAllOrders:  true,
  },
  vendedor: {
    canCreateOrder:    true,
    canCancelOrder:    true,
    canManageProducts: false,
    canManageClients:  false,
    canManageUsers:    false,
    canInvoice:        false,
    canViewAllOrders:  false,  // Solo sus órdenes
  },
  almacen: {
    canCreateOrder:    true,
    canCancelOrder:    true,
    canManageProducts: false,
    canManageClients:  false,
    canManageUsers:    false,
    canInvoice:        false,
    canViewAllOrders:  true,
  },
  facturacion: {
    canCreateOrder:    false,
    canCancelOrder:    false,
    canManageProducts: false,
    canManageClients:  false,
    canManageUsers:    false,
    canInvoice:        true,
    canViewAllOrders:  true,
  },
}