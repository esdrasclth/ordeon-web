'use client'

import { useState } from 'react'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useAccountBalance } from '@/lib/hooks/use-accounts'
import { useJournalEntries } from '@/lib/hooks/use-journal'
import { Account } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, BarChart3 } from 'lucide-react'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  activo:   { label: 'Activo',   color: '#27ae60' },
  pasivo:   { label: 'Pasivo',   color: '#e67e22' },
  capital:  { label: 'Capital',  color: '#9b59b6' },
  ingreso:  { label: 'Ingreso',  color: '#2980b9' },
  gasto:    { label: 'Gasto',    color: '#d94f4f' },
  costo:    { label: 'Costo',    color: '#e74c3c' },
}

function LedgerView({ accountId, fromDate, toDate }: { accountId: string; fromDate: string; toDate: string }) {
  const { data: balance } = useAccountBalance(accountId, fromDate || undefined, toDate || undefined)
  const { data: entries } = useJournalEntries({ from: fromDate || undefined, to: toDate || undefined })

  const relatedLines = (entries ?? []).flatMap(e =>
    (e.journal_lines ?? [])
      .filter(l => l.account_id === accountId)
      .map(l => ({ ...l, entry: e }))
  ).sort((a, b) => new Date(a.entry.date).getTime() - new Date(b.entry.date).getTime())

  let running = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Débitos',  value: fmt(balance?.totalDebit  ?? 0), color: '#27ae60' },
          { label: 'Total Créditos', value: fmt(balance?.totalCredit ?? 0), color: '#2980b9' },
          { label: 'Saldo',          value: fmt(balance?.balance ?? 0),     color: Math.abs(balance?.balance ?? 0) > 0 ? '#031926' : '#9DBEBB' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-4"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
            <p className="text-xs font-semibold" style={{ color: '#9DBEBB' }}>{kpi.label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Movimientos */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
        <div className="px-5 py-3" style={{ background: '#031926' }}>
          <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>Movimientos</h3>
        </div>
        {relatedLines.length === 0 ? (
          <div className="p-8 text-center" style={{ color: '#9DBEBB' }}>Sin movimientos en el período</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                {['Fecha', 'N° Asiento', 'Descripción', 'Referencia', 'Débito', 'Crédito', 'Saldo'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left"
                    style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relatedLines.map((l, i) => {
                running += Number(l.debit) - Number(l.credit)
                return (
                  <tr key={l.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#777' }}>
                      {new Date(l.entry.date).toLocaleDateString('es-HN')}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono font-bold" style={{ color: '#468189' }}>
                      #{l.entry.entry_number}
                    </td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: '#031926', maxWidth: 200 }}>
                      <p className="truncate">{l.description ?? l.entry.description}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#9DBEBB' }}>
                      {l.entry.reference ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-right" style={{ color: '#27ae60' }}>
                      {Number(l.debit) > 0 ? fmt(Number(l.debit)) : ''}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-right" style={{ color: '#2980b9' }}>
                      {Number(l.credit) > 0 ? fmt(Number(l.credit)) : ''}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-right"
                      style={{ color: running >= 0 ? '#031926' : '#d94f4f' }}>
                      {fmt(running)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function MayorPage() {
  const { data: accounts, isLoading } = useAccounts()
  const [selectedAccount, setSelectedAccount] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')

  const detailAccounts = (accounts ?? []).filter(a => a.is_detail)
  const account = accounts?.find(a => a.id === selectedAccount)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>Libro Mayor</h1>
        <p className="mt-1 text-sm" style={{ color: '#468189' }}>Movimientos por cuenta contable</p>
      </div>

      {/* Selección de cuenta + período */}
      <div className="flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-64">
          <p className="text-sm font-semibold mb-1" style={{ color: '#031926' }}>Cuenta</p>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#468189' }} />
          ) : (
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cuenta..." /></SelectTrigger>
              <SelectContent>
                {detailAccounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#031926' }}>Desde</p>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" style={{ color: '#555' }} />
        </div>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#031926' }}>Hasta</p>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" style={{ color: '#555' }} />
        </div>
      </div>

      {!selectedAccount ? (
        <div className="rounded-xl p-12 text-center" style={{ border: '1px solid rgba(68,129,137,0.15)', color: '#9DBEBB' }}>
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Selecciona una cuenta para ver su mayor</p>
        </div>
      ) : (
        <>
          {account && (
            <div className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: '#031926' }}>
              <div className="w-3 h-3 rounded-full"
                style={{ background: TYPE_CONFIG[account.type]?.color ?? '#468189' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                  {account.code} — {account.name}
                </p>
                <p className="text-xs" style={{ color: '#9DBEBB' }}>
                  {TYPE_CONFIG[account.type]?.label}
                </p>
              </div>
            </div>
          )}
          <LedgerView accountId={selectedAccount} fromDate={fromDate} toDate={toDate} />
        </>
      )}
    </div>
  )
}
