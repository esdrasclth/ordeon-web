'use client'

import { useQuery } from '@tanstack/react-query'
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

// Tipo para balance de comprobación
export interface TrialBalanceLine {
  account: Account
  totalDebit: number
  totalCredit: number
  balance: number  // debit - credit (positivo = saldo deudor)
}

// Balance de comprobación (todas las cuentas con movimientos en el período)
export function useTrialBalance(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['trial-balance', fromDate, toDate],
    staleTime: 0,
    queryFn: async () => {
      const companyId = await getCompanyId()

      let entryQuery = supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId)
      if (fromDate) entryQuery = entryQuery.gte('date', fromDate)
      if (toDate)   entryQuery = entryQuery.lte('date', toDate)
      const { data: entries } = await entryQuery
      const entryIds = (entries ?? []).map(e => e.id)

      if (entryIds.length === 0) return [] as TrialBalanceLine[]

      const { data: lines, error } = await supabase
        .from('journal_lines')
        .select('debit, credit, account_id, accounts(id, code, name, type, is_detail)')
        .in('entry_id', entryIds)
      if (error) throw error

      // Agrupar por cuenta
      const map: Record<string, TrialBalanceLine> = {}
      ;(lines ?? []).forEach(l => {
        if (!map[l.account_id]) {
          map[l.account_id] = {
            account:     (l as any).accounts as Account,
            totalDebit:  0,
            totalCredit: 0,
            balance:     0,
          }
        }
        map[l.account_id].totalDebit  += Number(l.debit)
        map[l.account_id].totalCredit += Number(l.credit)
      })
      return Object.values(map).map(row => ({
        ...row,
        balance: row.totalDebit - row.totalCredit,
      })).sort((a, b) => a.account.code.localeCompare(b.account.code))
    },
    enabled: true,
  })
}

// Balance General
export interface BalanceSheetSection {
  type: AccountType
  label: string
  lines: TrialBalanceLine[]
  total: number
}

export function useBalanceSheet(asOfDate?: string) {
  return useQuery({
    queryKey: ['balance-sheet', asOfDate],
    staleTime: 0,
    queryFn: async () => {
      const companyId = await getCompanyId()

      // Tomar todos los asientos hasta la fecha
      let entryQuery = supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId)
      if (asOfDate) entryQuery = entryQuery.lte('date', asOfDate)
      const { data: entries } = await entryQuery
      const entryIds = (entries ?? []).map(e => e.id)
      if (entryIds.length === 0) return null

      const { data: lines, error } = await supabase
        .from('journal_lines')
        .select('debit, credit, account_id, accounts(id, code, name, type, is_detail)')
        .in('entry_id', entryIds)
      if (error) throw error

      const map: Record<string, { account: Account; debit: number; credit: number }> = {}
      ;(lines ?? []).forEach(l => {
        if (!map[l.account_id]) {
          map[l.account_id] = { account: (l as any).accounts as Account, debit: 0, credit: 0 }
        }
        map[l.account_id].debit  += Number(l.debit)
        map[l.account_id].credit += Number(l.credit)
      })

      const calcBalance = (type: AccountType, debit: number, credit: number) => {
        // Activo, costo, gasto: saldo = debit - credit
        // Pasivo, capital, ingreso: saldo = credit - debit
        return ['activo', 'costo', 'gasto'].includes(type)
          ? debit - credit
          : credit - debit
      }

      const sections: Record<string, TrialBalanceLine[]> = {
        activo: [], pasivo: [], capital: [], ingreso: [], gasto: [], costo: []
      }

      Object.values(map).forEach(row => {
        const bal = calcBalance(row.account.type, row.debit, row.credit)
        if (bal !== 0) {
          sections[row.account.type].push({
            account:     row.account,
            totalDebit:  row.debit,
            totalCredit: row.credit,
            balance:     bal,
          })
        }
      })

      const total = (type: AccountType) =>
        sections[type].reduce((s, r) => s + r.balance, 0)

      return {
        activos:   { lines: sections.activo.sort((a,b) => a.account.code.localeCompare(b.account.code)),  total: total('activo') },
        pasivos:   { lines: sections.pasivo.sort((a,b) => a.account.code.localeCompare(b.account.code)),  total: total('pasivo') },
        capital:   { lines: sections.capital.sort((a,b) => a.account.code.localeCompare(b.account.code)), total: total('capital') },
        ingresos:  { lines: sections.ingreso.sort((a,b) => a.account.code.localeCompare(b.account.code)), total: total('ingreso') },
        gastos:    { lines: sections.gasto.sort((a,b) => a.account.code.localeCompare(b.account.code)),   total: total('gasto') },
        costos:    { lines: sections.costo.sort((a,b) => a.account.code.localeCompare(b.account.code)),   total: total('costo') },
        netIncome: total('ingreso') - total('gasto') - total('costo'),
      }
    },
  })
}

// Estado de Resultados
export function useIncomeStatement(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['income-statement', fromDate, toDate],
    staleTime: 0,
    queryFn: async () => {
      const companyId = await getCompanyId()

      let entryQuery = supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId)
      if (fromDate) entryQuery = entryQuery.gte('date', fromDate)
      if (toDate)   entryQuery = entryQuery.lte('date', toDate)
      const { data: entries } = await entryQuery
      const entryIds = (entries ?? []).map(e => e.id)
      if (entryIds.length === 0) return null

      const { data: lines, error } = await supabase
        .from('journal_lines')
        .select('debit, credit, account_id, accounts!inner(id, code, name, type, is_detail)')
        .in('entry_id', entryIds)
        .in('accounts.type', ['ingreso', 'gasto', 'costo'])
      if (error) throw error

      const map: Record<string, { account: Account; balance: number }> = {}
      ;(lines ?? []).forEach(l => {
        if (!map[l.account_id]) {
          map[l.account_id] = { account: (l as any).accounts as Account, balance: 0 }
        }
        const isIngreso = (l as any).accounts.type === 'ingreso'
        map[l.account_id].balance += isIngreso
          ? Number(l.credit) - Number(l.debit)
          : Number(l.debit) - Number(l.credit)
      })

      const ingresos = Object.values(map).filter(r => r.account.type === 'ingreso')
      const costos   = Object.values(map).filter(r => r.account.type === 'costo')
      const gastos   = Object.values(map).filter(r => r.account.type === 'gasto')

      const totalIngresos = ingresos.reduce((s, r) => s + r.balance, 0)
      const totalCostos   = costos.reduce((s, r) => s + r.balance, 0)
      const totalGastos   = gastos.reduce((s, r) => s + r.balance, 0)
      const utilidadBruta  = totalIngresos - totalCostos
      const utilidadNeta   = utilidadBruta - totalGastos

      return {
        ingresos:       ingresos.sort((a,b) => a.account.code.localeCompare(b.account.code)),
        costos:         costos.sort((a,b) => a.account.code.localeCompare(b.account.code)),
        gastos:         gastos.sort((a,b) => a.account.code.localeCompare(b.account.code)),
        totalIngresos,
        totalCostos,
        totalGastos,
        utilidadBruta,
        utilidadNeta,
      }
    },
  })
}
