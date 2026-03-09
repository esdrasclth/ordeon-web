import { createClient } from '@/lib/supabase/server'
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create_company:  { label: 'Empresa creada',      color: '#22c55e' },
  toggle_company:  { label: 'Estado empresa',      color: '#f59e0b' },
  update_company:  { label: 'Empresa actualizada', color: '#3b82f6' },
  delete_company:  { label: 'Empresa eliminada',   color: '#ef4444' },
  toggle_module:   { label: 'Módulo cambiado',     color: '#9b59b6' },
  create_user:     { label: 'Usuario creado',      color: '#22c55e' },
  login:           { label: 'Inicio de sesión',    color: '#64748b' },
}

export default async function AuditoriaPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          Auditoría del Sistema
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Registro de las últimas 100 acciones del sistema
        </p>
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: '#fff', border: '2px dashed rgba(70,129,137,0.2)' }}>
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-15" style={{ color: '#468189' }} />
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            No hay registros de auditoría aún.
            Las acciones administrativas (crear empresa, cambiar módulos, etc.) aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(70,129,137,0.12)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Fecha/Hora', 'Acción', 'Empresa', 'Detalles'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const ac = ACTION_LABELS[log.action] ?? { label: log.action, color: '#64748b' }
                return (
                  <tr key={log.id} className="hover:bg-slate-50"
                    style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#64748b' }}>
                      <p>{new Date(log.created_at).toLocaleDateString('es-HN')}</p>
                      <p style={{ color: '#94a3b8' }}>
                        {new Date(log.created_at).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${ac.color}18`, color: ac.color }}>
                        {ac.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1e293b' }}>
                      {(log as any).companies?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#64748b', maxWidth: 320 }}>
                      <p className="truncate">
                        {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)) : '—'}
                      </p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
