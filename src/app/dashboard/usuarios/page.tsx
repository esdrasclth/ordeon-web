'use client'

import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUser } from '@/lib/hooks/use-users'
import { UserForm } from '@/components/users/user-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, Pencil, UserCog } from 'lucide-react'
import { Profile, UserRole } from '@/types'
import { toast } from 'sonner'

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: '#031926' },
  supervisor: { label: 'Supervisor', color: '#468189' },
  vendedor: { label: 'Vendedor', color: '#27ae60' },
  almacen: { label: 'Almacén', color: '#e67e22' },
  facturacion: { label: 'Facturación', color: '#8e44ad' },
}

function RoleBadge({ role }: { role: UserRole }) {
  const config = ROLE_CONFIG[role] ?? { label: role, color: '#888' }
  return (
    <Badge style={{ background: config.color, color: '#fff', border: 'none', fontSize: 11 }}>
      {config.label}
    </Badge>
  )
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: '#468189', color: '#F4E9CD' }}
    >
      {initials}
    </div>
  )
}

export default function UsuariosPage() {
  const { data: users, isLoading } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  const handleCreate = async (data: any) => {
    try {
      await createUser.mutateAsync(data)
      toast.success('Usuario creado correctamente')
      setShowForm(false)
    } catch (e: any) {
      toast.error(e.message ?? 'Error al crear usuario')
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingUser) return
    try {
      await updateUser.mutateAsync({ id: editingUser.id, ...data })
      toast.success('Usuario actualizado')
      setEditingUser(null)
    } catch (e: any) {
      toast.error(e.message ?? 'Error al actualizar usuario')
    }
  }

  const activeUsers = users?.filter(u => u.active).length ?? 0
  const inactiveUsers = users?.filter(u => !u.active).length ?? 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)' }}>
            <UserCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Usuarios
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {activeUsers} activos
              {inactiveUsers > 0 && (
                <span className="ml-2" style={{ color: '#bbb' }}>· {inactiveUsers} inactivos</span>
              )}
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #468189, #031926)', color: '#fff' }}>
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: '#031926' }}>
              {['Usuario', 'Rol', 'Región', 'Teléfono', 'Estado', ''].map(h => (
                <TableHead key={h} style={{ color: '#F4E9CD', fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12" style={{ color: '#9DBEBB' }}>
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12" style={{ color: '#9DBEBB' }}>
                  <UserCog className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              users?.map((user, i) => (
                <TableRow
                  key={user.id}
                  style={{ background: i % 2 === 0 ? '#fff' : '#f9fbfb', opacity: user.active ? 1 : 0.5 }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.full_name} />
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#031926' }}>{user.full_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: '#777' }}>
                    {user.region ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: '#777' }}>
                    {user.phone ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge style={{
                      background: user.active ? '#27ae60' : '#bbb',
                      color: '#fff',
                      border: 'none',
                      fontSize: 11
                    }}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingUser(user)}
                      style={{ color: '#468189' }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Referencia de roles */}
      <div className="mt-6 rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: '#031926' }}>Permisos por Rol</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => (
            <div
              key={role}
              className="p-3 rounded-lg"
              style={{ background: '#f8fafa', borderLeft: `3px solid ${config.color}` }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: config.color }}>{config.label}</p>
              <p className="text-xs" style={{ color: '#888', lineHeight: 1.4 }}>
                {role === 'admin' && 'Acceso total al sistema'}
                {role === 'supervisor' && 'Ver reportes y gestionar'}
                {role === 'vendedor' && 'Crear pedidos y ver catálogo'}
                {role === 'almacen' && 'Preparar y despachar pedidos'}
                {role === 'facturacion' && 'Facturar pedidos preparados'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Crear */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Nuevo Usuario
            </DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            loading={createUser.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Editar Usuario
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm
              user={editingUser}
              onSubmit={handleUpdate}
              onCancel={() => setEditingUser(null)}
              loading={updateUser.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}