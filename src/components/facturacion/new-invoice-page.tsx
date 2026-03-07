'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, ShoppingCart, Package } from 'lucide-react'

const supabase = createClient()

interface InvoiceItem {
  product_id:   string
  description:  string
  quantity:     number
  unit_price:   number
  discount_pct: number
}

export function NewInvoicePage({
  config,
  clients,
  products,
  orders,
  companyId,
}: {
  config:    any
  clients:   any[]
  products:  any[]
  orders:    any[]
  companyId: string
}) {
  const router = useRouter()
  const [loading,        setLoading]        = useState(false)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [selectedOrder,  setSelectedOrder]  = useState<any | null>(null)
  const [issuedAt,       setIssuedAt]       = useState(new Date().toISOString().split('T')[0])
  const [notes,          setNotes]          = useState('')
  const [items,          setItems]          = useState<InvoiceItem[]>([])
  const [productSearch,  setProductSearch]  = useState('')
  const [showProducts,   setShowProducts]   = useState(false)
  const [source,         setSource]         = useState<'manual' | 'order'>('manual')

  const isv_rate = config.isv_rate ?? 15

  // Órdenes del cliente seleccionado
  const clientOrders = useMemo(() =>
    orders.filter(o => o.client_id === selectedClient?.id),
    [orders, selectedClient]
  )

  // Filtrar productos por búsqueda
  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 8),
    [products, productSearch]
  )

  // Precio según lista del cliente
  const getPrice = (product: any) => {
    const list = selectedClient?.price_list ?? 'A'
    if (list === 'B') return Number(product.price_b)
    if (list === 'C') return Number(product.price_c)
    return Number(product.price_a)
  }

  // Agregar producto manualmente
  const addProduct = (product: any) => {
    setItems(prev => [...prev, {
      product_id:   product.id,
      description:  `${product.code} - ${product.name}`,
      quantity:     1,
      unit_price:   getPrice(product),
      discount_pct: 0,
    }])
    setProductSearch('')
    setShowProducts(false)
  }

  // Cargar items desde orden
  const loadFromOrder = (order: any) => {
    setSelectedOrder(order)
    const orderItems = order.sales_order_items.map((oi: any) => ({
      product_id:   oi.product_id,
      description:  `${oi.products?.code ?? ''} - ${oi.products?.name ?? ''}`,
      quantity:     Number(oi.quantity),
      unit_price:   Number(oi.unit_price),
      discount_pct: Number(oi.discount_pct ?? 0),
    }))
    setItems(orderItems)
  }

  // Actualizar item
  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  // Cálculos
  const totals = useMemo(() => {
    let subtotal = 0
    let isv      = 0
    let discount = 0
    let total    = 0

    items.forEach(item => {
      const unitBase   = item.unit_price / (1 + isv_rate / 100)
      const isvLine    = item.unit_price - unitBase
      const discAmount = item.unit_price * (item.discount_pct / 100)
      const lineTotal  = (item.unit_price - discAmount) * item.quantity

      subtotal += unitBase     * item.quantity
      isv      += isvLine      * item.quantity
      discount += discAmount   * item.quantity
      total    += lineTotal
    })

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      isv:      Math.round(isv      * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total:    Math.round(total    * 100) / 100,
    }
  }, [items, isv_rate])

  const fmt = (n: number) =>
    `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

  const handleSubmit = async () => {
    if (!selectedClient) { toast.error('Selecciona un cliente'); return }
    if (items.length === 0) { toast.error('Agrega al menos un producto'); return }

    setLoading(true)

    const { error } = await supabase.rpc('create_invoice', {
      p_client_id:      selectedClient.id,
      p_issued_at:      issuedAt,
      p_notes:          notes || null,
      p_isv_rate:       isv_rate,
      p_items:          items,
      p_sales_order_id: selectedOrder?.id ?? null,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Factura emitida exitosamente')
    router.push('/dashboard/facturacion')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}
          style={{ color: '#468189' }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold"
            style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Nueva Factura
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>
            CAI: <span className="font-mono">{config.cai}</span> · Vence: {new Date(config.cai_expires_at).toLocaleDateString('es-HN')}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Cliente */}
          <div className="rounded-xl p-5"
            style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9DBEBB' }}>
              Cliente
            </p>
            <select
              value={selectedClient?.id ?? ''}
              onChange={e => {
                const c = clients.find(x => x.id === e.target.value) ?? null
                setSelectedClient(c)
                setSelectedOrder(null)
                setItems([])
              }}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid #d0e0de', outline: 'none', fontFamily: 'inherit' }}>
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {selectedClient && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs" style={{ color: '#555' }}>
                {selectedClient.rtn && <p>RTN: <span className="font-mono">{selectedClient.rtn}</span></p>}
                {selectedClient.address && <p>📍 {selectedClient.address}</p>}
                {selectedClient.email && <p>✉️ {selectedClient.email}</p>}
                {selectedClient.phone && <p>📞 {selectedClient.phone}</p>}
              </div>
            )}
          </div>

          {/* Fuente de items */}
          {selectedClient && (
            <div className="rounded-xl p-5"
              style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9DBEBB' }}>
                Origen de productos
              </p>
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setSource('manual'); setSelectedOrder(null); setItems([]) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold flex-1 justify-center"
                  style={{
                    background: source === 'manual' ? '#468189' : '#f0f5f5',
                    color:      source === 'manual' ? '#F4E9CD' : '#555',
                  }}>
                  <Package className="w-4 h-4" /> Manual
                </button>
                {clientOrders.length > 0 && (
                  <button onClick={() => setSource('order')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold flex-1 justify-center"
                    style={{
                      background: source === 'order' ? '#468189' : '#f0f5f5',
                      color:      source === 'order' ? '#F4E9CD' : '#555',
                    }}>
                    <ShoppingCart className="w-4 h-4" /> Desde orden
                  </button>
                )}
              </div>

              {/* Seleccionar orden */}
              {source === 'order' && (
                <div className="mb-4">
                  <select
                    value={selectedOrder?.id ?? ''}
                    onChange={e => {
                      const o = clientOrders.find(x => x.id === e.target.value)
                      if (o) loadFromOrder(o)
                    }}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ border: '1px solid #d0e0de', outline: 'none', fontFamily: 'inherit' }}>
                    <option value="">Seleccionar orden despachada...</option>
                    {clientOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        Orden #{o.order_number} — L. {Number(o.total).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Buscador de productos (manual) */}
              {source === 'manual' && (
                <div className="relative mb-4">
                  <Input
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowProducts(true) }}
                    onFocus={() => setShowProducts(true)}
                    placeholder="Buscar producto por nombre o código..."
                  />
                  {showProducts && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
                      style={{ background: '#fff', border: '1px solid #d0e0de' }}>
                      {filteredProducts.map(p => (
                        <button key={p.id}
                          onClick={() => addProduct(p)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                          style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <div>
                            <span className="font-mono text-xs mr-2" style={{ color: '#9DBEBB' }}>{p.code}</span>
                            <span style={{ color: '#031926' }}>{p.name}</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: '#468189' }}>
                            L. {getPrice(p).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tabla de items */}
              {items.length > 0 && (
                <div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee' }}>
                        {['Descripción', 'Cant.', 'Precio', 'Desc.%', 'Total', ''].map(h => (
                          <th key={h} className="pb-2 text-left"
                            style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const discAmount = item.unit_price * (item.discount_pct / 100)
                        const lineTotal  = (item.unit_price - discAmount) * item.quantity
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                            <td className="py-2 pr-2">
                              <input
                                value={item.description}
                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                className="w-full text-xs px-2 py-1 rounded"
                                style={{ border: '1px solid #eee', outline: 'none' }}
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number" min={0.01} step={0.01}
                                value={item.quantity}
                                onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                className="w-16 text-xs px-2 py-1 rounded text-center"
                                style={{ border: '1px solid #eee', outline: 'none' }}
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number" min={0} step={0.01}
                                value={item.unit_price}
                                onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                                className="w-24 text-xs px-2 py-1 rounded"
                                style={{ border: '1px solid #eee', outline: 'none' }}
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number" min={0} max={100} step={0.01}
                                value={item.discount_pct}
                                onChange={e => updateItem(idx, 'discount_pct', Number(e.target.value))}
                                className="w-16 text-xs px-2 py-1 rounded text-center"
                                style={{ border: '1px solid #eee', outline: 'none' }}
                              />
                            </td>
                            <td className="py-2 pr-2 text-xs font-bold" style={{ color: '#031926', whiteSpace: 'nowrap' }}>
                              {fmt(lineTotal)}
                            </td>
                            <td className="py-2">
                              <button onClick={() => removeItem(idx)}
                                style={{ color: '#d94f4f' }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {source === 'manual' && (
                    <button
                      onClick={() => setItems(prev => [...prev, {
                        product_id: '', description: '', quantity: 1, unit_price: 0, discount_pct: 0
                      }])}
                      className="mt-2 text-xs flex items-center gap-1"
                      style={{ color: '#468189' }}>
                      <Plus className="w-3 h-3" /> Agregar línea vacía
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fecha y notas */}
          <div className="rounded-xl p-5"
            style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9DBEBB' }}>
              Detalles
            </p>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Fecha de emisión
                </label>
                <Input type="date" value={issuedAt}
                  onChange={e => setIssuedAt(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Notas
                </label>
                <Input value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Opcional..." />
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha — Resumen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="rounded-xl p-5 sticky top-6"
            style={{ background: '#031926', border: '1px solid rgba(70,129,137,0.2)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#9DBEBB' }}>
              Resumen
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Subtotal (sin ISV)', value: fmt(totals.subtotal) },
                { label: `ISV (${isv_rate}%)`,  value: fmt(totals.isv)      },
                { label: 'Descuentos',           value: `- ${fmt(totals.discount)}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(244,233,205,0.6)' }}>{row.label}</span>
                  <span className="text-sm font-semibold" style={{ color: '#F4E9CD' }}>{row.value}</span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid rgba(244,233,205,0.1)' }}>
                <span className="text-sm font-bold" style={{ color: '#F4E9CD' }}>TOTAL</span>
                <span className="text-xl font-bold" style={{ color: '#9DBEBB', fontFamily: 'Georgia, serif' }}>
                  {fmt(totals.total)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(244,233,205,0.1)' }}>
              <p className="text-xs mb-2" style={{ color: 'rgba(244,233,205,0.4)' }}>
                Siguiente correlativo
              </p>
              <p className="text-xs font-mono font-bold" style={{ color: '#468189' }}>
                {config.range_from.split('-').slice(0, 3).join('-')}-{String(config.current_correlative).padStart(8, '0')}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedClient || items.length === 0}
              className="w-full mt-6"
              style={{ background: '#468189', color: '#F4E9CD' }}>
              {loading ? 'Emitiendo...' : 'Emitir Factura'}
            </Button>

            <p className="text-xs text-center mt-3" style={{ color: 'rgba(244,233,205,0.3)' }}>
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}