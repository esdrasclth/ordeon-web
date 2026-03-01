'use client'

import { useState } from 'react'
import { useOrders } from '@/lib/hooks/use-orders'
import { OrderForm } from '@/components/orders/order-form'
import { OrderStatusBadge, STATUS_CONFIG } from '@/components/orders/order-status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Plus, ShoppingCart, Eye } from 'lucide-react'
import { OrderStatus, SalesOrder } from '@/types'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState as useStateR } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrentUser, usePermissions } from '@/lib/hooks/use-current-user'

const TABS: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_preparacion', label: 'En Preparación' },
  { value: 'preparada', label: 'Preparadas' },
  { value: 'despachada', label: 'Despachadas' },
  { value: 'facturada', label: 'Facturadas' },
  { value: 'cancelada', label: 'Canceladas' },
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
      {/* Header */}
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

      {/* Info */}
      <div className="space-y-1 mb-4">
        <p className="text-xs" style={{ color: '#777' }}>
          👤 {order.profiles?.full_name ?? '—'}
        </p>
        <p className="text-xs" style={{ color: '#777' }}>
          📅 {date}
        </p>
        {order.delivery_date && (
          <p className="text-xs" style={{ color: '#777' }}>
            🚚 Entrega: {new Date(order.delivery_date).toLocaleDateString('es-HN')}
          </p>
        )}
        <p className="text-xs" style={{ color: '#777' }}>
          💳 {order.payment_terms}
        </p>
      </div>

      {/* Totales */}
      <div
        className="rounded-lg p-3 space-y-1"
        style={{ background: '#f8fafa' }}
      >
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
        <div
          className="flex justify-between pt-1"
          style={{ borderTop: '1px solid #eee' }}
        >
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
  const router = useRouter()

  const { data: currentUser } = useCurrentUser()
  const { actions, isVendedor } = usePermissions()

  // Si es vendedor, filtrar solo sus órdenes
  const vendorFilter = isVendedor ? currentUser?.id : undefined
  const { data: orders, isLoading } = useOrders(activeTab, vendorFilter)

  const counts = TABS.reduce((acc, tab) => {
    if (tab.value === 'todos') {
      acc[tab.value] = orders?.length ?? 0
    } else {
      acc[tab.value] = orders?.filter(o => o.status === tab.value).length ?? 0
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: '#031926', fontFamily: 'Georgia, serif' }}
          >
            Órdenes de Venta
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>
            {orders?.length ?? 0} órdenes encontradas
            {isVendedor && (
              <span className="ml-1" style={{ color: '#9DBEBB' }}>· solo tus órdenes</span>
            )}
          </p>
        </div>
        {actions.canCreateOrder && (
          <Button
            onClick={() => router.push('/dashboard/ordenes/nueva')}
            style={{ background: '#468189', color: '#F4E9CD' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1 pt-2">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.value ? '#468189' : '#fff',
              color:      activeTab === tab.value ? '#F4E9CD' : '#777',
              border:     `1px solid ${activeTab === tab.value ? '#468189' : '#ddd'}`,
            }}
          >
            {tab.label}
            {counts[tab.value] > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: activeTab === tab.value ? 'rgba(244,233,205,0.3)' : '#f0f0f0',
                  color:      activeTab === tab.value ? '#F4E9CD' : '#888',
                }}
              >
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl animate-pulse" style={{ background: '#e8efee' }} />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#9DBEBB' }}>
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay órdenes en este estado</p>
          {actions.canCreateOrder && (
            <p className="text-sm mt-1">Crea una nueva orden para comenzar</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders?.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}