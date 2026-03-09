import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Users, CreditCard, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatCard({ label, value, sub, color, icon: Icon, href }: {
  label: string; value: string | number; sub?: string
  color: string; icon: React.ElementType; href?: string
}) {
  const inner = (
    <div className="rounded-2xl p-5 h-full transition-all hover:shadow-md"
      style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold" style={{ color, fontFamily: 'Georgia, serif' }}>{value}</p>
      <p className="text-sm font-semibold mt-1" style={{ color: '#475569' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{sub}</p>}
    </div>
  )
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner
}

export default async function SuperAdminPage() {
  const supabase = await createClient()

  const [
    { data: companies },
    { data: allProfiles },
    { data: recentCompanies },
    { data: subscriptions },
    { data: recentPayments },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('companies').select('id, name, active, plan, modules, created_at, email').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, role, company_id, is_superadmin').eq('is_superadmin', false),
    supabase.from('companies').select('id, name, active, plan, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
    supabase.from('platform_payments').select('amount, payment_date, companies(name)').order('payment_date', { ascending: false }).limit(5),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(6),
  ])

  const total      = companies?.length ?? 0
  const activas    = companies?.filter(c => c.active).length ?? 0
  const inactivas  = companies?.filter(c => !c.active).length ?? 0
  const totalUsers = allProfiles?.length ?? 0

  // MRR del array de subscriptions
  const mrr = (subscriptions ?? [])
    .filter(s => s.status === 'activa')
    .reduce((sum, s) => sum + Number(s.amount_monthly ?? 0), 0)

  // Empresas creadas este mes
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = (companies ?? []).filter(c => new Date(c.created_at) >= startOfMonth).length

  const PLAN_COLORS: Record<string, string> = {
    basico: '#468189', profesional: '#2980b9', enterprise: '#9b59b6', gratis: '#94a3b8'
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          Dashboard del Sistema
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Resumen global de Ordeon ERP · {new Date().toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Empresas Activas" value={activas} sub={`${inactivas} inactivas · ${total} total`}
          color="#27ae60" icon={CheckCircle} href="/superadmin/empresas" />
        <StatCard label="Usuarios Totales" value={totalUsers} sub="en todas las empresas"
          color="#2980b9" icon={Users} href="/superadmin/usuarios" />
        <StatCard label="MRR Estimado" value={`L. ${mrr.toLocaleString('es-HN', { minimumFractionDigits: 0 })}`} sub="ingresos mensuales"
          color="#468189" icon={CreditCard} href="/superadmin/suscripciones" />
        <StatCard label="Nuevas este mes" value={newThisMonth} sub={`de ${total} empresas`}
          color="#e67e22" icon={TrendingUp} href="/superadmin/empresas" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Empresas recientes */}
        <div className="xl:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: '#468189' }} />
              <h3 className="font-bold text-sm" style={{ color: '#031926' }}>Empresas Recientes</h3>
            </div>
            <Link href="/superadmin/empresas" className="text-xs font-semibold" style={{ color: '#468189' }}>
              Ver todas →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Empresa', 'Plan', 'Estado', 'Creada'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentCompanies ?? []).map((c, i) => (
                <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #f8fafc' : undefined }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#1e293b' }}>{c.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: `${PLAN_COLORS[c.plan] ?? '#94a3b8'}15`, color: PLAN_COLORS[c.plan] ?? '#94a3b8' }}>
                      {c.plan ?? 'basico'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: c.active ? '#22c55e15' : '#ef444415', color: c.active ? '#22c55e' : '#ef4444' }}>
                      {c.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                    {new Date(c.created_at).toLocaleDateString('es-HN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Módulos más usados */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
          <h3 className="font-bold text-sm" style={{ color: '#031926' }}>Módulos más usados</h3>
          {(() => {
            const counts: Record<string, number> = {}
            ;(companies ?? []).forEach(c => {
              ;(c.modules ?? []).forEach((m: string) => { counts[m] = (counts[m] ?? 0) + 1 })
            })
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
            const max = sorted[0]?.[1] ?? 1
            return sorted.map(([mod, count]) => (
              <div key={mod}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color: '#475569' }}>{mod}</span>
                  <span style={{ color: '#94a3b8' }}>{count} empresas</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 5, background: '#f1f5f9' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(count / max) * 100}%`, background: '#468189' }} />
                </div>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Últimos pagos + distribución de planes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" style={{ color: '#468189' }} />
              <h3 className="font-bold text-sm" style={{ color: '#031926' }}>Últimos Pagos</h3>
            </div>
            <Link href="/superadmin/suscripciones" className="text-xs font-semibold" style={{ color: '#468189' }}>
              Ver todos →
            </Link>
          </div>
          {(recentPayments ?? []).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm" style={{ color: '#94a3b8' }}>
              Sin pagos registrados aún
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#f8fafc' }}>
                {['Empresa', 'Fecha', 'Monto'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#94a3b8' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(recentPayments ?? []).map((p, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? '1px solid #f8fafc' : undefined }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1e293b' }}>
                      {(p as any).companies?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                      {new Date(p.payment_date + 'T00:00:00').toLocaleDateString('es-HN')}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#27ae60' }}>
                      L. {Number(p.amount).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Distribución por plan */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
          <h3 className="font-bold text-sm" style={{ color: '#031926' }}>Distribución por Plan</h3>
          {(() => {
            const counts: Record<string, number> = {}
            ;(companies ?? []).forEach(c => {
              const p = c.plan ?? 'basico'
              counts[p] = (counts[p] ?? 0) + 1
            })
            return Object.entries(counts).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: PLAN_COLORS[plan] ?? '#94a3b8' }} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold capitalize">{plan}</span>
                    <span style={{ color: '#94a3b8' }}>{count} empresa{count !== 1 ? 's' : ''} · {Math.round((count / total) * 100)}%</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 6, background: '#f1f5f9' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${(count / total) * 100}%`, background: PLAN_COLORS[plan] ?? '#94a3b8' }} />
                  </div>
                </div>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Auditoría reciente */}
      {(recentLogs ?? []).length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <h3 className="font-bold text-sm" style={{ color: '#031926' }}>Actividad Reciente</h3>
            </div>
            <Link href="/superadmin/auditoria" className="text-xs font-semibold" style={{ color: '#468189' }}>
              Ver todo →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
            {(recentLogs ?? []).map((log, i) => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-3" style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#468189' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{log.action}</p>
                  {log.details && (
                    <p className="text-xs" style={{ color: '#94a3b8' }}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details).slice(0, 80) : log.details}
                    </p>
                  )}
                </div>
                <p className="text-xs flex-shrink-0" style={{ color: '#94a3b8' }}>
                  {new Date(log.created_at).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}