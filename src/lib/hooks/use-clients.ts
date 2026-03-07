'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/types'

const supabase = createClient()

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Client[]
    },
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })
}

export function useClientStats(id: string) {
  return useQuery({
    queryKey: ['client-stats', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_client_stats', {
        p_client_id: id,
      })
      if (error) throw error
      return data as {
        total_orders: number
        total_spent: number
        last_order: string | null
        pending_orders: number
      }
    },
    enabled: !!id,
  })
}

export function useClientOrders(id: string) {
  return useQuery({
    queryKey: ['client-orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          id, order_number, status, order_date,
          total, payment_terms, profiles (full_name)
        `)
        .eq('client_id', id)
        .order('order_date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      // Obtener company_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('Sin empresa asignada')

      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, company_id: profile.company_id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const payload = {
        p_id: id,
        p_name: client.name ?? '',
        p_rtn: client.rtn ?? '',
        p_contact_name: client.contact_name ?? '',
        p_phone: client.phone ?? '',
        p_email: client.email ?? '',
        p_address: client.address ?? '',
        p_city: client.city ?? '',
        p_department: client.department ?? '',
        p_price_list: (client.price_list ?? 'B') as string,
        p_credit_limit: Number(client.credit_limit ?? 0),
        p_payment_terms: client.payment_terms ?? 'Contado',
        p_status: (client.status ?? 'active') as string,
        p_notes: client.notes ?? '',
      }

      const { error } = await supabase.rpc('update_client', payload)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client'] })
      queryClient.refetchQueries({ queryKey: ['clients'] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_client', { p_id: id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}