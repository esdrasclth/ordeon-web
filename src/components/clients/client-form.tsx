'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import { useListValues } from '@/lib/hooks/use-settings'

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  rtn: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string()
    .optional()
    .refine(
      v => !v || /^\+504 \d{4}-\d{4}$/.test(v),
      { message: 'Formato requerido: +504 9999-9999' }
    ),
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

const DEPARTMENT_CITIES: Record<string, string[]> = {
  'Atlántida':          ['La Ceiba', 'Tela', 'El Porvenir', 'Jutiapa', 'Arizona', 'La Masica', 'San Francisco', 'Esparta'],
  'Choluteca':          ['Choluteca', 'Marcovia', 'San Marcos de Colón', 'Namasigüe', 'El Triunfo', 'Pespire', 'Orocuina', 'Duyure', 'Santa Ana de Yusguare', 'Morolica'],
  'Colón':              ['Trujillo', 'Tocoa', 'Sonaguera', 'Sabá', 'Bonito Oriental', 'Balfate', 'Iriona', 'Limón', 'Santa Rosa de Aguán'],
  'Comayagua':          ['Comayagua', 'Siguatepeque', 'La Trinidad', 'Villa de San Antonio', 'Ajuterique', 'El Rosario', 'Lamaní', 'Lejamaní', 'Meámbar', 'Minas de Oro', 'San Jerónimo', 'San José de Comayagua', 'San Luis', 'Taulabé'],
  'Copán':              ['Santa Rosa de Copán', 'La Entrada', 'Copán Ruinas', 'Florida', 'Nueva Arcadia', 'San Agustín', 'San Antonio', 'Cabañas', 'Cucuyagua', 'Dolores', 'El Paraíso', 'San Juan de Opoa', 'Santa Rita', 'Trinidad de Copán'],
  'Cortés':             ['San Pedro Sula', 'Choloma', 'La Lima', 'Villanueva', 'Puerto Cortés', 'Omoa', 'San Antonio de Cortés', 'Santa Cruz de Yojoa', 'Pimienta', 'Potrerillos'],
  'El Paraíso':         ['Yuscarán', 'Danlí', 'El Paraíso', 'Teupasenti', 'Jacaleapa', 'Liure', 'Morocelí', 'Oropolí', 'San Antonio de Flores', 'San Lucas', 'Vado Ancho', 'Yauguipe'],
  'Francisco Morazán':  ['Tegucigalpa', 'Comayagüela', 'Valle de Ángeles', 'Santa Lucía', 'Talanga', 'Cedros', 'Guaimaca', 'La Libertad', 'Maraita', 'Ojojona', 'Orica', 'Reitoca', 'Sabanagrande', 'San Antonio de Oriente', 'San Ignacio', 'San Juan de Flores', 'Santa Ana', 'Tatumbla', 'Vallecillos'],
  'Gracias a Dios':     ['Puerto Lempira', 'Brus Laguna', 'Ahuas', 'Juan Francisco Bulnes', 'Villeda Morales', 'Wampusirpe'],
  'Intibucá':           ['La Esperanza', 'Intibucá', 'Camasca', 'Colomoncagua', 'Dolores', 'Jesús de Otoro', 'Magdalena', 'San Antonio', 'San Isidro', 'San Juan', 'San Marcos de la Sierra', 'Santa Lucía', 'Yamaranguila'],
  'Islas de la Bahía':  ['Roatán', 'Utila', 'Guanaja', 'José Santos Guardiola'],
  'La Paz':             ['La Paz', 'Marcala', 'Cane', 'Chinacla', 'Guajiquiro', 'Lauterique', 'Opatoro', 'San Antonio del Norte', 'San José', 'San Juan', 'San Pedro de Tutule', 'Santa Ana', 'Santa Elena', 'Santa María', 'Santiago de Puringla', 'Yarula'],
  'Lempira':            ['Gracias', 'Lepaera', 'Belén', 'Candelaria', 'Cololaca', 'Erandique', 'Gualcince', 'Guarita', 'La Campa', 'La Iguala', 'Las Flores', 'La Unión', 'La Virtud', 'Mapulaca', 'Piraera', 'San Andrés', 'San Francisco', 'San Marcos de Caiquín', 'Talgua', 'Tomala', 'Valladolid', 'Virginia'],
  'Ocotepeque':         ['Ocotepeque', 'Belén Gualcho', 'Concepción', 'La Labor', 'Lucerna', 'Mercedes', 'San Fernando', 'San Francisco del Valle', 'San Jorge', 'San Marcos', 'Santa Fe', 'Sensenti', 'Sinuapa'],
  'Olancho':            ['Juticalpa', 'Catacamas', 'San Francisco de la Paz', 'Campamento', 'El Rosario', 'Gualaco', 'Guarizama', 'Guata', 'La Unión', 'Mangulile', 'Manto', 'Salamá', 'San Esteban', 'Dulce Nombre de Culmí', 'Silca', 'Yocón'],
  'Santa Bárbara':      ['Santa Bárbara', 'Quimistán', 'El Níspero', 'Colinas', 'Las Vegas', 'Arada', 'Atima', 'Azacualpa', 'Ceguaca', 'Chinda', 'Concepción del Norte', 'Concepción del Sur', 'Gualala', 'Ilama', 'Macuelizo', 'Naranjito', 'Nuevo Celilac', 'Petoa', 'Protección', 'San Francisco de Ojuera', 'San José de Colinas', 'San Luis', 'San Marcos', 'San Nicolás', 'San Pedro Zacapa', 'Santa Rita', 'Talgua', 'Trinidad'],
  'Valle':              ['Nacaome', 'Amapala', 'Alianza', 'Aramecina', 'Caridad', 'Goascorán', 'Langue', 'San Francisco de Coray', 'San Lorenzo'],
  'Yoro':               ['Yoro', 'El Progreso', 'Olanchito', 'Morazán', 'El Negrito', 'Arenal', 'Jocón', 'Sulaco', 'Victoria', 'Yorito', 'Santa Rita'],
}

const DEPARTMENTS = Object.keys(DEPARTMENT_CITIES).sort()



export function ClientForm({ client, onSubmit, onCancel, loading }: ClientFormProps) {
  const { data: paymentTerms } = useListValues('payment_terms')
  // Estado local para manejar el departamento y filtrar ciudades
  const [selectedDept, setSelectedDept] = useState<string>(client?.department ?? '')
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
            <Field label="Teléfono" error={errors.phone?.message}>
              <Input
                {...register('phone')}
                placeholder="+504 9999-9999"
                maxLength={14}
                className="h-10"
                onChange={e => {
                  let val = e.target.value.replace(/[^\d+\- ]/g, '')
                  // Auto-prefijo +504 si el usuario empieza a escribir dígitos
                  if (val && !val.startsWith('+')) val = '+504 ' + val
                  // Auto-insertar guión después del 4º dígito del número local
                  const digits = val.replace(/^\+504 /, '')
                  if (digits.length > 4 && !digits.includes('-')) {
                    val = '+504 ' + digits.slice(0, 4) + '-' + digits.slice(4)
                  }
                  e.target.value = val
                  register('phone').onChange(e)
                }}
              />
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
            <Field label="Departamento">
              <Select
                defaultValue={watch('department') ?? ''}
                onValueChange={v => {
                  setValue('department', v)
                  setValue('city', '')   // resetear ciudad al cambiar departamento
                  setSelectedDept(v)
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ciudad">
              <Select
                value={watch('city') ?? ''}
                onValueChange={v => setValue('city', v)}
                disabled={!selectedDept}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={selectedDept ? 'Seleccionar ciudad...' : 'Primero elige depto.'} />
                </SelectTrigger>
                <SelectContent>
                  {(DEPARTMENT_CITIES[selectedDept] ?? []).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
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
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {paymentTerms?.filter(t => t.active).map(t => (
                  <SelectItem key={t.id} value={t.label}>{t.label}</SelectItem>
                ))}
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