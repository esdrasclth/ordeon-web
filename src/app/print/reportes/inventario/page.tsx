import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintInventarioPage() {
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
    .select('code, name, unit, stock, min_stock, purchase_price, sale_price, active, categories(name)')
    .eq('company_id', cid!)
    .eq('active', true)
    .order('name')

  const prods        = products ?? []
  const valorTotal   = prods.reduce((s, p) => s + Number(p.stock ?? 0) * Number(p.purchase_price ?? 0), 0)
  const stockBajo    = prods.filter(p => Number(p.stock) <= Number(p.min_stock)).length
  const stockUnits   = prods.reduce((s, p) => s + Number(p.stock ?? 0), 0)

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Inventario Actual — {company.name}</title>
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
            <span>Stock Actual</span>
            <span>Al: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card"><div className="val">{prods.length}</div><div className="lbl">Productos activos</div></div>
          <div className="summary-card"><div className="val">{stockUnits.toLocaleString('es-HN')}</div><div className="lbl">Unidades en stock</div></div>
          <div className="summary-card" style={{ borderColor: '#e67e22' }}>
            <div className="val" style={{ color: '#e67e22' }}>{stockBajo}</div>
            <div className="lbl">Bajo mínimo</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#27ae60' }}>
            <div className="val" style={{ color: '#27ae60' }}>{fmt(valorTotal)}</div>
            <div className="lbl">Valor inventario</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Inventario Actual</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th className="right">Stock</th>
                <th className="right">Mínimo</th>
                <th className="right">P. Compra</th>
                <th className="right">P. Venta</th>
                <th className="right">Valor (HNL)</th>
                <th className="center">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {prods.map((p, i) => {
                const alerta = Number(p.stock) <= Number(p.min_stock)
                return (
                  <tr key={i} className={alerta ? 'alert' : ''}>
                    <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{p.code ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontSize: 10 }}>{(p.categories as any)?.name ?? '—'}</td>
                    <td>{p.unit ?? '—'}</td>
                    <td className="right" style={{ fontWeight: 700 }}>{Number(p.stock ?? 0).toLocaleString('es-HN')}</td>
                    <td className="right">{Number(p.min_stock ?? 0)}</td>
                    <td className="right">{fmt(p.purchase_price)}</td>
                    <td className="right">{fmt(p.sale_price)}</td>
                    <td className="right" style={{ fontWeight: 700 }}>{fmt(Number(p.stock ?? 0) * Number(p.purchase_price ?? 0))}</td>
                    <td className="center">
                      {alerta && <span className="badge badge-red">BAJO</span>}
                    </td>
                  </tr>
                )
              })}
              <tr className="total-row">
                <td colSpan={8} className="right">VALOR TOTAL INVENTARIO</td>
                <td className="right">{fmt(valorTotal)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Total de productos: {prods.length} · Stock bajo mínimo: {stockBajo}</p>
        </div>
      </body>
    </html>
  )
}
