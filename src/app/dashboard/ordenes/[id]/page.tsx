'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrder, useUpdateOrderStatus } from '@/lib/hooks/use-orders'
import { OrderStatusBadge, STATUS_CONFIG } from '@/components/orders/order-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { OrderStatus } from '@/types'
import { toast } from 'sonner'

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; color: string }>> = {
  pendiente:      { status: 'en_preparacion', label: 'Iniciar Preparación', color: '#2980b9' },
  en_preparacion: { status: 'preparada',      label: 'Marcar como Preparada', color: '#27ae60' },
  preparada:      { status: 'despachada',      label: 'Marcar como Despachada', color: '#16a085' },
  despachada:     { status: 'facturada',       label: 'Registrar Factura',     color: '#468189' },
}

export default function OrderDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { data: order, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [statusNotes,     setStatusNotes]     = useState('')
  const [invoiceNumber,   setInvoiceNumber]   = useState('')

  const fmt = (n: number) =>
    `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

  const nextAction = order ? NEXT_STATUS[order.status as OrderStatus] : null

  const handleStatusChange = async () => {
    if (!order || !nextAction) return
    try {
      await updateStatus.mutateAsync({
        order_id: order.id,
        status:   nextAction.status,
        notes:    statusNotes || undefined,
        invoice:  nextAction.status === 'facturada' ? invoiceNumber : undefined,
      })
      toast.success(`Orden actualizada a: ${STATUS_CONFIG[nextAction.status].label}`)
      setShowStatusModal(false)
      setStatusNotes('')
      setInvoiceNumber('')
    } catch {
      toast.error('Error al actualizar el estado')
    }
  }

  const handleCancel = async () => {
    if (!order) return
    try {
      await updateStatus.mutateAsync({
        order_id: order.id,
        status:   'cancelada',
        notes:    statusNotes || 'Orden cancelada',
      })
      toast.success('Orden cancelada')
      setShowCancelModal(false)
    } catch {
      toast.error('Error al cancelar la orden')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#468189' }} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20" style={{ color: '#9DBEBB' }}>
        <p>Orden no encontrada</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          style={{ color: '#468189' }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold"
              style={{ color: '#031926', fontFamily: 'Georgia, serif' }}
            >
              Orden #{String(order.order_number).padStart(5, '0')}
            </h1>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>
          <p className="text-sm mt-0.5" style={{ color: '#9DBEBB' }}>
            {new Date(order.order_date).toLocaleString('es-HN')}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          {order.status !== 'cancelada' && order.status !== 'facturada' && (
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(true)}
              style={{ color: '#d94f4f', borderColor: '#d94f4f' }}
            >
              Cancelar Orden
            </Button>
          )}
          {nextAction && (
            <Button
              onClick={() => setShowStatusModal(true)}
              style={{ background: nextAction.color, color: '#fff' }}
            >
              {nextAction.label}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="col-span-2 space-y-5">

          {/* Productos */}
          <div
            className="rounded-xl overflow-hidden shadow-sm"
            style={{ border: '1px solid rgba(68,129,137,0.15)' }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ background: '#031926' }}
            >
              <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                Productos ({order.sales_order_items?.length ?? 0} líneas)
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                  {['Código', 'Producto', 'Cant.', 'Precio c/ISV', 'Precio s/ISV', 'ISV', 'Desc.', 'Total'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left"
                      style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.sales_order_items?.map((item: any, i: number) => (
                  <tr
                    key={item.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#9DBEBB' }}>
                      {item.products?.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold" style={{ color: '#031926' }}>
                        {item.products?.name}
                      </p>
                      <p className="text-xs" style={{ color: '#9DBEBB' }}>{item.products?.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: '#555' }}>
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                      {fmt(item.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                      {fmt(item.unit_price_base)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                      {fmt(item.isv_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#27ae60' }}>
                      {item.discount_pct > 0 ? `-${item.discount_pct}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: '#031926' }}>
                      {fmt(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div
              className="px-5 py-4 space-y-2"
              style={{ borderTop: '2px solid rgba(68,129,137,0.15)', background: '#f8fafa' }}
            >
              {[
                { label: 'Subtotal (sin ISV)', value: order.subtotal },
                { label: `ISV (${order.isv_rate ?? 15}%)`, value: order.isv_amount },
                { label: 'Descuentos', value: order.discount_amount, green: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span style={{ color: '#777' }}>{row.label}</span>
                  <span style={{ color: row.green && Number(row.value) > 0 ? '#27ae60' : '#555' }}>
                    {row.green && Number(row.value) > 0 ? '-' : ''}{fmt(Number(row.value))}
                  </span>
                </div>
              ))}
              <div
                className="flex justify-between pt-2"
                style={{ borderTop: '1px solid #ddd' }}
              >
                <span className="font-bold text-base" style={{ color: '#031926' }}>Total</span>
                <span className="font-bold text-xl" style={{ color: '#468189' }}>
                  {fmt(Number(order.total))}
                </span>
              </div>
            </div>
          </div>

          {/* Historial de estados */}
          <div
            className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}
          >
            <h3 className="font-bold text-sm mb-4" style={{ color: '#031926' }}>
              Historial de Estados
            </h3>
            <div className="space-y-3">
              {order.order_status_log
                ?.sort((a: any, b: any) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                .map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: STATUS_CONFIG[log.status as OrderStatus]?.bg ?? '#888' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={log.status as OrderStatus} />
                        <span className="text-xs" style={{ color: '#9DBEBB' }}>
                          {new Date(log.created_at).toLocaleString('es-HN')}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-xs mt-1" style={{ color: '#777' }}>{log.notes}</p>
                      )}
                      {log.profiles?.full_name && (
                        <p className="text-xs" style={{ color: '#9DBEBB' }}>
                          por {log.profiles.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-5">

          {/* Info del cliente */}
          <div
            className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: '#031926' }}>Cliente</h3>
            <p className="font-semibold" style={{ color: '#031926' }}>{order.clients?.name}</p>
            {order.clients?.rtn && (
              <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>RTN: {order.clients.rtn}</p>
            )}
            {order.clients?.phone && (
              <p className="text-xs mt-1" style={{ color: '#777' }}>📞 {order.clients.phone}</p>
            )}
            {order.clients?.city && (
              <p className="text-xs mt-1" style={{ color: '#777' }}>📍 {order.clients.city}</p>
            )}
          </div>

          {/* Detalles de la orden */}
          <div
            className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: '#031926' }}>Detalles</h3>
            <div className="space-y-2">
              {[
                { label: 'Vendedor',        value: order.profiles?.full_name },
                { label: 'Lista de precios', value: `Lista ${order.price_list}` },
                { label: 'Términos de pago', value: order.payment_terms },
                { label: 'Método de entrega', value: order.delivery_method },
                { label: 'Fecha estimada',
                  value: order.delivery_date
                    ? new Date(order.delivery_date).toLocaleDateString('es-HN')
                    : '—'
                },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs" style={{ color: '#9DBEBB' }}>{row.label}</p>
                  <p className="text-sm font-medium" style={{ color: '#031926' }}>{row.value ?? '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          {order.notes && (
            <div
              className="rounded-xl p-5 shadow-sm"
              style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}
            >
              <h3 className="font-bold text-sm mb-2" style={{ color: '#031926' }}>Notas</h3>
              <p className="text-sm" style={{ color: '#555' }}>{order.notes}</p>
            </div>
          )}

          {/* Factura */}
          {order.invoice_number && (
            <div
              className="rounded-xl p-5 shadow-sm"
              style={{ background: '#f0f9f8', border: '1px solid rgba(68,129,137,0.3)' }}
            >
              <h3 className="font-bold text-sm mb-1" style={{ color: '#468189' }}>Factura</h3>
              <p className="text-lg font-bold" style={{ color: '#031926' }}>{order.invoice_number}</p>
              {order.invoiced_at && (
                <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                  {new Date(order.invoiced_at).toLocaleString('es-HN')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal cambio de estado */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              {nextAction?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {nextAction?.status === 'facturada' && (
              <div>
                <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                  Número de factura <span style={{ color: '#468189' }}>*</span>
                </Label>
                <Input
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="000-001-01-00000001"
                  className="mt-1 h-10"
                />
              </div>
            )}
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Notas (opcional)
              </Label>
              <Textarea
                value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)}
                placeholder="Observaciones del cambio de estado..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={
                  updateStatus.isPending ||
                  (nextAction?.status === 'facturada' && !invoiceNumber.trim())
                }
                style={{ background: nextAction?.color ?? '#468189', color: '#fff' }}
              >
                {updateStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal cancelar */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#d94f4f', fontFamily: 'Georgia, serif' }}>
              Cancelar Orden
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm" style={{ color: '#555' }}>
              ¿Estás seguro que deseas cancelar esta orden? Esta acción no se puede deshacer.
            </p>
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Motivo de cancelación
              </Label>
              <Textarea
                value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)}
                placeholder="Indica el motivo de la cancelación..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Volver
              </Button>
              <Button
                onClick={handleCancel}
                disabled={updateStatus.isPending}
                style={{ background: '#d94f4f', color: '#fff' }}
              >
                {updateStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cancelar Orden
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}