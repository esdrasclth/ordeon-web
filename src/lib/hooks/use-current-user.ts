'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types'
import { ROLE_ACTIONS } from '@/lib/permissions'

const supabase = createClient()

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return {
        id:       user.id,
        email:    user.email ?? '',
        ...profile,
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function usePermissions() {
  const { data: user } = useCurrentUser()
  const role = (user?.role ?? 'vendedor') as UserRole
  return {
    role,
    actions: ROLE_ACTIONS[role],
    isAdmin:       role === 'admin',
    isSupervisor:  role === 'supervisor',
    isVendedor:    role === 'vendedor',
    isAlmacen:     role === 'almacen',
    isFacturacion: role === 'facturacion',
  }
}