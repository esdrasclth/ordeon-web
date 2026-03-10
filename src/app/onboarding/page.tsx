import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export const dynamic = 'force-dynamic'

// Cliente con service role para leer la empresa sin restricciones de RLS
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Perfil del admin (RLS no es problema aquí: cada quien lee su propio perfil)
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, company_id')
        .eq('id', user!.id)
        .single()

    // Empresa: usamos service role para evitar bloqueos de RLS en lectura directa
    const { data: company } = profile?.company_id
        ? await supabaseAdmin
            .from('companies')
            .select('id, name, email, phone, address, rtn, modules')
            .eq('id', profile.company_id)
            .single()
        : { data: null }

    return (
        <OnboardingWizard
            adminName={profile?.full_name ?? ''}
            companyId={company?.id ?? ''}
            companyName={company?.name ?? ''}
            companyEmail={company?.email ?? ''}
            companyPhone={company?.phone ?? ''}
            companyAddress={company?.address ?? ''}
            companyRtn={company?.rtn ?? ''}
            modules={company?.modules ?? ['core']}
        />
    )
}
