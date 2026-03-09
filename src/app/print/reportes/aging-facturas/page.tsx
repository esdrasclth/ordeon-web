import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintAgingFacturasPage() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await authClient
    .from('profiles').select('company_id, companies(name, rtn)')
    .eq('id', user.id).single()

  const cid      = profile?.company_id
  const company  = (profile?.companies as any) ?? {}
  const supabase = createAdminClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number, issued_at, due_date, status, total, clients(name, rtn, phone)')
    .eq('company_id', cid!)
    .in('status', ['pendiente', 'emitida'])
    .order('issued_at', { ascending: true })

  const now  = new Date()
  const invs = (invoices ?? []).map(inv => {
    const due  = (inv as any).due_date ? new Date((inv as any).due_date) : new Date(inv.issued_at)
    const days = Math.floor((now.getTime() - due.getTime()) / 86400000)
    return { ...inv, due, days }
  }).sort((a, b) => b.days - a.days)

  const grupos = {
    alDia:   invs.filter(i => i.days <= 0),
    g1_30:   invs.filter(i => i.days > 0  && i.days <= 30),
    g31_60:  invs.filter(i => i.days > 30 && i.days <= 60),
    gMas60:  invs.filter(i => i.days > 60),
  }

  const totalPendiente = invs.reduce((s, i) => s + Number(i.total ?? 0), 0)

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Aging Facturas — {company.name}</title>
        <style>{BASE_CSS + `
          .aging-section { margin-bottom: 24px; }
          .aging-header { font-size: 13px; font-weight: 800; margin-bottom: 8px; padding: 6px 8px; border-radius: 6px; }
        `}</style>
      </head>
      <body>
        <div className="controls no-print">
          <button className="btn" style={{ background: '#031926', color: '#F4E9CD' }}
            onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
          <button className="btn" style={{ background: '#f1f5f9', color: '#475569' }}
            onClick={() => window.close()}>Cerrar</button>
        </div>

        <div className="header">
          <div className="logo">Ord<span>eon</span> ERP</div>
          <div className="meta">
            <span><strong>{company.name}</strong></span>
            <span>Aging — Facturas Pendientes de Cobro</span>
            <span>Al: {now.toLocaleDateString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card"><div className="val">{invs.length}</div><div className="lbl">Total pendientes</div></div>
          <div className="summary-card" style={{ borderColor: '#27ae60' }}>
            <div className="val" style={{ color: '#27ae60' }}>{grupos.alDia.length}</div>
            <div className="lbl">Al día</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#e67e22' }}>
            <div className="val" style={{ color: '#e67e22' }}>{grupos.g1_30.length + grupos.g31_60.length}</div>
            <div className="lbl">Vencidas 1-60d</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#dc2626' }}>
            <div className="val" style={{ color: '#dc2626' }}>{grupos.gMas60.length}</div>
            <div className="lbl">Vencidas +60d</div>
          </div>
        </div>

        <div className="container">
          {[
            { label: '+60 días vencida', invList: grupos.gMas60, bg: '#fee2e2', color: '#dc2626' },
            { label: '31-60 días vencida', invList: grupos.g31_60, bg: '#fff7ed', color: '#ea580c' },
            { label: '1-30 días vencida', invList: grupos.g1_30, bg: '#fefce8', color: '#ca8a04' },
            { label: 'Al día (no vencida)', invList: grupos.alDia, bg: '#f0fdf4', color: '#16a34a' },
          ].map(grupo => grupo.invList.length > 0 && (
            <div key={grupo.label} className="aging-section">
              <div className="aging-header" style={{ background: grupo.bg, color: grupo.color }}>
                {grupo.label} — {grupo.invList.length} facturas · {fmt(grupo.invList.reduce((s, i) => s + Number(i.total ?? 0), 0))}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>N° Factura</th>
                    <th>Emisión</th>
                    <th>Vencimiento</th>
                    <th className="right">Días</th>
                    <th>Cliente</th>
                    <th>RTN</th>
                    <th>Teléfono</th>
                    <th className="right">Total (HNL)</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.invList.map((inv, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{inv.invoice_number ?? '—'}</td>
                      <td>{new Date(inv.issued_at).toLocaleDateString('es-HN')}</td>
                      <td>{inv.due.toLocaleDateString('es-HN')}</td>
                      <td className="right" style={{ fontWeight: 700, color: grupo.color }}>
                        {Math.max(0, inv.days)}d
                      </td>
                      <td style={{ fontWeight: 600 }}>{(inv.clients as any)?.name ?? '—'}</td>
                      <td style={{ fontSize: 10 }}>{(inv.clients as any)?.rtn ?? '—'}</td>
                      <td style={{ fontSize: 10 }}>{(inv.clients as any)?.phone ?? '—'}</td>
                      <td className="right" style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <p className="footer">Total pendiente de cobro: {fmt(totalPendiente)} · {invs.length} facturas</p>
        </div>
      </body>
    </html>
  )
}
