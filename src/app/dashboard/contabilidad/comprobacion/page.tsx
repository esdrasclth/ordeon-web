'use client'

import { useState } from 'react'
import { useTrialBalance } from '@/lib/hooks/use-financial-reports'
import { Loader2, Scale, CheckCircle2, AlertCircle } from 'lucide-react'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const TYPE_COLORS: Record<string, string> = {
  activo: '#27ae60', pasivo: '#e67e22', capital: '#9b59b6',
  ingreso: '#2980b9', gasto: '#d94f4f', costo: '#e74c3c'
}

export default function ComprobacionPage() {
  const currentYear = new Date().getFullYear()
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`)
  const [toDate, setToDate]     = useState(`${currentYear}-12-31`)

  const { data: trial, isLoading } = useTrialBalance(fromDate, toDate)

  const totalDebit  = trial?.reduce((s, r) => s + r.totalDebit, 0)  ?? 0
  const totalCredit = trial?.reduce((s, r) => s + r.totalCredit, 0) ?? 0
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          Balance de Comprobación
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#468189' }}>Sumas y saldos de todas las cuentas con movimientos</p>
      </div>

      {/* Período */}
      <div className="flex items-end gap-4 flex-wrap">
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

      {/* Indicator balance */}
      {!isLoading && trial && trial.length > 0 && (
        <div className={`flex items-center gap-3 p-4 rounded-xl font-semibold text-sm ${isBalanced ? 'text-green-700' : 'text-red-600'}`}
          style={{ background: isBalanced ? '#27ae6015' : '#d94f4f15', border: `1px solid ${isBalanced ? '#27ae6040' : '#d94f4f40'}` }}>
          {isBalanced
            ? <><CheckCircle2 className="w-5 h-5" /> Libros balanceados — Débitos = Créditos = {fmt(totalDebit)}</>
            : <><AlertCircle className="w-5 h-5" /> Desbalance: Débitos {fmt(totalDebit)} ≠ Créditos {fmt(totalCredit)}</>
          }
        </div>
      )}

      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
        <div className="px-5 py-4" style={{ background: '#031926' }}>
          <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>Sumas y Saldos</h3>
        </div>
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} /></div>
        ) : !trial?.length ? (
          <div className="p-12 text-center" style={{ color: '#9DBEBB' }}>
            <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Sin movimientos en el período</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '2px solid #eee' }}>
                  <th className="px-4 py-3 text-left" style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>Código</th>
                  <th className="px-4 py-3 text-left" style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>Cuenta</th>
                  <th className="px-4 py-3 text-left" style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>Tipo</th>
                  <th className="px-4 py-3 text-right" style={{ fontSize: 11, color: '#27ae60', fontWeight: 700 }}>Total Débito</th>
                  <th className="px-4 py-3 text-right" style={{ fontSize: 11, color: '#2980b9', fontWeight: 700 }}>Total Crédito</th>
                  <th className="px-4 py-3 text-right" style={{ fontSize: 11, color: '#031926', fontWeight: 700 }}>Saldo Deudor</th>
                  <th className="px-4 py-3 text-right" style={{ fontSize: 11, color: '#031926', fontWeight: 700 }}>Saldo Acreedor</th>
                </tr>
              </thead>
              <tbody>
                {trial.map((row, i) => {
                  const saldoDeudor   = row.balance > 0 ? row.balance : 0
                  const saldoAcreedor = row.balance < 0 ? Math.abs(row.balance) : 0
                  const typeColor = TYPE_COLORS[row.account.type] ?? '#468189'
                  return (
                    <tr key={row.account.id}
                      style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <td className="px-4 py-2.5 text-xs font-mono font-bold" style={{ color: '#468189' }}>
                        {row.account.code}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium" style={{ color: '#031926' }}>
                        {row.account.name}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: typeColor + '18', color: typeColor }}>
                          {row.account.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right" style={{ color: '#27ae60' }}>
                        {fmt(row.totalDebit)}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right" style={{ color: '#2980b9' }}>
                        {fmt(row.totalCredit)}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-bold text-right" style={{ color: '#031926' }}>
                        {saldoDeudor > 0 ? fmt(saldoDeudor) : ''}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-bold text-right" style={{ color: '#031926' }}>
                        {saldoAcreedor > 0 ? fmt(saldoAcreedor) : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#031926', fontWeight: 700 }}>
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold" style={{ color: '#F4E9CD' }}>TOTALES</td>
                  <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#27ae60' }}>{fmt(totalDebit)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#2980b9' }}>{fmt(totalCredit)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#F4E9CD' }}>
                    {fmt(trial.reduce((s, r) => s + (r.balance > 0 ? r.balance : 0), 0))}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#F4E9CD' }}>
                    {fmt(trial.reduce((s, r) => s + (r.balance < 0 ? Math.abs(r.balance) : 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
