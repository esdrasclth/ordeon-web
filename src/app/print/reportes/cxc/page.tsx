import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { BASE_CSS, fmt } from '@/lib/reports/print-helpers'

export const dynamic = 'force-dynamic'

export default async function PrintCxcPage({
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

  const cid      = profile?.company_id
  const company  = (profile?.companies as any) ?? {}
  const supabase = createAdminClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('name, rtn, city, phone, current_balance, credit_limit, status')
    .eq('company_id', cid!)
    .gt('current_balance', 0)
    .order('current_balance', { ascending: false })

  const cls          = clients ?? []
  const totalSaldo   = cls.reduce((s, c) => s + Number(c.current_balance ?? 0), 0)
  const totalLimite  = cls.reduce((s, c) => s + Number(c.credit_limit ?? 0), 0)
  const excedidos    = cls.filter(c => Number(c.current_balance) > Number(c.credit_limit ?? 0)).length

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Cuentas por Cobrar — {company.name}</title>
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
            <span>Cuentas por Cobrar</span>
            <span>Generado: {new Date().toLocaleString('es-HN')}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="val">{cls.length}</div>
            <div className="lbl">Clientes con saldo</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#e67e22' }}>
            <div className="val" style={{ color: '#e67e22' }}>{fmt(totalSaldo)}</div>
            <div className="lbl">Saldo total pendiente</div>
          </div>
          <div className="summary-card">
            <div className="val">{fmt(totalLimite)}</div>
            <div className="lbl">Límite crédito total</div>
          </div>
          <div className="summary-card" style={{ borderColor: '#dc2626' }}>
            <div className="val" style={{ color: '#dc2626' }}>{excedidos}</div>
            <div className="lbl">Clientes exceden límite</div>
          </div>
        </div>

        <div className="container">
          <h2 className="report-title">Cuentas por Cobrar — Al {new Date().toLocaleDateString('es-HN')}</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>RTN</th>
                <th>Ciudad</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th className="right">Saldo Pendiente</th>
                <th className="right">Límite Crédito</th>
                <th className="right">Disponible</th>
                <th className="center">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {cls.map((c, i) => {
                const excede    = Number(c.current_balance) > Number(c.credit_limit ?? 0)
                const disponible = Math.max(0, Number(c.credit_limit ?? 0) - Number(c.current_balance))
                return (
                  <tr key={i} className={excede ? 'alert' : ''}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{c.rtn ?? '—'}</td>
                    <td>{c.city ?? '—'}</td>
                    <td>{c.phone ?? '—'}</td>
                    <td>
                      <span className={`badge ${c.status === 'activo' ? 'badge-green' : 'badge-gray'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="right" style={{ fontWeight: 700, color: '#e67e22' }}>
                      {fmt(c.current_balance)}
                    </td>
                    <td className="right">{fmt(c.credit_limit ?? 0)}</td>
                    <td className="right" style={{ color: disponible === 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                      {fmt(disponible)}
                    </td>
                    <td className="center">
                      {excede ? <span className="badge badge-red">EXCEDE</span> : '—'}
                    </td>
                  </tr>
                )
              })}
              <tr className="total-row">
                <td colSpan={6} className="right">TOTALES</td>
                <td className="right">{fmt(totalSaldo)}</td>
                <td className="right">{fmt(totalLimite)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
          <p className="footer">Total de clientes con saldo: {cls.length}</p>
        </div>
      </body>
    </html>
  )
}
