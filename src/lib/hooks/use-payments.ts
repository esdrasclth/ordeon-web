'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { tryCreateJournalEntry, buildPaymentJournalEntry } from '@/lib/accounting-integration'

const supabase = createClient()

async function getContext() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return { userId: user.id, companyId: profile.company_id }
}

export interface ClientPayment {
  id: string
  invoice_id: string
  client_id: string
  payment_date: string
  amount: number
  payment_method: string
  reference: string | null
  notes: string | null
  created_at: string
}

/** Lista todos los cobros de una factura específica */
export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return data as ClientPayment[]
    },
    enabled: !!invoiceId,
  })
}

/** Registra un cobro: llama al RPC y luego crea el asiento contable */
export function useRegisterPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      invoice_id: string
      invoice_number: string
      client_name: string
      amount: number
      payment_date: string
      payment_method: string
      reference?: string
      notes?: string
    }) => {
      const { invoice_id, invoice_number, client_name, amount, payment_date, payment_method, reference, notes } = params

      // 1. Registrar cobro en BD (actualiza saldo, payment_status, client balance)
      const { data: paymentId, error } = await supabase.rpc('register_payment', {
        p_invoice_id:     invoice_id,
        p_amount:         amount,
        p_payment_date:   payment_date,
        p_payment_method: payment_method,
        p_reference:      reference ?? null,
        p_notes:          notes ?? null,
      })
      if (error) throw error

      // 2. Asiento contable best-effort
      await tryCreateJournalEntry(
        buildPaymentJournalEntry({
          paymentId: typeof paymentId === 'string' ? paymentId : String(paymentId),
          invoiceNumber: invoice_number,
          date: payment_date,
          clientName: client_name,
          amount,
          paymentMethod: payment_method,
        })
      )

      return paymentId
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['payments', vars.invoice_id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
