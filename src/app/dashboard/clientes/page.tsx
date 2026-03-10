'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/lib/hooks/use-clients'
import { ClientForm } from '@/components/clients/client-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Plus, Search, Pencil, Users, Trash2, Eye } from 'lucide-react'
import { Client } from '@/types'
import { toast } from 'sonner'
import { usePermissions } from '@/lib/hooks/use-current-user'
import Link from 'next/link'

function CreditBar({ balance, limit }: { balance: number; limit: number }) {
  const pct = limit > 0 ? Math.min((balance / limit) * 100, 100) : 0
  const color = pct >= 100 ? '#d94f4f' : pct >= 80 ? '#e67e22' : '#27ae60'

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#9DBEBB' }}>Crédito usado</span>
        <span style={{ color, fontWeight: 700 }}>
          L. {Number(balance).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: '#e8efee' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
        Límite: L. {Number(limit).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

function ClientCard({ client, onEdit, onDelete, canManage }: {
  client: Client
  onEdit: () => void
  onDelete: () => void
  canManage: boolean
}) {
  const overCredit = client.current_balance >= client.credit_limit && client.credit_limit > 0
  const statusColors = {
    active: { bg: '#27ae60', label: 'Activo' },
    blocked: { bg: '#d94f4f', label: 'Bloqueado' },
    inactive: { bg: '#bbb', label: 'Inactivo' },
  }
  const status = statusColors[client.status]

  return (
    <div
      className="rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{
        background: '#fff',
        border: `1px solid ${overCredit ? 'rgba(217,79,79,0.3)' : 'rgba(68,129,137,0.12)'}`,
        borderLeft: `4px solid ${overCredit ? '#d94f4f' : '#468189'}`,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-bold text-sm truncate" style={{ color: '#031926' }}>{client.name}</p>
          {client.rtn && (
            <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>RTN: {client.rtn}</p>
          )}
        </div>
        <Badge style={{ background: '#F4E9CD', color: '#031926', border: 'none', flexShrink: 0 }}>
          Lista {client.price_list}
        </Badge>
      </div>

      {/* Contacto */}
      <div className="space-y-1 mb-4">
        {client.contact_name && (
          <p className="text-xs" style={{ color: '#5a7a7e' }}>👤 {client.contact_name}</p>
        )}
        {client.phone && (
          <p className="text-xs" style={{ color: '#5a7a7e' }}>📞 {client.phone}</p>
        )}
        {client.city && (
          <p className="text-xs" style={{ color: '#5a7a7e' }}>
            📍 {client.city}{client.department ? `, ${client.department}` : ''}
          </p>
        )}
        <p className="text-xs" style={{ color: '#5a7a7e' }}>💳 {client.payment_terms}</p>
      </div>

      {/* Crédito */}
      {client.credit_limit > 0 && (
        <div className="mb-4">
          <CreditBar balance={client.current_balance} limit={client.credit_limit} />
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-3"
        style={{ borderTop: '1px solid #f0f0f0' }}>
        <Badge style={{ background: status.bg, color: '#fff', border: 'none', fontSize: 11 }}>
          {status.label}
        </Badge>
        <div className="flex items-center gap-1">
          <Link href={`/dashboard/clientes/${client.id}`}>
            <Button size="sm" variant="ghost" className="h-7 px-2"
              style={{ color: '#468189' }}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </Link>
          {canManage && (
            <>
              <Button size="sm" variant="ghost" onClick={onEdit}
                className="h-7 px-2" style={{ color: '#468189' }}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}
                className="h-7 px-2" style={{ color: '#d94f4f' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientesPage() {
  const { data: clients, isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const { actions } = usePermissions()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = clients?.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.rtn ?? '').includes(search) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_name ?? '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter

    return matchesSearch && matchesStatus
  }) ?? []

  const handleCreate = async (data: any) => {
    try {
      await createClient.mutateAsync({ ...data, current_balance: 0 })
      toast.success('Cliente creado correctamente')
      setShowForm(false)
    } catch (e: any) {
      toast.error(e.message?.includes('rtn') ? 'Ya existe un cliente con ese RTN' : 'Error al crear el cliente')
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingClient) return
    try {
      await updateClient.mutateAsync({ id: editingClient.id, ...data })
      toast.success('Cliente actualizado')
      setEditingClient(null)
    } catch (e: any) {
      console.log('Error completo:', e)
      console.log('Error message:', e?.message)
      console.log('Error details:', JSON.stringify(e, null, 2))
      toast.error('Error al actualizar el cliente')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro que deseas eliminar este cliente?')) return
    try {
      await deleteClient.mutateAsync(id)
      toast.success('Cliente eliminado')
    } catch (e: any) {
      if (e.message?.includes('orden')) {
        toast.error('No se puede eliminar — tiene órdenes asociadas. Desactívalo en su lugar.')
      } else {
        toast.error('Error al eliminar el cliente')
      }
    }
  }

  const totalBlocked = clients?.filter(c =>
    c.current_balance >= c.credit_limit && c.credit_limit > 0
  ).length ?? 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)' }}>
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold"
              style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Clientes
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {clients?.length ?? 0} clientes registrados
              {totalBlocked > 0 && (
                <span className="ml-2 font-semibold" style={{ color: '#d94f4f' }}>
                  · {totalBlocked} con crédito excedido
                </span>
              )}
            </p>
          </div>
        </div>
        {actions.canManageClients && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)', color: '#fff' }}>
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: '#9DBEBB' }} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, RTN, ciudad o contacto..."
          className="pl-10 h-11"
          style={{ borderColor: '#d0e0de' }}
        />
      </div>

      {/* Filtro estado */}
      <div className="flex gap-2 mb-8">
        {[
          { value: 'all', label: 'Todos', count: clients?.length ?? 0 },
          { value: 'active', label: 'Activos', count: clients?.filter(c => c.status === 'active').length ?? 0 },
          { value: 'blocked', label: 'Bloqueados', count: clients?.filter(c => c.status === 'blocked').length ?? 0 },
          { value: 'inactive', label: 'Inactivos', count: clients?.filter(c => c.status === 'inactive').length ?? 0 },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: statusFilter === tab.value ? '#468189' : '#fff',
              color: statusFilter === tab.value ? '#F4E9CD' : '#777',
              border: `1px solid ${statusFilter === tab.value ? '#468189' : '#ddd'}`,
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: statusFilter === tab.value ? 'rgba(244,233,205,0.3)' : '#f0f0f0',
                  color: statusFilter === tab.value ? '#F4E9CD' : '#888',
                }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl animate-pulse"
              style={{ background: '#e8efee' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#9DBEBB' }}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No se encontraron clientes</p>
          <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => setEditingClient(client)}
              onDelete={() => handleDelete(client.id)}
              canManage={actions.canManageClients}
            />
          ))}
        </div>
      )}

      {/* Modal Crear */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                Nuevo Cliente
              </DialogTitle>
            </DialogHeader>
            <ClientForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              loading={createClient.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Editar */}
      {editingClient && (
        <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                Editar Cliente
              </DialogTitle>
            </DialogHeader>
            <ClientForm
              client={editingClient}
              onSubmit={handleUpdate}
              onCancel={() => setEditingClient(null)}
              loading={updateClient.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}