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
    .select('full_name, role, is_superadmin, company_id, companies(name, active, modules)')
    .eq('id', user.id)
    .single()

  // Si la empresa está inactiva y no es superadmin → pantalla suspendida
  const company = (profile?.companies as any)
  if (!profile?.is_superadmin && company && !company.active) {
    redirect('/suspendida')
  }

  // Si no tiene empresa asignada y no es superadmin → error
  if (!profile?.is_superadmin && !profile?.company_id) {
    redirect('/sin-empresa')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f5f7f7' }}>
      <Sidebar
        userName={profile?.full_name ?? user.email ?? 'Usuario'}
        userRole={(profile?.role ?? 'vendedor') as UserRole}
        isSuperAdmin={profile?.is_superadmin ?? false}
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