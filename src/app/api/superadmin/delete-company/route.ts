import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { company_id, password } = await req.json()

    // Verificar contraseña re-autenticando
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 })
    }

    // Obtener usuarios de la empresa para borrarlos de auth
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('company_id', company_id)
      .eq('is_superadmin', false)

    // Borrar en cascada via RPC
    const { error: rpcError } = await supabase.rpc('superadmin_delete_company', {
      p_company_id:    company_id,
      p_admin_email:   session.user.email,
      p_admin_password: password,
    })

    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 400 })

    // Borrar usuarios de auth.users
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        await supabaseAdmin.auth.admin.deleteUser(profile.id)
      }
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}