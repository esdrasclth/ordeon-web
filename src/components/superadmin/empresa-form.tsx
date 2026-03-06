'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

const ALL_MODULES = [
  { key: 'core',          label: 'Core'          },
  { key: 'ventas',        label: 'Ventas'        },
  { key: 'clientes',      label: 'Clientes'      },
  { key: 'reportes',      label: 'Reportes'      },
  { key: 'compras',       label: 'Compras'       },
  { key: 'facturacion',   label: 'Facturación'   },
  { key: 'logistica',     label: 'Logística'     },
  { key: 'multi_bodega',  label: 'Multi-bodega'  },
]

const PLANES = ['basico', 'profesional', 'completo', 'personalizado']

export function EmpresaForm({
  company,
  onSave,
  onClose,
}: {
  company:  any | null
  onSave:   (data: any) => Promise<void>
  onClose:  () => void
}) {
  const [loading,  setLoading]  = useState(false)
  const [modules,  setModules]  = useState<string[]>(company?.modules ?? ['core', 'ventas'])
  const [form,     setForm]     = useState({
    name:            company?.name            ?? '',
    slug:            company?.slug            ?? '',
    plan:            company?.plan            ?? 'basico',
    email:           company?.email           ?? '',
    phone:           company?.phone           ?? '',
    address:         company?.address         ?? '',
    notes:           company?.notes           ?? '',
    payment_day:     company?.payment_day     ?? 1,
    next_payment_at: company?.next_payment_at
      ? new Date(company.next_payment_at).toISOString().split('T')[0]
      : '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const toggleModule = (key: string) => {
    if (key === 'core') return // core siempre activo
    setModules(m =>
      m.includes(key) ? m.filter(x => x !== key) : [...m, key]
    )
  }

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleSubmit = async () => {
    if (!form.name || !form.slug) {
      alert('Nombre y slug son requeridos')
      return
    }
    setLoading(true)
    await onSave({ ...form, modules })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(3,25,38,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fff' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#031926' }}>
          <h2 className="font-bold text-base"
            style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif' }}>
            {company ? 'Editar Empresa' : 'Nueva Empresa'}
          </h2>
          <button onClick={onClose} style={{ color: '#9DBEBB' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Nombre */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                Nombre de la empresa *
              </label>
              <Input value={form.name}
                onChange={e => {
                  set('name', e.target.value)
                  if (!company) set('slug', autoSlug(e.target.value))
                }}
                placeholder="Distribuidora del Norte" />
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                Slug (identificador único) *
              </label>
              <Input value={form.slug}
                onChange={e => set('slug', autoSlug(e.target.value))}
                placeholder="distribuidora-del-norte" />
              <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                Solo letras minúsculas, números y guiones
              </p>
            </div>

            {/* Plan */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Plan</label>
              <div className="flex gap-2 flex-wrap">
                {PLANES.map(p => (
                  <button key={p} onClick={() => set('plan', p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={{
                      background: form.plan === p ? '#468189' : '#f0f5f5',
                      color:      form.plan === p ? '#F4E9CD' : '#555',
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Módulos */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: '#555' }}>
                Módulos activos
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_MODULES.map(m => {
                  const active = modules.includes(m.key)
                  const isCore = m.key === 'core'
                  return (
                    <button key={m.key}
                      onClick={() => toggleModule(m.key)}
                      disabled={isCore}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: active ? '#468189' : '#f0f5f5',
                        color:      active ? '#F4E9CD' : '#777',
                        opacity:    isCore ? 0.7 : 1,
                        cursor:     isCore ? 'not-allowed' : 'pointer',
                      }}>
                      {m.label} {isCore && '(requerido)'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Email y teléfono */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Email</label>
                <Input value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="admin@empresa.com" type="email" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Teléfono</label>
                <Input value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+504 0000-0000" />
              </div>
            </div>

            {/* Próximo pago */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Próximo pago
                </label>
                <Input value={form.next_payment_at}
                  onChange={e => set('next_payment_at', e.target.value)}
                  type="date" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Día de pago mensual
                </label>
                <Input value={form.payment_day}
                  onChange={e => set('payment_day', Number(e.target.value))}
                  type="number" min={1} max={31} />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Dirección</label>
              <Input value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Ciudad, País" />
            </div>

            {/* Notas */}
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                Notas internas
              </label>
              <textarea value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Notas sobre el cliente, acuerdos especiales, etc."
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  border: '1px solid #d0e0de', outline: 'none',
                  fontFamily: 'inherit', resize: 'vertical',
                }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #eee' }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}
            style={{ background: '#468189', color: '#F4E9CD' }}>
            {loading ? 'Guardando...' : company ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </div>
      </div>
    </div>
  )
}