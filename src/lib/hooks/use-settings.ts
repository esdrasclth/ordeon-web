'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('company_id', profile!.company_id)
        .order('key')

      if (error) throw error

      return data.reduce((acc, row) => {
        acc[row.key] = row.value
        return acc
      }, {} as Record<string, string>)
    },
  })
}

export function useUpdateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.rpc('update_setting', {
        p_key: key,
        p_value: value,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useListValues(listType: string) {
  return useQuery({
    queryKey: ['list_values', listType],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('list_values')
        .select('*')
        .eq('list_type', listType)
        .eq('company_id', profile!.company_id)
        .order('sort_order')

      if (error) throw error
      return data
    },
  })
}

export function useCreateListValue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: {
      list_type: string
      value: string
      label: string
      sort_order?: number
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('list_values')
        .upsert({ ...item, company_id: profile!.company_id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['list_values', variables.list_type] })
    },
  })
}

export function useToggleListValue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active, list_type }: { id: string; active: boolean; list_type: string }) => {
      const { error } = await supabase.rpc('toggle_list_value', {
        p_id: id,
        p_active: active,
      })

      if (error) throw error
      return { list_type }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['list_values', data.list_type] })
    },
  })
}

export function useDeleteListValue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, list_type }: { id: string; list_type: string }) => {
      const { error } = await supabase.rpc('delete_list_value', { p_id: id })
      if (error) throw error
      return { list_type }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['list_values', data.list_type] })
    },
  })
}