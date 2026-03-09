'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderItemForm } from '@/types'
import {
  tryCreateJournalEntry,
  buildPurchaseOrderJournalEntry,
} from '@/lib/accounting-integration'

const supabase = createClient()

async function getCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return profile.company_id
}

// ─── Lista de OCs ─────────────────────────────────────────────────────────────

export function usePurchaseOrders(status?: string) {
  return useQuery({
    queryKey: ['purchase-orders', status],
    queryFn: async () => {
      const companyId = await getCompanyId()
      let query = supabase
        .from('purchase_orders')
        .select('*, suppliers(name, rtn)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (status && status !== 'todos') {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) { console.error('[usePurchaseOrders]', error); throw error }
      return data as PurchaseOrder[]
    },
  })
}

// ─── Detalle de OC ────────────────────────────────────────────────────────────

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name, rtn, phone, email, contact_name),
          purchase_order_items(
            *,
            products(name, code, unit)
          )
        `)
        .eq('id', id)
        .single()
      if (error) { console.error('[usePurchaseOrder]', error); throw error }
      return data as PurchaseOrder & {
        suppliers: {
          name: string; rtn: string | null
          phone: string | null; email: string | null
          contact_name: string | null
        }
        purchase_order_items: (PurchaseOrderItem & {
          products: { name: string; code: string; unit: string }
        })[]
      }
    },
    enabled: !!id,
  })
}

// ─── Crear OC ─────────────────────────────────────────────────────────────────

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      supplier_id:    string
      supplier_name:  string
      warehouse_id?:  string
      expected_date?: string
      payment_terms?: string
      notes?:         string
      items:          PurchaseOrderItemForm[]
    }) => {
      const companyId = await getCompanyId()
      const { data: { user } } = await supabase.auth.getUser()

      // Calcular totales
      let subtotal = 0
      let isv_amount = 0
      const itemsToInsert = params.items.map(item => {
        const base        = item.quantity * item.unit_cost
        const discount    = base * (item.discount_pct / 100)
        const net         = base - discount
        const isv         = net * (item.isv_rate / 100)
        const line_total  = net + isv
        subtotal         += net
        isv_amount       += isv
        return {
          product_id:      item.product_id,
          quantity:        item.quantity,
          qty_received:    0,
          unit_cost:       item.unit_cost,
          isv_rate:        item.isv_rate,
          isv_amount:      Math.round(isv * 100) / 100,
          discount_pct:    item.discount_pct,
          discount_amount: Math.round(discount * 100) / 100,
          line_total:      Math.round(line_total * 100) / 100,
        }
      })
      const total = Math.round((subtotal + isv_amount) * 100) / 100
      subtotal    = Math.round(subtotal * 100) / 100
      isv_amount  = Math.round(isv_amount * 100) / 100

      // Insertar cabecera OC
      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .insert({
          company_id:    companyId,
          supplier_id:   params.supplier_id,
          warehouse_id:  params.warehouse_id ?? null,
          status:        'borrador',
          order_date:    new Date().toISOString().split('T')[0],
          expected_date: params.expected_date ?? null,
          payment_terms: params.payment_terms ?? null,
          subtotal,
          isv_amount,
          discount_amount: 0,
          total,
          notes:           params.notes ?? null,
          created_by:      user?.id ?? null,
        })
        .select()
        .single()

      if (poErr) { console.error('[useCreatePurchaseOrder]', poErr); throw poErr }

      // Insertar líneas
      const { error: itemsErr } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert.map(i => ({ ...i, po_id: po.id })))

      if (itemsErr) {
        // Rollback: borrar la OC
        await supabase.from('purchase_orders').delete().eq('id', po.id)
        console.error('[useCreatePurchaseOrder] items error', itemsErr)
        throw itemsErr
      }

      return po as PurchaseOrder
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}

// ─── Cambiar estado de OC ─────────────────────────────────────────────────────

export function useUpdatePOStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      po_id:  string
      status: 'enviada' | 'cancelada'
    }) => {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: params.status })
        .eq('id', params.po_id)
      if (error) { console.error('[useUpdatePOStatus]', error); throw error }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', vars.po_id] })
    },
  })
}

// ─── Recibir OC ───────────────────────────────────────────────────────────────
// Llama a la función SQL `receive_purchase_order` y luego genera asiento contable.

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      po_id:         string
      po_number:     number
      supplier_name: string
      items:         { item_id: string; qty_received: number }[]
      total_received: number   // monto total de lo recibido para el asiento
    }) => {
      const { data: { user } } = await supabase.auth.getUser()

      // 1 — Llamar función SQL de recepción
      const { data, error } = await supabase.rpc('receive_purchase_order', {
        p_po_id:       params.po_id,
        p_received_by: user?.id ?? null,
        p_items:       params.items,
      })

      if (error) { console.error('[useReceivePurchaseOrder]', error); throw error }
      if (!data?.success) throw new Error(data?.error ?? 'Error al recibir OC')

      // 2 — Asiento contable automático (best-effort)
      if (params.total_received > 0) {
        await tryCreateJournalEntry(
          buildPurchaseOrderJournalEntry({
            poId:         params.po_id,
            poNumber:     `OC-${String(params.po_number).padStart(5, '0')}`,
            date:         new Date().toISOString().split('T')[0],
            supplierName: params.supplier_name,
            total:        params.total_received,
          })
        )
      }

      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', vars.po_id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}
