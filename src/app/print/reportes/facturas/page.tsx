import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, getPeriodDates, getPeriodLabel, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintFacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const sp         = await searchParams
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await authClient
    .from('profiles').select('company_id, companies(name, rtn)')
    .eq('id', user.id).single()

  const cid         = profile?.company_id
  const company     = (profile?.companies as any) ?? {}
  const { start, end } = getPeriodDates(sp.period ?? 'month', sp.from, sp.to)
  const periodLabel = getPeriodLabel(sp.period ?? 'month', sp.from, sp.to)
  const supabase    = createAdminClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number, issued_at, due_date, status, subtotal, isv_amount, total, clients(name, rtn)')
    .eq('company_id', cid!)
    .gte('issued_at', start)
    .lte('issued_at', end)
    .order('issued_at', { ascending: false })

  const invs        = invoices ?? []
  const active      = invs.filter(i => i.status !== 'anulada')
  const totalSub    = active.reduce((s, i) => s + Number(i.subtotal ?? 0), 0)
  const totalIsv    = active.reduce((s, i) => s + Number(i.isv_amount ?? 0), 0)
  const totalGeneral = active.reduce((s, i) => s + Number(i.total ?? 0), 0)

  const STATUS_COLOR: Record<string, string> = {
    emitida: 'badge-blue', pendiente: 'badge-yellow',
    pagada: 'badge-green', anulada: 'badge-red',
  }

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Facturas Emitidas — {company.name}</title>
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
            <span>Facturas Emitidas</span>
            <span>Período: {periodLabel}</span>
            <span>Generado: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card"><div className="val">{invs.length}</div><div className="lbl">Total facturas</div></div>
          <div className="summary-card"><div className="val">{fmt(totalSub)}</div><div className="lbl">Subtotal</div></div>
          <div className="summary-card" style={{ borderColor: '#e67e22' }}>
            <div className="val" style={{ color: '#e67e22' }}>{fmt(totalIsv)}</div>
            <div className="lbl">ISV 15%</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#2980b9' }}>
            <div className="val" style={{ color: '#2980b9' }}>{fmt(totalGeneral)}</div>
            <div className="lbl">Total facturado</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Facturas Emitidas · {periodLabel}</h2>
          <table>
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Fecha Emisión</th>
                <th>Vencimiento</th>
                <th>Cliente</th>
                <th>RTN</th>
                <th>Estado</th>
                <th className="right">Subtotal</th>
                <th className="right">ISV 15%</th>
                <th className="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invs.map((inv, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2980b9' }}>
                    {inv.invoice_number ?? '—'}
                  </td>
                  <td>{new Date(inv.issued_at).toLocaleDateString('es-HN')}</td>
                  <td>{(inv as any).due_date ? new Date((inv as any).due_date).toLocaleDateString('es-HN') : '—'}</td>
                  <td style={{ fontWeight: 600 }}>{(inv.clients as any)?.name ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{(inv.clients as any)?.rtn ?? '—'}</td>
                  <td><span className={`badge ${STATUS_COLOR[inv.status] ?? 'badge-gray'}`}>{inv.status}</span></td>
                  <td className="right">{fmt(inv.subtotal)}</td>
                  <td className="right">{fmt(inv.isv_amount)}</td>
                  <td className="right" style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={6} className="right">TOTALES</td>
                <td className="right">{fmt(totalSub)}</td>
                <td className="right">{fmt(totalIsv)}</td>
                <td className="right">{fmt(totalGeneral)}</td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Total de registros: {invs.length}</p>
        </div>
      </body>
    </html>
  )
}
