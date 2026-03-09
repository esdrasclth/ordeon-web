'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Truck, CheckCircle, XCircle, CreditCard,
  Package2, Building2, AlertCircle, Clock, SendHorizonal, FileDown
} from 'lucide-react'
import { usePurchaseOrder, useReceivePurchaseOrder, useUpdatePOStatus } from '@/lib/hooks/use-purchase-orders'
import { useSupplierPayments, useCreateSupplierPayment } from '@/lib/hooks/use-supplier-payments'
import { PurchaseOrderStatus } from '@/types'

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  borrador:          { label: 'Borrador',         color: '#94a3b8', icon: Clock },
  enviada:           { label: 'Enviada',           color: '#3b82f6', icon: SendHorizonal },
  recibida_parcial:  { label: 'Recibida Parcial',  color: '#f59e0b', icon: AlertCircle },
  recibida:          { label: 'Recibida',          color: '#22c55e', icon: CheckCircle },
  cancelada:         { label: 'Cancelada',         color: '#ef4444', icon: XCircle },
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n)
}
function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OrdenCompraDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const { data: po, isLoading } = usePurchaseOrder(id)
  const { data: payments = []  } = useSupplierPayments(undefined, id)
  const receivePO    = useReceivePurchaseOrder()
  const updateStatus = useUpdatePOStatus()
  const createPayment = useCreateSupplierPayment()

  // Estado recepción
  const [recvQtys, setRecvQtys]     = useState<Record<string, number>>({})
  const [showRecvForm, setShowRecvForm] = useState(false)

  // Estado pago
  const [showPayForm,  setShowPayForm]  = useState(false)
  const [payAmount,    setPayAmount]    = useState('')
  const [payDate,      setPayDate]      = useState(new Date().toISOString().split('T')[0])
  const [payMethod,    setPayMethod]    = useState<'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'otro'>('transferencia')
  const [payRef,       setPayRef]       = useState('')
  const [payNotes,     setPayNotes]     = useState('')

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" style={{ color: '#94a3b8' }}>Cargando…</div>
  }
  if (!po) {
    return <div className="text-center py-12" style={{ color: '#94a3b8' }}>Orden de compra no encontrada</div>
  }

  const statusCfg = STATUS_CONFIG[po.status]
  const StatusIcon = statusCfg.icon
  const poLabel    = `OC-${String(po.po_number).padStart(5, '0')}`
  const canReceive = (po.status === 'enviada' || po.status === 'recibida_parcial')
  const canSend    = po.status === 'borrador'
  const canCancel  = po.status === 'borrador' || po.status === 'enviada'

  const handleSend = async () => {
    await updateStatus.mutateAsync({ po_id: po.id, status: 'enviada' })
  }
  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta orden de compra?')) return
    await updateStatus.mutateAsync({ po_id: po.id, status: 'cancelada' })
  }

  const handleReceive = async () => {
    const items = (po.purchase_order_items ?? [])
      .filter(i => (recvQtys[i.id] ?? 0) > 0)
      .map(i => ({ item_id: i.id, qty_received: recvQtys[i.id] }))

    if (items.length === 0) { alert('Ingresa cantidades a recibir'); return }

    const totalReceived = (po.purchase_order_items ?? []).reduce((sum, item) => {
      const qty = recvQtys[item.id] ?? 0
      return sum + qty * item.unit_cost
    }, 0)

    await receivePO.mutateAsync({
      po_id:          po.id,
      po_number:      po.po_number,
      supplier_name:  (po as any).suppliers?.name ?? '',
      items,
      total_received: totalReceived,
    })
    setShowRecvForm(false)
    setRecvQtys({})
  }

  const handlePayment = async () => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) { alert('Ingresa un monto válido'); return }

    await createPayment.mutateAsync({
      supplier_id:    po.supplier_id,
      supplier_name:  (po as any).suppliers?.name ?? '',
      po_id:          po.id,
      po_number:      poLabel,
      amount,
      payment_date:   payDate,
      payment_method: payMethod,
      reference:      payRef || undefined,
      notes:          payNotes || undefined,
    })
    setShowPayForm(false)
    setPayAmount('')
    setPayRef('')
    setPayNotes('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
    background: '#fff', color: '#1e293b',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#475569',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const balance   = po.total - totalPaid

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg" style={{ background: '#f1f5f9', color: '#64748b' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#031926' }}>{poLabel}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: `${statusCfg.color}18`, color: statusCfg.color }}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
          </div>
        </div>
        {/* Acciones */}
        <div className="flex gap-2">
          {/* Botón PDF — siempre visible */}
          <button
            onClick={() => window.open(`/print/compras/${po.id}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
          >
            <FileDown className="w-4 h-4" />
            Descargar PDF
          </button>
          {canSend && (
            <button onClick={handleSend} disabled={updateStatus.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#3b82f6', color: '#fff' }}>
              <SendHorizonal className="w-4 h-4" />
              Enviar al Proveedor
            </button>
          )}
          {canReceive && !showRecvForm && (
            <button onClick={() => setShowRecvForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#22c55e', color: '#fff' }}>
              <Truck className="w-4 h-4" />
              Registrar Recepción
            </button>
          )}
          {canCancel && (
            <button onClick={handleCancel} disabled={updateStatus.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}>
              <XCircle className="w-4 h-4" />
              Cancelar OC
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-5">
          {/* Info proveedor */}
          <div className="rounded-xl p-5 border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4" style={{ color: '#468189' }} />
              <h2 className="font-semibold text-sm" style={{ color: '#031926' }}>Proveedor</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>Nombre</p>
                <p className="font-medium">{(po as any).suppliers?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>RTN</p>
                <p>{(po as any).suppliers?.rtn ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>Contacto</p>
                <p>{(po as any).suppliers?.contact_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>Teléfono</p>
                <p>{(po as any).suppliers?.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>Fecha OC</p>
                <p>{fmtDate(po.order_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>F. Esperada</p>
                <p>{fmtDate(po.expected_date)}</p>
              </div>
              {po.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>Notas</p>
                  <p className="text-sm" style={{ color: '#475569' }}>{po.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Líneas de productos */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
            <div className="px-5 py-4 flex items-center gap-2 border-b" style={{ borderColor: '#f1f5f9' }}>
              <Package2 className="w-4 h-4" style={{ color: '#468189' }} />
              <h2 className="font-semibold text-sm" style={{ color: '#031926' }}>Productos</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Producto', 'Ord.', 'Recib.', 'Pendiente', 'Costo', 'Total', ...(showRecvForm ? ['A Recibir'] : [])].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(po.purchase_order_items ?? []).map((item, idx) => {
                  const pending = item.quantity - item.qty_received
                  const fullyReceived = pending <= 0
                  return (
                    <tr key={item.id} style={{ borderTop: idx > 0 ? '1px solid #f8fafc' : undefined }}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm" style={{ color: '#1e293b' }}>
                          {(item as any).products?.name ?? '—'}
                        </p>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>
                          {(item as any).products?.code} · {(item as any).products?.unit}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium" style={{ color: item.qty_received > 0 ? '#22c55e' : '#94a3b8' }}>
                          {item.qty_received}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span style={{ color: fullyReceived ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                          {fullyReceived ? '✓' : pending}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{fmtCurrency(item.unit_cost)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{fmtCurrency(item.line_total)}</td>
                      {showRecvForm && (
                        <td className="px-4 py-3" style={{ width: 90 }}>
                          {fullyReceived ? (
                            <span className="text-xs" style={{ color: '#22c55e' }}>Completo</span>
                          ) : (
                            <input type="number" min={0} max={pending} step={0.01}
                              value={recvQtys[item.id] ?? ''}
                              onChange={e => setRecvQtys(prev => ({ ...prev, [item.id]: parseFloat(e.target.value) || 0 }))}
                              placeholder={`máx ${pending}`}
                              style={{ ...inputStyle, padding: '4px 8px', fontSize: 13, width: 90 }} />
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Formulario de recepción */}
          {showRecvForm && (
            <div className="rounded-xl p-5 border" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <p className="text-sm font-medium mb-3" style={{ color: '#15803d' }}>
                Ingresa las cantidades recibidas en la tabla y confirma:
              </p>
              <div className="flex gap-2">
                <button onClick={handleReceive} disabled={receivePO.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: '#22c55e', color: '#fff' }}>
                  <Truck className="w-4 h-4" />
                  {receivePO.isPending ? 'Procesando…' : 'Confirmar Recepción'}
                </button>
                <button onClick={() => { setShowRecvForm(false); setRecvQtys({}) }}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Historial de pagos */}
          <div className="rounded-xl border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: '#468189' }} />
                <h2 className="font-semibold text-sm" style={{ color: '#031926' }}>Pagos al Proveedor</h2>
              </div>
              {!showPayForm && (
                <button onClick={() => setShowPayForm(true)}
                  className="text-sm px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'rgba(70,129,137,0.1)', color: '#468189' }}>
                  + Registrar Pago
                </button>
              )}
            </div>

            {payments.length === 0 && !showPayForm && (
              <p className="px-5 py-8 text-sm text-center" style={{ color: '#94a3b8' }}>
                No hay pagos registrados para esta OC
              </p>
            )}

            {payments.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Fecha', 'Método', 'Referencia', 'Monto'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, idx) => (
                    <tr key={p.id} style={{ borderTop: idx > 0 ? '1px solid #f8fafc' : undefined }}>
                      <td className="px-4 py-3">{fmtDate(p.payment_date)}</td>
                      <td className="px-4 py-3 capitalize">{p.payment_method}</td>
                      <td className="px-4 py-3" style={{ color: '#94a3b8' }}>{p.reference ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold">{fmtCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {showPayForm && (
              <div className="px-5 py-4 border-t space-y-3" style={{ borderColor: '#f1f5f9' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Monto *</label>
                    <input type="number" min={0.01} step={0.01} value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="0.00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha *</label>
                    <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Método *</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value as any)} style={inputStyle}>
                      {[['efectivo','Efectivo'],['transferencia','Transferencia'],['cheque','Cheque'],
                        ['tarjeta','Tarjeta'],['otro','Otro']].map(([v,l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Referencia</label>
                    <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)}
                      placeholder="Nº cheque / transferencia" style={inputStyle} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePayment} disabled={createPayment.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: '#468189', color: '#fff' }}>
                    <CreditCard className="w-4 h-4" />
                    {createPayment.isPending ? 'Guardando…' : 'Registrar Pago'}
                  </button>
                  <button onClick={() => setShowPayForm(false)}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{ background: '#f1f5f9', color: '#64748b' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumen lateral */}
        <div className="space-y-4">
          <div className="rounded-xl p-5 border space-y-3" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#031926' }}>Resumen Financiero</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span>{fmtCurrency(po.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>ISV</span>
                <span>{fmtCurrency(po.isv_amount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold" style={{ borderColor: '#f1f5f9' }}>
                <span>Total OC</span>
                <span style={{ color: '#031926' }}>{fmtCurrency(po.total)}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#22c55e' }}>
                <span>Pagado</span>
                <span className="font-semibold">{fmtCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: '#f1f5f9' }}>
                <span className="font-bold">Saldo</span>
                <span className="font-bold" style={{ color: balance > 0 ? '#ef4444' : '#22c55e' }}>
                  {fmtCurrency(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Info de estado de recepción */}
          <div className="rounded-xl p-5 border space-y-2" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <h2 className="font-semibold text-sm mb-3" style={{ color: '#031926' }}>Recepción</h2>
            {(po.purchase_order_items ?? []).map(item => {
              const pct = item.quantity > 0 ? (item.qty_received / item.quantity) * 100 : 0
              return (
                <div key={item.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#475569' }}>{(item as any).products?.name ?? 'Producto'}</span>
                    <span style={{ color: '#94a3b8' }}>{item.qty_received}/{item.quantity}</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 6, background: '#f1f5f9' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#22c55e' : '#f59e0b' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
