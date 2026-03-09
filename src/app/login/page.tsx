'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package2, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single()

    if (profile?.is_superadmin) {
      router.push('/superadmin')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #031926 0%, #062333 50%, #0a3a50 100%)' }}>

      {/* Círculos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#468189' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#77ACA2' }} />
      </div>

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: '#468189' }}>
            <Package2 className="w-8 h-8" style={{ color: '#F4E9CD' }} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif' }}>
            Ordeon
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#9DBEBB' }}>
            Sistema de Gestión Empresarial
          </p>
        </div>

        <Card className="border-0 shadow-2xl" style={{ background: 'rgba(255,255,255,0.97)' }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl" style={{ color: '#031926' }}>
              Iniciar Sesión
            </CardTitle>
            <CardDescription style={{ color: '#5a7a7e' }}>
              Ingresa tus credenciales para continuar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                  style={{ background: '#fef2f2', color: '#d94f4f', border: '1px solid #fca5a5' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: '#031926', fontWeight: 600 }}>
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11"
                  style={{ borderColor: '#d0e0de' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: '#031926', fontWeight: 600 }}>
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11"
                  style={{ borderColor: '#d0e0de' }}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold mt-2"
                disabled={loading}
                style={{ background: '#468189', color: '#F4E9CD' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>

            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs mt-6" style={{ color: '#468189' }}>
          ¿Problemas para ingresar? Contacta al administrador del sistema.
        </p>

      </div>
    </div>
  )
}