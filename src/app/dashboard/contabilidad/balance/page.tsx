'use client'

import { useState } from 'react'
import { useBalanceSheet } from '@/lib/hooks/use-financial-reports'
import { Loader2, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

function Section({ title, lines, total, color }: {
  title: string; lines: any[]; total: number; color: string
}) {
  if (!lines.length) return null
  return (
    <div className="rounded-xl overflow-hidden shadow-sm mb-4"
      style={{ border: `1px solid ${color}30` }}>
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: '#031926' }}>
        <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>{title}</h3>
        <span className="font-bold text-sm" style={{ color }}>{fmt(total)}</span>
      </div>
      <table className="w-full">
        <tbody>
          {lines.map((r, i) => (
            <tr key={r.account.id}
              style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <td className="px-4 py-2 text-xs font-mono font-bold" style={{ color: '#468189' }}>
                {r.account.code}
              </td>
              <td className="px-4 py-2 text-sm" style={{ color: '#031926' }}>{r.account.name}</td>
              <td className="px-4 py-2 text-sm font-bold text-right" style={{ color }}>
                {fmt(r.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function BalancePage() {
  const today = new Date().toISOString().split('T')[0]
  const [asOfDate, setAsOfDate] = useState(today)
  const { data: bs, isLoading } = useBalanceSheet(asOfDate)

  const totalActivos  = bs?.activos.total ?? 0
  const totalPasivos  = bs?.pasivos.total ?? 0
  const totalCapital  = bs?.capital.total ?? 0
  const utilidadNeta  = bs?.netIncome ?? 0
  const totalPasCap   = totalPasivos + totalCapital + utilidadNeta
  const isBalanced    = Math.abs(totalActivos - totalPasCap) < 0.01

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Balance General
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>Activos = Pasivos + Capital</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#031926' }}>Al día</p>
            <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" style={{ color: '#555' }} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} /></div>
      ) : !bs ? (
        <div className="p-12 text-center rounded-xl" style={{ border: '1px solid #eee', color: '#9DBEBB' }}>
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Sin datos al {new Date(asOfDate).toLocaleDateString('es-HN')}</p>
        </div>
      ) : (
        <>
          {/* Balance indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-semibold`}
            style={{
              background: isBalanced ? '#27ae6015' : '#d94f4f15',
              border: `1px solid ${isBalanced ? '#27ae6040' : '#d94f4f40'}`,
              color: isBalanced ? '#27ae60' : '#d94f4f',
            }}>
            {isBalanced
              ? <><CheckCircle2 className="w-5 h-5" /> ACTIVOS = PASIVOS + CAPITAL = {fmt(totalActivos)}</>
              : <><AlertCircle className="w-5 h-5" /> Desbalance: Activos {fmt(totalActivos)} ≠ Pasivos+Capital {fmt(totalPasCap)}</>
            }
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* ACTIVOS */}
            <div>
              <h2 className="font-bold text-lg mb-4" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                ACTIVOS
              </h2>
              <Section title="Activo Corriente" lines={bs.activos.lines.filter(r => r.account.code < '12')} total={bs.activos.lines.filter(r => r.account.code < '12').reduce((s, r) => s + r.balance, 0)} color="#27ae60" />
              <Section title="Activos en General" lines={bs.activos.lines.filter(r => r.account.code >= '12')} total={bs.activos.lines.filter(r => r.account.code >= '12').reduce((s, r) => s + r.balance, 0)} color="#27ae60" />

              {/* TOTAL ACTIVOS */}
              <div className="rounded-xl p-4 text-right" style={{ background: '#031926' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#9DBEBB' }}>TOTAL ACTIVOS</p>
                <p className="text-xl font-bold" style={{ color: '#27ae60' }}>{fmt(totalActivos)}</p>
              </div>
            </div>

            {/* PASIVOS + CAPITAL */}
            <div>
              <h2 className="font-bold text-lg mb-4" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                PASIVOS Y CAPITAL
              </h2>
              <Section title="Pasivos" lines={bs.pasivos.lines} total={totalPasivos} color="#e67e22" />
              <Section title="Capital" lines={bs.capital.lines} total={totalCapital} color="#9b59b6" />

              {/* Utilidad del período */}
              {utilidadNeta !== 0 && (
                <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #2980b930' }}>
                  <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#031926' }}>
                    <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>Utilidad del Período</h3>
                    <span className="font-bold text-sm" style={{ color: utilidadNeta >= 0 ? '#27ae60' : '#d94f4f' }}>
                      {fmt(utilidadNeta)}
                    </span>
                  </div>
                </div>
              )}

              {/* TOTAL PASIVOS + CAPITAL */}
              <div className="rounded-xl p-4 text-right" style={{ background: '#031926' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#9DBEBB' }}>TOTAL PASIVOS + CAPITAL</p>
                <p className="text-xl font-bold" style={{ color: '#e67e22' }}>{fmt(totalPasCap)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
