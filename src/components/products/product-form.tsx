'use client'

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
import { Loader2 } from 'lucide-react'
import { Product } from '@/types'

const productSchema = z.object({
  code:        z.string().min(1, 'El código es requerido'),
  name:        z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit:        z.string().min(1, 'La unidad es requerida'),
  price_a:     z.coerce.number().min(0, 'Precio inválido'),
  price_b:     z.coerce.number().min(0, 'Precio inválido'),
  price_c:     z.coerce.number().min(0, 'Precio inválido'),
  stock:       z.coerce.number().min(0, 'Stock inválido'),
  min_stock:   z.coerce.number().min(0, 'Stock mínimo inválido'),
  active:      z.boolean(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const UNITS = ['Unidad', 'Caja', 'Bolsa', 'Pack', 'Docena', 'Libra', 'Kilo', 'Litro']

export function ProductForm({ product, onSubmit, onCancel, loading }: ProductFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code:        product?.code        ?? '',
      name:        product?.name        ?? '',
      description: product?.description ?? '',
      unit:        product?.unit        ?? 'Unidad',
      price_a:     product?.price_a     ?? 0,
      price_b:     product?.price_b     ?? 0,
      price_c:     product?.price_c     ?? 0,
      stock:       product?.stock       ?? 0,
      min_stock:   product?.min_stock   ?? 0,
      active:      product?.active      ?? true,
    },
  })

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs mt-1" style={{ color: '#d94f4f' }}>{msg}</p> : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Código y Nombre */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code" style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
            Código <span style={{ color: '#468189' }}>*</span>
          </Label>
          <Input id="code" {...register('code')} placeholder="P001" className="mt-1 h-10" />
          <FieldError msg={errors.code?.message} />
        </div>
        <div>
          <Label htmlFor="unit" style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
            Unidad <span style={{ color: '#468189' }}>*</span>
          </Label>
          <Select defaultValue={watch('unit')} onValueChange={v => setValue('unit', v)}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nombre */}
      <div>
        <Label htmlFor="name" style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
          Nombre del producto <span style={{ color: '#468189' }}>*</span>
        </Label>
        <Input id="name" {...register('name')} placeholder="Aceite Vegetal 1L" className="mt-1 h-10" />
        <FieldError msg={errors.name?.message} />
      </div>

      {/* Descripción */}
      <div>
        <Label htmlFor="description" style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
          Descripción
        </Label>
        <Textarea id="description" {...register('description')} placeholder="Descripción opcional..." className="mt-1 resize-none" rows={2} />
      </div>

      {/* Precios */}
      <div>
        <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#468189' }}>
          Precios (L.)
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(['a', 'b', 'c'] as const).map(list => (
            <div key={list}>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Lista {list.toUpperCase()} <span style={{ color: '#468189' }}>*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                {...register(`price_${list}`)}
                placeholder="0.00"
                className="mt-1 h-10"
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
          defaultValue={watch('active') ? 'true' : 'false'}
          onValueChange={v => setValue('active', v === 'true')}
        >
          <SelectTrigger className="mt-1 h-10">
            <SelectValue />
          </SelectTrigger>
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
        <Button
          type="submit"
          disabled={loading}
          style={{ background: '#468189', color: '#F4E9CD' }}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>

    </form>
  )
}