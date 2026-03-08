'use client'

import { useState } from 'react'
import { useIncomeStatement } from '@/lib/hooks/use-financial-reports'
import { Loader2, Receipt, TrendingUp, TrendingDown } from 'lucide-react'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

function ResultSection({ title, items, total, color }: {
  title: string; items: { account: any; balance: number }[]; total: number; color: string
}) {
  if (!items.length) return null
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${color}30` }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#031926' }}>
        <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>{title}</h3>
        <span className="font-bold text-sm" style={{ color }}>{fmt(total)}</span>
      </div>
      <table className="w-full">
        <tbody>
          {items.map((r, i) => (
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

function SubtotalRow({ label, value, big = false }: { label: string; value: number; big?: boolean }) {
  const isPositive = value >= 0
  return (
    <div className={`flex items-center justify-between px-5 py-3 rounded-xl mb-3`}
      style={{
        background: big ? '#031926' : (isPositive ? '#27ae6010' : '#d94f4f10'),
        border: big ? 'none' : `1px solid ${isPositive ? '#27ae6030' : '#d94f4f30'}`,
      }}>
      <span className={big ? 'text-sm font-bold' : 'text-sm font-semibold'}
        style={{ color: big ? '#F4E9CD' : '#031926' }}>
        {label}
      </span>
      <span className={big ? 'text-lg font-bold' : 'text-sm font-bold'}
        style={{ color: big ? (isPositive ? '#27ae60' : '#d94f4f') : (isPositive ? '#27ae60' : '#d94f4f') }}>
        {fmt(value)}
      </span>
    </div>
  )
}

export default function ResultadosPage() {
  const currentYear = new Date().getFullYear()
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`)
  const [toDate, setToDate]     = useState(`${currentYear}-12-31`)

  const { data: is, isLoading } = useIncomeStatement(fromDate, toDate)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Estado de Resultados
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>Ingresos - Costos - Gastos = Utilidad</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#031926' }}>Desde</p>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#031926' }}>Hasta</p>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} /></div>
      ) : !is ? (
        <div className="p-12 text-center rounded-xl" style={{ border: '1px solid #eee', color: '#9DBEBB' }}>
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Sin datos en el período seleccionado</p>
        </div>
      ) : (
        <div>
          <ResultSection title="Ingresos" items={is.ingresos} total={is.totalIngresos} color="#2980b9" />
          <SubtotalRow label="Total Ingresos" value={is.totalIngresos} />

          <ResultSection title="(-) Costo de Ventas y Producción" items={is.costos} total={is.totalCostos} color="#e74c3c" />
          <SubtotalRow label="Utilidad Bruta" value={is.utilidadBruta} />

          <ResultSection title="(-) Gastos de Operación" items={is.gastos} total={is.totalGastos} color="#d94f4f" />

          <SubtotalRow label="UTILIDAD NETA DEL PERÍODO" value={is.utilidadNeta} big />

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              {
                label: 'Margen Bruto',
                value: is.totalIngresos > 0 ? ((is.utilidadBruta / is.totalIngresos) * 100).toFixed(1) + '%' : '—',
                icon: <TrendingUp className="w-4 h-4" />,
                color: '#27ae60',
              },
              {
                label: 'Margen Neto',
                value: is.totalIngresos > 0 ? ((is.utilidadNeta / is.totalIngresos) * 100).toFixed(1) + '%' : '—',
                icon: <TrendingUp className="w-4 h-4" />,
                color: (is.utilidadNeta / is.totalIngresos) >= 0.1 ? '#27ae60' : '#e67e22',
              },
              {
                label: 'Ratio Gastos/Ingresos',
                value: is.totalIngresos > 0 ? ((is.totalGastos / is.totalIngresos) * 100).toFixed(1) + '%' : '—',
                icon: <TrendingDown className="w-4 h-4" />,
                color: '#e67e22',
              },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-xl p-4"
                style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div style={{ color: kpi.color }}>{kpi.icon}</div>
                  <p className="text-xs font-semibold" style={{ color: '#9DBEBB' }}>{kpi.label}</p>
                </div>
                <p className="text-xl font-bold" style={{ color: kpi.color, fontFamily: 'Georgia, serif' }}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
