'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useJournalEntries } from '@/lib/hooks/use-journal'
import { JournalEntry } from '@/types'
import { Input } from '@/components/ui/input'
import { Plus, Loader2, Search, FileText, ChevronDown, ChevronUp } from 'lucide-react'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  manual:       { label: 'Manual',         color: '#468189' },
  venta:        { label: 'Venta',          color: '#27ae60' },
  compra:       { label: 'Compra',         color: '#e67e22' },
  ajuste_stock: { label: 'Ajuste Stock',   color: '#2980b9' },
  factura:      { label: 'Factura',        color: '#9b59b6' },
  pago:         { label: 'Pago',           color: '#27ae60' },
  devolucion:   { label: 'Devolución',     color: '#d94f4f' },
}

function EntryRow({ entry, i }: { entry: any; i: number }) {
  const [expanded, setExpanded] = useState(false)
  const lines = entry.journal_lines ?? []
  const totalD = lines.reduce((s: number, l: any) => s + Number(l.debit), 0)
  const totalC = lines.reduce((s: number, l: any) => s + Number(l.credit), 0)
  const isBalanced = Math.abs(totalD - totalC) < 0.01
  const src = SOURCE_CONFIG[entry.source] ?? SOURCE_CONFIG.manual

  return (
    <>
      <tr style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: expanded ? 'none' : '1px solid #f0f0f0' }}>
        <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: '#468189' }}>#{entry.entry_number}</td>
        <td className="px-4 py-3 text-xs" style={{ color: '#777' }}>
          {new Date(entry.date).toLocaleDateString('es-HN')}
        </td>
        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#031926', maxWidth: 220 }}>
          <p className="truncate">{entry.description}</p>
        </td>
        <td className="px-4 py-3 text-xs font-mono" style={{ color: '#9DBEBB' }}>{entry.reference ?? '—'}</td>
        <td className="px-4 py-3">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: src.color + '18', color: src.color }}>
            {src.label}
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#27ae60' }}>{fmt(totalD)}</td>
        <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#2980b9' }}>{fmt(totalC)}</td>
        <td className="px-4 py-3">
          {!isBalanced && <span className="text-xs text-red-500 font-bold">⚠</span>}
        </td>
        <td className="px-4 py-3">
          <button onClick={() => setExpanded(e => !e)} className="p-1 rounded hover:bg-gray-100">
            {expanded ? <ChevronUp className="w-4 h-4" style={{ color: '#468189' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#468189' }} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: i % 2 === 0 ? '#f8fcfc' : '#f5fafc' }}>
          <td colSpan={9} className="px-8 pb-4 pt-2">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #e0eaeb' }}>
                  <th className="text-left py-1.5 pr-4 font-semibold" style={{ color: '#9DBEBB' }}>Cuenta</th>
                  <th className="text-left py-1.5 pr-4 font-semibold" style={{ color: '#9DBEBB' }}>Descripción</th>
                  <th className="text-right py-1.5 pr-4 font-semibold" style={{ color: '#9DBEBB' }}>Débito</th>
                  <th className="text-right py-1.5 font-semibold" style={{ color: '#9DBEBB' }}>Crédito</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td className="py-1.5 pr-4 font-mono font-bold" style={{ color: '#468189' }}>
                      {l.accounts?.code} — {l.accounts?.name}
                    </td>
                    <td className="py-1.5 pr-4" style={{ color: '#555' }}>{l.description ?? '—'}</td>
                    <td className="py-1.5 pr-4 text-right font-bold" style={{ color: '#27ae60' }}>
                      {l.debit > 0 ? fmt(l.debit) : ''}
                    </td>
                    <td className="py-1.5 text-right font-bold" style={{ color: '#2980b9' }}>
                      {l.credit > 0 ? fmt(l.credit) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

export default function DiarioPage() {
  const [search, setSearch]       = useState('')
  const [source, setSource]       = useState('')
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')

  const { data: entries, isLoading } = useJournalEntries({
    from:   fromDate || undefined,
    to:     toDate   || undefined,
    source: source   || undefined,
  })

  const filtered = (entries ?? []).filter(e =>
    search === '' ||
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    (e.reference ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(e.entry_number).includes(search)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>Libro Diario</h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>{filtered.length} asientos</p>
        </div>
        <Link href="/dashboard/contabilidad/diario/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#468189', color: '#F4E9CD' }}>
          <Plus className="w-4 h-4" /> Nuevo Asiento
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9DBEBB' }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10 h-9" />
        </div>
        <select value={source} onChange={e => setSource(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" style={{ color: '#555' }}>
          <option value="">Todos los orígenes</option>
          {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" style={{ color: '#555' }} />
          <span className="text-xs" style={{ color: '#9DBEBB' }}>a</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" style={{ color: '#555' }} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
        <div className="px-5 py-4" style={{ background: '#031926' }}>
          <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>Asientos Contables</h3>
        </div>
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} /></div>
        ) : !filtered.length ? (
          <div className="p-12 text-center" style={{ color: '#9DBEBB' }}>
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Sin asientos en el período seleccionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                  {['N°', 'Fecha', 'Descripción', 'Referencia', 'Origen', 'Débito', 'Crédito', '', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left whitespace-nowrap"
                      style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => <EntryRow key={e.id} entry={e} i={i} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
