'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Plus, Trash2, Package2, Building2, Calendar, FileText
} from 'lucide-react'
import { useSuppliers } from '@/lib/hooks/use-suppliers'
import { useProducts } from '@/lib/hooks/use-products'
import { useCreatePurchaseOrder } from '@/lib/hooks/use-purchase-orders'
import { PurchaseOrderItemForm } from '@/types'

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(n)
}

const ISV_RATES = [0, 15, 18]

export default function NuevaCompraPage() {
  const router   = useRouter()
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers()
  const { data: products  = [], isLoading: loadingProducts  } = useProducts()
  const createPO = useCreatePurchaseOrder()

  // Cabecera
  const [supplierId,    setSupplierId]    = useState('')
  const [expectedDate,  setExpectedDate]  = useState('')
  const [paymentTerms,  setPaymentTerms]  = useState('30 días')
  const [notes,         setNotes]         = useState('')

  // Líneas de productos
  const [items, setItems] = useState<PurchaseOrderItemForm[]>([])

  const addItem = () => {
    setItems(prev => [...prev, {
      product_id: '', product_name: '', product_code: '', unit: '',
      quantity: 1, unit_cost: 0, isv_rate: 0, discount_pct: 0,
    }])
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof PurchaseOrderItemForm, value: string | number) => {
    setItems(prev => {
      const next = [...prev]
      if (field === 'product_id') {
        const prod = products.find(p => p.id === value)
        next[idx] = {
          ...next[idx],
          product_id:   prod?.id ?? '',
          product_name: prod?.name ?? '',
          product_code: prod?.code ?? '',
          unit:         prod?.unit ?? '',
          unit_cost:    prod?.purchase_price ?? 0,
        }
      } else {
        (next[idx] as any)[field] = value
      }
      return next
    })
  }

  const totals = useMemo(() => {
    let subtotal = 0, isv = 0
    for (const item of items) {
      const base = item.quantity * item.unit_cost
      const disc = base * (item.discount_pct / 100)
      const net  = base - disc
      const tax  = net * (item.isv_rate / 100)
      subtotal  += net
      isv       += tax
    }
    return { subtotal, isv, total: subtotal + isv }
  }, [items])

  const handleSubmit = async () => {
    if (!supplierId) { alert('Selecciona un proveedor'); return }
    if (items.length === 0) { alert('Agrega al menos un producto'); return }
    if (items.some(i => !i.product_id || i.quantity <= 0)) {
      alert('Todos los ítems deben tener producto y cantidad válida'); return
    }

    const supplier = suppliers.find(s => s.id === supplierId)
    try {
      const po = await createPO.mutateAsync({
        supplier_id:   supplierId,
        supplier_name: supplier?.name ?? '',
        expected_date: expectedDate || undefined,
        payment_terms: paymentTerms,
        notes,
        items,
      })
      router.push(`/dashboard/compras/${po.id}`)
    } catch (err) {
      console.error(err)
      alert('Error al crear la orden de compra')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
    background: '#fff', color: '#1e293b',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', maxWidth: 900 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg transition-all"
          style={{ background: '#f1f5f9', color: '#64748b' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#031926' }}>Nueva Orden de Compra</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Complete los datos para crear la OC en estado borrador</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario cabecera */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl p-5 border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4" style={{ color: '#468189' }} />
              <h2 className="font-semibold text-sm" style={{ color: '#031926' }}>Datos del Proveedor</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label style={labelStyle}>Proveedor *</label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar proveedor —</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {!loadingSuppliers && suppliers.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                    No hay proveedores. <button onClick={() => router.push('/dashboard/compras/proveedores')}
                      className="underline">Crear proveedor</button>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Fecha Esperada</label>
                  <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Términos de Pago</label>
                  <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} style={inputStyle}>
                    {['Contado', '15 días', '30 días', '45 días', '60 días', '90 días'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Observaciones opcionales…" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Líneas de OC */}
          <div className="rounded-xl border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center gap-2">
                <Package2 className="w-4 h-4" style={{ color: '#468189' }} />
                <h2 className="font-semibold text-sm" style={{ color: '#031926' }}>Productos</h2>
              </div>
              <button onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(70,129,137,0.1)', color: '#468189' }}>
                <Plus className="w-3.5 h-3.5" />Agregar
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-12 text-center" style={{ color: '#94a3b8' }}>
                <Package2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Agrega productos usando el botón de arriba</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      {['Producto', 'Cant.', 'Costo Unit.', 'ISV %', 'Desc %', 'Total', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase"
                          style={{ color: '#64748b', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const base  = item.quantity * item.unit_cost
                      const disc  = base * (item.discount_pct / 100)
                      const net   = base - disc
                      const total = net + net * (item.isv_rate / 100)
                      return (
                        <tr key={idx} style={{ borderTop: idx > 0 ? '1px solid #f8fafc' : undefined }}>
                          <td className="px-3 py-2">
                            <select value={item.product_id}
                              onChange={e => updateItem(idx, 'product_id', e.target.value)}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 13 }}>
                              <option value="">— Producto —</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2" style={{ width: 80 }}>
                            <input type="number" min={0.01} step={0.01} value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 13 }} />
                          </td>
                          <td className="px-3 py-2" style={{ width: 110 }}>
                            <input type="number" min={0} step={0.01} value={item.unit_cost}
                              onChange={e => updateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 13 }} />
                          </td>
                          <td className="px-3 py-2" style={{ width: 80 }}>
                            <select value={item.isv_rate}
                              onChange={e => updateItem(idx, 'isv_rate', parseFloat(e.target.value))}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 13 }}>
                              {ISV_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2" style={{ width: 80 }}>
                            <input type="number" min={0} max={100} step={0.5} value={item.discount_pct}
                              onChange={e => updateItem(idx, 'discount_pct', parseFloat(e.target.value) || 0)}
                              style={{ ...inputStyle, padding: '6px 8px', fontSize: 13 }} />
                          </td>
                          <td className="px-3 py-2 font-semibold text-xs" style={{ color: '#031926' }}>
                            {fmtCurrency(total)}
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeItem(idx)} className="p-1 rounded transition-all"
                              style={{ color: '#ef4444' }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Panel de totales y acción */}
        <div className="space-y-4">
          <div className="rounded-xl p-5 border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" style={{ color: '#468189' }} />
              <h2 className="font-semibold text-sm" style={{ color: '#031926' }}>Resumen</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span className="font-medium">{fmtCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>ISV</span>
                <span className="font-medium">{fmtCurrency(totals.isv)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: '#f1f5f9' }}>
                <span className="font-bold" style={{ color: '#031926' }}>Total</span>
                <span className="font-bold text-base" style={{ color: '#031926' }}>{fmtCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={createPO.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)', color: '#fff', opacity: createPO.isPending ? 0.7 : 1 }}
          >
            <Save className="w-4 h-4" />
            {createPO.isPending ? 'Guardando…' : 'Crear Orden de Compra'}
          </button>
          <p className="text-xs text-center" style={{ color: '#94a3b8' }}>
            Se creará en estado <strong>Borrador</strong>.
            Podrás enviarla y recibirla después.
          </p>
        </div>
      </div>
    </div>
  )
}
