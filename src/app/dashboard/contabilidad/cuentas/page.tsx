'use client'

import { useState } from 'react'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/lib/hooks/use-accounts'
import { Account, AccountType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, BookOpen, Search } from 'lucide-react'
import { toast } from 'sonner'

const TYPE_CONFIG: Record<AccountType, { label: string; color: string }> = {
  activo:   { label: 'Activo',   color: '#27ae60' },
  pasivo:   { label: 'Pasivo',   color: '#e67e22' },
  capital:  { label: 'Capital',  color: '#9b59b6' },
  ingreso:  { label: 'Ingreso',  color: '#2980b9' },
  gasto:    { label: 'Gasto',    color: '#d94f4f' },
  costo:    { label: 'Costo',    color: '#e74c3c' },
}

const ACCOUNT_TYPES: AccountType[] = ['activo','pasivo','capital','ingreso','gasto','costo']

const BLANK = { code: '', name: '', type: 'activo' as AccountType, parent_id: null as string | null, is_detail: true }

export default function CuentasPage() {
  const { data: accounts, isLoading } = useAccounts()
  const create  = useCreateAccount()
  const update  = useUpdateAccount()
  const remove  = useDeleteAccount()

  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Account | null>(null)
  const [search, setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all')
  const [form, setForm]         = useState(BLANK)

  const filtered = (accounts ?? []).filter(a => {
    const matchSearch = search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || a.type === typeFilter
    return matchSearch && matchType
  })

  const openNew = () => { setEditing(null); setForm(BLANK); setOpen(true) }
  const openEdit = (a: Account) => {
    setEditing(a)
    setForm({ code: a.code, name: a.name, type: a.type, parent_id: a.parent_id, is_detail: a.is_detail })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) { toast.error('Código y nombre son requeridos'); return }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...form })
        toast.success('Cuenta actualizada')
      } else {
        await create.mutateAsync(form)
        toast.success('Cuenta creada')
      }
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? 'Error al guardar cuenta')
    }
  }

  const handleDelete = async (a: Account) => {
    if (!confirm(`¿Desactivar cuenta "${a.name}"?`)) return
    try {
      await remove.mutateAsync(a.id)
      toast.success('Cuenta desactivada')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const groupedByType = ACCOUNT_TYPES.map(type => ({
    type,
    cfg: TYPE_CONFIG[type],
    items: filtered.filter(a => a.type === type),
  })).filter(g => g.items.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Plan de Cuentas
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>
            {accounts?.length ?? 0} cuentas activas
          </p>
        </div>
        <Button onClick={openNew}
          className="flex items-center gap-2"
          style={{ background: '#468189', color: '#F4E9CD' }}>
          <Plus className="w-4 h-4" /> Nueva Cuenta
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9DBEBB' }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre..." className="pl-10 h-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', ...ACCOUNT_TYPES] as (AccountType | 'all')[]).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: typeFilter === t ? (t === 'all' ? '#468189' : TYPE_CONFIG[t]?.color) : '#fff',
                color: typeFilter === t ? '#fff' : '#777',
                border: `1px solid ${typeFilter === t ? (t === 'all' ? '#468189' : TYPE_CONFIG[t]?.color) : '#ddd'}`,
              }}>
              {t === 'all' ? 'Todas' : TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla agrupada por tipo */}
      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} />
        </div>
      ) : !filtered.length ? (
        <div className="rounded-xl p-12 text-center" style={{ border: '1px solid #eee', color: '#9DBEBB' }}>
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin cuentas</p>
          <p className="text-sm mt-1">Crea tu primera cuenta o activa el plan de cuentas estándar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groupedByType.map(({ type, cfg, items }) => (
            <div key={type} className="rounded-xl overflow-hidden shadow-sm"
              style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
              <div className="px-5 py-3 flex items-center gap-3" style={{ background: '#031926' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
                <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                  {cfg.label}
                  <span className="ml-2 font-normal opacity-50">({items.length})</span>
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                    {['Código', 'Nombre', 'Tipo', 'Nivel', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left"
                        style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((a, i) => (
                    <tr key={a.id}
                      style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <td className="px-4 py-2.5 text-xs font-mono font-bold" style={{ color: '#468189' }}>
                        {a.code}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium" style={{ color: '#031926' }}>
                        {a.name}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: cfg.color + '18', color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: a.is_detail ? '#46818918' : '#77777718',
                            color: a.is_detail ? '#468189' : '#777',
                          }}>
                          {a.is_detail ? 'Detalle' : 'Grupo'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(a)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <Pencil className="w-3.5 h-3.5" style={{ color: '#468189' }} />
                          </button>
                          <button onClick={() => handleDelete(a)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#d94f4f' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="ej. 1101" className="mt-1" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as AccountType }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ej. Caja General" className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_detail" checked={form.is_detail}
                onChange={e => setForm(f => ({ ...f, is_detail: e.target.checked }))} />
              <label htmlFor="is_detail" className="text-sm font-medium" style={{ color: '#031926' }}>
                Cuenta de detalle (acepta movimientos)
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={create.isPending || update.isPending}
                style={{ background: '#468189', color: '#F4E9CD' }}>
                {(create.isPending || update.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
