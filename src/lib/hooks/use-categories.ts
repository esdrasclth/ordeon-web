'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ProductCategory } from '@/types'

const supabase = createClient()

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('active', true)
        .order('name')
      if (error) throw error
      return data as ProductCategory[]
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cat: { name: string; description?: string; color?: string }) => {
      const { error } = await supabase.from('product_categories').insert(cat)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_categories')
        .update({ active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}