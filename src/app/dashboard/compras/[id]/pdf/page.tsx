import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PurchaseOrderPDF } from '@/components/orders/purchase-order-pdf'

export const dynamic = 'force-dynamic'

export default async function PurchaseOrderPDFPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: po } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers(name, rtn, phone, email, address, city, department),
      purchase_order_items(
        *,
        products(code, name, unit)
      )
    `)
    .eq('id', id)
    .single()

  if (!po) notFound()

  // Obtener datos de la empresa
  const { data: profile } = await supabase.auth.getUser()
  const { data: companyProfile } = await supabase
    .from('profiles')
    .select('company_id, companies(name, rtn, address, phone, email)')
    .eq('id', profile.user!.id)
    .single()

  const company = (companyProfile?.companies as any) ?? {}

  return <PurchaseOrderPDF po={po} company={company} />
}
