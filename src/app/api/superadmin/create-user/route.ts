import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // Verificar que quien llama es superadmin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_superadmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { email, password, full_name, company_id, phone } = await req.json()

    if (!email || !password || !full_name || !company_id) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Crear usuario con Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, company_id },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Actualizar profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        role:       'admin',
        company_id,
        phone:      phone || null,
      })
      .eq('id', newUser.user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ id: newUser.user.id, email })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}