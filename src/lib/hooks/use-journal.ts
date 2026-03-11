'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { JournalEntry, JournalLine } from '@/types'

const supabase = createClient()

async function getCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return profile.company_id
}

export function useJournalEntries(filters?: {
  from?: string
  to?: string
  source?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['journal-entries', filters],
    staleTime: 0,
    queryFn: async () => {
      const companyId = await getCompanyId()
      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          profiles(full_name),
          accounting_periods(name, status),
          journal_lines(
            id, debit, credit, description,
            accounts(id, code, name, type)
          )
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false })
        .order('entry_number', { ascending: false })
        .limit(300)

      if (filters?.from)    query = query.gte('date', filters.from)
      if (filters?.to)      query = query.lte('date', filters.to)
      if (filters?.source)  query = query.eq('source', filters.source)

      const { data, error } = await query
      if (error) { console.error('[useJournalEntries]', error); throw error }
      return data as (JournalEntry & {
        profiles?: { full_name: string }
        accounting_periods?: { name: string; status: string }
      })[]
    },
  })
}

export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: ['journal-entry', id],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          profiles(full_name),
          journal_lines(
            id, debit, credit, description,
            accounts(id, code, name, type)
          )
        `)
        .eq('id', id)
        .single()
      if (error) { console.error('[useJournalEntry]', error); throw error }
      return data as JournalEntry & { profiles?: { full_name: string } }
    },
    enabled: !!id,
  })
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      date: string
      description: string
      reference?: string
      source?: JournalEntry['source']
      source_id?: string
      period_id?: string
      lines: { account_id: string; debit: number; credit: number; description?: string }[]
    }) => {
      const companyId = await getCompanyId()
      const { data: { user } } = await supabase.auth.getUser()

      // Validar balance
      const totalDebit  = params.lines.reduce((s, l) => s + l.debit, 0)
      const totalCredit = params.lines.reduce((s, l) => s + l.credit, 0)
      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new Error(`El asiento no balancea: débito ${totalDebit} ≠ crédito ${totalCredit}`)
      }

      // Crear cabecera
      const { data: entry, error: entryErr } = await supabase
        .from('journal_entries')
        .insert({
          company_id:  companyId,
          date:        params.date,
          description: params.description,
          reference:   params.reference ?? null,
          source:      params.source ?? 'manual',
          source_id:   params.source_id ?? null,
          period_id:   params.period_id ?? null,
          created_by:  user?.id ?? null,
        })
        .select().single()
      if (entryErr) { console.error('[useCreateJournalEntry] entry', entryErr); throw entryErr }

      // Crear líneas
      const { error: linesErr } = await supabase
        .from('journal_lines')
        .insert(params.lines.map(l => ({
          entry_id:    entry.id,
          account_id:  l.account_id,
          debit:       l.debit,
          credit:      l.credit,
          description: l.description ?? null,
        })))
      if (linesErr) { console.error('[useCreateJournalEntry] lines', linesErr); throw linesErr }

      return entry as JournalEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['account-balance'] })
    },
  })
}
