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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id, role, is_superadmin')
      .eq('id', user.id)
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
            business_name: data.business_name,
            commercial_name: data.commercial_name,
            rtn: data.rtn,
            address: data.address,
            phone: data.phone,
            email: data.email,
            cai: data.cai,
            cai_expires_at: data.cai_expires_at,
            range_from: data.range_from,
            range_to: data.range_to,
            isv_rate: data.isv_rate,
            footer_text: data.footer_text,
            updated_at: new Date().toISOString(),
            ...(rangeChanged ? { current_correlative: rangeStart } : {}),
          })
          .eq('company_id', profile.company_id)

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      } else {
        const { error } = await supabaseAdmin
          .from('invoice_configs')
          .insert({
            business_name: data.business_name,
            commercial_name: data.commercial_name,
            rtn: data.rtn,
            address: data.address,
            phone: data.phone,
            email: data.email,
            cai: data.cai,
            cai_expires_at: data.cai_expires_at,
            range_from: data.range_from,
            range_to: data.range_to,
            isv_rate: data.isv_rate,
            footer_text: data.footer_text,
            company_id: profile.company_id,
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