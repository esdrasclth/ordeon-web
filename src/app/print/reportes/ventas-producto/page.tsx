import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, getPeriodDates, getPeriodLabel, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintVentasProductoPage({
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
    .from('sales_orders').select('id')
    .eq('company_id', cid!)
    .gte('order_date', start)
    .lte('order_date', end)
    .neq('status', 'cancelada')

  const activeIds = (orders ?? []).map(o => o.id)

  const items = activeIds.length > 0
    ? (await supabase.from('sales_order_items')
        .select('quantity, line_total, products(code, name, unit)')
        .in('order_id', activeIds)).data ?? []
    : []

  const byProd: Record<string, { code: string; unit: string; total: number; unidades: number }> = {}
  items.forEach(i => {
    const name = (i.products as any)?.name ?? 'Desconocido'
    if (!byProd[name]) byProd[name] = {
      code: (i.products as any)?.code ?? '', unit: (i.products as any)?.unit ?? '',
      total: 0, unidades: 0,
    }
    byProd[name].total    += Number(i.line_total ?? 0)
    byProd[name].unidades += Number(i.quantity ?? 0)
  })

  const grandTotal = Object.values(byProd).reduce((s, d) => s + d.total, 0)
  const ranking    = Object.entries(byProd).sort((a, b) => b[1].total - a[1].total)

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Ventas por Producto — {company.name}</title>
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
            <span>Top Productos por Venta</span>
            <span>Período: {periodLabel}</span>
            <span>Generado: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="val">{ranking.length}</div>
            <div className="lbl">Productos distintos</div>
          </div>
          <div className="summary-card">
            <div className="val">{items.reduce((s, i) => s + Number(i.quantity ?? 0), 0)}</div>
            <div className="lbl">Unidades totales vendidas</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#2980b9' }}>
            <div className="val" style={{ color: '#2980b9' }}>{fmt(grandTotal)}</div>
            <div className="lbl">Total en ventas</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Ventas por Producto · {periodLabel}</h2>
          <table>
            <thead>
              <tr>
                <th className="center">#</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Unidad</th>
                <th className="right">Unidades Vendidas</th>
                <th className="right">Ingresos (HNL)</th>
                <th className="right">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(([producto, d], i) => (
                <tr key={i}>
                  <td className="center" style={{ fontWeight: 700, color: i < 3 ? '#2980b9' : '#64748b' }}>
                    {i + 1}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{d.code}</td>
                  <td style={{ fontWeight: 600 }}>{producto}</td>
                  <td>{d.unit}</td>
                  <td className="right" style={{ fontWeight: 700 }}>{d.unidades.toLocaleString('es-HN')}</td>
                  <td className="right" style={{ fontWeight: 700, color: '#2980b9' }}>{fmt(d.total)}</td>
                  <td className="right">{grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={4} className="right">TOTALES</td>
                <td className="right">{items.reduce((s, i) => s + Number(i.quantity ?? 0), 0)}</td>
                <td className="right">{fmt(grandTotal)}</td>
                <td className="right">100%</td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Total de productos distintos: {ranking.length}</p>
        </div>
      </body>
    </html>
  )
}
