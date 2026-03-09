'use client'

import { useState } from 'react'
import { Search, Users, Building2, Mail, Shield } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  role: string | null
  company_id: string | null
  company_name: string | null
  company_active: boolean | null
  email: string | null
}

const ROLE_LABELS: Record<string, string> = {
  admin:    'Administrador',
  vendedor: 'Vendedor',
  bodega:   'Bodega',
  contador: 'Contador',
}
const ROLE_COLORS: Record<string, string> = {
  admin:    '#2980b9',
  vendedor: '#27ae60',
  bodega:   '#e67e22',
  contador: '#9b59b6',
}

export function UsuariosClient({ profiles }: { profiles: Profile[] }) {
  const [search,   setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')

  const companies = Array.from(new Set(profiles.map(p => p.company_name).filter(Boolean))) as string[]

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (p.full_name ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) ||
      (p.company_name ?? '').toLowerCase().includes(q)
    const matchRole    = roleFilter    === 'all' || p.role === roleFilter
    const matchCompany = companyFilter === 'all' || p.company_name === companyFilter
    return matchSearch && matchRole && matchCompany
  })

  const inputStyle: React.CSSProperties = {
    padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
    fontSize: 13, outline: 'none', background: '#fff', color: '#1e293b',
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Usuarios del Sistema
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {profiles.length} usuarios en {companies.length} empresas
          </p>
        </div>
        {/* Mini stats */}
        <div className="hidden md:flex gap-4">
          {Object.entries(ROLE_LABELS).map(([role, label]) => {
            const count = profiles.filter(p => p.role === role).length
            return (
              <div key={role} className="text-center px-4 py-2 rounded-xl"
                style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
                <p className="text-xl font-bold" style={{ color: ROLE_COLORS[role], fontFamily: 'Georgia, serif' }}>{count}</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>{label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuario, email o empresa…"
            style={{ ...inputStyle, paddingLeft: 32, minWidth: 260 }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={inputStyle}>
          <option value="all">Todos los roles</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={inputStyle}>
          <option value="all">Todas las empresas</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || roleFilter !== 'all' || companyFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setRoleFilter('all'); setCompanyFilter('all') }}
            style={{ ...inputStyle, color: '#94a3b8', cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(70,129,137,0.12)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Usuario', 'Email', 'Rol', 'Empresa', 'Estado empresa'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#94a3b8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: '#94a3b8' }}>
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin resultados</p>
              </td></tr>
            )}
            {filtered.map((p, i) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors"
                style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${ROLE_COLORS[p.role ?? 'vendedor'] ?? '#94a3b8'}20`,
                               color: ROLE_COLORS[p.role ?? 'vendedor'] ?? '#94a3b8' }}>
                      {(p.full_name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium" style={{ color: '#1e293b' }}>{p.full_name ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    {p.email ?? '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${ROLE_COLORS[p.role ?? ''] ?? '#94a3b8'}15`,
                             color: ROLE_COLORS[p.role ?? ''] ?? '#94a3b8' }}>
                    <Shield className="w-3 h-3 inline mr-1" />
                    {ROLE_LABELS[p.role ?? ''] ?? p.role ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" style={{ color: '#94a3b8' }} />
                    <span className="text-sm" style={{ color: '#475569' }}>{p.company_name ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: p.company_active ? '#22c55e15' : '#ef444415',
                             color: p.company_active ? '#22c55e' : '#ef4444' }}>
                    {p.company_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
