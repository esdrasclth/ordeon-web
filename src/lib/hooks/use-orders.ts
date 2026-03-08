'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { SalesOrder, OrderItemForm } from '@/types'
import { usePermissions } from '@/lib/hooks/use-current-user'

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

export function useOrders(status?: string, vendorId?: string) {
  const { role } = usePermissions()

  return useQuery({
    queryKey: ['orders', status, vendorId, role],
    queryFn: async () => {
      const companyId = await getCompanyId()

      let query = supabase
        .from('sales_orders')
        .select(`*, clients (name, rtn), profiles (full_name)`)
        .eq('company_id', companyId)
        .order('order_date', { ascending: false })

      if (status && status !== 'todos') {
        query = query.eq('status', status)
      }
      if (vendorId) {
        query = query.eq('vendor_id', vendorId)
      }
      if (role === 'almacen' || role === 'facturacion') {
        query = query.neq('status', 'pendiente_aprobacion')
      }

      const { data, error } = await query
      if (error) throw error
      return data as SalesOrder[]
    },
    enabled: !!role,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const companyId = await getCompanyId()

      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          clients (name, rtn, city, phone),
          profiles (full_name),
          sales_order_items (
            *,
            products (name, code, unit)
          ),
          order_status_log (
            *,
            profiles (full_name)
          )
        `)
        .eq('id', id)
        .eq('company_id', companyId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      client_id:       string
      vendor_id:       string
      delivery_date:   string | null
      payment_terms:   string
      delivery_method: string
      warehouse_id:    string | null
      price_list:      string
      notes:           string
      isv_rate:        number
      items:           OrderItemForm[]
      force_status?:   string
    }) => {
      const { data, error } = await supabase.rpc('create_sales_order', {
        p_client_id:      params.client_id,
        p_vendor_id:      params.vendor_id,
        p_delivery_date:  params.delivery_date,
        p_payment_terms:  params.payment_terms,
        p_delivery_method: params.delivery_method,
        p_warehouse_id:   params.warehouse_id,
        p_price_list:     params.price_list,
        p_notes:          params.notes,
        p_isv_rate:       params.isv_rate,
        p_force_status:   params.force_status ?? null,
        p_items: params.items.map(item => ({
          product_id:   item.product_id,
          quantity:     item.quantity,
          unit_price:   item.unit_price,
          discount_pct: item.discount_pct,
        })),
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      order_id: string
      status:   string
      notes?:   string
      invoice?: string
    }) => {
      const { error } = await supabase.rpc('update_order_status', {
        p_order_id: params.order_id,
        p_status:   params.status,
        p_notes:    params.notes   ?? null,
        p_invoice:  params.invoice ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useDispatchOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      order_id: string
      items: { item_id: string; dispatched_qty: number }[]
      notes?: string
    }) => {
      const { error } = await supabase.rpc('dispatch_order', {
        p_order_id: params.order_id,
        p_items:    params.items,
        p_notes:    params.notes ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
    },
  })
}