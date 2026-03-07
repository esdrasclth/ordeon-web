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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id, role, is_superadmin')
      .eq('id', session.user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 })
    }

    if (profile.role !== 'admin' && !profile.is_superadmin) {
      return NextResponse.json({ error: 'Solo administradores pueden configurar el CAI' }, { status: 403 })
    }

    const body = await req.json()
    const { action, ...data } = body

    if (action === 'upsert') {
      const rangeStart = parseInt(data.range_from?.split('-').pop() ?? '1', 10)

      const { data: existing } = await supabaseAdmin
        .from('invoice_configs')
        .select('id, range_from')
        .eq('company_id', profile.company_id)
        .single()

      if (existing) {
        // Solo resetear correlativo si cambió el rango
        const rangeChanged = existing.range_from !== data.range_from

        const { error } = await supabaseAdmin
          .from('invoice_configs')
          .update({
            ...data,
            ...(rangeChanged ? { current_correlative: rangeStart } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', profile.company_id)

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      } else {
        const { error } = await supabaseAdmin
          .from('invoice_configs')
          .insert({
            ...data,
            company_id:          profile.company_id,
            current_correlative: rangeStart,
          })

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}