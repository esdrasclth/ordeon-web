import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, getPeriodDates, getPeriodLabel, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintVentasVendedorPage({
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

  const { data: orders } = await supabase
    .from('sales_orders')
    .select('total, status, profiles(full_name)')
    .eq('company_id', cid!)
    .gte('order_date', start)
    .lte('order_date', end)
    .neq('status', 'cancelada')

  const byVend: Record<string, { total: number; ordenes: number }> = {}
  const grandTotal = (orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0)
  ;(orders ?? []).forEach(o => {
    const v = (o.profiles as any)?.full_name ?? 'Sin asignar'
    if (!byVend[v]) byVend[v] = { total: 0, ordenes: 0 }
    byVend[v].total   += Number(o.total ?? 0)
    byVend[v].ordenes += 1
  })
  const ranking = Object.entries(byVend).sort((a, b) => b[1].total - a[1].total)

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Ventas por Vendedor — {company.name}</title>
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
            <span>Ventas por Vendedor</span>
            <span>Período: {periodLabel}</span>
            <span>Generado: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="val">{ranking.length}</div>
            <div className="lbl">Vendedores activos</div>
          </div>
          <div className="summary-card">
            <div className="val">{(orders ?? []).length}</div>
            <div className="lbl">Órdenes totales</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#468189' }}>
            <div className="val" style={{ color: '#468189' }}>{fmt(grandTotal)}</div>
            <div className="lbl">Total vendido</div>
          </div>
          <div className="summary-card">
            <div className="val">{fmt((orders ?? []).length > 0 ? grandTotal / (orders ?? []).length : 0)}</div>
            <div className="lbl">Ticket promedio global</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Ventas por Vendedor · {periodLabel}</h2>
          <table>
            <thead>
              <tr>
                <th className="center">#</th>
                <th>Vendedor</th>
                <th className="right">Órdenes</th>
                <th className="right">Total Ventas (HNL)</th>
                <th className="right">Ticket Promedio</th>
                <th className="right">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(([vendedor, d], i) => (
                <tr key={i}>
                  <td className="center" style={{ fontWeight: 700, color: i < 3 ? '#468189' : '#64748b' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td style={{ fontWeight: 600 }}>{vendedor}</td>
                  <td className="right">{d.ordenes}</td>
                  <td className="right" style={{ fontWeight: 700, color: '#468189' }}>{fmt(d.total)}</td>
                  <td className="right">{fmt(d.ordenes > 0 ? d.total / d.ordenes : 0)}</td>
                  <td className="right">
                    <span style={{ fontWeight: 700 }}>
                      {grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={2} className="right">TOTALES</td>
                <td className="right">{(orders ?? []).length}</td>
                <td className="right">{fmt(grandTotal)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Total de vendedores: {ranking.length}</p>
        </div>
      </body>
    </html>
  )
}
