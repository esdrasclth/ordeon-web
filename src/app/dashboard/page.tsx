'use client'

import { useState } from 'react'
import {
  useDashboardKpis, useSalesTrend, useTopProducts,
  useTopClients, useSalesByVendor, useOrdersByStatus,
  useLowStockProducts, useOverCreditClients,
  useInvoiceStats, useAccountingKpis, useRecentJournalEntries,
  useWarehouseStockSummary,
} from '@/lib/hooks/use-dashboard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, ShoppingCart, Clock, TrendingDown,
  Package, CreditCard, AlertTriangle, ArrowRight,
  FileText, BookOpen, Warehouse, DollarSign, BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import { usePermissions, useModules } from '@/lib/hooks/use-current-user'

const PERIODS = [
  { value: 'today', label: 'Hoy'         },
  { value: 'week',  label: 'Esta semana' },
  { value: 'month', label: 'Este mes'    },
  { value: 'year',  label: 'Este año'    },
]

const STATUS_COLORS: Record<string, string> = {
  pendiente:            '#e67e22',
  pendiente_aprobacion: '#f59e0b',
  en_preparacion:       '#2980b9',
  preparada:            '#27ae60',
  despachada:           '#16a085',
  facturada:            '#468189',
  cancelada:            '#d94f4f',
  rechazada:            '#7f1d1d',
}

const STATUS_LABELS: Record<string, string> = {
  pendiente:            'Pendiente',
  pendiente_aprobacion: 'Pend. Aprob.',
  en_preparacion:       'En Preparación',
  preparada:            'Preparada',
  despachada:           'Despachada',
  facturada:            'Facturada',
  cancelada:            'Cancelada',
  rechazada:            'Rechazada',
}

const SOURCE_LABELS: Record<string, string> = {
  manual:       'Manual',
  factura:      'Factura',
  venta:        'Venta',
  ajuste_stock: 'Ajuste Stock',
  pago:         'Pago',
  devolucion:   'Devolución',
  compra:       'Compra',
}

const CHART_COLORS = ['#468189', '#77ACA2', '#9DBEBB', '#2980b9', '#e67e22']

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const fmtShort = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n / 1000).toFixed(0)}K`
  return `${n.toFixed(0)}`
}

// ── Componentes ───────────────────────────────────────────────────────────────

function PeriodSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#e8efee' }}>
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: value === p.value ? '#031926' : 'transparent',
            color:      value === p.value ? '#F4E9CD' : '#777',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

function KpiCard({ label, value, sub, icon, color, loading, href }: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; color: string; loading?: boolean; href?: string
}) {
  const inner = (
    <div
      className="rounded-2xl p-5 h-full transition-all hover:shadow-md group"
      style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {href && (
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: '#9DBEBB' }} />
        )}
      </div>
      {loading ? (
        <div className="h-8 w-28 rounded-lg animate-pulse" style={{ background: '#e8efee' }} />
      ) : (
        <p className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          {value}
        </p>
      )}
      <p className="text-sm font-semibold mt-1" style={{ color }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>{sub}</p>}
    </div>
  )
  return href
    ? <Link href={href} className="block h-full">{inner}</Link>
    : inner
}

function SectionCard({ title, children, loading, action }: {
  title: string; children: React.ReactNode; loading?: boolean; action?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #f4f4f4' }}>
        <h3 className="font-bold text-sm" style={{ color: '#031926' }}>{title}</h3>
        {action}
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-5 rounded-lg animate-pulse"
                style={{ background: '#f0f4f4', width: `${85 - i * 12}%` }} />
            ))}
          </div>
        ) : children}
      </div>
    </div>
  )
}

function ModuleBadge({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
      style={{ background: 'rgba(68,129,137,0.1)', color: '#468189', border: '1px solid rgba(68,129,137,0.2)' }}>
      {label} <ArrowRight className="w-3 h-3" />
    </Link>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-xl text-xs"
      style={{ background: '#031926', color: '#F4E9CD', border: '1px solid rgba(70,129,137,0.3)' }}>
      <p className="font-semibold mb-1" style={{ color: '#9DBEBB' }}>{label}</p>
      <p className="font-bold text-sm">{fmt(payload[0]?.value ?? 0)}</p>
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
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <TrendingDown className="w-8 h-8 opacity-15" style={{ color: '#468189' }} />
      <p className="text-sm" style={{ color: '#9DBEBB' }}>{text}</p>
    </div>
  )
}

function RankRow({ rank, name, sub, value, color, pct }: {
  rank: number; name: string; sub: string; value: string; color: string; pct: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: color, color: '#fff' }}>
            {rank}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#031926' }}>{name}</p>
            <p className="text-xs" style={{ color: '#9DBEBB' }}>{sub}</p>
          </div>
        </div>
        <span className="text-sm font-bold ml-3 flex-shrink-0" style={{ color: '#468189' }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: '#f0f4f4' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState('month')
  const { role } = usePermissions()
  const { hasModule } = useModules()
  const isVendedor = role === 'vendedor'

  // Módulos activos
  const hasVentas       = hasModule('ventas')
  const hasClientes     = hasModule('clientes')
  const hasFacturacion  = hasModule('facturacion')
  const hasContabilidad = hasModule('contabilidad')
  const hasMultiBodega  = hasModule('multi_bodega')

  // ── Hooks (habilitados solo si el módulo está activo) ──
  const { data: kpis,      isLoading: kpisLoading      } = useDashboardKpis(period)
  const { data: trend,     isLoading: trendLoading      } = useSalesTrend()
  const { data: products,  isLoading: productsLoading   } = useTopProducts(period)
  const { data: clients,   isLoading: clientsLoading    } = useTopClients(period)
  const { data: vendors,   isLoading: vendorsLoading    } = useSalesByVendor(period)
  const { data: statuses,  isLoading: statusesLoading   } = useOrdersByStatus()
  const { data: lowStock,  isLoading: stockLoading      } = useLowStockProducts()
  const { data: overCredit,isLoading: creditLoading     } = useOverCreditClients()

  const { data: invoiceStats,  isLoading: invoiceLoading   } = useInvoiceStats(period,    hasFacturacion)
  const { data: acctKpis,      isLoading: acctKpisLoading  } = useAccountingKpis(period,  hasContabilidad)
  const { data: recentEntries, isLoading: entriesLoading   } = useRecentJournalEntries(   hasContabilidad)
  const { data: warehouseSummary, isLoading: warehouseLoading } = useWarehouseStockSummary(hasMultiBodega)

  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? ''
  const now = new Date().toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })

  const hasAnyOptionalModule = hasVentas || hasClientes || hasFacturacion || hasContabilidad || hasMultiBodega

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm capitalize" style={{ color: '#9DBEBB' }}>{now}</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* ── KPIs de Ventas ── */}
      {hasVentas && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Total Ventas"
            value={fmt(kpis?.total_sales ?? 0)}
            sub={periodLabel}
            icon={<TrendingUp className="w-5 h-5" />}
            color="#468189"
            loading={kpisLoading}
            href="/dashboard/ordenes"
          />
          <KpiCard
            label="Órdenes"
            value={String(kpis?.total_orders ?? 0)}
            sub="no canceladas"
            icon={<ShoppingCart className="w-5 h-5" />}
            color="#27ae60"
            loading={kpisLoading}
            href="/dashboard/ordenes"
          />
          <KpiCard
            label="Ticket Promedio"
            value={fmt(kpis?.avg_order ?? 0)}
            sub="por orden"
            icon={<TrendingUp className="w-5 h-5" />}
            color="#2980b9"
            loading={kpisLoading}
          />
          <KpiCard
            label="Pendientes"
            value={String(kpis?.pending_orders ?? 0)}
            sub="requieren atención"
            icon={<Clock className="w-5 h-5" />}
            color={(kpis?.pending_orders ?? 0) > 0 ? '#e67e22' : '#27ae60'}
            loading={kpisLoading}
            href="/dashboard/ordenes"
          />
        </div>
      )}

      {/* ── KPIs Facturación ── */}
      {hasFacturacion && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <KpiCard
            label="Facturas Emitidas"
            value={String(invoiceStats?.total_invoices ?? 0)}
            sub={periodLabel}
            icon={<FileText className="w-5 h-5" />}
            color="#468189"
            loading={invoiceLoading}
            href="/dashboard/facturacion"
          />
          <KpiCard
            label="Monto Facturado"
            value={fmt(invoiceStats?.total_amount ?? 0)}
            sub={periodLabel}
            icon={<DollarSign className="w-5 h-5" />}
            color="#27ae60"
            loading={invoiceLoading}
            href="/dashboard/facturacion"
          />
          <KpiCard
            label="Facturas Pendientes"
            value={String(invoiceStats?.pending ?? 0)}
            sub="por cobrar"
            icon={<Clock className="w-5 h-5" />}
            color={(invoiceStats?.pending ?? 0) > 0 ? '#e67e22' : '#27ae60'}
            loading={invoiceLoading}
            href="/dashboard/facturacion"
          />
        </div>
      )}

      {/* ── KPIs Contabilidad ── */}
      {hasContabilidad && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Ingresos"
            value={fmt(acctKpis?.ingresos ?? 0)}
            sub={periodLabel}
            icon={<TrendingUp className="w-5 h-5" />}
            color="#27ae60"
            loading={acctKpisLoading}
            href="/dashboard/contabilidad/resultados"
          />
          <KpiCard
            label="Costos"
            value={fmt(acctKpis?.costos ?? 0)}
            sub={periodLabel}
            icon={<Package className="w-5 h-5" />}
            color="#e67e22"
            loading={acctKpisLoading}
          />
          <KpiCard
            label="Gastos"
            value={fmt(acctKpis?.gastos ?? 0)}
            sub={periodLabel}
            icon={<TrendingDown className="w-5 h-5" />}
            color="#d94f4f"
            loading={acctKpisLoading}
          />
          <KpiCard
            label="Utilidad Neta"
            value={fmt(acctKpis?.utilidad ?? 0)}
            sub={periodLabel}
            icon={<BarChart2 className="w-5 h-5" />}
            color={(acctKpis?.utilidad ?? 0) >= 0 ? '#468189' : '#d94f4f'}
            loading={acctKpisLoading}
            href="/dashboard/contabilidad/resultados"
          />
        </div>
      )}

      {/* ── Tendencia + Órdenes por Estado ── */}
      {hasVentas && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <SectionCard title="📈 Tendencia de Ventas — Últimos 30 días" loading={trendLoading}>
              {trend && trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#468189" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#468189" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9DBEBB' }} interval={4}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9DBEBB' }} tickFormatter={fmtShort}
                      width={52} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="total" stroke="#468189" strokeWidth={2.5}
                      dot={false} activeDot={{ r: 5, fill: '#468189', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="orders" stroke="#9DBEBB" strokeWidth={1.5}
                      dot={false} strokeDasharray="4 3" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState text="Sin datos para el período" />}
            </SectionCard>
          </div>

          <SectionCard title="🍩 Órdenes por Estado" loading={statusesLoading}>
            {statuses && statuses.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={statuses} dataKey="total" nameKey="status"
                      cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={2}>
                      {statuses.map(entry => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#888'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [v, STATUS_LABELS[name as string] ?? name]}
                      contentStyle={{ background: '#031926', border: 'none', borderRadius: 8, color: '#F4E9CD', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statuses.map(s => (
                    <div key={s.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: STATUS_COLORS[s.status] ?? '#888' }} />
                        <span className="text-xs" style={{ color: '#555' }}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#031926' }}>{s.total}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState text="Sin órdenes" />}
          </SectionCard>
        </div>
      )}

      {/* ── Top Productos + Top Clientes ── */}
      {(hasVentas || hasClientes) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {hasVentas && (
            <SectionCard
              title="📦 Top 5 Productos"
              loading={productsLoading}
              action={<ModuleBadge label="Ver todos" href="/dashboard/productos" />}
            >
              {products && products.length > 0 ? (
                <div className="space-y-4">
                  {products.map((p, i) => (
                    <RankRow
                      key={p.code}
                      rank={i + 1}
                      name={p.name}
                      sub={`${p.total_qty} unidades vendidas`}
                      value={fmt(p.total_sales)}
                      color="#468189"
                      pct={(p.total_sales / (products[0]?.total_sales ?? 1)) * 100}
                    />
                  ))}
                </div>
              ) : <EmptyState text="Sin ventas en el período" />}
            </SectionCard>
          )}

          {hasClientes && (
            <SectionCard
              title="👥 Top 5 Clientes"
              loading={clientsLoading}
              action={<ModuleBadge label="Ver todos" href="/dashboard/clientes" />}
            >
              {clients && clients.length > 0 ? (
                <div className="space-y-4">
                  {clients.map((c, i) => (
                    <RankRow
                      key={c.name}
                      rank={i + 1}
                      name={c.name}
                      sub={`${c.city ?? '—'} · ${c.total_orders} ${c.total_orders === 1 ? 'orden' : 'órdenes'}`}
                      value={fmt(c.total_sales)}
                      color="#77ACA2"
                      pct={(c.total_sales / (clients[0]?.total_sales ?? 1)) * 100}
                    />
                  ))}
                </div>
              ) : <EmptyState text="Sin ventas en el período" />}
            </SectionCard>
          )}
        </div>
      )}

      {/* ── Ventas por Vendedor ── */}
      {hasVentas && (
        <SectionCard
          title="🏆 Ventas por Vendedor"
          loading={vendorsLoading}
          action={<ModuleBadge label="Ver órdenes" href="/dashboard/ordenes" />}
        >
          {vendors && vendors.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vendors} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f4" vertical={false} />
                <XAxis dataKey="full_name" tick={{ fontSize: 12, fill: '#555', fontWeight: 600 }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9DBEBB' }} tickFormatter={fmtShort}
                  width={56} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number | undefined) => [fmt(v ?? 0), 'Ventas']}
                  contentStyle={{ background: '#031926', border: 'none', borderRadius: 10, color: '#F4E9CD', fontSize: 12 }}
                  cursor={{ fill: 'rgba(68,129,137,0.05)' }}
                />
                <Bar dataKey="total_sales" radius={[8, 8, 0, 0]}>
                  {vendors.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Sin datos de vendedores en el período" />}
        </SectionCard>
      )}

      {/* ── Stock por Bodega ── */}
      {hasMultiBodega && (
        <SectionCard
          title="🏭 Stock por Bodega"
          loading={warehouseLoading}
          action={<ModuleBadge label="Ver bodegas" href="/dashboard/bodegas" />}
        >
          {warehouseSummary && warehouseSummary.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Barras comparativas */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={warehouseSummary} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9DBEBB' }} tickFormatter={fmtShort}
                    width={52} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: any) => [fmt(Number(v)), 'Valor inventario']}
                    contentStyle={{ background: '#031926', border: 'none', borderRadius: 10, color: '#F4E9CD', fontSize: 12 }}
                    cursor={{ fill: 'rgba(68,129,137,0.05)' }}
                  />
                  <Bar dataKey="valor_total" name="Valor" radius={[6, 6, 0, 0]}>
                    {warehouseSummary.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Tabla resumen */}
              <div className="space-y-2">
                {warehouseSummary.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: '#f8fafa', border: '1px solid rgba(68,129,137,0.12)' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Warehouse className="w-4 h-4 flex-shrink-0" style={{ color: '#468189' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#031926' }}>
                          {w.name}
                          {w.is_default && <span className="ml-1.5 text-xs" style={{ color: '#e67e22' }}>★</span>}
                        </p>
                        <p className="text-xs" style={{ color: '#9DBEBB' }}>
                          {w.total_products} productos · {w.total_units.toLocaleString('es-HN')} unidades
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold ml-3 flex-shrink-0" style={{ color: '#468189' }}>
                      {fmt(w.valor_total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState text="Sin bodegas configuradas" />}
        </SectionCard>
      )}

      {/* ── Últimos Asientos Contables ── */}
      {hasContabilidad && (
        <SectionCard
          title="📒 Últimos Asientos Contables"
          loading={entriesLoading}
          action={<ModuleBadge label="Ver diario" href="/dashboard/contabilidad/diario" />}
        >
          {recentEntries && recentEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {['#', 'Fecha', 'Descripción', 'Origen', 'Monto'].map(h => (
                      <th key={h} className="pb-2 text-left"
                        style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f8f8f8', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td className="py-2 pr-3">
                        <span className="font-mono text-xs font-bold" style={{ color: '#468189' }}>
                          #{e.entry_number}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs whitespace-nowrap" style={{ color: '#777' }}>
                        {new Date(e.date).toLocaleDateString('es-HN')}
                      </td>
                      <td className="py-2 pr-3 text-xs" style={{ color: '#031926', maxWidth: 260 }}>
                        <p className="truncate">{e.description}</p>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(68,129,137,0.1)', color: '#468189' }}>
                          {SOURCE_LABELS[e.source] ?? e.source}
                        </span>
                      </td>
                      <td className="py-2 text-sm font-bold" style={{ color: '#031926' }}>
                        {fmt(e.total_debit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState text="Sin asientos contables registrados" />}
        </SectionCard>
      )}

      {/* ── Alertas ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Stock bajo — siempre visible */}
        <SectionCard
          title="⚠️ Productos con Stock Bajo"
          loading={stockLoading}
          action={<ModuleBadge label="Ver inventario" href="/dashboard/inventario" />}
        >
          {(lowStock?.length ?? 0) === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <Package className="w-5 h-5" style={{ color: '#27ae60' }} />
              <p className="text-sm font-medium" style={{ color: '#27ae60' }}>
                Todos los productos tienen stock suficiente
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(lowStock ?? []).map(p => {
                const pct = Math.min((Number(p.stock) / Number(p.min_stock)) * 100, 100)
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#e67e22' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#031926' }}>{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 w-20 rounded-full" style={{ background: '#fde68a' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#e67e22' }} />
                          </div>
                          <p className="text-xs" style={{ color: '#9DBEBB' }}>mín. {p.min_stock} {p.unit}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-bold" style={{ color: '#e67e22' }}>
                        {p.stock} {p.unit}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* Crédito excedido — módulo clientes + no vendedor */}
        {hasClientes && !isVendedor && (
          <SectionCard
            title="🔴 Clientes con Crédito Excedido"
            loading={creditLoading}
            action={<ModuleBadge label="Ver clientes" href="/dashboard/clientes" />}
          >
            {(overCredit?.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <CreditCard className="w-5 h-5" style={{ color: '#27ae60' }} />
                <p className="text-sm font-medium" style={{ color: '#27ae60' }}>
                  Ningún cliente excede su límite
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(overCredit ?? []).map(c => {
                  const excess = Number(c.current_balance) - Number(c.credit_limit)
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <CreditCard className="w-4 h-4 flex-shrink-0" style={{ color: '#d94f4f' }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#031926' }}>{c.name}</p>
                          <p className="text-xs" style={{ color: '#9DBEBB' }}>
                            {c.city} · límite {fmt(Number(c.credit_limit))}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-bold" style={{ color: '#d94f4f' }}>
                          {fmt(Number(c.current_balance))}
                        </p>
                        <p className="text-xs font-semibold" style={{ color: '#d94f4f' }}>
                          +{fmt(excess)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* ── Sin módulos activos ── */}
      {!hasAnyOptionalModule && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: '#fff', border: '2px dashed rgba(68,129,137,0.25)' }}>
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: '#468189' }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: '#031926' }}>
            Activa módulos para ver más métricas
          </h3>
          <p className="text-sm mb-4" style={{ color: '#9DBEBB' }}>
            El dashboard muestra datos según los módulos activos de tu empresa:
            Ventas, Facturación, Contabilidad y Multi-Bodega.
          </p>
          <p className="text-xs" style={{ color: '#9DBEBB' }}>
            Contacta al administrador del sistema para activar los módulos que necesitas.
          </p>
        </div>
      )}

    </div>
  )
}