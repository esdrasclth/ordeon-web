'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

function getPeriodDates(period: string) {
  const now   = new Date()
  const end   = new Date(now)
  const start = new Date(now)

  if (period === 'today') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  } else if (period === 'year') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
  }

  return { start: start.toISOString(), end: end.toISOString() }
}

export function useDashboardKpis(period: string) {
  const { start, end } = getPeriodDates(period)
  return useQuery({
    queryKey: ['dashboard-kpis', period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_kpis', {
        p_start_date: start,
        p_end_date:   end,
      })
      if (error) throw error
      return data as {
        total_sales:    number
        total_orders:   number
        avg_order:      number
        pending_orders: number
      }
    },
  })
}

export function useSalesTrend() {
  return useQuery({
    queryKey: ['sales-trend'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_trend', { p_days: 30 })
      if (error) throw error
      return data as { date: string; total: number; orders: number }[]
    },
  })
}

export function useTopProducts(period: string) {
  const { start, end } = getPeriodDates(period)
  return useQuery({
    queryKey: ['top-products', period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_products', {
        p_start_date: start,
        p_end_date:   end,
      })
      if (error) throw error
      return data as { name: string; code: string; total_qty: number; total_sales: number }[]
    },
  })
}

export function useTopClients(period: string) {
  const { start, end } = getPeriodDates(period)
  return useQuery({
    queryKey: ['top-clients', period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_clients', {
        p_start_date: start,
        p_end_date:   end,
      })
      if (error) throw error
      return data as { name: string; city: string; total_orders: number; total_sales: number }[]
    },
  })
}

export function useSalesByVendor(period: string) {
  const { start, end } = getPeriodDates(period)
  return useQuery({
    queryKey: ['sales-by-vendor', period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_by_vendor', {
        p_start_date: start,
        p_end_date:   end,
      })
      if (error) throw error
      return data as { full_name: string; total_orders: number; total_sales: number }[]
    },
  })
}

export function useOrdersByStatus() {
  return useQuery({
    queryKey: ['orders-by-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_orders_by_status')
      if (error) throw error
      return data as { status: string; total: number }[]
    },
  })
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, stock, min_stock, unit')
        .eq('company_id', profile!.company_id)
        .eq('active', true)
        .order('stock', { ascending: true })
        .limit(50)
      if (error) throw error
      return (data ?? []).filter(p => Number(p.stock) <= Number(p.min_stock)).slice(0, 6)
    },
  })
}

export function useOverCreditClients() {
  return useQuery({
    queryKey: ['over-credit-clients'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, city, current_balance, credit_limit')
        .eq('company_id', profile!.company_id)
        .eq('status', 'active')
        .gt('credit_limit', 0)
        .order('current_balance', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []).filter(c => Number(c.current_balance) > Number(c.credit_limit)).slice(0, 6)
    },
  })
}

// ─── Facturación ───────────────────────────────────────────────────────────────

export function useInvoiceStats(period: string, enabled = true) {
  const { start, end } = getPeriodDates(period)
  return useQuery({
    queryKey: ['invoice-stats', period],
    enabled,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data: profile } = await supabase
        .from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) return null

      const { data, error } = await supabase
        .from('invoices')
        .select('id, total, status, issued_at')
        .eq('company_id', profile.company_id)
        .gte('issued_at', start)
        .lte('issued_at', end)
      if (error) { console.warn('[useInvoiceStats]', error); return null }

      const total_invoices = data.length
      const total_amount   = data.reduce((s, i) => s + Number(i.total ?? 0), 0)
      const pending        = data.filter(i => i.status === 'pending' || i.status === 'pendiente').length
      return { total_invoices, total_amount, pending }
    },
  })
}

// ─── Contabilidad ──────────────────────────────────────────────────────────────

export function useAccountingKpis(period: string, enabled = true) {
  const { start, end } = getPeriodDates(period)
  return useQuery({
    queryKey: ['accounting-kpis', period],
    enabled,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data: profile } = await supabase
        .from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) return null

      // Traer líneas de asientos en el período con tipo de cuenta
      const { data: entries } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', profile.company_id)
        .gte('date', start.split('T')[0])
        .lte('date', end.split('T')[0])
      const ids = (entries ?? []).map(e => e.id)
      if (ids.length === 0) return { ingresos: 0, costos: 0, gastos: 0, utilidad: 0, num_asientos: 0 }

      const { data: lines, error } = await supabase
        .from('journal_lines')
        .select('debit, credit, accounts(type)')
        .in('entry_id', ids)
      if (error) { console.warn('[useAccountingKpis]', error); return null }

      let ingresos = 0, costos = 0, gastos = 0
      ;(lines ?? []).forEach(l => {
        const type = (l as any).accounts?.type
        const credit = Number(l.credit), debit = Number(l.debit)
        if (type === 'ingreso') ingresos += credit - debit
        if (type === 'costo')   costos   += debit - credit
        if (type === 'gasto')   gastos   += debit - credit
      })

      return { ingresos, costos, gastos, utilidad: ingresos - costos - gastos, num_asientos: ids.length }
    },
  })
}

export function useRecentJournalEntries(enabled = true) {
  return useQuery({
    queryKey: ['recent-journal-entries'],
    enabled,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data: profile } = await supabase
        .from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) return []

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, entry_number, date, description, source, journal_lines(debit, credit)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) { console.warn('[useRecentJournalEntries]', error); return [] }

      return (data ?? []).map(e => ({
        id:           e.id,
        entry_number: e.entry_number,
        date:         e.date,
        description:  e.description,
        source:       e.source,
        total_debit:  (e.journal_lines ?? []).reduce((s: number, l: any) => s + Number(l.debit), 0),
      }))
    },
  })
}

// ─── Multi-Bodega ──────────────────────────────────────────────────────────────

export function useWarehouseStockSummary(enabled = true) {
  return useQuery({
    queryKey: ['warehouse-stock-summary'],
    enabled,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data: profile } = await supabase
        .from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) return []

      const { data: warehouses, error: wErr } = await supabase
        .from('warehouses')
        .select('id, name, code, is_default')
        .eq('company_id', profile.company_id)
        .eq('active', true)
        .order('name')
      if (wErr) { console.warn('[useWarehouseStockSummary]', wErr); return [] }

      const results = await Promise.all((warehouses ?? []).map(async w => {
        const { data: stock } = await supabase
          .from('warehouse_stock')
          .select('stock, products(purchase_price)')
          .eq('warehouse_id', w.id)
        const total_products = (stock ?? []).length
        const total_units    = (stock ?? []).reduce((s, r) => s + Number(r.stock), 0)
        const valor_total    = (stock ?? []).reduce((s, r) =>
          s + Number(r.stock) * Number((r as any).products?.purchase_price ?? 0), 0
        )
        return { id: w.id, name: w.name, code: w.code, is_default: w.is_default, total_products, total_units, valor_total }
      }))

      return results
    },
  })
}