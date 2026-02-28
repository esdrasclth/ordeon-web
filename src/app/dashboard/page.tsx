import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, stock, min_stock, active')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, status, current_balance, credit_limit')

  const totalProducts = products?.filter(p => p.active).length ?? 0
  const lowStock = products?.filter(p => p.stock < p.min_stock).length ?? 0
  const totalClients = clients?.length ?? 0
  const blockedClients = clients?.filter(c => c.current_balance >= c.credit_limit).length ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          Panel Principal
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#468189' }}>
          Bienvenido al sistema Ordeon
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Productos Activos', value: totalProducts, icon: '📦', sub: 'en catálogo' },
          { label: 'Stock Bajo', value: lowStock, icon: '⚠️', sub: 'requieren reposición', alert: lowStock > 0 },
          { label: 'Clientes', value: totalClients, icon: '👥', sub: 'registrados' },
          { label: 'Crédito Excedido', value: blockedClients, icon: '🚫', sub: 'clientes bloqueados', alert: blockedClients > 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-5 shadow-sm"
            style={{
              background: '#fff',
              border: stat.alert ? '1px solid #fca5a5' : '1px solid rgba(68,129,137,0.12)'
            }}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: stat.alert ? '#fef2f2' : 'rgba(68,129,137,0.1)' }}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                  {stat.value}
                </p>
                <p className="text-sm font-semibold" style={{ color: stat.alert ? '#d94f4f' : '#468189' }}>
                  {stat.label}
                </p>
                <p className="text-xs" style={{ color: '#9DBEBB' }}>{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}