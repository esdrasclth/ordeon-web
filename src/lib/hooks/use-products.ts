'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import { tryCreateJournalEntry, buildStockEntryJournalEntry } from '@/lib/accounting-integration'

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

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(id, name, color)')
        .eq('company_id', companyId)
        .order('code', { ascending: true })
      if (error) throw error
      return data as Product[]
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single()
      if (error) throw error
      return data as Product
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const companyId = await getCompanyId()
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, company_id: companyId })
        .select()
        .single()
      if (error) throw error

      // Si el producto se crea con stock inicial > 0, generar asiento contable
      const initialStock = Number(product.stock ?? 0)
      const unitCost     = Number(product.purchase_price ?? 0)
      if (initialStock > 0 && unitCost > 0) {
        const today   = new Date().toISOString().split('T')[0]
        const payload = buildStockEntryJournalEntry({
          date:        today,
          productName: product.name,
          quantity:    initialStock,
          unitCost,
          reference:   `Stock inicial — ${product.name}`,
        })
        await tryCreateJournalEntry(payload)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const rawCategory = (product as any).category_id
      const categoryId  = rawCategory &&
        rawCategory !== 'false' &&
        rawCategory !== 'true'  &&
        rawCategory !== 'none'
        ? rawCategory : null

      const { error } = await supabase.rpc('update_product', {
        p_id:            id,
        p_code:          product.code        ?? '',
        p_name:          product.name        ?? '',
        p_description:   product.description ?? '',
        p_unit:          product.unit        ?? '',
        p_price_a:       product.price_a     ?? 0,
        p_price_b:       product.price_b     ?? 0,
        p_price_c:       product.price_c     ?? 0,
        p_stock:         product.stock       ?? 0,
        p_min_stock:     product.min_stock   ?? 0,
        p_active:        product.active === undefined ? true : Boolean(product.active),
        p_category_id:   categoryId,
        p_purchase_price: Number((product as any).purchase_price ?? 0),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

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