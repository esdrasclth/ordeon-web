import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, getPeriodDates, getPeriodLabel } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintMovimientosPage({
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

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('type, quantity, reason, notes, created_at, products(code, name, unit), profiles(full_name)')
    .eq('company_id', cid!)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  const movs     = movements ?? []
  const entradas = movs.filter(m => m.type === 'entrada').reduce((s, m) => s + Number(m.quantity ?? 0), 0)
  const salidas  = movs.filter(m => m.type === 'salida' || m.type === 'venta').reduce((s, m) => s + Number(m.quantity ?? 0), 0)

  const TIPO_ES: Record<string, string> = {
    entrada: 'Entrada', salida: 'Salida', ajuste: 'Ajuste',
    venta: 'Venta', devolucion: 'Devolución',
  }
  const TIPO_COLOR: Record<string, string> = {
    entrada: 'badge-green', salida: 'badge-red', ajuste: 'badge-yellow',
    venta: 'badge-blue', devolucion: 'badge-gray',
  }

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Movimientos de Stock — {company.name}</title>
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
            <span>Movimientos de Stock</span>
            <span>Período: {periodLabel}</span>
            <span>Generado: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card"><div className="val">{movs.length}</div><div className="lbl">Total movimientos</div></div>
          <div className="summary-card" style={{ borderColor: '#27ae60' }}>
            <div className="val" style={{ color: '#27ae60' }}>+{entradas.toLocaleString('es-HN')}</div>
            <div className="lbl">Unidades entrada</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#e74c3c' }}>
            <div className="val" style={{ color: '#e74c3c' }}>-{salidas.toLocaleString('es-HN')}</div>
            <div className="lbl">Unidades salida/venta</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Movimientos de Stock · {periodLabel}</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Código</th>
                <th className="right">Cantidad</th>
                <th>Motivo/Notas</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(m.created_at).toLocaleString('es-HN')}</td>
                  <td>
                    <span className={`badge ${TIPO_COLOR[m.type] ?? 'badge-gray'}`}>
                      {TIPO_ES[m.type] ?? m.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{(m.products as any)?.name ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{(m.products as any)?.code ?? '—'}</td>
                  <td className="right" style={{
                    fontWeight: 700,
                    color: m.type === 'entrada' ? '#16a34a' : '#dc2626'
                  }}>
                    {m.type === 'entrada' ? '+' : '-'}{Number(m.quantity ?? 0)}
                  </td>
                  <td style={{ fontSize: 10 }}>{(m as any).reason ?? (m as any).notes ?? '—'}</td>
                  <td style={{ fontSize: 10 }}>{(m.profiles as any)?.full_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="footer">Total de registros: {movs.length}</p>
        </div>
      </body>
    </html>
  )
}
