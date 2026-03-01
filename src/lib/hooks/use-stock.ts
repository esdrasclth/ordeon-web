'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { StockMovement } from '@/types'

const supabase = createClient()

export function useStockMovements(productId: string) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, profiles(full_name)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as StockMovement[]
    },
    enabled: !!productId,
  })
}

export function useProductStats(productId: string) {
  return useQuery({
    queryKey: ['product-stats', productId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_product_stats', {
        p_product_id: productId,
      })
      if (error) throw error
      return data as {
        total_sold: number
        total_orders: number
        last_sale: string | null
        total_revenue: number
      }
    },
    enabled: !!productId,
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      product_id, quantity, type, notes
    }: {
      product_id: string
      quantity: number
      type: string
      notes?: string
    }) => {
      const { error } = await supabase.rpc('adjust_stock', {
        p_product_id: product_id,
        p_quantity: quantity,
        p_type: type,
        p_notes: notes ?? null,
      })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', vars.product_id] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements', vars.product_id] })
    },
  })
}

export function useAllMovements(filters?: {
  type?: string
  product_id?: string
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: ['movements', filters],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select(`
                *,
                profiles (full_name),
                products  (id, code, name, unit, purchase_price)
              `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (filters?.type) query = query.eq('type', filters.type)
      if (filters?.product_id) query = query.eq('product_id', filters.product_id)
      if (filters?.from) query = query.gte('created_at', filters.from)
      if (filters?.to) query = query.lte('created_at', filters.to)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useAdjustStockBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      movements: { product_id: string; quantity: number }[]
      type: string
      reference?: string
      supplier?: string
      reason?: string
      notes?: string
    }) => {
      const { error } = await supabase.rpc('adjust_stock_batch', {
        p_movements: params.movements,
        p_type: params.type,
        p_reference: params.reference ?? null,
        p_supplier: params.supplier ?? null,
        p_reason: params.reason ?? null,
        p_notes: params.notes ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}

export function useInventoryOverview() {
  return useQuery({
    queryKey: ['inventory-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_inventory_overview')
      if (error) throw error
      return data as {
        total_productos:   number
        productos_activos: number
        valor_total:       number
        stock_bajo:        number
        sin_stock:         number
        stock_normal:      number
      }
    },
  })
}

export function useInventoryByCategory() {
  return useQuery({
    queryKey: ['inventory-by-category'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_inventory_by_category')
      if (error) throw error
      return data as {
        category:       string
        color:          string
        total_products: number
        valor_total:    number
        total_units:    number
      }[]
    },
  })
}

export function useProductRotation(days = 90) {
  return useQuery({
    queryKey: ['product-rotation', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_product_rotation', { p_days: days })
      if (error) throw error
      return data as {
        id:               string
        code:             string
        name:             string
        unit:             string
        stock:            number
        min_stock:        number
        purchase_price:   number
        valor_stock:      number
        total_vendido:    number
        num_movimientos:  number
        rotacion:         string
      }[]
    },
  })
}