'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SuspendidaPage() {
  const supabase = createClient()
  const router   = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#031926' }}>
      <div className="text-center max-w-md px-8">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold mb-3"
          style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif' }}>
          Cuenta suspendida
        </h1>
        <p className="text-sm mb-6" style={{ color: '#9DBEBB', lineHeight: 1.7 }}>
          Tu cuenta ha sido suspendida temporalmente. Por favor contacta a soporte para regularizar tu situación.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <a href="mailto:soporte@brandsoft.app"
            className="inline-block px-6 py-3 rounded-lg text-sm font-semibold w-full"
            style={{ background: '#468189', color: '#F4E9CD' }}>
            Contactar soporte
          </a>
          <button onClick={handleLogout}
            className="text-sm px-6 py-3 rounded-lg w-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#9DBEBB', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cerrar sesión e iniciar con otra cuenta
          </button>
        </div>
      </div>
    </div>
  )
}