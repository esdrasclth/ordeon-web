'use client'

import { useState, useEffect } from 'react'
import { useProducts } from '@/lib/hooks/use-products'
import { useClients } from '@/lib/hooks/use-clients'
import { useSettings, useListValues } from '@/lib/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Loader2, Plus, Trash2, Search, AlertCircle } from 'lucide-react'
import { OrderItemForm, Client } from '@/types'

interface OrderFormProps {
  vendorId: string
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function OrderForm({ vendorId, onSubmit, onCancel, loading }: OrderFormProps) {
  const { data: products } = useProducts()
  const { data: clients } = useClients()
  const { data: settings } = useSettings()
  const { data: paymentTerms } = useListValues('payment_terms')
  const { data: deliveryMethods } = useListValues('delivery_methods')

  const [clientId, setClientId] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [paymentTerm, setPaymentTerm] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderItemForm[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showProducts, setShowProducts] = useState(false)

  const isvRate = Number(settings?.isv_rate ?? 15)

  // Cuando cambia el cliente, actualizar término de pago por defecto
  useEffect(() => {
    if (selectedClient) {
      setPaymentTerm(selectedClient.payment_terms ?? 'Contado')
    }
  }, [selectedClient])

  const handleSelectClient = (id: string) => {
    setClientId(id)
    const client = clients?.find(c => c.id === id) ?? null
    setSelectedClient(client)
  }

  const getPriceForClient = (product: any, priceList: string) => {
    if (priceList === 'A') return Number(product.price_a)
    if (priceList === 'C') return Number(product.price_c)
    return Number(product.price_b)
  }

  const addProduct = (product: any) => {
    const priceList = selectedClient?.price_list ?? 'B'
    const price = getPriceForClient(product, priceList)

    const exists = items.find(i => i.product_id === product.id)
    if (exists) {
      setItems(prev => prev.map(i =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setItems(prev => [...prev, {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        unit: product.unit,
        quantity: 1,
        unit_price: price,
        discount_pct: 0,
      }])
    }
    setProductSearch('')
    setShowProducts(false)
  }

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }

  const updateItem = (productId: string, field: keyof OrderItemForm, value: number) => {
    setItems(prev => prev.map(i =>
      i.product_id === productId ? { ...i, [field]: value } : i
    ))
  }

  // Cálculos
  const calcLine = (item: OrderItemForm) => {
    const basePrice = item.unit_price / (1 + isvRate / 100)
    const isvPerUnit = item.unit_price - basePrice
    const discAmount = item.unit_price * (item.discount_pct / 100)
    const lineTotal = (item.unit_price - discAmount) * item.quantity
    return { basePrice, isvPerUnit, discAmount, lineTotal }
  }

  const subtotal = items.reduce((acc, item) => {
    const { basePrice } = calcLine(item)
    return acc + basePrice * item.quantity
  }, 0)

  const isvTotal = items.reduce((acc, item) => {
    const { isvPerUnit } = calcLine(item)
    return acc + isvPerUnit * item.quantity
  }, 0)

  const discountTotal = items.reduce((acc, item) => {
    const { discAmount } = calcLine(item)
    return acc + discAmount * item.quantity
  }, 0)

  const total = items.reduce((acc, item) => {
    const { lineTotal } = calcLine(item)
    return acc + lineTotal
  }, 0)

  const filteredProducts = products?.filter(p =>
    p.active && (
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase())
    )
  ).slice(0, 8) ?? []

  const handleSubmit = async () => {
    if (!clientId || items.length === 0) return
    await onSubmit({
      client_id: clientId,
      vendor_id: vendorId,
      delivery_date: deliveryDate || null,
      payment_terms: paymentTerm,
      delivery_method: deliveryMethod,
      warehouse_id: null,
      price_list: selectedClient?.price_list ?? 'B',
      notes,
      isv_rate: isvRate,
      items,
    })
  }

  const fmt = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const overCredit = selectedClient &&
    selectedClient.credit_limit > 0 &&
    (selectedClient.current_balance + total) > selectedClient.credit_limit

  return (
    <div className="space-y-6">

      {/* Cliente */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
        <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#468189' }}>
          Cliente
        </p>
        <Select value={clientId} onValueChange={handleSelectClient}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Seleccionar cliente..." />
          </SelectTrigger>
          <SelectContent>
            {clients?.filter(c => c.status === 'active').map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — Lista {c.price_list}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedClient && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg" style={{ background: '#f8fafa' }}>
              <p className="text-xs" style={{ color: '#9DBEBB' }}>Lista de precios</p>
              <p className="font-bold text-sm" style={{ color: '#031926' }}>Lista {selectedClient.price_list}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#f8fafa' }}>
              <p className="text-xs" style={{ color: '#9DBEBB' }}>Saldo actual</p>
              <p className="font-bold text-sm" style={{ color: '#031926' }}>
                {fmt(selectedClient.current_balance)}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: overCredit ? '#fef2f2' : '#f8fafa' }}>
              <p className="text-xs" style={{ color: '#9DBEBB' }}>Límite crédito</p>
              <p className="font-bold text-sm" style={{ color: overCredit ? '#d94f4f' : '#031926' }}>
                {fmt(selectedClient.credit_limit)}
              </p>
            </div>
          </div>
        )}

        {overCredit && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg text-sm"
            style={{ background: '#fef2f2', color: '#d94f4f', border: '1px solid #fca5a5' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Este pedido excede el límite de crédito del cliente
          </div>
        )}
      </div>

      {/* Detalles de entrega */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
        <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#468189' }}>
          Detalles de entrega
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Fecha de entrega estimada</Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className="mt-1 h-10"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Términos de pago <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Select value={paymentTerm} onValueChange={setPaymentTerm}>
              <SelectTrigger className="mt-1 h-10">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {paymentTerms?.filter(t => t.active).map(t => (
                  <SelectItem key={t.id} value={t.label}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Método de entrega <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger className="mt-1 h-10">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {deliveryMethods?.filter(m => m.active).map(m => (
                  <SelectItem key={m.id} value={m.label}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#468189' }}>
            Productos ({items.length})
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowProducts(v => !v)}
            disabled={!clientId}
            style={{ background: '#468189', color: '#F4E9CD' }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Agregar
          </Button>
        </div>

        {/* Buscador de productos */}
        {showProducts && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9DBEBB' }} />
              <Input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Buscar producto por nombre o código..."
                className="pl-10 h-10"
                autoFocus
              />
            </div>
            {productSearch && (
              <div className="mt-1 rounded-lg overflow-hidden shadow-lg z-10"
                style={{ border: '1px solid rgba(68,129,137,0.2)' }}>
                {filteredProducts.length === 0 ? (
                  <p className="p-3 text-sm text-center" style={{ color: '#9DBEBB' }}>Sin resultados</p>
                ) : (
                  filteredProducts.map(p => {
                    const price = getPriceForClient(p, selectedClient?.price_list ?? 'B')
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: '1px solid #f0f0f0' }}
                      >
                        <div>
                          <span className="text-xs font-mono mr-2" style={{ color: '#9DBEBB' }}>{p.code}</span>
                          <span className="text-sm font-medium" style={{ color: '#031926' }}>{p.name}</span>
                          <span className="text-xs ml-2" style={{ color: '#9DBEBB' }}>{p.unit}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: '#468189' }}>{fmt(price)}</p>
                          <p className="text-xs" style={{ color: p.stock > 0 ? '#27ae60' : '#d94f4f' }}>
                            Stock: {p.stock}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Lista de items */}
        {items.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: '#9DBEBB' }}>
            {clientId ? 'Agrega productos a la orden' : 'Primero selecciona un cliente'}
          </p>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const { lineTotal } = calcLine(item)
              return (
                <div
                  key={item.product_id}
                  className="rounded-lg p-3"
                  style={{ background: '#f8fafa', border: '1px solid #eee' }}
                >
                  {/* Nombre y eliminar */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#031926' }}>
                        {item.product_name}
                      </p>
                      <p className="text-xs" style={{ color: '#9DBEBB' }}>
                        {item.product_code} · {item.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="flex items-center justify-center w-6 h-6 rounded ml-2 flex-shrink-0"
                      style={{ color: '#d94f4f' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Campos en grid 3 columnas */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#9DBEBB' }}>Cantidad</p>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(item.product_id, 'quantity', Number(e.target.value))}
                        className="h-8 text-sm text-center px-1"
                      />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#9DBEBB' }}>Precio c/ISV</p>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={e => updateItem(item.product_id, 'unit_price', Number(e.target.value))}
                        className="h-8 text-sm px-2"
                      />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#9DBEBB' }}>Descuento %</p>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount_pct}
                        onChange={e => updateItem(item.product_id, 'discount_pct', Number(e.target.value))}
                        className="h-8 text-sm text-center px-1"
                      />
                    </div>
                  </div>

                  {/* Desglose ISV y total */}
                  <div className="flex items-center justify-between mt-2 pt-2"
                    style={{ borderTop: '1px solid #e5e5e5' }}>
                    <div className="flex gap-3">
                      <span className="text-xs" style={{ color: '#9DBEBB' }}>
                        Sin ISV: <span style={{ color: '#555' }}>
                          {fmt(calcLine(item).basePrice * item.quantity)}
                        </span>
                      </span>
                      <span className="text-xs" style={{ color: '#9DBEBB' }}>
                        ISV: <span style={{ color: '#555' }}>
                          {fmt(calcLine(item).isvPerUnit * item.quantity)}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: '#031926' }}>
                      {fmt(lineTotal)}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Totales */}
            <div className="mt-4 pt-4 space-y-1.5"
              style={{ borderTop: '2px solid rgba(68,129,137,0.15)' }}>
              {[
                { label: 'Subtotal (sin ISV)', value: subtotal },
                { label: `ISV (${isvRate}%)`, value: isvTotal },
                { label: 'Descuentos', value: -discountTotal, green: discountTotal > 0 },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm px-2">
                  <span style={{ color: '#777' }}>{row.label}</span>
                  <span style={{ color: row.green ? '#27ae60' : '#031926', fontWeight: 500 }}>
                    {row.green ? '-' : ''}{fmt(Math.abs(row.value))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-2 pt-2"
                style={{ borderTop: '1px solid #eee' }}>
                <span className="font-bold" style={{ color: '#031926' }}>Total</span>
                <span className="text-lg font-bold" style={{ color: '#468189' }}>{fmt(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
        <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Notas de la orden</Label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Instrucciones especiales, referencias, observaciones..."
          className="mt-2 resize-none"
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !clientId || items.length === 0 || !paymentTerm || !deliveryMethod}
          style={{ background: '#468189', color: '#F4E9CD' }}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Crear Orden
        </Button>
      </div>

    </div>
  )
}