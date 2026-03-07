import { createClient } from '@/lib/supabase/server'
import { FacturacionClient } from '@/components/facturacion/facturacion-client'

export const dynamic = 'force-dynamic'

export default async function FacturacionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const { data: config } = await supabase
    .from('invoice_configs')
    .select('*')
    .eq('company_id', profile!.company_id)
    .single()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(name, rtn)')
    .eq('company_id', profile!.company_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <FacturacionClient
      config={config ?? null}
      invoices={invoices ?? []}
      companyId={profile!.company_id}
    />
  )
}