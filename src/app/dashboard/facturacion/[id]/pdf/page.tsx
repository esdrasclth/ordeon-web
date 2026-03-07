import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { InvoicePDF } from '@/components/facturacion/invoice-pdf'

export const dynamic = 'force-dynamic'

export default async function InvoicePDFPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_items(*, products(code, name, unit))')
    .eq('id', id)
    .single()

  if (!invoice) notFound()

  const { data: config } = await supabase
    .from('invoice_configs')
    .select('*')
    .eq('company_id', invoice.company_id)
    .single()

  if (!config) notFound()

  return <InvoicePDF invoice={invoice} config={config} />
}