'use client'

import { useState } from 'react'
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@/lib/hooks/use-warehouses'
import { Warehouse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Plus, Pencil, Trash2, Loader2, Warehouse as WarehouseIcon,
  MapPin, Star, StarOff, CheckCircle2, XCircle
} from 'lucide-react'
import { toast } from 'sonner'

// ── Formulario de bodega ──────────────────────────────────────────────────────
interface WarehouseFormData {
  name: string
  code: string
  location: string
  is_default: boolean
}

function WarehouseFormModal({
  warehouse,
  onClose,
  onSaved,
}: {
  warehouse: Warehouse | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEditing = !!warehouse
  const create = useCreateWarehouse()
  const update = useUpdateWarehouse()

  const [form, setForm] = useState<WarehouseFormData>({
    name:       warehouse?.name       ?? '',
    code:       warehouse?.code       ?? '',
    location:   warehouse?.location   ?? '',
    is_default: warehouse?.is_default ?? false,
  })

  const set = (k: keyof WarehouseFormData, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const isPending = create.isPending || update.isPending

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Nombre y código son requeridos')
      return
    }
    try {
      if (isEditing) {
        await update.mutateAsync({
          id:         warehouse.id,
          name:       form.name.trim(),
          code:       form.code.trim(),
          location:   form.location.trim() || null,
          is_default: form.is_default,
        })
        toast.success('Bodega actualizada')
      } else {
        await create.mutateAsync({
          name:       form.name.trim(),
          code:       form.code.trim(),
          location:   form.location.trim() || undefined,
          is_default: form.is_default,
        })
        toast.success('Bodega creada')
      }
      onSaved()
    } catch (e: any) {
      toast.error(
        e.message?.includes('unique') || e.message?.includes('duplicate')
          ? 'Ya existe una bodega con ese código'
          : 'Error al guardar la bodega'
      )
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            {isEditing ? 'Editar Bodega' : 'Nueva Bodega'}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Nombre <span style={{ color: '#d94f4f' }}>*</span>
            </Label>
            <Input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Bodega Central"
              className="mt-1.5 h-10"
            />
          </div>

          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Código <span style={{ color: '#d94f4f' }}>*</span>
            </Label>
            <Input
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              placeholder="BOD-01"
              className="mt-1.5 h-10 font-mono"
            />
          </div>

          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
              Ubicación <span style={{ color: '#9DBEBB' }}>(opcional)</span>
            </Label>
            <Input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Zona Industrial, Bloque 3"
              className="mt-1.5 h-10"
            />
          </div>

          <button
            type="button"
            onClick={() => set('is_default', !form.is_default)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: form.is_default ? 'rgba(68,129,137,0.1)' : '#f8fafa',
              border: `1px solid ${form.is_default ? '#468189' : '#e0eded'}`,
              color: form.is_default ? '#468189' : '#777',
            }}
          >
            {form.is_default
              ? <Star className="w-4 h-4 flex-shrink-0" />
              : <StarOff className="w-4 h-4 flex-shrink-0" />
            }
            {form.is_default ? 'Bodega predeterminada' : 'Marcar como predeterminada'}
          </button>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              style={{ background: '#468189', color: '#F4E9CD' }}
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
                : isEditing ? 'Guardar cambios' : 'Crear bodega'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function BodegasPage() {
  const { data: warehouses, isLoading } = useWarehouses()
  const deleteWarehouse = useDeleteWarehouse()

  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState<Warehouse | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const handleOpenCreate = () => { setEditing(null); setShowForm(true) }
  const handleOpenEdit   = (w: Warehouse) => { setEditing(w); setShowForm(true) }
  const handleClose      = () => { setShowForm(false); setEditing(null) }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteWarehouse.mutateAsync(id)
      toast.success('Bodega desactivada')
    } catch {
      toast.error('Error al desactivar la bodega')
    }
    setDeletingId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold"
            style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Bodegas
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>
            Gestión de ubicaciones de almacenamiento
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          style={{ background: '#468189', color: '#F4E9CD' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Bodega
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden shadow-sm"
        style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
        <div className="px-5 py-4" style={{ background: '#031926' }}>
          <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
            Bodegas Activas
            <span className="ml-2 opacity-60 font-normal">
              ({warehouses?.length ?? 0} registradas)
            </span>
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} />
          </div>
        ) : !warehouses?.length ? (
          <div className="p-16 text-center" style={{ color: '#9DBEBB' }}>
            <WarehouseIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay bodegas registradas</p>
            <p className="text-sm mt-1">Crea tu primera bodega para comenzar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                  {['Bodega', 'Código', 'Ubicación', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left"
                      style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w, i) => (
                  <tr key={w.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>

                    {/* Nombre */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(68,129,137,0.1)' }}>
                          <WarehouseIcon className="w-4 h-4" style={{ color: '#468189' }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#031926' }}>
                            {w.name}
                          </p>
                          {w.is_default && (
                            <span className="text-xs font-bold flex items-center gap-0.5"
                              style={{ color: '#e67e22' }}>
                              <Star className="w-3 h-3" /> Predeterminada
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Código */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded"
                        style={{ background: 'rgba(68,129,137,0.08)', color: '#468189' }}>
                        {w.code}
                      </span>
                    </td>

                    {/* Ubicación */}
                    <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                      {w.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9DBEBB' }} />
                          {w.location}
                        </span>
                      ) : (
                        <span style={{ color: '#ccc' }}>—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold"
                        style={{ color: w.active ? '#27ae60' : '#d94f4f' }}>
                        {w.active
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : <XCircle className="w-3.5 h-3.5" />
                        }
                        {w.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost"
                          onClick={() => handleOpenEdit(w)}
                          style={{ color: '#468189' }}
                          title="Editar bodega">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleDelete(w.id)}
                          disabled={deletingId === w.id || w.is_default}
                          style={{ color: '#d94f4f' }}
                          title={w.is_default ? 'No puedes desactivar la bodega predeterminada' : 'Desactivar bodega'}>
                          {deletingId === w.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <WarehouseFormModal
          warehouse={editing}
          onClose={handleClose}
          onSaved={handleClose}
        />
      )}
    </div>
  )
}
