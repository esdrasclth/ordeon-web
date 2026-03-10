'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Profile, UserRole } from '@/types'
import { formatHNPhone } from '@/components/shared/phone-input'

const createSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.string().min(1),
  region: z.string().optional(),
  phone: z.string().optional(),
})

const editSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  role: z.string().min(1),
  region: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean(),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'facturacion', label: 'Facturación' },
]

interface UserFormProps {
  user?: Profile
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function UserForm({ user, onSubmit, onCancel, loading }: UserFormProps) {
  const isEdit = !!user

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: isEdit ? {
      full_name: user.full_name,
      role: user.role,
      region: user.region ?? '',
      phone: user.phone ?? '',
      active: user.active,
    } : {
      full_name: '',
      email: '',
      password: '',
      role: 'vendedor',
      region: '',
      phone: '',
    },
  })

  const selectedRole = watch('role')
  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs mt-1" style={{ color: '#d94f4f' }}>{msg}</p> : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div>
        <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
          Nombre completo <span style={{ color: '#468189' }}>*</span>
        </Label>
        <Input {...register('full_name')} placeholder="María López" className="mt-1 h-10" />
        <FieldError msg={errors.full_name?.message as string} />
      </div>

      {!isEdit && (
        <>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Correo electrónico <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Input {...register('email')} type="email" placeholder="correo@empresa.com" className="mt-1 h-10" />
            <FieldError msg={(errors as any).email?.message as string} />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Contraseña temporal <span style={{ color: '#468189' }}>*</span>
            </Label>
            <Input {...register('password')} type="password" placeholder="Mínimo 6 caracteres" className="mt-1 h-10" />
            <FieldError msg={(errors as any).password?.message as string} />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
            Rol <span style={{ color: '#468189' }}>*</span>
          </Label>
          <Select defaultValue={watch('role')} onValueChange={v => setValue('role', v)}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Teléfono</Label>
          <Input
            {...register('phone')}
            placeholder="+504 9999-9999"
            maxLength={14}
            className="mt-1 h-10"
            onChange={e => {
              const formatted = formatHNPhone(e.target.value)
              e.target.value = formatted
              register('phone').onChange(e)
            }}
          />
        </div>
      </div>

      {selectedRole === 'vendedor' && (
        <div>
          <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Región / Zona</Label>
          <Input {...register('region')} placeholder="Norte, Sur, Centro..." className="mt-1 h-10" />
        </div>
      )}

      {isEdit && (
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
      )}

      {/* Info */}
      {!isEdit && (
        <div className="rounded-lg p-3 text-xs" style={{ background: '#f0f9f8', color: '#468189' }}>
          💬 El usuario podrá cambiar su contraseña desde su perfil una vez que ingrese al sistema.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} style={{ background: '#468189', color: '#F4E9CD' }}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>

    </form>
  )
}