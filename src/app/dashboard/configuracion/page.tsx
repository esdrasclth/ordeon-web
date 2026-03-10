'use client'

import { useState } from 'react'
import { useSettings, useUpdateSetting, useListValues, useCreateListValue, useToggleListValue, useDeleteListValue } from '@/lib/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Loader2, Plus, ToggleLeft, ToggleRight, Building2, DollarSign, Truck, CreditCard, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatHNPhone } from '@/components/shared/phone-input'

// ── Componente: sección de empresa / fiscal ─────────────────────────
function EmpresaTab() {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    company_name: '',
    company_rtn: '',
    company_phone: '',
    company_email: '',
    company_address: '',
    isv_rate: '',
    max_discount_vendor: '',
    max_discount_supervisor: '',
  })

  const [initialized, setInitialized] = useState(false)

  // Inicializar el form una sola vez cuando llegan los settings
  if (settings && !initialized) {
    setForm({
      company_name: settings.company_name ?? '',
      company_rtn: settings.company_rtn ?? '',
      company_phone: settings.company_phone ?? '',
      company_email: settings.company_email ?? '',
      company_address: settings.company_address ?? '',
      isv_rate: settings.isv_rate ?? '',
      max_discount_vendor: settings.max_discount_vendor ?? '',
      max_discount_supervisor: settings.max_discount_supervisor ?? '',
    })
    setInitialized(true)
  }

  const handleSave = async () => {
    try {
      await Promise.all(
        Object.entries(form).map(([key, value]) =>
          updateSetting.mutateAsync({ key, value })
        )
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar')
    }
  }

  if (isLoading) return <div className="py-8 text-center" style={{ color: '#9DBEBB' }}>Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Datos de empresa */}
      <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4" style={{ color: '#468189' }} />
          <h3 className="font-bold text-sm" style={{ color: '#031926' }}>Datos de la Empresa</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Nombre de la empresa</Label>
            <Input
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              placeholder="Mi Empresa S.A."
              className="mt-1 h-10"
            />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>RTN</Label>
            <Input
              value={form.company_rtn}
              onChange={e => setForm(f => ({ ...f, company_rtn: e.target.value }))}
              placeholder="08019999000000"
              className="mt-1 h-10"
            />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Teléfono</Label>
            <Input
              value={form.company_phone}
              onChange={e => setForm(f => ({ ...f, company_phone: formatHNPhone(e.target.value) }))}
              placeholder="+504 0000-0000"
              maxLength={14}
              className="mt-1 h-10"
            />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Correo</Label>
            <Input
              value={form.company_email}
              onChange={e => setForm(f => ({ ...f, company_email: e.target.value }))}
              placeholder="info@empresa.com"
              className="mt-1 h-10"
            />
          </div>
        </div>
        <div className="mt-4">
          <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Dirección fiscal</Label>
          <Input
            value={form.company_address}
            onChange={e => setForm(f => ({ ...f, company_address: e.target.value }))}
            placeholder="Col. Trejo, Tegucigalpa"
            className="mt-1 h-10"
          />
        </div>
      </div>

      {/* Parámetros fiscales */}
      <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4" style={{ color: '#468189' }} />
          <h3 className="font-bold text-sm" style={{ color: '#031926' }}>Parámetros Fiscales</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>ISV (%)</Label>
            <Input
              type="number"
              value={form.isv_rate}
              onChange={e => setForm(f => ({ ...f, isv_rate: e.target.value }))}
              placeholder="15"
              className="mt-1 h-10"
            />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Descuento máx. vendedor (%)</Label>
            <Input
              type="number"
              value={form.max_discount_vendor}
              onChange={e => setForm(f => ({ ...f, max_discount_vendor: e.target.value }))}
              placeholder="10"
              className="mt-1 h-10"
            />
          </div>
          <div>
            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>Descuento máx. supervisor (%)</Label>
            <Input
              type="number"
              value={form.max_discount_supervisor}
              onChange={e => setForm(f => ({ ...f, max_discount_supervisor: e.target.value }))}
              placeholder="20"
              className="mt-1 h-10"
            />
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end items-center gap-3">
        {saved && (
          <span className="text-sm font-semibold" style={{ color: '#27ae60' }}>
            ✅ Guardado correctamente
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={updateSetting.isPending}
          style={{ background: '#468189', color: '#F4E9CD' }}
        >
          {updateSetting.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}

// ── Componente: lista de valores (pagos / entregas) ─────────────────
function ListValuesTab({ listType, icon, title, placeholder }: {
  listType: string
  icon: React.ReactNode
  title: string
  placeholder: string
}) {
  const { data: items, isLoading } = useListValues(listType)
  const createItem = useCreateListValue()
  const toggleItem = useToggleListValue()
  const deleteItem = useDeleteListValue()
  const [showModal, setShowModal] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newLabel.trim()) return
    try {
      await createItem.mutateAsync({
        list_type: listType,
        label: newLabel.trim(),
        value: newLabel.trim().toLowerCase().replace(/\s+/g, '_'),
        sort_order: (items?.length ?? 0) + 1,
      })
      toast.success('Agregado correctamente')
      setNewLabel('')
      setShowModal(false)
    } catch {
      toast.error('Error al agregar')
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleItem.mutateAsync({ id, active: !currentActive, list_type: listType })
      toast.success(!currentActive ? 'Activado' : 'Desactivado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync({ id, list_type: listType })
      toast.success('Eliminado correctamente')
      setDeletingId(null)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="rounded-xl p-5 shadow-sm"
      style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-sm" style={{ color: '#031926' }}>{title}</h3>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}
          style={{ background: '#468189', color: '#F4E9CD' }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
        </Button>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-sm" style={{ color: '#9DBEBB' }}>Cargando...</div>
      ) : items?.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: '#9DBEBB' }}>
          No hay elementos. Agrega el primero.
        </p>
      ) : (
        <div className="space-y-2">
          {items?.map(item => (
            <div key={item.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{ background: item.active ? '#f8fafa' : '#f5f5f5', border: '1px solid #eee' }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium"
                  style={{ color: item.active ? '#031926' : '#aaa' }}>
                  {item.label}
                </span>
                <span className="text-xs font-mono" style={{ color: '#9DBEBB' }}>
                  {item.value}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge style={{
                  background: item.active ? '#27ae60' : '#bbb',
                  color: '#fff', border: 'none', fontSize: 10,
                }}>
                  {item.active ? 'Activo' : 'Inactivo'}
                </Badge>
                <button onClick={() => handleToggle(item.id, item.active)}
                  style={{ color: item.active ? '#468189' : '#bbb' }}>
                  {item.active
                    ? <ToggleRight className="w-5 h-5" />
                    : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setDeletingId(item.id)}
                  style={{ color: '#d94f4f' }}
                  title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Agregar {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                Nombre <span style={{ color: '#468189' }}>*</span>
              </Label>
              <Input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder={placeholder}
                className="mt-1 h-10"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button
                onClick={handleCreate}
                disabled={!newLabel.trim() || createItem.isPending}
                style={{ background: '#468189', color: '#F4E9CD' }}>
                {createItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar eliminar */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              ¿Eliminar elemento?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: '#555' }}>
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
            <Button
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={deleteItem.isPending}
              style={{ background: '#d94f4f', color: '#fff', border: 'none' }}>
              {deleteItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────
export default function ConfiguracionPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #468189, #031926)' }}>
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Configuración
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Parámetros generales del sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="mb-6" style={{ background: '#e8efee' }}>
          <TabsTrigger value="empresa" style={{ fontWeight: 600 }}>🏢 Empresa</TabsTrigger>
          <TabsTrigger value="pagos" style={{ fontWeight: 600 }}>💳 Términos de pago</TabsTrigger>
          <TabsTrigger value="entregas" style={{ fontWeight: 600 }}>🚚 Métodos de entrega</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <EmpresaTab />
        </TabsContent>

        <TabsContent value="pagos">
          <ListValuesTab
            listType="payment_terms"
            icon={<CreditCard className="w-4 h-4" style={{ color: '#468189' }} />}
            title="Términos de Pago"
            placeholder="Crédito 60 días"
          />
        </TabsContent>

        <TabsContent value="entregas">
          <ListValuesTab
            listType="delivery_methods"
            icon={<Truck className="w-4 h-4" style={{ color: '#468189' }} />}
            title="Métodos de Entrega"
            placeholder="Moto mensajero"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}