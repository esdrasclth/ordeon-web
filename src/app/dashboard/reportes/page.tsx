'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart2, FileText, Package, TrendingUp, CreditCard,
  ShoppingCart, Download, FileDown, Calendar, Loader2,
  AlertTriangle, RefreshCw, Users, BarChart, Receipt, BookOpen,
  ArrowUpDown, DollarSign, Truck,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

const supabase = createClient()

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const CHART_COLORS = ['#468189', '#031926', '#2980b9', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c']

const PERIOD_LABELS: Record<string, string> = {
  today: 'Hoy', week: 'Esta semana', month: 'Este mes', year: 'Este año',
}

interface PeriodOption { value: string; label: string }
const PERIODS: PeriodOption[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'custom', label: 'Personalizado' },
]

const TABS = [
  { id: 'ventas', label: 'Ventas', icon: TrendingUp },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'facturacion', label: 'Facturación', icon: Receipt },
  { id: 'compras', label: 'Compras', icon: ShoppingCart },
  { id: 'contabilidad', label: 'Contabilidad', icon: BookOpen },
]

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string
  icon?: React.ElementType
}) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-3"
      style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
      {Icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold" style={{ color, fontFamily: 'Georgia, serif' }}>{value}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: '#475569' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#94a3b8' }}>
      {children}
    </h2>
  )
}

function ChartCard({ title, children, minH = 260 }: {
  title: string; children: React.ReactNode; minH?: number
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)', minHeight: minH }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: '#031926' }}>{title}</h3>
      {children}
    </div>
  )
}

function ReportCard({
  icon: Icon, title, description, type, accent,
  period, from, to, hasModule = true, printHref,
}: {
  icon: React.ElementType; title: string; description: string
  type: string; accent: string; period: string; from: string; to: string
  hasModule?: boolean; printHref?: string
}) {
  const [loading, setLoading] = useState(false)

  const downloadExcel = async () => {
    if (!hasModule || loading) return
    setLoading(true)
    const params = new URLSearchParams({ type, period })
    if (period === 'custom') { params.set('from', from); params.set('to', to) }
    try {
      const res = await fetch(`/api/reports/export?${params}`)
      if (!res.ok) throw new Error('Error al generar reporte')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `reporte_${type}_${Date.now()}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="rounded-2xl overflow-hidden transition-all hover:shadow-md"
      style={{
        background: hasModule ? '#fff' : '#fafafa',
        border: `1px solid ${hasModule ? 'rgba(70,129,137,0.12)' : '#e2e8f0'}`,
        opacity: hasModule ? 1 : 0.6,
      }}>
      {/* Top color bar */}
      <div className="h-1" style={{ background: hasModule ? accent : '#e2e8f0' }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}15` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          {!hasModule && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#f1f5f9', color: '#94a3b8' }}>
              Módulo inactivo
            </span>
          )}
        </div>
        <h3 className="font-bold text-sm mb-1" style={{ color: '#031926' }}>{title}</h3>
        <p className="text-xs mb-4" style={{ color: '#94a3b8', lineHeight: 1.6 }}>{description}</p>

        <div className="flex gap-2">
          <button
            onClick={downloadExcel}
            disabled={!hasModule || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: hasModule ? accent : '#e2e8f0',
              color: hasModule ? '#fff' : '#94a3b8',
              cursor: hasModule ? 'pointer' : 'not-allowed',
            }}>
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando…</>
              : <><Download className="w-3.5 h-3.5" /> Excel</>}
          </button>
          {printHref && hasModule && (
            <Link href={printHref + `?period=${period}&from=${from}&to=${to}`}
              target="_blank"
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: '#f1f5f9', color: '#475569' }}>
              <FileDown className="w-3.5 h-3.5" /> PDF
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab Ventas ───────────────────────────────────────────────────────────────

function VentasTab({ period, from, to, has }: {
  period: string; from: string; to: string; has: (m: string) => boolean
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const ACCENT = '#468189'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams({ period, from, to })
      const res = await fetch(`/api/reports/chart-data?module=ventas&${params}`)
      if (res.ok) setData(await res.json())
      setLoading(false)
    }
    load()
  }, [period, from, to])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#f1f5f9' }} />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Total Ventas" value={fmt(data.kpis.totalVentas)} color={ACCENT} sub={PERIOD_LABELS[period] ?? 'Período'} />
          <StatCard icon={BarChart2} label="Órdenes" value={data.kpis.totalOrdenes} color="#031926" sub="activas (sin canceladas)" />
          <StatCard icon={DollarSign} label="Ticket Promedio" value={fmt(data.kpis.ticketPromedio)} color="#2980b9" sub="por orden" />
          <StatCard icon={Users} label="Clientes Únicos" value={data.kpis.clientesUnicos} color="#27ae60" sub="en el período" />
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard title="Ventas por día">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.porDia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `L.${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} labelFormatter={l => `Día: ${l}`} />
                <Line type="monotone" dataKey="total" stroke={ACCENT} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 8 — Ventas por Vendedor">
            <ResponsiveContainer width="100%" height={220}>
              <ReBarChart data={data.porVendedor.slice(0, 8)} layout="vertical" margin={{ left: 60, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `L.${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="vendedor" tick={{ fontSize: 10 }} width={60} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="total" fill={ACCENT} radius={[0, 4, 4, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 10 — Ventas por Producto">
            <ResponsiveContainer width="100%" height={220}>
              <ReBarChart data={data.porProducto.slice(0, 10)} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="producto" tick={{ fontSize: 9 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `L.${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="total" fill="#2980b9" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Órdenes por Estado">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.porEstado} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="cantidad" nameKey="estado" paddingAngle={2}>
                  {data.porEstado.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div>
        <SectionTitle>Reportes de Ventas</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ReportCard icon={TrendingUp} title="Ventas por Período"
            description="Listado de órdenes con cliente, vendedor, estado y monto."
            type="ventas" accent={ACCENT}
            period={period} from={from} to={to} hasModule={has('ventas')}
            printHref="/print/reportes/ventas" />
          <ReportCard icon={Users} title="Ventas por Vendedor"
            description="Ranking de vendedores con total vendido, ticket promedio y % del total."
            type="ventas_vendedor" accent="#031926"
            period={period} from={from} to={to} hasModule={has('ventas')}
            printHref="/print/reportes/ventas-vendedor" />
          <ReportCard icon={Package} title="Ventas por Producto"
            description="Top productos: unidades vendidas, ingresos y participación en ventas."
            type="ventas_producto" accent="#2980b9"
            period={period} from={from} to={to} hasModule={has('ventas')}
            printHref="/print/reportes/ventas-producto" />
          <ReportCard icon={BarChart} title="Ventas por Cliente"
            description="Top clientes por monto, frecuencia de compra y ticket promedio."
            type="ventas_cliente" accent="#27ae60"
            period={period} from={from} to={to} hasModule={has('ventas')} />
          <ReportCard icon={ArrowUpDown} title="Órdenes por Estado"
            description="Conteo y monto total agrupado por estado: pendientes, despachadas, canceladas."
            type="ordenes_estado" accent="#e67e22"
            period={period} from={from} to={to} hasModule={has('ventas')} />
        </div>
      </div>
    </div>
  )
}

// ─── Tab Inventario ───────────────────────────────────────────────────────────

function InventarioTab({ period, from, to, has }: {
  period: string; from: string; to: string; has: (m: string) => boolean
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const ACCENT = '#27ae60'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams({ period, from, to })
      const res = await fetch(`/api/reports/chart-data?module=inventario&${params}`)
      if (res.ok) setData(await res.json())
      setLoading(false)
    }
    load()
  }, [period, from, to])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#f1f5f9' }} />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Total Productos" value={data.kpis.totalProductos} color={ACCENT} sub="activos" />
          <StatCard icon={AlertTriangle} label="Bajo Mínimo" value={data.kpis.bajoMinimo} color="#e67e22" sub="requieren reorden" />
          <StatCard icon={DollarSign} label="Valor Inventario" value={fmt(data.kpis.valorInventario)} color="#2980b9" sub="costo total" />
          <StatCard icon={ArrowUpDown} label="Movimientos" value={data.kpis.movimientos} color="#9b59b6" sub="en el período" />
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard title="Top 10 — Productos con mayor stock">
            <ResponsiveContainer width="100%" height={220}>
              <ReBarChart data={data.topStock.slice(0, 10)} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="producto" tick={{ fontSize: 9 }} width={80} />
                <Tooltip />
                <Bar dataKey="stock" fill={ACCENT} radius={[0, 4, 4, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Movimientos de Stock por Tipo">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.movPorTipo} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="cantidad" nameKey="tipo" paddingAngle={2}>
                  {data.movPorTipo.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div>
        <SectionTitle>Reportes de Inventario</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ReportCard icon={Package} title="Stock Actual"
            description="Listado completo de productos con stock, mínimo, precios y valor de inventario."
            type="inventario" accent={ACCENT}
            period={period} from={from} to={to}
            printHref="/print/reportes/inventario" />
          <ReportCard icon={AlertTriangle} title="Productos Bajo Mínimo"
            description="Solo productos que requieren reorden, con su stock actual vs mínimo requerido."
            type="stock_bajo" accent="#e67e22"
            period={period} from={from} to={to}
            printHref="/print/reportes/stock-bajo" />
          <ReportCard icon={RefreshCw} title="Movimientos de Stock"
            description="Historial de entradas y salidas con motivo, producto y usuario responsable."
            type="movimientos" accent="#16a085"
            period={period} from={from} to={to}
            printHref="/print/reportes/movimientos" />
          <ReportCard icon={BarChart2} title="Rotación de Inventario"
            description="Productos más y menos vendidos/movidos. Identifica artículos estancados."
            type="rotacion" accent="#9b59b6"
            period={period} from={from} to={to} />
          <ReportCard icon={DollarSign} title="Valoración de Inventario"
            description="Valor total del inventario a costo promedio, agrupado por categoría."
            type="valoracion" accent="#2980b9"
            period={period} from={from} to={to}
            printHref="/print/reportes/valoracion" />
        </div>
      </div>
    </div>
  )
}

// ─── Tab Facturación ──────────────────────────────────────────────────────────

function FacturacionTab({ period, from, to, has }: {
  period: string; from: string; to: string; has: (m: string) => boolean
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const ACCENT = '#2980b9'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams({ period, from, to })
      const res = await fetch(`/api/reports/chart-data?module=facturacion&${params}`)
      if (res.ok) setData(await res.json())
      setLoading(false)
    }
    load()
  }, [period, from, to])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#f1f5f9' }} />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Receipt} label="Facturas Emitidas" value={data.kpis.totalFacturas} color={ACCENT} sub="en el período" />
          <StatCard icon={DollarSign} label="Total Facturado" value={fmt(data.kpis.totalFacturado)} color="#27ae60" sub="sin canceladas" />
          <StatCard icon={FileText} label="ISV Causado" value={fmt(data.kpis.totalIsv)} color="#e67e22" sub="ISV 15% SAR" />
          <StatCard icon={AlertTriangle} label="Pendientes Cobro" value={data.kpis.pendientesCobro} color="#e74c3c" sub="facturas por cobrar" />
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard title="Facturación mensual (año actual)">
            <ResponsiveContainer width="100%" height={220}>
              <ReBarChart data={data.porMes} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `L.${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="subtotal" name="Subtotal" fill={ACCENT} radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="isv" name="ISV" fill="#e67e22" radius={[4, 4, 0, 0]} stackId="a" />
              </ReBarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Aging — Facturas por Antigüedad">
            <ResponsiveContainer width="100%" height={220}>
              <ReBarChart data={data.aging} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="rango" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Facturas" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div>
        <SectionTitle>Reportes de Facturación</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ReportCard icon={Receipt} title="Facturas Emitidas"
            description="Todas las facturas del período con subtotal, ISV y total."
            type="facturas" accent={ACCENT}
            period={period} from={from} to={to} hasModule={has('facturacion')}
            printHref="/print/reportes/facturas" />
          <ReportCard icon={FileText} title="Reporte Fiscal ISV"
            description="Facturas con subtotal, ISV 15% y total para declaración mensual ante el SAR."
            type="isv" accent="#e67e22"
            period={period} from={from} to={to} hasModule={has('facturacion')}
            printHref="/print/reportes/isv" />
          <ReportCard icon={AlertTriangle} title="Aging — Facturas Pendientes"
            description="Facturas sin cobrar agrupadas por antigüedad: al día, 1-30, 31-60, +60 días."
            type="aging_facturas" accent="#e74c3c"
            period={period} from={from} to={to} hasModule={has('facturacion')}
            printHref="/print/reportes/aging-facturas" />
          <ReportCard icon={CreditCard} title="Cuentas por Cobrar"
            description="Clientes con saldo pendiente, límite de crédito disponible y alertas de exceso."
            type="cxc" accent="#9b59b6"
            period={period} from={from} to={to} hasModule={has('clientes')}
            printHref="/print/reportes/cxc" />
        </div>
      </div>
    </div>
  )
}

// ─── Tab Compras ──────────────────────────────────────────────────────────────

function ComprasTab({ period, from, to, has }: {
  period: string; from: string; to: string; has: (m: string) => boolean
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const ACCENT = '#9b59b6'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams({ period, from, to })
      const res = await fetch(`/api/reports/chart-data?module=compras&${params}`)
      if (res.ok) setData(await res.json())
      setLoading(false)
    }
    load()
  }, [period, from, to])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#f1f5f9' }} />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={ShoppingCart} label="Órdenes de Compra" value={data.kpis.totalOC} color={ACCENT} sub="en el período" />
          <StatCard icon={DollarSign} label="Total Comprado" value={fmt(data.kpis.totalComprado)} color="#2980b9" sub="sin canceladas" />
          <StatCard icon={Truck} label="Proveedores" value={data.kpis.proveedores} color="#27ae60" sub="con OC en el período" />
          <StatCard icon={CreditCard} label="Pagos Realizados" value={fmt(data.kpis.totalPagado)} color="#e67e22" sub="en el período" />
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard title="Top 8 — Compras por Proveedor">
            <ResponsiveContainer width="100%" height={220}>
              <ReBarChart data={data.porProveedor.slice(0, 8)} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `L.${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="proveedor" tick={{ fontSize: 9 }} width={80} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="total" fill={ACCENT} radius={[0, 4, 4, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="OC por Estado">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.porEstado} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="cantidad" nameKey="estado" paddingAngle={2}>
                  {data.porEstado.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div>
        <SectionTitle>Reportes de Compras</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ReportCard icon={ShoppingCart} title="OC por Proveedor"
            description="Historial de órdenes de compra agrupado por proveedor con ISV y totales."
            type="compras" accent={ACCENT}
            period={period} from={from} to={to} hasModule={has('compras')}
            printHref="/print/reportes/compras" />
          <ReportCard icon={BarChart2} title="Compras por Período"
            description="Resumen de compras totales vs período anterior. Tendencia de gasto."
            type="compras_periodo" accent="#2980b9"
            period={period} from={from} to={to} hasModule={has('compras')} />
          <ReportCard icon={CreditCard} title="Pagos a Proveedores"
            description="Historial de pagos realizados a proveedores con saldos pendientes."
            type="pagos_proveedores" accent="#27ae60"
            period={period} from={from} to={to} hasModule={has('compras')}
            printHref="/print/reportes/pagos-proveedores" />
        </div>
      </div>
    </div>
  )
}

// ─── Tab Contabilidad ─────────────────────────────────────────────────────────

function ContabilidadTab() {
  const contReports = [
    { icon: BarChart2, title: 'Balance General', accent: '#468189', href: '/dashboard/contabilidad/balance', desc: 'Activos, pasivos y patrimonio al cierre del período.' },
    { icon: TrendingUp, title: 'Estado de Resultados', accent: '#27ae60', href: '/dashboard/contabilidad/resultados', desc: 'Ingresos - Costos - Gastos = Utilidad del período.' },
    { icon: BookOpen, title: 'Libro Diario', accent: '#031926', href: '/dashboard/contabilidad/diario', desc: 'Todos los asientos contables registrados en el período.' },
    { icon: BarChart, title: 'Comprobación de Saldos', accent: '#2980b9', href: '/dashboard/contabilidad/comprobacion', desc: 'Balanza de comprobación: débitos y créditos por cuenta.' },
    { icon: DollarSign, title: 'Mayor General', accent: '#9b59b6', href: '/dashboard/contabilidad/mayor', desc: 'Movimientos por cuenta contable con saldos acumulados.' },
  ]
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: '#fff9ed', border: '1px solid #fbbf24' }}>
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#92400e' }}>Módulo de Contabilidad</p>
          <p className="text-xs mt-0.5" style={{ color: '#78350f', lineHeight: 1.6 }}>
            Los reportes contables se generan desde el módulo dedicado de contabilidad.
            Aquí puedes acceder directamente a cada reporte con los filtros de período aplicados.
          </p>
        </div>
      </div>
      <div>
        <SectionTitle>Reportes Contables</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contReports.map(r => (
            <div key={r.href} className="rounded-2xl overflow-hidden transition-all hover:shadow-md"
              style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
              <div className="h-1" style={{ background: r.accent }} />
              <div className="p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${r.accent}15` }}>
                  <r.icon className="w-5 h-5" style={{ color: r.accent }} />
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: '#031926' }}>{r.title}</h3>
                <p className="text-xs mb-4" style={{ color: '#94a3b8', lineHeight: 1.6 }}>{r.desc}</p>
                <Link href={r.href}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold w-full"
                  style={{ background: r.accent, color: '#fff' }}>
                  <FileDown className="w-3.5 h-3.5" /> Abrir reporte
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState('ventas')
  const [period, setPeriod] = useState('month')
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])
  const [modules, setModules] = useState<string[]>(['core'])
  const [kpis, setKpis] = useState<any>(null)
  const [loadingKpis, setLoadingKpis] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('company_id, companies(modules)')
        .eq('id', user.id).single()
      const mods = (profile?.companies as any)?.modules ?? ['core']
      setModules(mods)
      const id = profile?.company_id
      if (!id) return

      const now = new Date()
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const [{ data: orders }, { data: invoices }, { data: lowStock }, { data: cxcData }] =
        await Promise.all([
          supabase.from('sales_orders').select('total').eq('company_id', id)
            .gte('order_date', startDate).neq('status', 'cancelada'),
          supabase.from('invoices').select('id').eq('company_id', id).gte('issued_at', startDate),
          supabase.from('products').select('id, stock, min_stock').eq('company_id', id).eq('active', true),
          supabase.from('clients').select('current_balance').eq('company_id', id).gt('current_balance', 0),
        ])

      setKpis({
        totalVentas: (orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0),
        totalFacturas: (invoices ?? []).length,
        productosStockBajo: (lowStock ?? []).filter(p => Number(p.stock) <= Number(p.min_stock)).length,
        clientesCxC: (cxcData ?? []).length,
      })
      setLoadingKpis(false)
    }
    load()
  }, [])

  const has = (m: string) => modules.includes(m) || modules.includes('core')

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
    fontSize: 13, outline: 'none', background: '#fff', color: '#1e293b',
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #468189, #031926)' }}>
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Centro de Reportes
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Visualiza, analiza y descarga reportes de toda la operación
          </p>
        </div>
      </div>

      {/* KPIs globales del mes */}
      {loadingKpis ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#f1f5f9' }} />)}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Ventas este mes" value={fmt(kpis.totalVentas)} color="#468189" sub="órdenes activas" />
          <StatCard icon={Receipt} label="Facturas este mes" value={kpis.totalFacturas} color="#2980b9" sub="emitidas" />
          <StatCard icon={AlertTriangle} label="Productos bajo stock" value={kpis.productosStockBajo} color="#e67e22" sub="requieren reorden" />
          <StatCard icon={CreditCard} label="Clientes con saldo" value={kpis.clientesCxC} color="#9b59b6" sub="cuentas por cobrar" />
        </div>
      )}

      {/* Filtros de período */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-3"
        style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: '#468189' }} />
          <span className="text-sm font-semibold" style={{ color: '#031926' }}>Período:</span>
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: '#f1f5f9' }}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                background: period === p.value ? '#031926' : 'transparent',
                color: period === p.value ? '#F4E9CD' : '#64748b',
              }}>
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
            <span className="text-xs" style={{ color: '#94a3b8' }}>—</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: '#f1f5f9' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === t.id ? '#031926' : 'transparent',
                color: activeTab === t.id ? '#F4E9CD' : '#64748b',
              }}>
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'ventas' && <VentasTab period={period} from={from} to={to} has={has} />}
        {activeTab === 'inventario' && <InventarioTab period={period} from={from} to={to} has={has} />}
        {activeTab === 'facturacion' && <FacturacionTab period={period} from={from} to={to} has={has} />}
        {activeTab === 'compras' && <ComprasTab period={period} from={from} to={to} has={has} />}
        {activeTab === 'contabilidad' && <ContabilidadTab />}
      </div>

    </div>
  )
}
