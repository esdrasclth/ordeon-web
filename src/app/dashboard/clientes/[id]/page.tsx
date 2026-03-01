'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClient, useClientStats, useClientOrders, useUpdateClient } from '@/lib/hooks/use-clients'
import { ClientForm } from '@/components/clients/client-form'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  ArrowLeft, Pencil, Loader2, ShoppingCart,
  TrendingUp, Clock, Hash, Phone, MapPin, Mail
} from 'lucide-react'
import { OrderStatus } from '@/types'
import { toast } from 'sonner'
import { usePermissions } from '@/lib/hooks/use-current-user'
import Link from 'next/link'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const STATUS_COLORS = {
  active:   { bg: '#27ae60', label: 'Activo'    },
  blocked:  { bg: '#d94f4f', label: 'Bloqueado' },
  inactive: { bg: '#bbb',    label: 'Inactivo'  },
}

export default function ClientDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { actions } = usePermissions()

  const { data: client,  isLoading: clientLoading  } = useClient(id)
  const { data: stats,   isLoading: statsLoading    } = useClientStats(id)
  const { data: orders,  isLoading: ordersLoading   } = useClientOrders(id)
  const updateClient = useUpdateClient()

  const [showEdit, setShowEdit] = useState(false)

  const handleUpdate = async (data: any) => {
    try {
      await updateClient.mutateAsync({ id, ...data })
      toast.success('Cliente actualizado')
      setShowEdit(false)
    } catch {
      toast.error('Error al actualizar el cliente')
    }
  }

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#468189' }} />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-20" style={{ color: '#9DBEBB' }}>
        <p>Cliente no encontrado</p>
      </div>
    )
  }

  const status      = STATUS_COLORS[client.status]
  const overCredit  = client.credit_limit > 0 && client.current_balance >= client.credit_limit
  const creditPct   = client.credit_limit > 0
    ? Math.min((client.current_balance / client.credit_limit) * 100, 100)
    : 0
  const creditColor = creditPct >= 100 ? '#d94f4f' : creditPct >= 80 ? '#e67e22' : '#27ae60'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}
            style={{ color: '#468189' }}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold"
                style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                {client.name}
              </h1>
              <Badge style={{ background: status.bg, color: '#fff', border: 'none' }}>
                {status.label}
              </Badge>
              <Badge style={{ background: '#F4E9CD', color: '#031926', border: 'none' }}>
                Lista {client.price_list}
              </Badge>
            </div>
            {client.rtn && (
              <p className="text-sm mt-0.5" style={{ color: '#9DBEBB' }}>
                RTN: {client.rtn}
              </p>
            )}
          </div>
        </div>

        {actions.canManageClients && (
          <Button onClick={() => setShowEdit(true)}
            style={{ background: '#468189', color: '#F4E9CD' }}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar Cliente
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          {
            label: 'Total Comprado',
            value: statsLoading ? '...' : fmt(stats?.total_spent ?? 0),
            icon:  <TrendingUp className="w-5 h-5" />,
            color: '#468189',
          },
          {
            label: 'Órdenes Totales',
            value: statsLoading ? '...' : String(stats?.total_orders ?? 0),
            icon:  <ShoppingCart className="w-5 h-5" />,
            color: '#27ae60',
          },
          {
            label: 'Órdenes Pendientes',
            value: statsLoading ? '...' : String(stats?.pending_orders ?? 0),
            icon:  <Clock className="w-5 h-5" />,
            color: stats?.pending_orders ? '#e67e22' : '#27ae60',
          },
          {
            label: 'Última Orden',
            value: statsLoading ? '...' : stats?.last_order
              ? new Date(stats.last_order).toLocaleDateString('es-HN')
              : 'Sin órdenes',
            icon:  <Clock className="w-5 h-5" />,
            color: '#9DBEBB',
          },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${kpi.color}18` }}>
                <div style={{ color: kpi.color }}>{kpi.icon}</div>
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                  {kpi.value}
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: kpi.color }}>
                  {kpi.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cuerpo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Historial de órdenes */}
        <div className="rounded-xl overflow-hidden shadow-sm"
          style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
          <div className="px-5 py-4" style={{ background: '#031926' }}>
            <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
              Historial de Órdenes
            </h3>
          </div>

          {ordersLoading ? (
            <div className="p-8 text-center" style={{ color: '#9DBEBB' }}>
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : orders?.length === 0 ? (
            <div className="p-12 text-center" style={{ color: '#9DBEBB' }}>
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin órdenes registradas</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                  {['# Orden', 'Fecha', 'Estado', 'Vendedor', 'Pago', 'Total', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left"
                      style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders?.map((order: any, i: number) => (
                  <tr key={order.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: '#468189' }}>
                      #{String(order.order_number).padStart(5, '0')}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                      {new Date(order.order_date).toLocaleDateString('es-HN')}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                      {order.profiles?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                      {order.payment_terms}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: '#031926' }}>
                      {fmt(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/ordenes/${order.id}`}>
                        <Button size="sm" variant="ghost" style={{ color: '#468189' }}>
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info del cliente */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Datos de contacto */}
          <div className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-4"
              style={{ color: '#468189' }}>
              Contacto
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {client.contact_name && (
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9DBEBB' }} />
                  <span className="text-sm" style={{ color: '#031926' }}>{client.contact_name}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9DBEBB' }} />
                  <span className="text-sm" style={{ color: '#031926' }}>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9DBEBB' }} />
                  <span className="text-sm" style={{ color: '#031926' }}>{client.email}</span>
                </div>
              )}
              {(client.city || client.department) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9DBEBB' }} />
                  <span className="text-sm" style={{ color: '#031926' }}>
                    {[client.city, client.department].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {client.address && (
                <p className="text-xs leading-relaxed" style={{ color: '#777', paddingLeft: 20 }}>
                  {client.address}
                </p>
              )}
            </div>
          </div>

          {/* Condiciones comerciales */}
          <div className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-4"
              style={{ color: '#468189' }}>
              Condiciones Comerciales
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Lista de precios',  value: `Lista ${client.price_list}` },
                { label: 'Términos de pago',  value: client.payment_terms },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs mb-0.5" style={{ color: '#9DBEBB' }}>{row.label}</p>
                  <p className="text-sm font-semibold" style={{ color: '#031926' }}>{row.value}</p>
                </div>
              ))}

              {/* Barra de crédito */}
              {client.credit_limit > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: '#9DBEBB' }}>Crédito</p>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#9DBEBB' }}>Usado</span>
                    <span style={{ color: creditColor, fontWeight: 700 }}>
                      {fmt(client.current_balance)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: '#e8efee' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${creditPct}%`, background: creditColor }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                    Límite: {fmt(client.credit_limit)}
                  </p>
                  {overCredit && (
                    <p className="text-xs mt-1 font-bold" style={{ color: '#d94f4f' }}>
                      ⚠ Crédito excedido
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          {client.notes && (
            <div className="rounded-xl p-5 shadow-sm"
              style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3"
                style={{ color: '#468189' }}>
                Notas
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal editar */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Editar Cliente
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={client}
            onSubmit={handleUpdate}
            onCancel={() => setShowEdit(false)}
            loading={updateClient.isPending}
          />
        </DialogContent>
      </Dialog>

    </div>
  )
}