import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintStockBajoPage() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await authClient
    .from('profiles').select('company_id, companies(name, rtn)')
    .eq('id', user.id).single()

  const cid      = profile?.company_id
  const company  = (profile?.companies as any) ?? {}
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('code, name, unit, stock, min_stock, purchase_price')
    .eq('company_id', cid!)
    .eq('active', true)
    .order('name')

  const prods = (products ?? []).filter(p => Number(p.stock) <= Number(p.min_stock))
  const valorReponer = prods.reduce((s, p) =>
    s + (Number(p.min_stock ?? 0) - Number(p.stock ?? 0)) * Number(p.purchase_price ?? 0), 0)

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Productos Bajo Mínimo — {company.name}</title>
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
            <span>Alerta de Reorden — Productos Bajo Mínimo</span>
            <span>Al: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card" style={{ borderColor: '#e74c3c' }}>
            <div className="val" style={{ color: '#e74c3c' }}>{prods.length}</div>
            <div className="lbl">Productos a reponer</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#e67e22' }}>
            <div className="val" style={{ color: '#e67e22' }}>{fmt(valorReponer)}</div>
            <div className="lbl">Inversión estimada reorden</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Productos Bajo Mínimo — {new Date().toLocaleDateString('es-HN')}</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Unidad</th>
                <th className="right">Stock Actual</th>
                <th className="right">Stock Mínimo</th>
                <th className="right">Diferencia</th>
                <th className="right">P. Compra</th>
                <th className="right">Valor a Reponer</th>
              </tr>
            </thead>
            <tbody>
              {prods.map((p, i) => {
                const diff = Number(p.min_stock ?? 0) - Number(p.stock ?? 0)
                return (
                  <tr key={i} className="alert">
                    <td>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{p.code ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.unit ?? '—'}</td>
                    <td className="right" style={{ color: '#dc2626', fontWeight: 700 }}>{Number(p.stock ?? 0)}</td>
                    <td className="right">{Number(p.min_stock ?? 0)}</td>
                    <td className="right" style={{ color: '#dc2626', fontWeight: 700 }}>{diff}</td>
                    <td className="right">{fmt(p.purchase_price)}</td>
                    <td className="right" style={{ fontWeight: 700 }}>{fmt(diff * Number(p.purchase_price ?? 0))}</td>
                  </tr>
                )
              })}
              <tr className="total-row">
                <td colSpan={8} className="right">INVERSIÓN ESTIMADA TOTAL</td>
                <td className="right">{fmt(valorReponer)}</td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Productos que requieren reorden: {prods.length}</p>
        </div>
      </body>
    </html>
  )
}
