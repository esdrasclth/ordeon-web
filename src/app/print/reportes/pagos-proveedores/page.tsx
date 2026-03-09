import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, getPeriodDates, getPeriodLabel, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintPagosProveedoresPage({
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

  const { data: payments } = await supabase
    .from('supplier_payments')
    .select('payment_date, amount, payment_method, reference, notes, suppliers(name, rtn), purchase_orders(po_number)')
    .eq('company_id', cid!)
    .gte('payment_date', start.split('T')[0])
    .lte('payment_date', end.split('T')[0])
    .order('payment_date', { ascending: false })

  const pagos     = payments ?? []
  const totalPagado = pagos.reduce((s, p) => s + Number(p.amount ?? 0), 0)

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Pagos a Proveedores — {company.name}</title>
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
            <span>Pagos a Proveedores</span>
            <span>Período: {periodLabel}</span>
            <span>Generado: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card"><div className="val">{pagos.length}</div><div className="lbl">Pagos realizados</div></div>
          <div className="summary-card" style={{ borderColor: '#9b59b6' }}>
            <div className="val" style={{ color: '#9b59b6' }}>{fmt(totalPagado)}</div>
            <div className="lbl">Total pagado</div>
          </div>
          <div className="summary-card">
            <div className="val">{new Set(pagos.map(p => (p.suppliers as any)?.name).filter(Boolean)).size}</div>
            <div className="lbl">Proveedores</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Pagos a Proveedores · {periodLabel}</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>RTN</th>
                <th>OC Referida</th>
                <th>Método</th>
                <th>Referencia</th>
                <th className="right">Monto (HNL)</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p, i) => (
                <tr key={i}>
                  <td>{p.payment_date}</td>
                  <td style={{ fontWeight: 600 }}>{(p.suppliers as any)?.name ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{(p.suppliers as any)?.rtn ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace' }}>
                    {(p.purchase_orders as any)?.po_number
                      ? `OC-${String((p.purchase_orders as any).po_number).padStart(5, '0')}` : '—'}
                  </td>
                  <td>{p.payment_method ?? '—'}</td>
                  <td style={{ fontSize: 10 }}>{p.reference ?? '—'}</td>
                  <td className="right" style={{ fontWeight: 700, color: '#9b59b6' }}>{fmt(p.amount)}</td>
                  <td style={{ fontSize: 10 }}>{p.notes ?? ''}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={6} className="right">TOTAL PAGADO</td>
                <td className="right">{fmt(totalPagado)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Total de pagos: {pagos.length}</p>
        </div>
      </body>
    </html>
  )
}
