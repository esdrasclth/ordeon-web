'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Loader2, Plus } from 'lucide-react'
import { Product } from '@/types'
import { useCategories, useCreateCategory } from '@/lib/hooks/use-categories'
import { toast } from 'sonner'

const productSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit: z.string().min(1, 'La unidad es requerida'),
  price_a: z.coerce.number().min(0, 'Precio inválido'),
  price_b: z.coerce.number().min(0, 'Precio inválido'),
  price_c: z.coerce.number().min(0, 'Precio inválido'),
  stock: z.coerce.number().min(0, 'Stock inválido'),
  min_stock: z.coerce.number().min(0, 'Stock mínimo inválido'),
  active: z.boolean(),
  category_id: z.string().nullable().optional(),
  purchase_price: z.coerce.number().min(0).default(0),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const UNITS = ['Unidad', 'Caja', 'Bolsa', 'Pack', 'Docena', 'Libra', 'Kilo', 'Litro']

const COLORS = [
  '#468189', '#27ae60', '#2980b9', '#e67e22',
  '#d94f4f', '#8e44ad', '#16a085', '#f39c12',
  '#c0392b', '#7f8c8d',
]

export function ProductForm({ product, onSubmit, onCancel, loading }: ProductFormProps) {
  const { data: categories } = useCategories()
  const createCategory = useCreateCategory()

  const [showCatDialog, setShowCatDialog] = useState(false)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#468189')
  const [catLoading, setCatLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      code: product?.code ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      unit: product?.unit ?? 'Unidad',
      price_a: product?.price_a ?? 0,
      price_b: product?.price_b ?? 0,
      price_c: product?.price_c ?? 0,
      stock: product?.stock ?? 0,
      min_stock: product?.min_stock ?? 0,
      active: product?.active ?? true,
      category_id: (product as any)?.category_id ?? null,
      purchase_price: product?.purchase_price ?? 0,
    },
  })

  const handleCreateCategory = async () => {
    if (!catName.trim()) return
    setCatLoading(true)
    try {
      await createCategory.mutateAsync({ name: catName.trim(), color: catColor })
      toast.success(`Categoría "${catName}" creada`)
      setCatName('')
      setCatColor('#468189')
      setShowCatDialog(false)
    } catch (e) {
      console.error('Error categoría:', e)
      toast.error('Error al crear la categoría')
    } finally {
      setCatLoading(false)
    }
  }

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs mt-1" style={{ color: '#d94f4f' }}>{msg}</p> : null

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Código y Unidad */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Código <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Input {...register('code')} placeholder="P001" className="mt-1 h-10" />
            <FieldError msg={errors.code?.message} />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Unidad <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Select defaultValue={watch('unit')} onValueChange={v => setValue('unit', v)}>
              <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
            Nombre del producto <span style={{ color: '#468189' }}>*</span>
          </Label>
          <Input {...register('name')} placeholder="Cadena de bicicleta KMC Ti 126L" className="mt-1 h-10" />
          <FieldError msg={errors.name?.message} />
        </div>

        {/* Descripción */}
        <div>
          <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Descripción</Label>
          <Textarea {...register('description')} placeholder="Descripción opcional..." className="mt-1 resize-none" rows={2} />
        </div>

        {/* Categoría + botón crear */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Categoría</Label>
            <button
              type="button"
              onClick={() => setShowCatDialog(true)}
              className="flex items-center gap-1 text-xs font-600 hover:opacity-80 transition-opacity"
              style={{ color: '#468189', fontWeight: 600 }}
            >
              <Plus size={13} />
              Nueva categoría
            </button>
          </div>
          <Select
            defaultValue={watch('category_id') ?? 'none'}
            onValueChange={v => setValue('category_id', v === 'none' ? null : v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin categoría</SelectItem>
              {categories?.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: cat.color }} />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Precios */}
        <div>
          <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#468189' }}>
            Precios (L.)
          </p>
          <div className="mb-3 p-3 rounded-lg" style={{ background: '#fff8e6', border: '1px solid #f0d080' }}>
            <Label style={{ color: '#8a6500', fontWeight: 600, fontSize: 12 }}>
              Precio de Compra (Costo) — Solo visible para admin
            </Label>
            <Input
              type="number" step="0.01"
              {...register('purchase_price')}
              placeholder="0.00" className="mt-1.5 h-10"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['a', 'b', 'c'] as const).map(list => (
              <div key={list}>
                <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                  Lista {list.toUpperCase()} <span style={{ color: '#468189' }}>*</span>
                </Label>
                <Input
                  type="number" step="0.01"
                  {...register(`price_${list}`)}
                  placeholder="0.00" className="mt-1 h-10"
                />
                <FieldError msg={errors[`price_${list}`]?.message} />
              </div>
            ))}
          </div>
        </div>

        {/* Stock */}
        <div>
          <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#468189' }}>
            Inventario
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Stock actual <span style={{ color: '#468189' }}>*</span>
              </Label>
              <Input type="number" {...register('stock')} placeholder="0" className="mt-1 h-10" />
              <FieldError msg={errors.stock?.message} />
            </div>
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Stock mínimo <span style={{ color: '#468189' }}>*</span>
              </Label>
              <Input type="number" {...register('min_stock')} placeholder="0" className="mt-1 h-10" />
              <FieldError msg={errors.min_stock?.message} />
            </div>
          </div>
        </div>

        {/* Estado */}
        <div>
          <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Estado</Label>
          <Select
            value={watch('active') ? 'true' : 'false'}
            onValueChange={v => setValue('active', v === 'true', { shouldDirty: true })}
          >
            <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}
            style={{ background: '#468189', color: '#F4E9CD' }}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>

      </form>

      {/* Dialog: Nueva Categoría */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926' }}>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Nombre <span style={{ color: '#468189' }}>*</span>
              </Label>
              <Input
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="Ej: Repuestos, Accesorios..."
                className="mt-1 h-10"
                onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                autoFocus
              />
            </div>

            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Color
              </Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCatColor(c)}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: c,
                      border: catColor === c ? '3px solid #031926' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: catColor, border: '1px solid #eee',
                  flexShrink: 0,
                }} />
                <span className="text-sm" style={{ color: '#777' }}>
                  Color seleccionado
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button" variant="outline"
                onClick={() => { setShowCatDialog(false); setCatName('') }}
                disabled={catLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateCategory}
                disabled={catLoading || !catName.trim()}
                style={{ background: '#468189', color: '#F4E9CD' }}
              >
                {catLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear categoría
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}