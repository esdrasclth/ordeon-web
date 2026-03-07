'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

const supabase = createClient()

async function getCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return profile.company_id
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('full_name')
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      email:     string
      password:  string
      full_name: string
      role:      string
      region?:   string
      phone?:    string
    }) => {
      const response = await fetch('/api/users', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Error al crear usuario')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id:        string
      full_name: string
      role:      string
      region?:   string
      phone?:    string
      active:    boolean
    }) => {
      const { error } = await supabase.rpc('update_user_profile', {
        p_id:        params.id,
        p_full_name: params.full_name,
        p_role:      params.role,
        p_region:    params.region ?? null,
        p_phone:     params.phone  ?? null,
        p_active:    params.active,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}