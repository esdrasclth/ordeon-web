'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Warehouse } from '@/types'

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

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('company_id', companyId)
        .eq('active', true)
        .order('name', { ascending: true })  // solo orden simple para evitar 400
      if (error) {
        console.error('[useWarehouses] error:', error)
        throw error
      }
      // Ordenar localmente: predeterminada primero
      return (data as Warehouse[]).sort((a, b) =>
        (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0)
      )
    },
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      name: string
      code: string
      location?: string
      is_default?: boolean
    }) => {
      const companyId = await getCompanyId()

      // Si is_default, quitar el default solo de las que ya lo tienen
      if (params.is_default) {
        const { error: updateErr } = await supabase
          .from('warehouses')
          .update({ is_default: false })
          .eq('company_id', companyId)
          .eq('is_default', true)
        if (updateErr) console.warn('[useCreateWarehouse] reset default:', updateErr)
      }

      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          company_id: companyId,
          name: params.name,
          code: params.code.toUpperCase(),
          location: params.location ?? null,
          is_default: params.is_default ?? false,
          active: true,
        })
        .select()
        .single()
      if (error) {
        console.error('[useCreateWarehouse] insert error:', error)
        throw error
      }
      return data as Warehouse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      code?: string
      location?: string | null
      is_default?: boolean
      active?: boolean
    }) => {
      // Si is_default, quitar el default de las demás (excluyendo la actual)
      if (params.is_default) {
        const companyId = await getCompanyId()
        const { error: updateErr } = await supabase
          .from('warehouses')
          .update({ is_default: false })
          .eq('company_id', companyId)
          .eq('is_default', true)
          .neq('id', params.id)
        if (updateErr) console.warn('[useUpdateWarehouse] reset default:', updateErr)
      }

      const { id, ...rest } = params
      const { error } = await supabase
        .from('warehouses')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) {
        console.error('[useUpdateWarehouse] error:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('warehouses')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) {
        console.error('[useDeleteWarehouse] error:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}

// Stock de todos los productos en todas las bodegas de la empresa
export function useWarehouseStockAll() {
  return useQuery({
    queryKey: ['warehouse-stock-all'],
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('warehouse_stock')
        .select(`
          id,
          stock,
          min_stock,
          stock_reserved,
          updated_at,
          warehouse_id,
          product_id,
          warehouses!inner(id, name, code, company_id),
          products!inner(id, name, code, unit, purchase_price)
        `)
        .eq('warehouses.company_id', companyId)
        .order('product_id')
      if (error) {
        console.error('[useWarehouseStockAll] error:', error)
        throw error
      }
      return (data as unknown) as {
        id: string
        stock: number
        min_stock: number
        stock_reserved: number
        updated_at: string
        warehouse_id: string
        product_id: string
        warehouses: { id: string; name: string; code: string; company_id: string }
        products: { id: string; name: string; code: string; unit: string; purchase_price: number }
      }[]
    },
  })
}

