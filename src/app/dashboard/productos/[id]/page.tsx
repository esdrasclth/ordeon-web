'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProduct, useUpdateProduct } from '@/lib/hooks/use-products'
import { useStockMovements, useProductStats, useAdjustStock } from '@/lib/hooks/use-stock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  ArrowLeft, Loader2, TrendingUp, ShoppingCart,
  Clock, Package, Plus, Minus, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { usePermissions } from '@/lib/hooks/use-current-user'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const MOVEMENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  entrada:    { label: 'Entrada',    color: '#27ae60', icon: '↑' },
  salida:     { label: 'Salida',     color: '#d94f4f', icon: '↓' },
  ajuste:     { label: 'Ajuste',     color: '#2980b9', icon: '⟳' },
  venta:      { label: 'Venta',      color: '#e67e22', icon: '↓' },
  devolucion: { label: 'Devolución', color: '#9b59b6', icon: '↑' },
}

export default function ProductDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { actions } = usePermissions()

  const { data: product,   isLoading: productLoading  } = useProduct(id)
  const { data: stats,     isLoading: statsLoading    } = useProductStats(id)
  const { data: movements, isLoading: movementsLoading } = useStockMovements(id)
  const adjustStock = useAdjustStock()

  const [showAdjust,   setShowAdjust]   = useState(false)
  const [adjustType,   setAdjustType]   = useState('entrada')
  const [adjustQty,    setAdjustQty]    = useState('')
  const [adjustNotes,  setAdjustNotes]  = useState('')

  const handleAdjust = async () => {
    const qty = Number(adjustQty)
    if (!qty || qty <= 0) {
      toast.error('Ingresa una cantidad válida')
      return
    }
    try {
      await adjustStock.mutateAsync({
        product_id: id,
        quantity:   qty,
        type:       adjustType,
        notes:      adjustNotes || undefined,
      })
      toast.success('Stock actualizado correctamente')
      setShowAdjust(false)
      setAdjustQty('')
      setAdjustNotes('')
    } catch (e: any) {
      toast.error(e.message?.includes('insuficiente')
        ? 'Stock insuficiente para esa salida'
        : 'Error al ajustar stock'
      )
    }
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#468189' }} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20" style={{ color: '#9DBEBB' }}>
        <p>Producto no encontrado</p>
      </div>
    )
  }

  const stockColor = product.stock <= 0
    ? '#d94f4f'
    : product.stock <= product.min_stock
      ? '#e67e22'
      : '#27ae60'

  const stockLabel = product.stock <= 0
    ? 'Sin stock'
    : product.stock <= product.min_stock
      ? 'Stock bajo'
      : 'Disponible'

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
                {product.name}
              </h1>
              <Badge style={{
                background: product.active ? '#27ae60' : '#bbb',
                color: '#fff', border: 'none'
              }}>
                {product.active ? 'Activo' : 'Inactivo'}
              </Badge>
              {product.product_categories && (
                <Badge style={{
                  background: (product.product_categories as any).color + '20',
                  color: (product.product_categories as any).color,
                  border: `1px solid ${(product.product_categories as any).color}40`
                }}>
                  {(product.product_categories as any).name}
                </Badge>
              )}
            </div>
            <p className="text-sm mt-0.5 font-mono" style={{ color: '#9DBEBB' }}>
              {product.code} · {product.unit}
            </p>
          </div>
        </div>

        {actions.canManageProducts && (
          <Button
            onClick={() => setShowAdjust(true)}
            style={{ background: '#468189', color: '#F4E9CD' }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Ajustar Stock
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          {
            label: 'Stock Actual',
            value: `${product.stock} ${product.unit}`,
            sub:   `mín. ${product.min_stock}`,
            icon:  <Package className="w-5 h-5" />,
            color: stockColor,
          },
          {
            label: 'Total Vendido',
            value: statsLoading ? '...' : `${stats?.total_sold ?? 0} uds`,
            sub:   `en ${stats?.total_orders ?? 0} órdenes`,
            icon:  <ShoppingCart className="w-5 h-5" />,
            color: '#468189',
          },
          {
            label: 'Ingresos Totales',
            value: statsLoading ? '...' : fmt(stats?.total_revenue ?? 0),
            sub:   'no canceladas',
            icon:  <TrendingUp className="w-5 h-5" />,
            color: '#27ae60',
          },
          {
            label: 'Última Venta',
            value: statsLoading ? '...' : stats?.last_sale
              ? new Date(stats.last_sale).toLocaleDateString('es-HN')
              : 'Sin ventas',
            sub:   '',
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
                <p className="text-xl font-bold"
                  style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                  {kpi.value}
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: kpi.color }}>
                  {kpi.label}
                </p>
                {kpi.sub && (
                  <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>{kpi.sub}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cuerpo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Historial de movimientos */}
        <div className="rounded-xl overflow-hidden shadow-sm"
          style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
          <div className="px-5 py-4" style={{ background: '#031926' }}>
            <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
              Historial de Movimientos de Stock
            </h3>
          </div>

          {movementsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#468189' }} />
            </div>
          ) : movements?.length === 0 ? (
            <div className="p-12 text-center" style={{ color: '#9DBEBB' }}>
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin movimientos registrados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                  {['Fecha', 'Tipo', 'Cantidad', 'Antes', 'Después', 'Usuario', 'Notas'].map(h => (
                    <th key={h} className="px-4 py-3 text-left"
                      style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements?.map((m, i) => {
                  const mv = MOVEMENT_LABELS[m.type]
                  return (
                    <tr key={m.id}
                      style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: '#777' }}>
                        {new Date(m.created_at).toLocaleString('es-HN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: mv.color + '15', color: mv.color }}>
                          {mv.icon} {mv.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-center"
                        style={{ color: mv.color }}>
                        {m.type === 'salida' || m.type === 'venta' ? '-' : '+'}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-center" style={{ color: '#777' }}>
                        {m.stock_before}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: '#031926' }}>
                        {m.stock_after}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                        {(m as any).profiles?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#777', maxWidth: 150 }}>
                        {m.notes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Info del producto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Precios */}
          <div className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-4"
              style={{ color: '#468189' }}>
              Lista de Precios
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Lista A — Mayorista',  value: product.price_a, color: '#27ae60' },
                { label: 'Lista B — Regular',    value: product.price_b, color: '#468189' },
                { label: 'Lista C — Minorista',  value: product.price_c, color: '#9DBEBB' },
              ].map(p => (
                <div key={p.label} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#777' }}>{p.label}</span>
                  <span className="text-sm font-bold" style={{ color: p.color }}>
                    {fmt(p.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detalles */}
          <div className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-4"
              style={{ color: '#468189' }}>
              Detalles
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Código',        value: product.code },
                { label: 'Unidad',        value: product.unit },
                { label: 'Stock mínimo',  value: String(product.min_stock) },
                { label: 'Categoría',     value: (product.product_categories as any)?.name ?? 'Sin categoría' },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs mb-0.5" style={{ color: '#9DBEBB' }}>{row.label}</p>
                  <p className="text-sm font-semibold" style={{ color: '#031926' }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Descripción */}
          {product.description && (
            <div className="rounded-xl p-5 shadow-sm"
              style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.15)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3"
                style={{ color: '#468189' }}>
                Descripción
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal ajuste de stock */}
      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Ajustar Stock — {product.name}
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>

            <div className="rounded-lg p-3 text-center"
              style={{ background: '#f0f9f8', border: '1px solid rgba(68,129,137,0.2)' }}>
              <p className="text-xs" style={{ color: '#9DBEBB' }}>Stock actual</p>
              <p className="text-2xl font-bold" style={{ color: stockColor }}>
                {product.stock} <span className="text-sm font-normal">{product.unit}</span>
              </p>
            </div>

            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Tipo de movimiento
              </Label>
              <Select value={adjustType} onValueChange={setAdjustType}>
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">↑ Entrada de stock</SelectItem>
                  <SelectItem value="salida">↓ Salida de stock</SelectItem>
                  <SelectItem value="ajuste">⟳ Ajuste (nuevo valor absoluto)</SelectItem>
                  <SelectItem value="devolucion">↑ Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                {adjustType === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
              </Label>
              <Input
                type="number"
                min="0"
                value={adjustQty}
                onChange={e => setAdjustQty(e.target.value)}
                placeholder="0"
                className="mt-1.5 h-10"
              />
              {adjustType !== 'ajuste' && adjustQty && (
                <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                  Stock resultante:{' '}
                  <span style={{ fontWeight: 700, color: '#031926' }}>
                    {adjustType === 'salida'
                      ? product.stock - Number(adjustQty)
                      : product.stock + Number(adjustQty)
                    } {product.unit}
                  </span>
                </p>
              )}
            </div>

            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Notas (opcional)
              </Label>
              <Textarea
                value={adjustNotes}
                onChange={e => setAdjustNotes(e.target.value)}
                placeholder="Motivo del ajuste..."
                className="mt-1.5 resize-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAdjust(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={adjustStock.isPending || !adjustQty}
                style={{ background: '#468189', color: '#F4E9CD' }}
              >
                {adjustStock.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}