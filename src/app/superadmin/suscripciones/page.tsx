import { createClient } from '@/lib/supabase/server'
import { SuscripcionesClient } from '@/components/superadmin/suscripciones-client'

export const dynamic = 'force-dynamic'

export default async function SuscripcionesPage() {
  const supabase = await createClient()

  const [{ data: subscriptions }, { data: payments }] = await Promise.all([
    supabase.from('subscriptions')
      .select('*, companies(name, email, active, plan)')
      .order('created_at', { ascending: false }),
    supabase.from('platform_payments')
      .select('*, companies(name)')
      .order('payment_date', { ascending: false })
      .limit(50),
  ])

  return <SuscripcionesClient subscriptions={subscriptions ?? []} payments={payments ?? []} />
}
