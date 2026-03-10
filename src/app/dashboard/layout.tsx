import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { UserRole } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_superadmin, company_id, onboarding_completed, companies(name, active, modules)')
    .eq('id', user.id)
    .single()

  // Sin perfil (ej: perfil eliminado accidentalmente) → reiniciar sesión
  if (!profile) redirect('/login')

  // Superadmin: siempre va al panel de superadmin, sin importar si tiene empresa o no
  if (profile.is_superadmin) redirect('/superadmin')

  // Empresa inactiva → pantalla suspendida
  const company = (profile.companies as any)
  if (company && !company.active) redirect('/suspendida')

  // Sin empresa asignada → error
  if (!profile.company_id) redirect('/sin-empresa')

  // Primer login del admin → onboarding obligatorio
  if (profile.role === 'admin' && profile.onboarding_completed === false) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f5f7f7' }}>
      <Sidebar
        userName={profile.full_name ?? user.email ?? 'Usuario'}
        userRole={(profile.role ?? 'vendedor') as UserRole}
        isSuperAdmin={false}
        companyName={company?.name ?? ''}
        modules={company?.modules ?? ['core']}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}