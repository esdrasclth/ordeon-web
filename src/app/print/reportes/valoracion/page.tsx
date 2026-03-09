import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintValoracionPage() {
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
    .select('code, name, unit, stock, purchase_price, categories(name)')
    .eq('company_id', cid!)
    .eq('active', true)
    .order('name')

  const prods = products ?? []

  // Agrupar por categoría
  const byCat: Record<string, { productos: typeof prods; valor: number }> = {}
  prods.forEach(p => {
    const cat = (p.categories as any)?.name ?? 'Sin categoría'
    if (!byCat[cat]) byCat[cat] = { productos: [], valor: 0 }
    byCat[cat].productos.push(p)
    byCat[cat].valor += Number(p.stock ?? 0) * Number(p.purchase_price ?? 0)
  })

  const valorTotal = prods.reduce((s, p) => s + Number(p.stock ?? 0) * Number(p.purchase_price ?? 0), 0)
  const cats = Object.entries(byCat).sort((a, b) => b[1].valor - a[1].valor)

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Valoración de Inventario — {company.name}</title>
        <style>{BASE_CSS + `
          .cat-header td { background: #031926; color: #F4E9CD; font-weight: 700; font-size: 11px; padding: 5px 8px; }
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
            <span>Valoración de Inventario (Costo Promedio)</span>
            <span>Al: {new Date().toLocaleDateString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card"><div className="val">{prods.length}</div><div className="lbl">Productos activos</div></div>
          <div className="summary-card"><div className="val">{cats.length}</div><div className="lbl">Categorías</div></div>
          <div className="summary-card" style={{ borderColor: '#2980b9' }}>
            <div className="val" style={{ color: '#2980b9' }}>{fmt(valorTotal)}</div>
            <div className="lbl">Valor total inventario</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Valoración de Inventario por Categoría</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Unidad</th>
                <th className="right">Stock</th>
                <th className="right">Costo Unit.</th>
                <th className="right">Valor Total (HNL)</th>
                <th className="right">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(([catName, catData]) => (
                <>
                  <tr key={`cat-${catName}`} className="cat-header">
                    <td colSpan={5}>{catName} — {catData.productos.length} productos</td>
                    <td className="right">{fmt(catData.valor)}</td>
                    <td className="right">{valorTotal > 0 ? ((catData.valor / valorTotal) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  {catData.productos.map((p, i) => (
                    <tr key={`${catName}-${i}`}>
                      <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{p.code ?? '—'}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.unit ?? '—'}</td>
                      <td className="right">{Number(p.stock ?? 0).toLocaleString('es-HN')}</td>
                      <td className="right">{fmt(p.purchase_price)}</td>
                      <td className="right" style={{ fontWeight: 700 }}>
                        {fmt(Number(p.stock ?? 0) * Number(p.purchase_price ?? 0))}
                      </td>
                      <td className="right" style={{ fontSize: 10, color: '#64748b' }}>
                        {valorTotal > 0
                          ? ((Number(p.stock ?? 0) * Number(p.purchase_price ?? 0) / valorTotal) * 100).toFixed(1)
                          : 0}%
                      </td>
                    </tr>
                  ))}
                </>
              ))}
              <tr className="total-row">
                <td colSpan={5} className="right">VALOR TOTAL INVENTARIO</td>
                <td className="right">{fmt(valorTotal)}</td>
                <td className="right">100%</td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Método: Costo Promedio · Productos: {prods.length} · Categorías: {cats.length}</p>
        </div>
      </body>
    </html>
  )
}
