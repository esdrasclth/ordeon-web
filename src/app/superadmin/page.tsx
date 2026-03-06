import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export default async function SuperAdminPage() {
  const supabase = await createClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  const total      = companies?.length ?? 0
  const activas    = companies?.filter(c => c.active).length ?? 0
  const inactivas  = companies?.filter(c => !c.active).length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="text-2xl font-bold"
          style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: '#468189' }}>
          Resumen general del sistema
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total empresas',    value: total,     color: '#468189' },
          { label: 'Empresas activas',  value: activas,   color: '#27ae60' },
          { label: 'Empresas inactivas', value: inactivas, color: '#d94f4f' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-5"
            style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
            <p className="text-3xl font-bold" style={{ color: kpi.color, fontFamily: 'Georgia, serif' }}>
              {kpi.value}
            </p>
            <p className="text-sm mt-1" style={{ color: '#777' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla de empresas */}
      <div className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(70,129,137,0.15)' }}>
        <div className="px-5 py-4" style={{ background: '#031926' }}>
          <h3 className="text-sm font-bold" style={{ color: '#F4E9CD' }}>
            Empresas registradas
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
              {['Empresa', 'Plan', 'Módulos', 'Estado', 'Creada'].map(h => (
                <th key={h} className="px-4 py-3 text-left"
                  style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies?.map((c, i) => (
              <tr key={c.id}
                style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <td className="px-4 py-3">
                  <p className="text-sm font-bold" style={{ color: '#031926' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: '#9DBEBB' }}>{c.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full font-semibold capitalize"
                    style={{ background: 'rgba(70,129,137,0.1)', color: '#468189' }}>
                    {c.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.modules?.map((m: string) => (
                      <span key={m} className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: '#f0f5f5', color: '#468189' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full font-bold"
                    style={{
                      background: c.active ? '#27ae6015' : '#d94f4f15',
                      color:      c.active ? '#27ae60'   : '#d94f4f',
                    }}>
                    {c.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#777' }}>
                  {new Date(c.created_at).toLocaleDateString('es-HN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}