import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role bypasses RLS — needed because admins can't PATCH companies directly
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        // Verificar que el usuario es admin de esta empresa
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.company_id) {
            return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 })
        }

        const { name, rtn, phone, address } = await req.json()

        // 1. Actualizar la empresa con service role (bypasa RLS)
        const { error: companyError } = await supabaseAdmin
            .from('companies')
            .update({
                name: name || undefined,
                rtn: rtn || null,
                phone: phone || null,
                address: address || null,
            })
            .eq('id', profile.company_id)

        if (companyError) {
            return NextResponse.json({ error: companyError.message }, { status: 400 })
        }

        // 2. Sincronizar a settings para que aparezca en /dashboard/configuracion
        const settingsToSync: { key: string; value: string }[] = []
        if (name) settingsToSync.push({ key: 'company_name', value: name })
        if (phone) settingsToSync.push({ key: 'company_phone', value: phone })
        if (address) settingsToSync.push({ key: 'company_address', value: address })
        if (rtn) settingsToSync.push({ key: 'company_rtn', value: rtn })

        await Promise.all(
            settingsToSync.map(({ key, value }) =>
                supabase.rpc('update_setting', { p_key: key, p_value: value })
            )
        )

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
