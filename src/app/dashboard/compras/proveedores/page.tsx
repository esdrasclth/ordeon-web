'use client'

import { useState } from 'react'
import {
  Building2, Plus, Pencil, Trash2, Search, Phone, Mail, X, Save
} from 'lucide-react'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/lib/hooks/use-suppliers'
import { Supplier } from '@/types'

type SupplierForm = {
  name: string; code: string; rtn: string; contact_name: string
  phone: string; email: string; address: string; city: string
  department: string; credit_limit: number; payment_terms: string; notes: string
}

const EMPTY_FORM: SupplierForm = {
  name: '', code: '', rtn: '', contact_name: '',
  phone: '', email: '', address: '', city: '',
  department: '', credit_limit: 0, payment_terms: '30 días', notes: '',
}

function SupplierModal({
  supplier, onClose
}: {
  supplier: Supplier | null
  onClose: () => void
}) {
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const [form, setForm] = useState<SupplierForm>(supplier ? {
    name: supplier.name, code: supplier.code ?? '', rtn: supplier.rtn ?? '',
    contact_name: supplier.contact_name ?? '', phone: supplier.phone ?? '',
    email: supplier.email ?? '', address: supplier.address ?? '',
    city: supplier.city ?? '', department: supplier.department ?? '',
    credit_limit: supplier.credit_limit, payment_terms: supplier.payment_terms ?? '30 días',
    notes: supplier.notes ?? '',
  } : { ...EMPTY_FORM })

  const set = (field: keyof SupplierForm, val: string | number) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert('El nombre es requerido'); return }
    try {
      if (supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, ...form })
      } else {
        await createSupplier.mutateAsync(form)
      }
      onClose()
    } catch { alert('Error al guardar proveedor') }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
    background: '#fff', color: '#1e293b',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b',
    marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  const isPending = createSupplier.isPending || updateSupplier.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(3,25,38,0.4)', backdropFilter: 'blur(2px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" style={{ color: '#468189' }} />
            <h2 className="font-bold text-base" style={{ color: '#031926' }}>
              {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: '#94a3b8' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="col-span-2">
            <label style={labelStyle}>Nombre *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Nombre del proveedor" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Código</label>
            <input value={form.code} onChange={e => set('code', e.target.value)}
              placeholder="P-001" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>RTN</label>
            <input value={form.rtn} onChange={e => set('rtn', e.target.value)}
              placeholder="0801-0000-00000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contacto</label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
              placeholder="Nombre del contacto" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Teléfono</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+504 0000-0000" style={inputStyle} />
          </div>
          <div className="col-span-2">
            <label style={labelStyle}>Correo Electrónico</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="proveedor@example.com" style={inputStyle} />
          </div>
          <div className="col-span-2">
            <label style={labelStyle}>Dirección</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Dirección física" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ciudad</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="Tegucigalpa" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Departamento</label>
            <input value={form.department} onChange={e => set('department', e.target.value)}
              placeholder="Francisco Morazán" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Límite de Crédito (L.)</label>
            <input type="number" min={0} value={form.credit_limit}
              onChange={e => set('credit_limit', parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Términos de Pago</label>
            <select value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} style={inputStyle}>
              {['Contado', '15 días', '30 días', '45 días', '60 días', '90 días'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label style={labelStyle}>Notas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Observaciones…"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: '#f1f5f9' }}>
          <button onClick={onClose} disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm" style={{ color: '#64748b', background: '#f1f5f9' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)', color: '#fff' }}>
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProveedoresPage() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const deleteSupplier = useDeleteSupplier()

  const [search,   setSearch]   = useState('')
  const [modalFor, setModalFor] = useState<Supplier | null | 'new'>(null)

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.rtn ?? '').includes(search) ||
    (s.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`¿Desactivar el proveedor "${s.name}"?`)) return
    await deleteSupplier.mutateAsync(s.id)
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b' }}>
      {/* Modal */}
      {modalFor !== null && (
        <SupplierModal
          supplier={modalFor === 'new' ? null : modalFor}
          onClose={() => setModalFor(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #468189, #031926)' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#031926' }}>Proveedores</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} activo{suppliers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button onClick={() => setModalFor('new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #468189, #031926)', color: '#fff' }}>
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, RTN o ciudad…"
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border outline-none"
          style={{ borderColor: '#e2e8f0', background: '#fff', maxWidth: 420 }} />
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Proveedor', 'RTN', 'Contacto', 'Ciudad', 'Crédito', 'Términos', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                  style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: '#94a3b8' }}>Cargando…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: '#94a3b8' }}>
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay proveedores. <button onClick={() => setModalFor('new')} className="underline">Crear el primero</button></p>
              </td></tr>
            )}
            {filtered.map((s, idx) => (
              <tr key={s.id} className="transition-colors hover:bg-slate-50"
                style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : undefined }}>
                <td className="px-4 py-3">
                  <p className="font-semibold" style={{ color: '#1e293b' }}>{s.name}</p>
                  {s.code && <p className="text-xs" style={{ color: '#94a3b8' }}>{s.code}</p>}
                </td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: '#475569' }}>{s.rtn ?? '—'}</td>
                <td className="px-4 py-3">
                  {s.contact_name && <p className="text-sm">{s.contact_name}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    {s.phone && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#94a3b8' }}>
                        <Phone className="w-3 h-3" />{s.phone}
                      </span>
                    )}
                    {s.email && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#94a3b8' }}>
                        <Mail className="w-3 h-3" />{s.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>{s.city ?? '—'}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  L. {(s.credit_limit ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>{s.payment_terms ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModalFor(s)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: '#468189', background: 'transparent' }}
                      title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(s)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: '#94a3b8', background: 'transparent' }}
                      title="Desactivar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
