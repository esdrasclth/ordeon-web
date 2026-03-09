import { createClient } from '@/lib/supabase/server'
import { UsuariosClient } from '@/components/superadmin/usuarios-client'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const supabase = await createClient()

  // Traer perfiles con email del auth y datos de empresa
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, company_id, is_superadmin, companies(name, active)')
    .eq('is_superadmin', false)
    .order('full_name')

  // Traer emails desde auth.users solo es posible con service_role key
  // Usamos el campo email del profile si existe, o vacío
  const mapped = (profiles ?? []).map(p => ({
    id:             p.id,
    full_name:      p.full_name,
    role:           p.role,
    company_id:     p.company_id,
    company_name:   (p.companies as any)?.name ?? null,
    company_active: (p.companies as any)?.active ?? null,
    email:          (p as any).email ?? null,
  }))

  return <UsuariosClient profiles={mapped} />
}
