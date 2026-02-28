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
import { Client } from '@/types'

const clientSchema = z.object({
  name:          z.string().min(1, 'El nombre es requerido'),
  rtn:           z.string().optional(),
  contact_name:  z.string().optional(),
  phone:         z.string().optional(),
  email:         z.string().email('Correo inválido').optional().or(z.literal('')),
  address:       z.string().optional(),
  city:          z.string().optional(),
  department:    z.string().optional(),
  price_list:    z.enum(['A', 'B', 'C']),
  credit_limit:  z.coerce.number().min(0),
  payment_terms: z.string().min(1, 'Los términos de pago son requeridos'),
  status:        z.enum(['active', 'blocked', 'inactive']),
  notes:         z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  client?: Client
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const DEPARTMENTS = [
  'Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán',
  'Cortés', 'El Paraíso', 'Francisco Morazán', 'Gracias a Dios',
  'Intibucá', 'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque',
  'Olancho', 'Santa Bárbara', 'Valle', 'Yoro'
]

const PAYMENT_TERMS = [
  'Contado', 'Crédito 15 días', 'Crédito 30 días', 'Crédito 45 días'
]

export function ClientForm({ client, onSubmit, onCancel, loading }: ClientFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name:          client?.name          ?? '',
      rtn:           client?.rtn           ?? '',
      contact_name:  client?.contact_name  ?? '',
      phone:         client?.phone         ?? '',
      email:         client?.email         ?? '',
      address:       client?.address       ?? '',
      city:          client?.city          ?? '',
      department:    client?.department    ?? '',
      price_list:    client?.price_list    ?? 'B',
      credit_limit:  client?.credit_limit  ?? 0,
      payment_terms: client?.payment_terms ?? 'Contado',
      status:        client?.status        ?? 'active',
      notes:         client?.notes         ?? '',
    },
  })

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs mt-1" style={{ color: '#d94f4f' }}>{msg}</p> : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

      {/* Datos principales */}
      <div>
        <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#468189' }}>
          Datos del negocio
        </p>
        <div className="space-y-3">
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Nombre del negocio <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Input {...register('name')} placeholder="Supermercado La Colonia" className="mt-1 h-10" />
            <FieldError msg={errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>RTN</Label>
              <Input {...register('rtn')} placeholder="05019999000000" className="mt-1 h-10" maxLength={14} />
            </div>
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Teléfono</Label>
              <Input {...register('phone')} placeholder="9999-9999" className="mt-1 h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Contacto principal</Label>
              <Input {...register('contact_name')} placeholder="María López" className="mt-1 h-10" />
            </div>
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Correo electrónico</Label>
              <Input {...register('email')} type="email" placeholder="correo@ejemplo.com" className="mt-1 h-10" />
              <FieldError msg={errors.email?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div>
        <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#468189' }}>
          Ubicación
        </p>
        <div className="space-y-3">
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Dirección</Label>
            <Input {...register('address')} placeholder="Col. Trejo, calle principal" className="mt-1 h-10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Ciudad</Label>
              <Input {...register('city')} placeholder="La Ceiba" className="mt-1 h-10" />
            </div>
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Departamento</Label>
              <Select defaultValue={watch('department') ?? ''} onValueChange={v => setValue('department', v)}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Condiciones comerciales */}
      <div>
        <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#468189' }}>
          Condiciones comerciales
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Lista de precios <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Select defaultValue={watch('price_list')} onValueChange={v => setValue('price_list', v as 'A' | 'B' | 'C')}>
              <SelectTrigger className="mt-1 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Lista A — Mayorista</SelectItem>
                <SelectItem value="B">Lista B — Regular</SelectItem>
                <SelectItem value="C">Lista C — Minorista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Términos de pago <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Select defaultValue={watch('payment_terms')} onValueChange={v => setValue('payment_terms', v)}>
              <SelectTrigger className="mt-1 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError msg={errors.payment_terms?.message} />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Límite de crédito (L.)</Label>
            <Input type="number" step="0.01" {...register('credit_limit')} placeholder="0.00" className="mt-1 h-10" />
            <FieldError msg={errors.credit_limit?.message} />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Estado</Label>
            <Select defaultValue={watch('status')} onValueChange={v => setValue('status', v as Client['status'])}>
              <SelectTrigger className="mt-1 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Notas internas</Label>
        <Textarea {...register('notes')} placeholder="Observaciones del cliente..." className="mt-1 resize-none" rows={2} />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} style={{ background: '#468189', color: '#F4E9CD' }}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {client ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>

    </form>
  )
}