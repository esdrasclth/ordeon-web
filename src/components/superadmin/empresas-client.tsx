'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmpresaForm } from '@/components/superadmin/empresa-form'

const supabase = createClient()

const PLAN_COLORS: Record<string, string> = {
  basico: '#9DBEBB',
  profesional: '#468189',
  completo: '#031926',
  personalizado: '#e67e22',
}

const ALL_MODULES = ['core', 'ventas', 'clientes', 'reportes', 'compras', 'facturacion', 'logistica', 'multi_bodega']

export function EmpresasClient({ companies }: { companies: any[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleActive = async (company: any) => {
    setLoading(company.id)
    const { error } = await supabase
      .from('companies')
      .update({ active: !company.active })
      .eq('id', company.id)

    if (error) {
      toast.error('Error al actualizar el estado')
    } else {
      toast.success(company.active ? `${company.name} desactivada` : `${company.name} activada`)
      router.refresh()
    }
    setLoading(null)
  }

  const handleSave = async (data: any) => {
    if (editingCompany) {
      // Editar — sí cerrar al terminar
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          slug: data.slug,
          plan: data.plan,
          modules: data.modules,
          email: data.email,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          payment_day: data.payment_day,
          next_payment_at: data.next_payment_at || null,
        })
        .eq('id', editingCompany.id)

      if (error) { toast.error('Error al actualizar'); return }
      toast.success('Empresa actualizada')
      setShowForm(false)
      setEditingCompany(null)
      router.refresh()
    } else {
      // Crear — NO cerrar, el form avanza al paso 2
      const { error } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          slug: data.slug,
          plan: data.plan,
          modules: data.modules,
          email: data.email,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          payment_day: data.payment_day,
          next_payment_at: data.next_payment_at || null,
          active: true,
        })

      if (error) {
        if (error.message.includes('slug')) {
          toast.error('Ya existe una empresa con ese slug')
        } else {
          toast.error('Error al crear la empresa')
        }
        throw error // importante: lanzar el error para que el form no avance
      }

      router.refresh()
      // No cerramos — el EmpresaForm avanza al paso 2 solo
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

                {/* Empresa */}
                <td className="px-4 py-3">
                  <p className="text-sm font-bold" style={{ color: '#031926' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: '#9DBEBB' }}>{c.email}</p>
                  {c.phone && <p className="text-xs" style={{ color: '#9DBEBB' }}>{c.phone}</p>}
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full font-bold capitalize"
                    style={{
                      background: `${PLAN_COLORS[c.plan] ?? '#468189'}18`,
                      color: PLAN_COLORS[c.plan] ?? '#468189',
                    }}>
                    {c.plan}
                  </span>
                </td>

                {/* Módulos */}
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

                {/* Próximo pago */}
                <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                  {c.next_payment_at
                    ? (() => {
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
                    })()
                    : <span style={{ color: '#ccc' }}>—</span>
                  }
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full font-bold"
                    style={{
                      background: c.active ? '#27ae6015' : '#d94f4f15',
                      color: c.active ? '#27ae60' : '#d94f4f',
                    }}>
                    {c.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost"
                      onClick={() => { setEditingCompany(c); setShowForm(true) }}
                      style={{ color: '#468189' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleToggleActive(c)}
                      disabled={loading === c.id}
                      style={{ color: c.active ? '#d94f4f' : '#27ae60' }}>
                      {c.active
                        ? <PowerOff className="w-3.5 h-3.5" />
                        : <Power className="w-3.5 h-3.5" />
                      }
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <EmpresaForm
          company={editingCompany}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingCompany(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}