'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrder, useUpdateOrderStatus, useDispatchOrder } from '@/lib/hooks/use-orders'
import { OrderStatusBadge, STATUS_CONFIG } from '@/components/orders/order-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { ArrowLeft, Loader2, MapPin, Phone, Hash, AlertCircle, AlertTriangle, Package } from 'lucide-react'
import { OrderStatus } from '@/types'
import { toast } from 'sonner'
import { usePermissions, useCurrentUser } from '@/lib/hooks/use-current-user'
import { useSettings } from '@/lib/hooks/use-settings'
import { PdfDownloadButton } from '@/components/orders/pdf-download-button'

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; color: string }>> = {
  pendiente: { status: 'en_preparacion', label: 'Iniciar Preparación', color: '#2980b9' },
  en_preparacion: { status: 'preparada', label: 'Marcar como Preparada', color: '#27ae60' },
  preparada: { status: 'despachada', label: 'Marcar como Despachada', color: '#16a085' },
  despachada: { status: 'facturada', label: 'Registrar Factura', color: '#468189' },
}

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

// ── Tipos internos ────────────────────────────────────────────────────────────

interface DispatchLine {
  item_id:      string
  product_name: string
  product_code: string
  unit:         string
  ordered_qty:  number
  dispatch_qty: number
}

// ── Modal de despacho con cantidades ─────────────────────────────────────────

function DispatchModal({
  open, onOpenChange, items, orderId, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  items: any[]
  orderId: string
  onSuccess: () => void
}) {
  const dispatchOrder = useDispatchOrder()
  const [lines, setLines] = useState<DispatchLine[]>([])
  const [notes, setNotes] = useState('')

  // Inicializar líneas cada vez que el modal se abre
  useEffect(() => {
    if (open) {
      setLines(items.map(item => ({
        item_id:      item.id,
        product_name: item.products?.name ?? '—',
        product_code: item.products?.code ?? '—',
        unit:         item.products?.unit ?? '',
        ordered_qty:  Number(item.quantity),
        dispatch_qty: Number(item.quantity),   // pre-fill = cantidad pedida
      })))
      setNotes('')
    }
  }, [open, items])

  const setQty = (item_id: string, val: string) => {
    const num = parseFloat(val)
    setLines(prev => prev.map(l =>
      l.item_id === item_id
        ? { ...l, dispatch_qty: isNaN(num) ? 0 : Math.min(Math.max(0, num), l.ordered_qty) }
        : l
    ))
  }

  const hasPartial = lines.some(l => l.dispatch_qty < l.ordered_qty)
  const allEmpty   = lines.every(l => l.dispatch_qty === 0)

  const handleConfirm = async () => {
    try {
      await dispatchOrder.mutateAsync({
        order_id: orderId,
        items: lines.map(l => ({ item_id: l.item_id, dispatched_qty: l.dispatch_qty })),
        notes: notes || undefined,
      })
      toast.success('Orden despachada correctamente')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Error al registrar el despacho')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Confirmar Despacho
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>

          {/* Aviso de despacho parcial */}
          {hasPartial && (
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#e67e22' }} />
              <p className="text-xs" style={{ color: '#92400e' }}>
                Estás despachando menos unidades de las pedidas en algunos artículos.
                El stock reservado no despachado será liberado automáticamente.
              </p>
            </div>
          )}

          {/* Tabla de cantidades */}
          <div className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
            <div className="px-4 py-3" style={{ background: '#031926' }}>
              <p className="text-xs font-bold" style={{ color: '#F4E9CD' }}>
                Cantidad a Despachar por Artículo
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                  {['Código', 'Producto', 'Pedido', 'A Despachar'].map(h => (
                    <th key={h} className="px-4 py-3 text-left"
                      style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const isPartial = l.dispatch_qty < l.ordered_qty
                  return (
                    <tr key={l.item_id}
                      style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#9DBEBB' }}>
                        {l.product_code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold" style={{ color: '#031926' }}>{l.product_name}</p>
                        <p className="text-xs" style={{ color: '#9DBEBB' }}>{l.unit}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium" style={{ color: '#555' }}>
                          {l.ordered_qty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={l.ordered_qty}
                            step="1"
                            value={l.dispatch_qty}
                            onChange={e => setQty(l.item_id, e.target.value)}
                            className="h-9 w-24 text-center font-bold"
                            style={{
                              borderColor: isPartial ? '#f59e0b' : 'rgba(68,129,137,0.3)',
                              color: isPartial ? '#e67e22' : '#031926',
                            }}
                          />
                          {isPartial && (
                            <span className="text-xs font-semibold" style={{ color: '#e67e22' }}>
                              −{l.ordered_qty - l.dispatch_qty} {l.unit}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Notas */}
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Notas del despacho (opcional)
            </Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones, número de guía, transportista..."
              className="mt-1.5 resize-none"
              rows={2}
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={dispatchOrder.isPending || allEmpty}
              style={{ background: '#16a085', color: '#fff' }}
            >
              {dispatchOrder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {hasPartial ? 'Confirmar Despacho Parcial' : 'Confirmar Despacho'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: order, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()
  const { actions, role } = usePermissions()
  const { data: settings } = useSettings()

  const [showStatusModal,   setShowStatusModal]   = useState(false)
  const [showCancelModal,   setShowCancelModal]   = useState(false)
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [statusNotes,       setStatusNotes]       = useState('')
  const [invoiceNumber,     setInvoiceNumber]     = useState('')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction,    setApprovalAction]    = useState<'aprobar' | 'rechazar'>('aprobar')

  const { data: currentUser, isLoading: userLoading } = useCurrentUser()

  if (isLoading || userLoading) {
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

  const userRole = currentUser?.role ?? 'vendedor'
  if (
    order.status === 'pendiente_aprobacion' &&
    userRole !== 'admin' &&
    userRole !== 'supervisor' &&
    userRole !== 'vendedor'
  ) {
    router.replace('/dashboard/ordenes')
    return null
  }

  const nextAction = order ? NEXT_STATUS[order.status as OrderStatus] : null
  const isDispatchAction = nextAction?.status === 'despachada'

  const handleStatusChange = async () => {
    if (!order || !nextAction) return
    try {
      await updateStatus.mutateAsync({
        order_id: order.id,
        status: nextAction.status,
        notes: statusNotes || undefined,
        invoice: nextAction.status === 'facturada' ? invoiceNumber : undefined,
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
        status: 'cancelada',
        notes: statusNotes || 'Orden cancelada',
      })
      toast.success('Orden cancelada')
      setShowCancelModal(false)
    } catch {
      toast.error('Error al cancelar la orden')
    }
  }

  const handleApproval = async (action: 'aprobar' | 'rechazar') => {
    if (!order) return
    try {
      await updateStatus.mutateAsync({
        order_id: order.id,
        status: action === 'aprobar' ? 'pendiente' : 'rechazada',
        notes: statusNotes || (action === 'aprobar' ? 'Orden aprobada' : 'Orden rechazada'),
      })
      toast.success(action === 'aprobar' ? 'Orden aprobada' : 'Orden rechazada')
      setShowApprovalModal(false)
      setStatusNotes('')
    } catch {
      toast.error('Error al procesar la aprobación')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} style={{ color: '#468189' }}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                Orden #{String(order.order_number).padStart(5, '0')}
              </h1>
              <OrderStatusBadge status={order.status as OrderStatus} />
            </div>
            <p className="text-sm mt-0.5" style={{ color: '#9DBEBB' }}>
              {new Date(order.order_date).toLocaleString('es-HN')}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          {order && settings && (
            <PdfDownloadButton order={order} settings={settings} />
          )}
          {actions.canCancelOrder &&
            order.status !== 'cancelada' &&
            order.status !== 'facturada' && (
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                style={{ color: '#d94f4f', borderColor: '#d94f4f' }}
              >
                Cancelar Orden
              </Button>
            )}
          {nextAction && (() => {
            if (role === 'facturacion' && nextAction.status !== 'facturada') return null
            if (role === 'almacen' && nextAction.status === 'facturada') return null
            if (role === 'vendedor') return null
            return (
              <Button
                onClick={() => isDispatchAction ? setShowDispatchModal(true) : setShowStatusModal(true)}
                style={{ background: nextAction.color, color: '#fff' }}
              >
                {nextAction.label}
              </Button>
            )
          })()}
        </div>
      </div>

      {/* Banner pendiente aprobación */}
      {order.status === 'pendiente_aprobacion' && (
        <div className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: '#fffbeb', border: '2px solid #fcd34d' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#fef3c7' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#d97706' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#92400e' }}>
                Orden pendiente de aprobación
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
                Esta orden excede el límite de crédito del cliente y requiere autorización.
              </p>
            </div>
          </div>
          {(role === 'admin' || role === 'supervisor') && (
            <div className="flex gap-2 ml-4">
              <Button
                onClick={() => { setApprovalAction('rechazar'); setShowApprovalModal(true) }}
                variant="outline"
                style={{ color: '#d94f4f', borderColor: '#d94f4f' }}
              >
                Rechazar
              </Button>
              <Button
                onClick={() => { setApprovalAction('aprobar'); setShowApprovalModal(true) }}
                style={{ background: '#27ae60', color: '#fff' }}
              >
                Aprobar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Cuerpo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Tabla de productos */}
          <div className="rounded-xl overflow-hidden shadow-sm"
            style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
            <div className="px-5 py-4" style={{ background: '#031926' }}>
              <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                Productos — {order.sales_order_items?.length ?? 0} {order.sales_order_items?.length === 1 ? 'línea' : 'líneas'}
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                  {['Código', 'Producto', 'Pedido', 'Despachado', 'Precio c/ISV', 'Precio s/ISV', 'ISV', 'Desc.', 'Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left"
                      style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.sales_order_items?.map((item: any, i: number) => {
                  const hasDispatch = item.dispatched_quantity != null
                  const isPartial   = hasDispatch && Number(item.dispatched_quantity) < Number(item.quantity)
                  return (
                    <tr key={item.id}
                      style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <td className="px-4 py-4 font-mono text-xs" style={{ color: '#9DBEBB' }}>
                        {item.products?.code}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold" style={{ color: '#031926' }}>{item.products?.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>{item.products?.unit}</p>
                      </td>
                      {/* Cantidad pedida */}
                      <td className="px-4 py-4 text-sm text-center font-medium" style={{ color: '#555' }}>
                        {item.quantity}
                      </td>
                      {/* Cantidad despachada */}
                      <td className="px-4 py-4 text-sm text-center font-bold">
                        {hasDispatch ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span style={{ color: isPartial ? '#e67e22' : '#27ae60' }}>
                              {item.dispatched_quantity}
                            </span>
                            {isPartial && (
                              <Package className="w-3.5 h-3.5" style={{ color: '#e67e22' }} />
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#9DBEBB' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: '#555' }}>{fmt(item.unit_price)}</td>
                      <td className="px-4 py-4 text-sm" style={{ color: '#555' }}>{fmt(item.unit_price_base)}</td>
                      <td className="px-4 py-4 text-sm" style={{ color: '#555' }}>{fmt(item.isv_amount)}</td>
                      <td className="px-4 py-4 text-sm" style={{ color: '#27ae60' }}>
                        {item.discount_pct > 0 ? `-${item.discount_pct}%` : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold" style={{ color: '#031926' }}>
                        {fmt(item.line_total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totales */}
            <div className="px-6 py-5"
              style={{ borderTop: '2px solid rgba(68,129,137,0.12)', background: '#fafafa' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, marginLeft: 'auto' }}>
                {[
                  { label: 'Subtotal (sin ISV)', value: order.subtotal },
                  { label: `ISV (15%)`, value: order.isv_amount },
                  { label: 'Descuentos', value: order.discount_amount, green: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-sm" style={{ color: '#777' }}>{row.label}</span>
                    <span className="text-sm" style={{ color: row.green && Number(row.value) > 0 ? '#27ae60' : '#555' }}>
                      {row.green && Number(row.value) > 0 ? '-' : ''}{fmt(Number(row.value))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-3" style={{ borderTop: '2px solid rgba(68,129,137,0.15)' }}>
                  <span className="font-bold text-base" style={{ color: '#031926' }}>Total</span>
                  <span className="text-xl font-bold" style={{ color: '#468189' }}>{fmt(Number(order.total))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historial */}
          <div className="rounded-xl p-6 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
            <h3 className="font-bold text-sm mb-5" style={{ color: '#031926' }}>Historial de Estados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {order.order_status_log
                ?.sort((a: any, b: any) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                .map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: STATUS_CONFIG[log.status as OrderStatus]?.bg ?? '#888' }} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <OrderStatusBadge status={log.status as OrderStatus} />
                        <span className="text-xs" style={{ color: '#9DBEBB' }}>
                          {new Date(log.created_at).toLocaleString('es-HN')}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-xs mt-1" style={{ color: '#777' }}>{log.notes}</p>
                      )}
                      {log.profiles?.full_name && (
                        <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Cliente */}
          <div className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: '#468189' }}>
              Cliente
            </p>
            <p className="font-bold text-base" style={{ color: '#031926' }}>{order.clients?.name}</p>
            {order.clients?.rtn && (
              <div className="flex items-center gap-1.5 mt-2">
                <Hash className="w-3 h-3" style={{ color: '#9DBEBB' }} />
                <p className="text-xs" style={{ color: '#777' }}>RTN: {order.clients.rtn}</p>
              </div>
            )}
            {order.clients?.phone && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Phone className="w-3 h-3" style={{ color: '#9DBEBB' }} />
                <p className="text-xs" style={{ color: '#777' }}>{order.clients.phone}</p>
              </div>
            )}
            {order.clients?.city && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3 h-3" style={{ color: '#9DBEBB' }} />
                <p className="text-xs" style={{ color: '#777' }}>{order.clients.city}</p>
              </div>
            )}
          </div>

          {/* Detalles */}
          <div className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: '#468189' }}>
              Detalles de la Orden
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Vendedor', value: order.profiles?.full_name },
                { label: 'Lista de precios', value: `Lista ${order.price_list}` },
                { label: 'Términos de pago', value: order.payment_terms },
                { label: 'Método de entrega', value: order.delivery_method },
                {
                  label: 'Fecha estimada',
                  value: order.delivery_date
                    ? new Date(order.delivery_date).toLocaleDateString('es-HN')
                    : '—'
                },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs mb-0.5" style={{ color: '#9DBEBB' }}>{row.label}</p>
                  <p className="text-sm font-semibold" style={{ color: '#031926' }}>{row.value ?? '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          {order.notes && (
            <div className="rounded-xl p-5 shadow-sm"
              style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#468189' }}>
                Notas
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{order.notes}</p>
            </div>
          )}

          {/* Factura */}
          {order.invoice_number && (
            <div className="rounded-xl p-5 shadow-sm"
              style={{ background: '#f0f9f8', border: '1px solid rgba(68,129,137,0.3)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#468189' }}>
                Factura
              </p>
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

      {/* ── Modal de despacho con cantidades ── */}
      <DispatchModal
        open={showDispatchModal}
        onOpenChange={setShowDispatchModal}
        items={order.sales_order_items ?? []}
        orderId={order.id}
        onSuccess={() => {}}
      />

      {/* ── Modal genérico para otros estados ── */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              {nextAction?.label}
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            {nextAction?.status === 'facturada' && (
              <div>
                <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                  Número de factura <span style={{ color: '#468189' }}>*</span>
                </Label>
                <Input
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="000-001-01-00000001"
                  className="mt-1.5 h-10"
                />
              </div>
            )}
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Notas (opcional)</Label>
              <Textarea
                value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)}
                placeholder="Observaciones del cambio de estado..."
                className="mt-1.5 resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancelar</Button>
              <Button
                onClick={handleStatusChange}
                disabled={updateStatus.isPending || (nextAction?.status === 'facturada' && !invoiceNumber.trim())}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            <p className="text-sm" style={{ color: '#555' }}>
              ¿Estás seguro que deseas cancelar esta orden? Esta acción no se puede deshacer.
            </p>
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Motivo de cancelación</Label>
              <Textarea
                value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)}
                placeholder="Indica el motivo de la cancelación..."
                className="mt-1.5 resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>Volver</Button>
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

      {/* Modal aprobación */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle style={{
              color: approvalAction === 'aprobar' ? '#27ae60' : '#d94f4f',
              fontFamily: 'Georgia, serif'
            }}>
              {approvalAction === 'aprobar' ? 'Aprobar Orden' : 'Rechazar Orden'}
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            <p className="text-sm" style={{ color: '#555' }}>
              {approvalAction === 'aprobar'
                ? 'La orden pasará a estado Pendiente y continuará su flujo normal.'
                : 'La orden será rechazada y el stock reservado será liberado.'
              }
            </p>
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Notas (opcional)
              </Label>
              <Textarea
                value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)}
                placeholder="Motivo de la decisión..."
                className="mt-1.5 resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleApproval(approvalAction)}
                disabled={updateStatus.isPending}
                style={{
                  background: approvalAction === 'aprobar' ? '#27ae60' : '#d94f4f',
                  color: '#fff'
                }}
              >
                {updateStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {approvalAction === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}