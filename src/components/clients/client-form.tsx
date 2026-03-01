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
  name: z.string().min(1, 'El nombre es requerido'),
  rtn: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  price_list: z.enum(['A', 'B', 'C']),
  credit_limit: z.coerce.number().min(0).default(0),
  payment_terms: z.string().min(1, 'Los términos de pago son requeridos'),
  status: z.enum(['active', 'blocked', 'inactive']),
  notes: z.string().optional(),
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
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      name: client?.name ?? '',
      rtn: client?.rtn ?? '',
      contact_name: client?.contact_name ?? '',
      phone: client?.phone ?? '',
      email: client?.email ?? '',
      address: client?.address ?? '',
      city: client?.city ?? '',
      department: client?.department ?? '',
      price_list: client?.price_list ?? 'B',
      credit_limit: client?.credit_limit ?? 0,
      payment_terms: client?.payment_terms ?? 'Contado',
      status: client?.status ?? 'active',
      notes: client?.notes ?? '',
    },
  })

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs mt-1" style={{ color: '#d94f4f' }}>{msg}</p> : null

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-bold uppercase tracking-widest mb-4"
      style={{ color: '#468189', letterSpacing: '0.08em' }}>
      {children}
    </p>
  )

  const Field = ({ label, required, children, error }: {
    label: string; required?: boolean; children: React.ReactNode; error?: string
  }) => (
    <div>
      <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
        {label} {required && <span style={{ color: '#468189' }}>*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <FieldError msg={error} />}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>

      {/* Datos del negocio */}
      <div className="rounded-xl p-2" style={{ background: '#f8fafa', border: '1px solid rgba(68,129,137,0.1)' }}>
        <SectionTitle>Datos del negocio</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre del negocio" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="Supermercado La Colonia" className="h-10" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="RTN">
              <Input {...register('rtn')} placeholder="05019999000000" className="h-10" maxLength={14} />
            </Field>
            <Field label="Teléfono">
              <Input {...register('phone')} placeholder="9999-9999" className="h-10" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Contacto principal">
              <Input {...register('contact_name')} placeholder="María López" className="h-10" />
            </Field>
            <Field label="Correo electrónico" error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder="correo@ejemplo.com" className="h-10" />
            </Field>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div className="rounded-xl p-2" style={{ background: '#f8fafa', border: '1px solid rgba(68,129,137,0.1)' }}>
        <SectionTitle>Ubicación</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Dirección">
            <Input {...register('address')} placeholder="Col. Trejo, calle principal" className="h-10" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Ciudad">
              <Input {...register('city')} placeholder="La Ceiba" className="h-10" />
            </Field>
            <Field label="Departamento">
              <Select defaultValue={watch('department') ?? ''} onValueChange={v => setValue('department', v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </div>

      {/* Condiciones comerciales */}
      <div className="rounded-xl p-2" style={{ background: '#f8fafa', border: '1px solid rgba(68,129,137,0.1)' }}>
        <SectionTitle>Condiciones comerciales</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Lista de precios" required>
            <Select defaultValue={watch('price_list')} onValueChange={v => setValue('price_list', v as 'A' | 'B' | 'C')}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Lista A — Mayorista</SelectItem>
                <SelectItem value="B">Lista B — Regular</SelectItem>
                <SelectItem value="C">Lista C — Minorista</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Términos de pago" required error={errors.payment_terms?.message}>
            <Select defaultValue={watch('payment_terms')} onValueChange={v => setValue('payment_terms', v)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Límite de crédito (L.)" error={errors.credit_limit?.message}>
            <Input type="number" step="0.01" {...register('credit_limit')} placeholder="0.00" className="h-10" />
          </Field>
          <Field label="Estado">
            <Select defaultValue={watch('status')} onValueChange={v => setValue('status', v as Client['status'])}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {/* Notas */}
      <div>
        <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Notas internas</Label>
        <Textarea
          {...register('notes')}
          placeholder="Observaciones del cliente..."
          className="mt-1.5 resize-none"
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-1">
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