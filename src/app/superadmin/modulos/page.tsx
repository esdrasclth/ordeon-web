import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALL_MODULES = [
  { key: 'core',          label: 'Core',           desc: 'Módulo base — siempre activo',           required: true  },
  { key: 'ventas',        label: 'Ventas',          desc: 'Órdenes de venta y pedidos',            required: false },
  { key: 'clientes',      label: 'Clientes',        desc: 'Cartera de clientes y créditos',        required: false },
  { key: 'inventario',    label: 'Inventario',      desc: 'Control de stock y movimientos',        required: false },
  { key: 'facturacion',   label: 'Facturación',     desc: 'Facturas electrónicas y PDF',           required: false },
  { key: 'contabilidad',  label: 'Contabilidad',    desc: 'Libro diario, balance y estados financieros', required: false },
  { key: 'compras',       label: 'Compras',         desc: 'Órdenes de compra y proveedores',       required: false },
  { key: 'multi_bodega',  label: 'Multi-Bodega',    desc: 'Gestión de múltiples almacenes',        required: false },
]

export default async function ModulosPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, active, modules')
    .order('name')

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          Módulos del Sistema
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Vista de adopción de módulos por empresa. Para activar/desactivar ve a la página de Empresas.
        </p>
      </div>

      {/* Cards de módulos con adopción */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {ALL_MODULES.map(mod => {
          const usage = (companies ?? []).filter(c => (c.modules ?? []).includes(mod.key)).length
          const pct   = companies?.length ? Math.round((usage / companies.length) * 100) : 0
          return (
            <div key={mod.key} className="rounded-2xl p-5"
              style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm" style={{ color: '#031926' }}>{mod.label}</h3>
                    {mod.required && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ background: 'rgba(70,129,137,0.1)', color: '#468189' }}>
                        Base
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{mod.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>{usage}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>empresas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: '#f1f5f9' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: mod.required ? '#468189' : '#2980b9' }} />
                </div>
                <span className="text-xs font-semibold w-10 text-right" style={{ color: '#64748b' }}>{pct}%</span>
              </div>

              {/* Lista de empresas que tienen este módulo */}
              {usage > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {(companies ?? [])
                    .filter(c => (c.modules ?? []).includes(mod.key))
                    .slice(0, 6)
                    .map(c => (
                      <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: c.active ? 'rgba(70,129,137,0.08)' : 'rgba(239,68,68,0.08)',
                          color:      c.active ? '#468189'                : '#ef4444',
                        }}>
                        {c.name}
                      </span>
                    ))}
                  {(companies ?? []).filter(c => (c.modules ?? []).includes(mod.key)).length > 6 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#94a3b8' }}>
                      +{(companies ?? []).filter(c => (c.modules ?? []).includes(mod.key)).length - 6} más
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
