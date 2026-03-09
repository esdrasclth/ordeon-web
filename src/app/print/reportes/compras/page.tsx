import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, getPeriodDates, getPeriodLabel, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const sp         = await searchParams
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await authClient
    .from('profiles').select('company_id, companies(name, rtn, address, phone)')
    .eq('id', user.id).single()

  const cid         = profile?.company_id
  const company     = (profile?.companies as any) ?? {}
  const { start, end } = getPeriodDates(sp.period ?? 'month', sp.from, sp.to)
  const periodLabel = getPeriodLabel(sp.period ?? 'month', sp.from, sp.to)
  const supabase    = createAdminClient()

  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('po_number, order_date, status, subtotal, isv_amount, total, suppliers(name, rtn)')
    .eq('company_id', cid!)
    .gte('order_date', start.split('T')[0])
    .lte('order_date', end.split('T')[0])
    .order('order_date', { ascending: false })

  const orders       = pos ?? []
  const active       = orders.filter(p => p.status !== 'cancelada')
  const totalSub     = active.reduce((s, p) => s + Number(p.subtotal ?? 0), 0)
  const totalIsv     = active.reduce((s, p) => s + Number((p as any).isv_amount ?? 0), 0)
  const totalGeneral = active.reduce((s, p) => s + Number(p.total ?? 0), 0)

  const STATUS_LABELS: Record<string, string> = {
    borrador: 'Borrador', enviada: 'Enviada', recibida_parcial: 'Rec. Parcial',
    recibida: 'Recibida', cancelada: 'Cancelada',
  }

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Reporte de Compras — {company.name}</title>
        <style>{BASE_CSS}</style>
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
            {company.rtn && <span>RTN: {company.rtn}</span>}
            <span>Reporte de Compras</span>
            <span>Período: {periodLabel}</span>
            <span>Generado: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="val">{orders.length}</div>
            <div className="lbl">Total OC</div>
          </div>
          <div className="summary-card">
            <div className="val">{fmt(totalSub)}</div>
            <div className="lbl">Subtotal</div>
          </div>
          <div className="summary-card">
            <div className="val">{fmt(totalIsv)}</div>
            <div className="lbl">ISV</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#9b59b6' }}>
            <div className="val" style={{ color: '#9b59b6' }}>{fmt(totalGeneral)}</div>
            <div className="lbl">Total comprado</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Reporte de Compras · {periodLabel}</h2>
          <table>
            <thead>
              <tr>
                <th>OC N°</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>RTN Proveedor</th>
                <th>Estado</th>
                <th className="right">Subtotal (HNL)</th>
                <th className="right">ISV (HNL)</th>
                <th className="right">Total (HNL)</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9b59b6' }}>
                    OC-{String(p.po_number).padStart(5, '0')}
                  </td>
                  <td>{p.order_date}</td>
                  <td style={{ fontWeight: 600 }}>{(p.suppliers as any)?.name ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{(p.suppliers as any)?.rtn ?? '—'}</td>
                  <td>
                    <span className={`badge ${
                      p.status === 'recibida' ? 'badge-green' :
                      p.status === 'cancelada' ? 'badge-red' :
                      p.status === 'enviada' ? 'badge-blue' : 'badge-yellow'
                    }`}>{STATUS_LABELS[p.status] ?? p.status}</span>
                  </td>
                  <td className="right">{fmt(p.subtotal)}</td>
                  <td className="right">{fmt((p as any).isv_amount)}</td>
                  <td className="right" style={{ fontWeight: 700 }}>{fmt(p.total)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={5} className="right">TOTALES (excl. canceladas)</td>
                <td className="right">{fmt(totalSub)}</td>
                <td className="right">{fmt(totalIsv)}</td>
                <td className="right">{fmt(totalGeneral)}</td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Total de registros: {orders.length}</p>
        </div>
      </body>
    </html>
  )
}
