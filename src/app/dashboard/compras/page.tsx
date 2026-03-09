'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag, Plus, Search, Filter, Eye, TruckIcon,
  CheckCircle, Clock, XCircle, SendHorizonal, AlertCircle
} from 'lucide-react'
import { usePurchaseOrders } from '@/lib/hooks/use-purchase-orders'
import { PurchaseOrder, PurchaseOrderStatus } from '@/types'

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  borrador:          { label: 'Borrador',         color: '#94a3b8', icon: Clock },
  enviada:           { label: 'Enviada',           color: '#3b82f6', icon: SendHorizonal },
  recibida_parcial:  { label: 'Recibida Parcial',  color: '#f59e0b', icon: AlertCircle },
  recibida:          { label: 'Recibida',          color: '#22c55e', icon: CheckCircle },
  cancelada:         { label: 'Cancelada',         color: '#ef4444', icon: XCircle },
}

const FILTER_OPTIONS = [
  { value: 'todos',            label: 'Todas' },
  { value: 'borrador',         label: 'Borrador' },
  { value: 'enviada',          label: 'Enviadas' },
  { value: 'recibida_parcial', label: 'Parciales' },
  { value: 'recibida',         label: 'Recibidas' },
  { value: 'cancelada',        label: 'Canceladas' },
]

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n)
}
function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ComprasPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('todos')
  const [search, setSearch] = useState('')

  const { data: orders = [], isLoading, error } = usePurchaseOrders(
    statusFilter !== 'todos' ? statusFilter : undefined
  )

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    return (
      String(o.po_number).includes(q) ||
      (o.suppliers?.name ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)' }}>
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#031926' }}>Compras</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>Gestión de órdenes de compra y proveedores</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard/compras/proveedores')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
          >
            Proveedores
          </button>
          <button
            onClick={() => router.push('/dashboard/compras/nueva')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" />
            Nueva OC
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {FILTER_OPTIONS.filter(f => f.value !== 'todos').map(f => {
          const count = orders.filter(o => o.status === f.value).length
          const cfg   = STATUS_CONFIG[f.value as PurchaseOrderStatus]
          const Icon  = cfg.icon
          return (
            <button key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="rounded-xl p-4 text-left transition-all border"
              style={{
                background:   statusFilter === f.value ? `${cfg.color}15` : '#fff',
                borderColor:  statusFilter === f.value ? cfg.color : '#e2e8f0',
                boxShadow:    '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                <span className="text-xl font-bold" style={{ color: cfg.color }}>{count}</span>
              </div>
              <p className="text-xs font-medium" style={{ color: '#64748b' }}>{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número o proveedor…"
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border outline-none"
            style={{ borderColor: '#e2e8f0', background: '#fff' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: '#94a3b8' }} />
          {FILTER_OPTIONS.map(f => (
            <button key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background:  statusFilter === f.value ? '#031926' : '#fff',
                color:       statusFilter === f.value ? '#f4e9cd' : '#64748b',
                borderColor: statusFilter === f.value ? '#031926' : '#e2e8f0',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['# OC', 'Proveedor', 'Fecha', 'F. Esperada', 'Total', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                  style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#94a3b8' }}>
                Cargando…
              </td></tr>
            )}
            {error && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#ef4444' }}>
                Error al cargar órdenes de compra
              </td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: '#94a3b8' }}>
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay órdenes de compra{statusFilter !== 'todos' ? ` con estado "${FILTER_OPTIONS.find(f=>f.value===statusFilter)?.label}"` : ''}</p>
              </td></tr>
            )}
            {filtered.map((order, idx) => {
              const cfg  = STATUS_CONFIG[order.status]
              const Icon = cfg.icon
              return (
                <tr key={order.id}
                  className="transition-colors hover:bg-slate-50 cursor-pointer"
                  style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : undefined }}
                  onClick={() => router.push(`/dashboard/compras/${order.id}`)}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: '#031926' }}>
                    OC-{String(order.po_number).padStart(5, '0')}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#1e293b' }}>
                    {order.suppliers?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#64748b' }}>{fmtDate(order.order_date)}</td>
                  <td className="px-4 py-3" style={{ color: '#64748b' }}>{fmtDate(order.expected_date)}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#031926' }}>
                    {fmtCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${cfg.color}18`, color: cfg.color }}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/dashboard/compras/${order.id}`)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: '#468189' }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
