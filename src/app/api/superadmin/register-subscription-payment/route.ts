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

        // Validar superadmin
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_superadmin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_superadmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const { company_id, amount, payment_date, payment_method, reference, next_payment_at } = await req.json()

        if (!company_id || !amount || !payment_date) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }

        // Insertar pago
        const { error: insertError } = await supabaseAdmin
            .from('platform_payments')
            .insert({
                company_id,
                amount,
                payment_date,
                payment_method,
                reference: reference || null
            })

        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

        // Actualizar fecha de vencimiento y estado de empresa si aplica
        if (next_payment_at) {
            const { error: updateError } = await supabaseAdmin
                .from('companies')
                .update({
                    next_payment_at,
                    active: true // Si paga, asumimos que se reactiva su acceso
                })
                .eq('id', company_id)

            if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
