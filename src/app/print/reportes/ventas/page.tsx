import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

function getPeriodDates(period: string, from?: string, to?: string) {
  const now = new Date()
  if (period === 'custom' && from && to) return { start: from + 'T00:00:00', end: to + 'T23:59:59' }
  const start = new Date(now)
  if      (period === 'today') start.setHours(0, 0, 0, 0)
  else if (period === 'week')  { start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0) }
  else if (period === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0) }
  else if (period === 'year')  { start.setMonth(0, 1); start.setHours(0, 0, 0, 0) }
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: endOfDay.toISOString() }
}

export default async function PrintVentasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await authClient
    .from('profiles').select('company_id, companies(name, rtn, address, phone)')
    .eq('id', user.id).single()

  const cid = profile?.company_id
  const company = (profile?.companies as any) ?? {}
  const { start, end } = getPeriodDates(sp.period ?? 'month', sp.from, sp.to)
  const periodLabel = sp.period === 'custom'
    ? `${sp.from} — ${sp.to}`
    : ({ today: 'Hoy', week: 'Esta semana', month: 'Este mes', year: 'Este año' }[sp.period ?? 'month'] ?? 'Este mes')
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('sales_orders')
    .select('order_number, status, total, order_date, profiles(full_name), clients(name, city)')
    .eq('company_id', cid!)
    .gte('order_date', start)
    .lte('order_date', end)
    .order('order_date', { ascending: false })

  const total = (orders ?? []).filter(o => o.status !== 'cancelada').reduce((s, o) => s + Number(o.total), 0)
  const fmt   = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
  const STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente', en_preparacion: 'En preparación',
    preparada: 'Preparada', despachada: 'Despachada',
    facturada: 'Facturada', cancelada: 'Cancelada',
  }

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Reporte de Ventas — {company.name}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; }
          @media print {
            @page { margin: 15mm 12mm; size: A4 landscape; }
            .no-print { display: none !important; }
          }
          .header { background: #031926; color: #F4E9CD; padding: 20px 24px; margin-bottom: 16px; }
          .logo   { font-size: 20px; font-weight: 900; font-family: Georgia, serif; }
          .logo span { color: #468189; }
          .meta   { display: flex; gap: 24px; margin-top: 6px; font-size: 11px; color: rgba(244,233,205,0.7); }
          table   { width: 100%; border-collapse: collapse; }
          th      { background: #031926; color: #F4E9CD; padding: 6px 8px; text-align: left; font-size: 11px; }
          td      { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
          tr:hover td { background: #f8fafc; }
          .total-row td { font-weight: 700; background: #f0f9f0; border-top: 2px solid #468189; }
          .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
          .controls { padding: 12px 24px; display: flex; gap: 8px; }
          .btn { padding: 6px 14px; border-radius: 6px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; }
        `}</style>
      </head>
      <body>
        <div className="controls no-print">
          <button className="btn" onClick={() => window.print()}
            style={{ background: '#031926', color: '#F4E9CD' }}>
            🖨️ Imprimir / PDF
          </button>
          <button className="btn" onClick={() => window.close()}
            style={{ background: '#f1f5f9', color: '#475569' }}>
            Cerrar
          </button>
        </div>

        <div className="header">
          <div className="logo">Ord<span>eon</span> ERP</div>
          <div className="meta">
            <span><strong>{company.name}</strong></span>
            {company.rtn && <span>RTN: {company.rtn}</span>}
            <span>Período: {periodLabel}</span>
            <span>Generado: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          <h2 style={{ marginBottom: 12, fontSize: 16, fontWeight: 800, color: '#031926' }}>
            Reporte de Ventas · {periodLabel}
          </h2>

          <table>
            <thead>
              <tr>
                {['N° Orden', 'Fecha', 'Cliente', 'Ciudad', 'Vendedor', 'Estado', 'Total'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map(o => (
                <tr key={o.order_number}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#468189' }}>
                    #{o.order_number}
                  </td>
                  <td>{new Date(o.order_date).toLocaleDateString('es-HN')}</td>
                  <td style={{ fontWeight: 600 }}>{(o.clients as any)?.name ?? '—'}</td>
                  <td>{(o.clients as any)?.city ?? '—'}</td>
                  <td>{(o.profiles as any)?.full_name ?? '—'}</td>
                  <td>
                    <span className="badge" style={{
                      background: o.status === 'cancelada' ? '#fee2e2' : '#f0fdf4',
                      color:      o.status === 'cancelada' ? '#dc2626' : '#16a34a',
                    }}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(Number(o.total))}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={6} style={{ textAlign: 'right' }}>TOTAL (excl. canceladas)</td>
                <td style={{ textAlign: 'right' }}>{fmt(total)}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ marginTop: 16, fontSize: 10, color: '#94a3b8' }}>
            Total de registros: {(orders ?? []).length}
          </p>
        </div>
      </body>
    </html>
  )
}
