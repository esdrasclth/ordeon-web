import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PurchaseOrderPDF } from '@/components/orders/purchase-order-pdf'

export const dynamic = 'force-dynamic'

export default async function PrintPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  // Datos de la empresa del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('companies(name, rtn, address, phone, email)')
    .eq('id', user.id)
    .single()

  const company = (profile?.companies as any) ?? {}

  return <PurchaseOrderPDF po={po} company={company} />
}
