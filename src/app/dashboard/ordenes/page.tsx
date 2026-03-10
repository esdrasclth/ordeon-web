'use client'

import { useState } from 'react'
import { useOrders } from '@/lib/hooks/use-orders'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, ShoppingCart, Eye, Search } from 'lucide-react'
import { SalesOrder } from '@/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrentUser, usePermissions } from '@/lib/hooks/use-current-user'

const TABS: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente_aprobacion', label: 'Pend. Aprobación' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_preparacion', label: 'En Preparación' },
  { value: 'preparada', label: 'Preparadas' },
  { value: 'despachada', label: 'Despachadas' },
  { value: 'facturada', label: 'Facturadas' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'rechazada', label: 'Rechazadas' },
]

function OrderCard({ order }: { order: SalesOrder }) {
  const fmt = (n: number) =>
    `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

  const date = new Date(order.order_date).toLocaleDateString('es-HN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div
      className="rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
      style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm" style={{ color: '#468189' }}>
              #{String(order.order_number).padStart(5, '0')}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="font-bold mt-1" style={{ color: '#031926' }}>
            {order.clients?.name ?? '—'}
          </p>
        </div>
        <Link href={`/dashboard/ordenes/${order.id}`}>
          <Button size="sm" variant="ghost" style={{ color: '#468189' }}>
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-1 mb-4">
        <p className="text-xs" style={{ color: '#777' }}>
          👤 {order.profiles?.full_name ?? '—'}
        </p>
        <p className="text-xs" style={{ color: '#777' }}>📅 {date}</p>
        {order.delivery_date && (
          <p className="text-xs" style={{ color: '#777' }}>
            🚚 Entrega: {new Date(order.delivery_date).toLocaleDateString('es-HN')}
          </p>
        )}
        <p className="text-xs" style={{ color: '#777' }}>💳 {order.payment_terms}</p>
      </div>

      <div className="rounded-lg p-3 space-y-1" style={{ background: '#f8fafa' }}>
        <div className="flex justify-between text-xs">
          <span style={{ color: '#9DBEBB' }}>Subtotal sin ISV</span>
          <span style={{ color: '#555' }}>{fmt(Number(order.subtotal))}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: '#9DBEBB' }}>ISV</span>
          <span style={{ color: '#555' }}>{fmt(Number(order.isv_amount))}</span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-xs">
            <span style={{ color: '#9DBEBB' }}>Descuento</span>
            <span style={{ color: '#27ae60' }}>-{fmt(Number(order.discount_amount))}</span>
          </div>
        )}
        <div className="flex justify-between pt-1" style={{ borderTop: '1px solid #eee' }}>
          <span className="text-sm font-bold" style={{ color: '#031926' }}>Total</span>
          <span className="text-sm font-bold" style={{ color: '#468189' }}>
            {fmt(Number(order.total))}
          </span>
        </div>
      </div>

      {order.invoice_number && (
        <p className="text-xs mt-2 font-semibold" style={{ color: '#468189' }}>
          Factura: {order.invoice_number}
        </p>
      )}
    </div>
  )
}

export default function OrdenesPage() {
  const [activeTab, setActiveTab] = useState('todos')
  const [search, setSearch] = useState('')
  const router = useRouter()

  const { data: currentUser } = useCurrentUser()
  const { actions, isVendedor, role } = usePermissions()

  const vendorFilter = isVendedor ? currentUser?.id : undefined
  const { data: orders, isLoading } = useOrders(activeTab, vendorFilter)

  const filteredOrders = (orders ?? []).filter(o => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      String(o.order_number).padStart(5, '0').includes(q) ||
      o.clients?.name?.toLowerCase().includes(q) ||
      o.profiles?.full_name?.toLowerCase().includes(q)
    )
  })

  const counts = TABS.reduce((acc, tab) => {
    acc[tab.value] = tab.value === 'todos'
      ? (orders?.length ?? 0)
      : (orders?.filter(o => o.status === tab.value).length ?? 0)
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)' }}>
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Órdenes de Venta
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {filteredOrders.length} órdenes encontradas
              {isVendedor && <span className="ml-1" style={{ color: '#9DBEBB' }}>· solo tus órdenes</span>}
            </p>
          </div>
        </div>
        {actions.canCreateOrder && (
          <button
            onClick={() => router.push('/dashboard/ordenes/nueva')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" />
            Nueva Orden
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 pt-2">
        {TABS
          .filter(tab => {
            if (
              (tab.value === 'pendiente_aprobacion' || tab.value === 'rechazada') &&
              (role === 'almacen' || role === 'facturacion')
            ) return false
            return true
          })
          .map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                background: activeTab === tab.value ? '#468189' : '#fff',
                color: activeTab === tab.value ? '#F4E9CD' : '#777',
                border: `1px solid ${activeTab === tab.value ? '#468189' : '#ddd'}`,
              }}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === tab.value ? 'rgba(244,233,205,0.3)' :
                      tab.value === 'pendiente_aprobacion' ? '#fef3c7' : '#f0f0f0',
                    color: activeTab === tab.value ? '#F4E9CD' :
                      tab.value === 'pendiente_aprobacion' ? '#d97706' : '#888',
                  }}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))
        }
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9DBEBB' }} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por número de orden, cliente o vendedor..."
          className="pl-10 h-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xl leading-none"
            style={{ color: '#9DBEBB' }}
          >
            ×
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl animate-pulse" style={{ background: '#e8efee' }} />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#9DBEBB' }}>
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? `Sin resultados para "${search}"` : 'No hay órdenes en este estado'}
          </p>
          {actions.canCreateOrder && !search && (
            <p className="text-sm mt-1">Crea una nueva orden para comenzar</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}