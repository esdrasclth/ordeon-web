'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

export function CAIConfigForm({
  config,
  companyId,
  onClose,
}: {
  config: any | null
  companyId: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: config?.business_name ?? '',
    commercial_name: config?.commercial_name ?? '',
    rtn: config?.rtn ?? '',
    address: config?.address ?? '',
    phone: config?.phone ?? '',
    email: config?.email ?? '',
    cai: config?.cai ?? '',
    cai_expires_at: config?.cai_expires_at
      ? new Date(config.cai_expires_at).toISOString().split('T')[0]
      : '',
    range_from: config?.range_from ?? '',
    range_to: config?.range_to ?? '',
    isv_rate: config?.isv_rate ?? 15,
    footer_text: config?.footer_text ?? '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.business_name || !form.rtn || !form.cai || !form.cai_expires_at || !form.range_from || !form.range_to) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    setLoading(true)

    const res = await fetch('/api/invoice-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', ...form }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error('Error al guardar: ' + data.error)
      setLoading(false)
      return
    }

    toast.success(config ? 'Configuración actualizada' : 'CAI configurado exitosamente')
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(3,25,38,0.7)' }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fff' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#031926' }}>
          <h2 className="font-bold text-base"
            style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif' }}>
            Configuración CAI
          </h2>
          <button onClick={onClose} style={{ color: '#9DBEBB' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Datos del emisor */}
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9DBEBB' }}>
              Datos del emisor
            </p>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                Razón social *
              </label>
              <Input value={form.business_name}
                onChange={e => set('business_name', e.target.value)}
                placeholder="Mi Empresa S. de R.L." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Nombre comercial
                </label>
                <Input value={form.commercial_name}
                  onChange={e => set('commercial_name', e.target.value)}
                  placeholder="Mi Empresa" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  RTN * (14 dígitos)
                </label>
                <Input value={form.rtn}
                  onChange={e => set('rtn', e.target.value.replace(/\D/g, '').slice(0, 14))}
                  placeholder="08019999123456" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                Dirección *
              </label>
              <Input value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Col. Las Colinas, San Pedro Sula, Cortés" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Teléfono</label>
                <Input value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+504 0000-0000" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>Correo</label>
                <Input value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="facturacion@empresa.com" type="email" />
              </div>
            </div>

            {/* CAI */}
            <p className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: '#9DBEBB' }}>
              CAI y Rango
            </p>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                CAI * (Clave de Autorización de Impresión)
              </label>
              <Input value={form.cai}
                onChange={e => set('cai', e.target.value.toUpperCase())}
                placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX"
                className="font-mono" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Fecha límite de emisión *
                </label>
                <Input value={form.cai_expires_at}
                  onChange={e => set('cai_expires_at', e.target.value)}
                  type="date" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Tasa ISV (%)
                </label>
                <Input value={form.isv_rate}
                  onChange={e => set('isv_rate', Number(e.target.value))}
                  type="number" min={0} max={100} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Rango desde *
                </label>
                <Input value={form.range_from}
                  onChange={e => set('range_from', e.target.value)}
                  placeholder="001-001-01-00000001"
                  className="font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                  Rango hasta *
                </label>
                <Input value={form.range_to}
                  onChange={e => set('range_to', e.target.value)}
                  placeholder="001-001-01-00099999"
                  className="font-mono" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#555' }}>
                Texto pie de factura
              </label>
              <textarea value={form.footer_text}
                onChange={e => set('footer_text', e.target.value)}
                rows={2}
                placeholder="Ej: Esta factura es válida como comprobante fiscal."
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ border: '1px solid #d0e0de', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #eee' }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}
            style={{ background: '#468189', color: '#F4E9CD' }}>
            {loading ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </div>
    </div>
  )
}