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