'use client'

import { useState } from 'react'
import {
  useDashboardKpis, useSalesTrend, useTopProducts,
  useTopClients, useSalesByVendor, useOrdersByStatus
} from '@/lib/hooks/use-dashboard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, BarChart, Bar
} from 'recharts'
import { TrendingUp, ShoppingCart, Clock, TrendingDown } from 'lucide-react'

const PERIODS = [
  { value: 'today', label: 'Hoy'         },
  { value: 'week',  label: 'Esta semana' },
  { value: 'month', label: 'Este mes'    },
  { value: 'year',  label: 'Este año'    },
]

const STATUS_COLORS: Record<string, string> = {
  pendiente:      '#e67e22',
  en_preparacion: '#2980b9',
  preparada:      '#27ae60',
  despachada:     '#16a085',
  facturada:      '#468189',
  cancelada:      '#d94f4f',
}

const STATUS_LABELS: Record<string, string> = {
  pendiente:      'Pendiente',
  en_preparacion: 'En Preparación',
  preparada:      'Preparada',
  despachada:     'Despachada',
  facturada:      'Facturada',
  cancelada:      'Cancelada',
}

const CHART_COLORS = ['#468189', '#77ACA2', '#9DBEBB', '#031926', '#e67e22']

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const fmtShort = (n: number) => {
  if (n >= 1000000) return `L. ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `L. ${(n / 1000).toFixed(1)}K`
  return `L. ${n.toFixed(0)}`
}

function PeriodSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#e8efee' }}>
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
          style={{
            background: value === p.value ? '#468189' : 'transparent',
            color:      value === p.value ? '#F4E9CD' : '#777',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

function KpiCard({ label, value, sub, icon, color, loading }: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; color: string; loading?: boolean
}) {
  return (
    <div className="rounded-xl p-5 shadow-sm"
      style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-7 w-24 rounded animate-pulse" style={{ background: '#e8efee' }} />
          ) : (
            <p className="text-2xl font-bold truncate"
              style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              {value}
            </p>
          )}
          <p className="text-sm font-semibold mt-0.5" style={{ color }}>{label}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, children, loading }: {
  title: string; children: React.ReactNode; loading?: boolean
}) {
  return (
    <div className="rounded-xl shadow-sm"
      style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
      <div className="px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(68,129,137,0.1)' }}>
        <h3 className="font-bold text-sm" style={{ color: '#031926' }}>{title}</h3>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-5 rounded animate-pulse"
                style={{ background: '#e8efee', width: `${85 - i * 12}%` }} />
            ))}
          </div>
        ) : children}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 shadow-lg text-xs"
      style={{ background: '#031926', color: '#F4E9CD' }}>
      <p className="font-bold mb-1" style={{ color: '#9DBEBB' }}>{label}</p>
      <p className="font-semibold">{fmt(payload[0]?.value ?? 0)}</p>
      {payload[1] && (
        <p className="mt-0.5" style={{ color: '#77ACA2' }}>
          {payload[1]?.value ?? 0} órdenes
        </p>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <TrendingDown className="w-8 h-8 mb-2 opacity-20" style={{ color: '#468189' }} />
      <p className="text-sm" style={{ color: '#9DBEBB' }}>{text}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('month')

  const { data: kpis,     isLoading: kpisLoading    } = useDashboardKpis(period)
  const { data: trend,    isLoading: trendLoading    } = useSalesTrend()
  const { data: products, isLoading: productsLoading } = useTopProducts(period)
  const { data: clients,  isLoading: clientsLoading  } = useTopClients(period)
  const { data: vendors,  isLoading: vendorsLoading   } = useSalesByVendor(period)
  const { data: statuses, isLoading: statusesLoading  } = useOrdersByStatus()

  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold"
            style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>
            Resumen de operaciones — {periodLabel}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard
          label="Total Ventas"
          value={fmt(kpis?.total_sales ?? 0)}
          sub={periodLabel}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#468189"
          loading={kpisLoading}
        />
        <KpiCard
          label="Órdenes"
          value={String(kpis?.total_orders ?? 0)}
          sub="no canceladas"
          icon={<ShoppingCart className="w-5 h-5" />}
          color="#27ae60"
          loading={kpisLoading}
        />
        <KpiCard
          label="Ticket Promedio"
          value={fmt(kpis?.avg_order ?? 0)}
          sub="por orden"
          icon={<TrendingUp className="w-5 h-5" />}
          color="#9DBEBB"
          loading={kpisLoading}
        />
        <KpiCard
          label="Pendientes"
          value={String(kpis?.pending_orders ?? 0)}
          sub="requieren atención"
          icon={<Clock className="w-5 h-5" />}
          color={kpis?.pending_orders ? '#e67e22' : '#27ae60'}
          loading={kpisLoading}
        />
      </div>

      {/* Tendencia + Dona */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <SectionCard title="📈 Tendencia de Ventas — Últimos 30 días" loading={trendLoading}>
          {trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9DBEBB' }} interval={4} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9DBEBB' }} tickFormatter={fmtShort} width={58} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#468189" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#468189', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="orders" stroke="#9DBEBB" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Sin datos para el período" />}
        </SectionCard>

        <SectionCard title="🍩 Órdenes por Estado" loading={statusesLoading}>
          {statuses && statuses.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={statuses} dataKey="total" nameKey="status"
                    cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3}>
                    {statuses.map(entry => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#888'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, STATUS_LABELS[name as string] ?? name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {statuses.map(s => (
                  <div key={s.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLORS[s.status] ?? '#888' }} />
                      <span className="text-xs" style={{ color: '#555' }}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#031926' }}>
                      {s.total}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState text="Sin órdenes" />}
        </SectionCard>
      </div>

      {/* Top Productos + Top Clientes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="📦 Top 5 Productos más vendidos" loading={productsLoading}>
          {products && products.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {products.map((p, i) => {
                const pct = (p.total_sales / (products[0]?.total_sales ?? 1)) * 100
                return (
                  <div key={p.code}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: '#468189', color: '#F4E9CD' }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#031926' }}>{p.name}</p>
                          <p className="text-xs" style={{ color: '#9DBEBB' }}>{p.total_qty} unidades</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: '#468189' }}>
                        {fmt(p.total_sales)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#e8efee' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: '#468189' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <EmptyState text="Sin ventas en el período" />}
        </SectionCard>

        <SectionCard title="👥 Top 5 Clientes por monto" loading={clientsLoading}>
          {clients && clients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {clients.map((c, i) => {
                const pct = (c.total_sales / (clients[0]?.total_sales ?? 1)) * 100
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: '#77ACA2', color: '#fff' }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#031926' }}>{c.name}</p>
                          <p className="text-xs" style={{ color: '#9DBEBB' }}>
                            {c.city ?? '—'} · {c.total_orders} {c.total_orders === 1 ? 'orden' : 'órdenes'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: '#468189' }}>
                        {fmt(c.total_sales)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#e8efee' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: '#77ACA2' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <EmptyState text="Sin ventas en el período" />}
        </SectionCard>
      </div>

      {/* Ventas por vendedor */}
      <SectionCard title="🏆 Ventas por Vendedor" loading={vendorsLoading}>
        {vendors && vendors.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vendors} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barSize={44}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f4" vertical={false} />
              <XAxis dataKey="full_name" tick={{ fontSize: 12, fill: '#555', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9DBEBB' }} tickFormatter={fmtShort} width={62} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number | undefined) => [fmt(value ?? 0), 'Ventas']}
                contentStyle={{ background: '#031926', border: 'none', borderRadius: 8, color: '#F4E9CD', fontSize: 12 }}
                cursor={{ fill: 'rgba(68,129,137,0.06)' }}
              />
              <Bar dataKey="total_sales" radius={[6, 6, 0, 0]}>
                {vendors.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState text="Sin datos de vendedores en el período" />}
      </SectionCard>

    </div>
  )
}