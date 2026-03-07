'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Power, PowerOff, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmpresaForm } from '@/components/superadmin/empresa-form'

const supabase = createClient()

const PLAN_COLORS: Record<string, string> = {
  basico:        '#9DBEBB',
  profesional:   '#468189',
  completo:      '#031926',
  personalizado: '#e67e22',
}

// ── Modal de confirmación de borrado ─────────────────────
function DeleteCompanyModal({
  company,
  onClose,
  onDeleted,
}: {
  company:   any
  onClose:   () => void
  onDeleted: () => void
}) {
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [step,     setStep]     = useState<'warn' | 'confirm'>('warn')

  const handleDelete = async () => {
    if (!password) { toast.error('Ingresa tu contraseña'); return }
    setLoading(true)

    const res = await fetch('/api/superadmin/delete-company', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ company_id: company.id, password }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error)
      setLoading(false)
      return
    }

    toast.success(`Empresa ${company.name} eliminada`)
    onDeleted()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        padding: 32, maxWidth: 440, width: '100%', margin: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {step === 'warn' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#fff0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <AlertTriangle size={28} style={{ color: '#d94f4f' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#031926', margin: '0 0 8px' }}>
                ¿Eliminar empresa?
              </h2>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                Estás a punto de eliminar <strong>{company.name}</strong> y{' '}
                <strong>todos sus registros</strong> incluyendo productos, clientes,
                órdenes, facturas, movimientos y usuarios.
              </p>
            </div>

            <div style={{
              background: '#fff8f8', border: '1px solid #d94f4f30',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              fontSize: 12, color: '#d94f4f', lineHeight: 1.6,
            }}>
              ⚠ Esta acción es <strong>irreversible</strong>. No podrás recuperar ningún dato.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                style={{ flex: 1, background: '#d94f4f', color: '#fff', border: 'none' }}>
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#031926', margin: '0 0 8px' }}>
              Confirmar eliminación
            </h2>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
              Ingresa tu contraseña de superadmin para confirmar la eliminación de{' '}
              <strong>{company.name}</strong>.
            </p>

            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña de superadmin..."
              style={{ marginBottom: 16 }}
              onKeyDown={e => e.key === 'Enter' && handleDelete()}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={() => setStep('warn')} style={{ flex: 1 }}>
                Volver
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading || !password}
                style={{ flex: 1, background: '#d94f4f', color: '#fff', border: 'none' }}>
                {loading ? 'Eliminando...' : 'Eliminar todo'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────
export function EmpresasClient({ companies }: { companies: any[] }) {
  const router = useRouter()
  const [showForm,        setShowForm]        = useState(false)
  const [editingCompany,  setEditingCompany]  = useState<any | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<any | null>(null)
  const [loading,         setLoading]         = useState<string | null>(null)

  const handleToggleActive = async (company: any) => {
    setLoading(company.id)
    const res = await fetch('/api/superadmin/toggle-company', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ company_id: company.id, active: !company.active }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error('Error al actualizar: ' + data.error)
    } else {
      toast.success(company.active ? `${company.name} desactivada` : `${company.name} activada`)
      router.refresh()
    }
    setLoading(null)
  }

  const handleSave = async (data: any) => {
    if (editingCompany) {
      const res = await fetch('/api/superadmin/update-company', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          company_id:      editingCompany.id,
          name:            data.name,
          slug:            data.slug,
          plan:            data.plan,
          modules:         data.modules,
          email:           data.email,
          phone:           data.phone,
          address:         data.address,
          notes:           data.notes,
          payment_day:     data.payment_day,
          next_payment_at: data.next_payment_at || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error('Error al actualizar: ' + result.error); return }
      toast.success('Empresa actualizada')
      setShowForm(false)
      setEditingCompany(null)
      router.refresh()
    } else {
      const { error } = await supabase.from('companies').insert({
        name:            data.name,
        slug:            data.slug,
        plan:            data.plan,
        modules:         data.modules,
        email:           data.email,
        phone:           data.phone,
        address:         data.address,
        notes:           data.notes,
        payment_day:     data.payment_day,
        next_payment_at: data.next_payment_at || null,
        active:          true,
      })
      if (error) {
        toast.error(error.message.includes('slug')
          ? 'Ya existe una empresa con ese slug'
          : 'Error al crear la empresa')
        throw error
      }
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"
            style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Empresas
          </h1>
          <p className="text-sm mt-1" style={{ color: '#468189' }}>
            {companies.length} empresa(s) registrada(s)
          </p>
        </div>
        <Button onClick={() => { setEditingCompany(null); setShowForm(true) }}
          style={{ background: '#468189', color: '#F4E9CD' }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(70,129,137,0.15)' }}>
        <div className="px-5 py-4" style={{ background: '#031926' }}>
          <h3 className="text-sm font-bold" style={{ color: '#F4E9CD' }}>
            Empresas registradas
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
              {['Empresa', 'Plan', 'Módulos activos', 'Próximo pago', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left"
                  style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((c, i) => (
              <tr key={c.id}
                style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>

                <td className="px-4 py-3">
                  <p className="text-sm font-bold" style={{ color: '#031926' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: '#9DBEBB' }}>{c.email}</p>
                  {c.phone && <p className="text-xs" style={{ color: '#9DBEBB' }}>{c.phone}</p>}
                </td>

                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full font-bold capitalize"
                    style={{
                      background: `${PLAN_COLORS[c.plan] ?? '#468189'}18`,
                      color:       PLAN_COLORS[c.plan] ?? '#468189',
                    }}>
                    {c.plan}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.modules?.map((m: string) => (
                      <span key={m} className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: '#f0f5f5', color: '#468189' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                  {c.next_payment_at ? (() => {
                    const days = Math.ceil(
                      (new Date(c.next_payment_at).getTime() - Date.now()) / 86400000
                    )
                    return (
                      <div>
                        <p>{new Date(c.next_payment_at).toLocaleDateString('es-HN')}</p>
                        <p style={{ color: days <= 5 ? '#d94f4f' : days <= 10 ? '#e67e22' : '#27ae60' }}>
                          {days < 0 ? `Vencido hace ${Math.abs(days)}d` : `En ${days} días`}
                        </p>
                      </div>
                    )
                  })() : <span style={{ color: '#ccc' }}>—</span>}
                </td>

                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full font-bold"
                    style={{
                      background: c.active ? '#27ae6015' : '#d94f4f15',
                      color:      c.active ? '#27ae60'   : '#d94f4f',
                    }}>
                    {c.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost"
                      onClick={() => { setEditingCompany(c); setShowForm(true) }}
                      style={{ color: '#468189' }}
                      title="Editar empresa">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleToggleActive(c)}
                      disabled={loading === c.id}
                      style={{ color: c.active ? '#d94f4f' : '#27ae60' }}
                      title={c.active ? 'Desactivar' : 'Activar'}>
                      {c.active
                        ? <PowerOff className="w-3.5 h-3.5" />
                        : <Power    className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => setDeletingCompany(c)}
                      style={{ color: '#d94f4f' }}
                      title="Eliminar empresa">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal editar/crear */}
      {showForm && (
        <EmpresaForm
          company={editingCompany}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingCompany(null); router.refresh() }}
        />
      )}

      {/* Modal eliminar */}
      {deletingCompany && (
        <DeleteCompanyModal
          company={deletingCompany}
          onClose={() => setDeletingCompany(null)}
          onDeleted={() => { setDeletingCompany(null); router.refresh() }}
        />
      )}
    </div>
  )
}