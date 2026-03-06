import { createClient } from '@/lib/supabase/server'
import { EmpresasClient } from '@/components/superadmin/empresas-client'

export default async function EmpresasPage() {
  const supabase = await createClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  return <EmpresasClient companies={companies ?? []} />
}