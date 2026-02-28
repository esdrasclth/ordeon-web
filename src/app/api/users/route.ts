import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar que quien llama es admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Crear usuario con el cliente admin
    const body = await request.json()
    const { email, password, full_name, role, region, phone } = body

    const adminClient = createAdminClient()

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Actualizar perfil con rol y datos adicionales
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        full_name,
        role,
        region:  region || null,
        phone:   phone  || null,
      })
      .eq('id', newUser.user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, id: newUser.user.id })

  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}