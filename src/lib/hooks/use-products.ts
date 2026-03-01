'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'

const supabase = createClient()

// ── Obtener todos los productos ──────────────────────────
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (name)
        `)
        .order('code', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

// ── Crear producto ───────────────────────────────────────
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// ── Actualizar producto ──────────────────────────────────
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { error } = await supabase.rpc('update_product', {
        p_id: id,
        p_code: product.code ?? '',
        p_name: product.name ?? '',
        p_description: product.description ?? '',
        p_unit: product.unit ?? '',
        p_price_a: product.price_a ?? 0,
        p_price_b: product.price_b ?? 0,
        p_price_c: product.price_c ?? 0,
        p_stock: product.stock ?? 0,
        p_min_stock: product.min_stock ?? 0,
        p_active: product.active ?? true,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// ── Eliminar producto ────────────────────────────────────
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_product', { p_id: id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}