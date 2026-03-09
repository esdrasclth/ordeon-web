'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Supplier } from '@/types'

const supabase = createClient()

async function getCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return profile.company_id
}

// ─── Lista de proveedores ─────────────────────────────────────────────────────

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', companyId)
        .eq('active', true)
        .order('name')
      if (error) { console.error('[useSuppliers]', error); throw error }
      return data as Supplier[]
    },
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()
      if (error) { console.error('[useSupplier]', error); throw error }
      return data as Supplier
    },
    enabled: !!id,
  })
}

// ─── CRUD Proveedores ─────────────────────────────────────────────────────────

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      name: string
      code?: string
      rtn?: string
      contact_name?: string
      phone?: string
      email?: string
      address?: string
      city?: string
      department?: string
      country?: string
      credit_limit?: number
      payment_terms?: string
      notes?: string
    }) => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ ...params, company_id: companyId, active: true })
        .select()
        .single()
      if (error) { console.error('[useCreateSupplier]', error); throw error }
      return data as Supplier
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: Partial<Supplier> & { id: string }) => {
      const { id, ...rest } = params
      const { data, error } = await supabase
        .from('suppliers')
        .update(rest)
        .eq('id', id)
        .select()
        .single()
      if (error) { console.error('[useUpdateSupplier]', error); throw error }
      return data as Supplier
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier', vars.id] })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ active: false })
        .eq('id', id)
      if (error) { console.error('[useDeleteSupplier]', error); throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}
