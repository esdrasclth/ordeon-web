'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { AccountingPeriod } from '@/types'

const supabase = createClient()

async function getCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return profile.company_id
}

export function useAccountingPeriods() {
  return useQuery({
    queryKey: ['accounting-periods'],
    staleTime: 0,
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('accounting_periods')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false })
      if (error) { console.error('[useAccountingPeriods]', error); throw error }
      return data as AccountingPeriod[]
    },
  })
}

export function useCreatePeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      name: string
      start_date: string
      end_date: string
    }) => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('accounting_periods')
        .insert({ ...params, company_id: companyId, status: 'open' })
        .select().single()
      if (error) { console.error('[useCreatePeriod]', error); throw error }
      return data as AccountingPeriod
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounting-periods'] }),
  })
}

export function useClosePeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounting_periods')
        .update({ status: 'closed' })
        .eq('id', id)
      if (error) { console.error('[useClosePeriod]', error); throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounting-periods'] }),
  })
}

export function useReopenPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounting_periods')
        .update({ status: 'open' })
        .eq('id', id)
      if (error) { console.error('[useReopenPeriod]', error); throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounting-periods'] }),
  })
}
