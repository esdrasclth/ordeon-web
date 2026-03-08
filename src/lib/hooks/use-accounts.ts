'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Account, AccountType } from '@/types'

const supabase = createClient()

async function getCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return profile.company_id
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('active', true)
        .order('code')
      if (error) { console.error('[useAccounts]', error); throw error }
      return data as Account[]
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      code: string
      name: string
      type: AccountType
      subtype?: string
      parent_id?: string | null
      is_detail?: boolean
    }) => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...params, company_id: companyId, active: true })
        .select().single()
      if (error) { console.error('[useCreateAccount]', error); throw error }
      return data as Account
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: Partial<Account> & { id: string }) => {
      const { id, ...rest } = params
      const { error } = await supabase.from('accounts').update(rest).eq('id', id)
      if (error) { console.error('[useUpdateAccount]', error); throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').update({ active: false }).eq('id', id)
      if (error) { console.error('[useDeleteAccount]', error); throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

// Helper: obtener saldo de una cuenta (débitos - créditos para activo/costo/gasto)
export function useAccountBalance(accountId: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['account-balance', accountId, fromDate, toDate],
    queryFn: async () => {
      let query = supabase
        .from('journal_lines')
        .select('debit, credit, journal_entries!inner(date, company_id)')
        .eq('account_id', accountId)
      if (fromDate) query = query.gte('journal_entries.date', fromDate)
      if (toDate)   query = query.lte('journal_entries.date', toDate)
      const { data, error } = await query
      if (error) throw error
      const totalDebit  = (data ?? []).reduce((s, r) => s + Number(r.debit), 0)
      const totalCredit = (data ?? []).reduce((s, r) => s + Number(r.credit), 0)
      return { totalDebit, totalCredit, balance: totalDebit - totalCredit }
    },
    enabled: !!accountId,
  })
}
