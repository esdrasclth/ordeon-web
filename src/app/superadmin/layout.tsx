import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuperAdminNav } from '@/components/superadmin/superadmin-nav'
import { LogOut } from 'lucide-react'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: '#f0f5f5' }}>
      {/* Top bar */}
      <header style={{ background: '#031926', borderBottom: '1px solid rgba(70,129,137,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 18 }}>
              Ord<span style={{ color: '#468189' }}>eon</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(217,79,79,0.2)', color: '#d94f4f', border: '1px solid rgba(217,79,79,0.3)' }}>
              SUPERADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(70,129,137,0.3)', color: '#9DBEBB' }}>
                {(profile.full_name ?? 'S').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs" style={{ color: '#9DBEBB' }}>
                {profile.full_name}
              </span>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button type="submit"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'rgba(217,79,79,0.15)', color: '#f87171', border: '1px solid rgba(217,79,79,0.2)' }}>
                <LogOut className="w-3 h-3" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="flex max-w-7xl mx-auto">
        <SuperAdminNav />
        <main className="flex-1 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}