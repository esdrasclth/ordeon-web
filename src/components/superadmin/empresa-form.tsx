'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, CheckCircle2, Building2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

const ALL_MODULES = [
  { key: 'core', label: 'Core' },
  { key: 'ventas', label: 'Ordenes' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'reportes', label: 'Reportes' },
  { key: 'compras', label: 'Compras' },
  { key: 'facturacion', label: 'Facturación' },
  { key: 'logistica', label: 'Logística' },
  { key: 'multi_bodega', label: 'Multi-bodega' },
]

const PLANES = ['basico', 'profesional', 'completo', 'personalizado']

const STEP_LABELS = [
  { icon: <Building2 className="w-4 h-4" />, label: 'Empresa' },
  { icon: <UserPlus className="w-4 h-4" />, label: 'Admin' },
  { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Listo' },
]

export function EmpresaForm({
  company,
  onSave,
  onClose,
}: {
  company: any | null
  onSave: (data: any) => Promise<void>
  onClose: () => void
}) {
  const isEditing = !!company

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(
    isEditing ? company.id : null
  )

  const [modules, setModules] = useState<string[]>(
    company?.modules ?? ['core']
  )
  const [form, setForm] = useState({
    name: company?.name ?? '',
    slug: company?.slug ?? '',
    plan: company?.plan ?? 'basico',
    email: company?.email ?? '',
    phone: company?.phone ?? '',
    address: company?.address ?? '',
    notes: company?.notes ?? '',
    payment_day: company?.payment_day ?? 1,
    next_payment_at: company?.next_payment_at
      ? new Date(company.next_payment_at).toISOString().split('T')[0]
      : '',
  })

  const [adminForm, setAdminForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setAdmin = (k: string, v: any) => setAdminForm(f => ({ ...f, [k]: v }))

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const toggleModule = (key: string) => {
    if (key === 'core') return
    setModules(m => m.includes(key) ? m.filter(x => x !== key) : [...m, key])
  }

  // ── Paso 1: Guardar empresa ──────────────────────────────────
  const handleSaveEmpresa = async () => {
    if (!form.name || !form.slug) {
      toast.error('Nombre y slug son requeridos')
      return
    }
    setLoading(true)
    try {
      await onSave({ ...form, modules })
      if (!isEditing) {
        // Obtener el id de la empresa recién creada
        const { data } = await supabase
          .from('companies')
          .select('id')
          .eq('slug', form.slug)
          .single()
        setCreatedCompanyId(data?.id ?? null)
        setStep(2)
      } else {
        onClose()
      }
    } catch {
      toast.error('Error al guardar la empresa')
    }
    setLoading(false)
  }

  // ── Paso 2: Crear usuario admin ──────────────────────────────
  const handleCreateAdmin = async () => {
    if (!adminForm.full_name || !adminForm.email || !adminForm.password) {
      toast.error('Nombre, correo y contraseña son requeridos')
      return
    }
    if (adminForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (!createdCompanyId) {
      toast.error('No se encontró el ID de la empresa')
      return
    }

    setLoading(true)

    const res = await fetch('/api/superadmin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminForm.email,
        password: adminForm.password,
        full_name: adminForm.full_name,
        company_id: createdCompanyId,
        phone: adminForm.phone || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error?.includes('already')
        ? 'Ya existe un usuario con ese correo'
        : data.error ?? 'Error al crear usuario'
      )
      setLoading(false)
      return
    }

    toast.success('Usuario admin creado exitosamente')
    setStep(3)
    setLoading(false)
  }

  const handleSkipAdmin = () => setStep(3)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(3,25,38,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fff' }}>

        {/* Header */}
        <div className="px-6 py-4" style={{ background: '#031926' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base"
              style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif' }}>
              {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
            </h2>
            <button onClick={onClose} style={{ color: '#9DBEBB' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps — solo en modo creación */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              {STEP_LABELS.map((s, idx) => {
                const n = idx + 1
                const active = step === n
                const done = step > n
                return (
                  <div key={n} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: done ? '#27ae60' : active ? '#468189' : 'rgba(255,255,255,0.1)',
                          color: done || active ? '#fff' : 'rgba(255,255,255,0.3)',
                        }}>
                        {done ? '✓' : n}
                      </div>
                      <span className="text-xs font-medium"
                        style={{ color: active ? '#F4E9CD' : 'rgba(244,233,205,0.4)' }}>
                        {s.label}
                      </span>
                    </div>
                    {idx < STEP_LABELS.length - 1 && (
                      <div className="w-8 h-px mx-1"
                        style={{ background: 'rgba(255,255,255,0.1)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── PASO 1: Empresa ─────────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                    Nombre de la empresa *
                  </label>
                  <Input value={form.name}
                    onChange={e => {
                      set('name', e.target.value)
                      if (!isEditing) set('slug', autoSlug(e.target.value))
                    }}
                    placeholder="Distribuidora del Norte" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                    Slug *
                  </label>
                  <Input value={form.slug}
                    onChange={e => set('slug', autoSlug(e.target.value))}
                    placeholder="distribuidora-del-norte"
                    disabled={isEditing} />
                  <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                    Solo letras minúsculas, números y guiones
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Plan</label>
                  <div className="flex gap-2 flex-wrap">
                    {PLANES.map(p => (
                      <button key={p} onClick={() => set('plan', p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
                        style={{
                          background: form.plan === p ? '#468189' : '#f0f5f5',
                          color: form.plan === p ? '#F4E9CD' : '#555',
                        }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: '#555' }}>
                    Módulos activos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_MODULES.map(m => {
                      const active = modules.includes(m.key)
                      const isCore = m.key === 'core'
                      return (
                        <button key={m.key} onClick={() => toggleModule(m.key)}
                          disabled={isCore}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            background: active ? '#468189' : '#f0f5f5',
                            color: active ? '#F4E9CD' : '#777',
                            opacity: isCore ? 0.7 : 1,
                            cursor: isCore ? 'not-allowed' : 'pointer',
                          }}>
                          {m.label}{isCore ? ' (requerido)' : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Email</label>
                    <Input value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="admin@empresa.com" type="email" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Teléfono</label>
                    <Input value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="+504 0000-0000" />
                  </div>
                </div>

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

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Dirección</label>
                  <Input value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Ciudad, País" />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                    Notas internas
                  </label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    rows={3} placeholder="Notas sobre el cliente, acuerdos especiales, etc."
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ border: '1px solid #d0e0de', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #eee' }}>
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button onClick={handleSaveEmpresa} disabled={loading}
                style={{ background: '#468189', color: '#F4E9CD' }}>
                {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Continuar →'}
              </Button>
            </div>
          </>
        )}

        {/* ── PASO 2: Usuario Admin ────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="p-6">
              <div className="rounded-xl p-4 mb-6"
                style={{ background: '#f0f9f4', border: '1px solid rgba(39,174,96,0.2)' }}>
                <p className="text-sm font-semibold" style={{ color: '#27ae60' }}>
                  ✅ Empresa <strong>{form.name}</strong> creada exitosamente
                </p>
                <p className="text-xs mt-1" style={{ color: '#555' }}>
                  Ahora crea el usuario administrador para esta empresa.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                    Nombre completo *
                  </label>
                  <Input value={adminForm.full_name}
                    onChange={e => setAdmin('full_name', e.target.value)}
                    placeholder="Juan Pérez" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                      Correo *
                    </label>
                    <Input value={adminForm.email}
                      onChange={e => setAdmin('email', e.target.value)}
                      placeholder="admin@empresa.com" type="email" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                      Teléfono
                    </label>
                    <Input value={adminForm.phone}
                      onChange={e => setAdmin('phone', e.target.value)}
                      placeholder="+504 0000-0000" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                    Contraseña temporal *
                  </label>
                  <Input value={adminForm.password}
                    onChange={e => setAdmin('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres" type="password" />
                  <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                    El usuario deberá cambiarla en su primer inicio de sesión.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-3 px-6 py-4" style={{ borderTop: '1px solid #eee' }}>
              <Button variant="outline" onClick={handleSkipAdmin} disabled={loading}>
                Omitir por ahora
              </Button>
              <Button onClick={handleCreateAdmin} disabled={loading}
                style={{ background: '#468189', color: '#F4E9CD' }}>
                {loading ? 'Creando...' : 'Crear usuario admin →'}
              </Button>
            </div>
          </>
        )}

        {/* ── PASO 3: Listo ────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#27ae6015' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: '#27ae60' }} />
            </div>
            <h3 className="text-xl font-bold mb-2"
              style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              ¡Todo listo!
            </h3>
            <p className="text-sm mb-2" style={{ color: '#555' }}>
              La empresa <strong>{form.name}</strong> ha sido configurada.
            </p>
            {adminForm.email && (
              <div className="rounded-lg p-3 mt-4 text-left"
                style={{ background: '#f8fafa', border: '1px solid #eee' }}>
                <p className="text-xs font-bold mb-2" style={{ color: '#555' }}>
                  Credenciales del admin:
                </p>
                <p className="text-xs" style={{ color: '#468189' }}>
                  📧 {adminForm.email}
                </p>
                <p className="text-xs" style={{ color: '#468189' }}>
                  🔑 {adminForm.password}
                </p>
                <p className="text-xs mt-2" style={{ color: '#9DBEBB' }}>
                  Comparte estas credenciales con el administrador de la empresa.
                </p>
              </div>
            )}
            <Button onClick={onClose} className="mt-6"
              style={{ background: '#468189', color: '#F4E9CD' }}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}