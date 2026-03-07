import { createClient } from '@/lib/supabase/server'
import { NewInvoicePage } from '@/components/facturacion/new-invoice-page'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NuevaFacturaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const companyId = profile!.company_id

  // Verificar que tenga CAI configurado
  const { data: config } = await supabase
    .from('invoice_configs')
    .select('*')
    .eq('company_id', companyId)
    .single()

  if (!config || new Date(config.cai_expires_at) < new Date()) {
    redirect('/dashboard/facturacion?error=cai')
  }

  // Cargar clientes activos
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, rtn, address, email, phone, price_list')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('name')

  // Cargar productos activos
  const { data: products } = await supabase
    .from('products')
    .select('id, code, name, unit, price_a, price_b, price_c, stock')
    .eq('company_id', companyId)
    .eq('active', true)
    .order('name')

  // Cargar órdenes despachadas sin facturar
  const { data: orders } = await supabase
    .from('sales_orders')
    .select('id, order_number, client_id, total, order_date, sales_order_items(product_id, quantity, unit_price, discount_pct, line_total, products(id, code, name, unit))')
    .eq('company_id', companyId)
    .eq('status', 'despachada')
    .is('invoice_number', null)
    .order('order_number', { ascending: false })

  return (
    <NewInvoicePage
      config={config}
      clients={clients ?? []}
      products={products ?? []}
      orders={orders ?? []}
      companyId={companyId}
    />
  )
}