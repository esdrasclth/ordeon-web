'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { SupplierPayment } from '@/types'
import {
  tryCreateJournalEntry,
  buildSupplierPaymentJournalEntry,
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

// ─── Lista de pagos ───────────────────────────────────────────────────────────

export function useSupplierPayments(supplierId?: string, poId?: string) {
  return useQuery({
    queryKey: ['supplier-payments', supplierId, poId],
    queryFn: async () => {
      const companyId = await getCompanyId()
      let query = supabase
        .from('supplier_payments')
        .select('*, suppliers(name)')
        .eq('company_id', companyId)
        .order('payment_date', { ascending: false })

      if (supplierId) query = query.eq('supplier_id', supplierId)
      if (poId)       query = query.eq('po_id', poId)

      const { data, error } = await query
      if (error) { console.error('[useSupplierPayments]', error); throw error }
      return data as SupplierPayment[]
    },
  })
}

// ─── Registrar pago a proveedor ───────────────────────────────────────────────

export function useCreateSupplierPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      supplier_id: string
      supplier_name: string
      po_id?: string
      po_number?: string
      amount: number
      payment_date: string
      payment_method: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'otro'
      reference?: string
      notes?: string
    }) => {
      const companyId = await getCompanyId()
      const { data: { user } } = await supabase.auth.getUser()

      // 1 — Insertar pago
      const { data, error } = await supabase
        .from('supplier_payments')
        .insert({
          company_id:     companyId,
          supplier_id:    params.supplier_id,
          po_id:          params.po_id ?? null,
          amount:         params.amount,
          payment_date:   params.payment_date,
          payment_method: params.payment_method,
          reference:      params.reference ?? null,
          notes:          params.notes ?? null,
          created_by:     user?.id ?? null,
        })
        .select()
        .single()

      if (error) { console.error('[useCreateSupplierPayment]', error); throw error }

      // 2 — Asiento contable automático (best-effort, no bloquea)
      await tryCreateJournalEntry(
        buildSupplierPaymentJournalEntry({
          paymentId:     data.id,
          poNumber:      params.po_number,
          date:          params.payment_date,
          supplierName:  params.supplier_name,
          amount:        params.amount,
          paymentMethod: params.payment_method,
        })
      )

      return data as SupplierPayment
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', vars.po_id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}
