'use client'

import { useState } from 'react'
import { CreditCard, Plus, X } from 'lucide-react'

interface Subscription {
  id: string; company_id: string; status: string; plan: string
  amount_monthly: number; current_period_end: string | null; trial_ends_at: string | null
  companies: { name: string; email: string | null; active: boolean; plan: string } | null
}
interface Payment {
  id: string; company_id: string; amount: number; payment_date: string
  payment_method: string; reference: string | null
  companies: { name: string } | null
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  activa:     { label: 'Activa',      color: '#22c55e' },
  suspendida: { label: 'Suspendida',  color: '#f59e0b' },
  cancelada:  { label: 'Cancelada',   color: '#ef4444' },
  prueba:     { label: 'Prueba',      color: '#3b82f6' },
}
const fmt = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
const fmtDate = (s: string | null) => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-HN') : '—'

export function SuscripcionesClient({ subscriptions, payments }: {
  subscriptions: Subscription[]; payments: Payment[]
}) {
  const [tab, setTab]   = useState<'subs' | 'pagos'>('subs')
  const [showPay, setShowPay] = useState(false)

  const mrr = subscriptions.filter(s => s.status === 'activa').reduce((s, sub) => s + Number(sub.amount_monthly ?? 0), 0)
  const activas = subscriptions.filter(s => s.status === 'activa').length
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)

  const tabStyle = (t: typeof tab): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: tab === t ? '#031926' : 'transparent',
    color: tab === t ? '#F4E9CD' : '#64748b', border: 'none',
  })

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Suscripciones y Pagos
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Gestión de facturación de la plataforma Ordeon
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'MRR', value: fmt(mrr), color: '#22c55e' },
          { label: 'Suscripciones activas', value: activas, color: '#468189' },
          { label: 'Total cobrado (historial)', value: fmt(totalPaid), color: '#2980b9' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-5"
            style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
            <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: 'Georgia, serif' }}>{k.value}</p>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl self-start" style={{ background: '#f1f5f9', width: 'fit-content' }}>
        <button style={tabStyle('subs')}   onClick={() => setTab('subs')}>Suscripciones</button>
        <button style={tabStyle('pagos')}  onClick={() => setTab('pagos')}>Historial de Pagos</button>
      </div>

      {tab === 'subs' && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(70,129,137,0.12)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Empresa', 'Plan', 'Estado', 'Mensualidad', 'Vence', 'Prueba hasta'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#94a3b8' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {subscriptions.map((s, i) => {
                const sc = STATUS_CFG[s.status] ?? { label: s.status, color: '#888' }
                return (
                  <tr key={s.id} className="hover:bg-slate-50"
                    style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: '#1e293b' }}>{s.companies?.name ?? '—'}</p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{s.companies?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-sm">{s.plan}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `${sc.color}18`, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{fmt(Number(s.amount_monthly ?? 0))}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>{fmtDate(s.current_period_end)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>{fmtDate(s.trial_ends_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pagos' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowPay(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#468189,#031926)', color: '#fff' }}>
              <Plus className="w-4 h-4" /> Registrar Pago
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(70,129,137,0.12)' }}>
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Empresa', 'Fecha', 'Método', 'Referencia', 'Monto'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#94a3b8' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {payments.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: '#94a3b8' }}>
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin pagos registrados
                  </td></tr>
                )}
                {payments.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50"
                    style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1e293b' }}>{p.companies?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>{fmtDate(p.payment_date)}</td>
                    <td className="px-4 py-3 capitalize text-sm">{p.payment_method}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#94a3b8' }}>{p.reference ?? '—'}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#22c55e' }}>{fmt(Number(p.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
