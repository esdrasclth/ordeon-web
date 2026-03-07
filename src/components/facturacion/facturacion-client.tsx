'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvoiceList } from '@/components/facturacion/invoice-list'
import { CAIConfigForm } from '@/components/facturacion/cai-config-form'

export function FacturacionClient({
  config,
  invoices,
  companyId,
}: {
  config: any | null
  invoices: any[]
  companyId: string
}) {
  const router = useRouter()
  const [showCAIForm, setShowCAIForm] = useState(false)

  const caiExpired = config
    ? new Date(config.cai_expires_at) < new Date(new Date().toDateString())
    : false
  const caiDaysLeft = config
    ? Math.ceil((new Date(config.cai_expires_at).getTime() - Date.now()) / 86400000)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"
            style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Facturación
          </h1>
          <p className="text-sm mt-1" style={{ color: '#468189' }}>
            {invoices.filter(i => i.status === 'emitida').length} factura(s) emitida(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCAIForm(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar CAI
          </Button>
          {config && !caiExpired && (
            <Button
              onClick={() => router.push('/dashboard/facturacion/nueva')}
              style={{ background: '#468189', color: '#F4E9CD' }}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Factura
            </Button>
          )}
        </div>
      </div>

      {/* Alertas CAI */}
      {!config && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: '#fff8e6', border: '1px solid #e67e2240' }}>
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#e67e22' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#e67e22' }}>CAI no configurado</p>
            <p className="text-xs mt-0.5" style={{ color: '#777' }}>
              Debes configurar tu CAI antes de emitir facturas. Haz clic en "Configurar CAI".
            </p>
          </div>
        </div>
      )}

      {config && caiExpired && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: '#fff0f0', border: '1px solid #d94f4f40' }}>
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#d94f4f' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#d94f4f' }}>CAI vencido</p>
            <p className="text-xs mt-0.5" style={{ color: '#777' }}>
              Tu CAI venció el {new Date(config.cai_expires_at).toLocaleDateString('es-HN')}.
              Solicita un nuevo CAI al SAR y actualiza la configuración.
            </p>
          </div>
        </div>
      )}

      {config && !caiExpired && caiDaysLeft <= 15 && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: '#fff8e6', border: '1px solid #e67e2240' }}>
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#e67e22' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#e67e22' }}>CAI por vencer</p>
            <p className="text-xs mt-0.5" style={{ color: '#777' }}>
              Tu CAI vence en {caiDaysLeft} días ({new Date(config.cai_expires_at).toLocaleDateString('es-HN')}).
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      {config && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Facturas emitidas', value: invoices.filter(i => i.status === 'emitida').length, color: '#468189' },
            { label: 'Facturas anuladas', value: invoices.filter(i => i.status === 'anulada').length, color: '#d94f4f' },
            {
              label: 'Total facturado',
              value: `L. ${invoices
                .filter(i => i.status === 'emitida')
                .reduce((s, i) => s + Number(i.total), 0)
                .toLocaleString('es-HN', { minimumFractionDigits: 2 })}`,
              color: '#27ae60',
            },
            { label: 'Correlativo actual', value: config.current_correlative - 1, color: '#031926' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl p-4"
              style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
              <p className="text-2xl font-bold"
                style={{ color: kpi.color, fontFamily: 'Georgia, serif' }}>
                {kpi.value}
              </p>
              <p className="text-xs mt-1" style={{ color: '#777' }}>{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Info CAI activo */}
      {config && !caiExpired && (
        <div className="rounded-xl p-4"
          style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
          <p className="text-xs font-bold mb-3" style={{ color: '#555' }}>CAI Activo</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <p className="text-xs" style={{ color: '#9DBEBB' }}>CAI</p>
              <p className="text-sm font-mono font-bold" style={{ color: '#031926' }}>{config.cai}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#9DBEBB' }}>Fecha límite</p>
              <p className="text-sm font-bold"
                style={{ color: caiDaysLeft <= 15 ? '#e67e22' : '#27ae60' }}>
                {new Date(config.cai_expires_at).toLocaleDateString('es-HN')} ({caiDaysLeft}d)
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#9DBEBB' }}>Rango autorizado</p>
              <p className="text-sm font-mono" style={{ color: '#031926' }}>
                {config.range_from} — {config.range_to}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <InvoiceList invoices={invoices} onRefresh={() => router.refresh()} />

      {/* Modal CAI — este sí se queda como modal porque es configuración */}
      {showCAIForm && (
        <CAIConfigForm
          config={config}
          companyId={companyId}
          onClose={() => { setShowCAIForm(false); router.refresh() }}
        />
      )}
    </div>
  )
}