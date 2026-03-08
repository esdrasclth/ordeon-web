'use client'

import { useState } from 'react'
import { useJournalEntries } from '@/lib/hooks/use-journal'
import { Loader2, Receipt } from 'lucide-react'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

// Cuentas ISV típicas
const ISV_CUENTAS = {
  pagar:      ['2102', 'ISV por Pagar'],
  acreditable: ['1105', 'ISV Acreditable'],
}

export default function ImpuestosPage() {
  const currentYear = new Date().getFullYear()
  const [month, setMonth]     = useState(new Date().getMonth() + 1)
  const [year, setYear]       = useState(currentYear)

  const pad = (n: number) => String(n).padStart(2, '0')
  const fromDate = `${year}-${pad(month)}-01`
  const lastDay  = new Date(year, month, 0).getDate()
  const toDate   = `${year}-${pad(month)}-${lastDay}`

  const { data: entries, isLoading } = useJournalEntries({ from: fromDate, to: toDate })

  // Calcular ISV por Pagar (ventas con ISV)
  const ventasLines = (entries ?? [])
    .filter(e => e.source === 'venta' || e.source === 'factura')
    .flatMap(e => e.journal_lines ?? [])

  const isvPorPagar = ventasLines
    .filter(l => (l.accounts as any)?.code?.startsWith(ISV_CUENTAS.pagar[0]))
    .reduce((s, l) => s + Number(l.credit) - Number(l.debit), 0)

  const isvAcreditable = (entries ?? [])
    .filter(e => e.source === 'compra')
    .flatMap(e => e.journal_lines ?? [])
    .filter(l => (l.accounts as any)?.code?.startsWith(ISV_CUENTAS.acreditable[0]))
    .reduce((s, l) => s + Number(l.debit) - Number(l.credit), 0)

  const isvNeto = isvPorPagar - isvAcreditable

  const ventaEntries = (entries ?? []).filter(e => e.source === 'venta' || e.source === 'factura')
  const compraEntries = (entries ?? []).filter(e => e.source === 'compra')

  const totalVentas  = ventaEntries.flatMap(e => e.journal_lines ?? [])
    .filter(l => (l.accounts as any)?.type === 'ingreso')
    .reduce((s, l) => s + Number(l.credit) - Number(l.debit), 0)

  const totalCompras = compraEntries.flatMap(e => e.journal_lines ?? [])
    .filter(l => (l.accounts as any)?.type === 'activo' || (l.accounts as any)?.type === 'costo')
    .reduce((s, l) => s + Number(l.debit) - Number(l.credit), 0)

  const MONTHS = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          Reporte ISV / SAR
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#468189' }}>
          Impuesto Sobre Ventas — Honduras (15% / 18%)
        </p>
      </div>

      {/* Selector período */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#031926' }}>Mes</p>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm" style={{ color: '#555' }}>
            {MONTHS.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#031926' }}>Año</p>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm" style={{ color: '#555' }}>
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} /></div>
      ) : (
        <>
          {/* KPIs ISV */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Ventas Gravadas',   value: fmt(totalVentas),   color: '#2980b9' },
              { label: 'ISV por Pagar',     value: fmt(isvPorPagar),   color: '#d94f4f' },
              { label: 'ISV Acreditable',   value: fmt(isvAcreditable), color: '#27ae60' },
              { label: 'ISV Neto a Pagar',  value: fmt(isvNeto),       color: isvNeto > 0 ? '#e67e22' : '#27ae60' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-xl p-5 shadow-sm"
                style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#9DBEBB' }}>{kpi.label}</p>
                <p className="text-lg font-bold" style={{ color: kpi.color, fontFamily: 'Georgia, serif' }}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Libro de Ventas */}
          <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
            <div className="px-5 py-4" style={{ background: '#031926' }}>
              <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                Libro de Ventas — {MONTHS[month]} {year}
                <span className="ml-2 opacity-50 font-normal">({ventaEntries.length} registros)</span>
              </h3>
            </div>
            {ventaEntries.length === 0 ? (
              <div className="p-8 text-center" style={{ color: '#9DBEBB' }}>
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin ventas en {MONTHS[month]}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                    {['Fecha', 'N° Asiento', 'Descripción', 'Referencia', 'Importe', 'ISV'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left"
                        style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ventaEntries.map((e, i) => {
                    const ingreso = (e.journal_lines ?? [])
                      .filter(l => (l.accounts as any)?.type === 'ingreso')
                      .reduce((s, l) => s + Number(l.credit), 0)
                    const isv = (e.journal_lines ?? [])
                      .filter(l => (l.accounts as any)?.code?.startsWith('2102'))
                      .reduce((s, l) => s + Number(l.credit), 0)
                    return (
                      <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <td className="px-4 py-2.5 text-xs" style={{ color: '#777' }}>
                          {new Date(e.date).toLocaleDateString('es-HN')}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono font-bold" style={{ color: '#468189' }}>
                          #{e.entry_number}
                        </td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: '#031926' }}>{e.description}</td>
                        <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#9DBEBB' }}>{e.reference ?? '—'}</td>
                        <td className="px-4 py-2.5 text-sm font-bold" style={{ color: '#2980b9' }}>{fmt(ingreso)}</td>
                        <td className="px-4 py-2.5 text-sm font-bold" style={{ color: '#d94f4f' }}>{isv > 0 ? fmt(isv) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Nota */}
          <div className="rounded-xl p-4" style={{ background: '#f8fafa', border: '1px solid #eee' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#031926' }}>Nota importante</p>
            <p className="text-xs" style={{ color: '#777' }}>
              Este reporte se genera a partir de los asientos contables. Para obtener datos precisos de ISV,
              las cuentas <strong>2102 ISV por Pagar</strong> y <strong>1105 ISV Acreditable</strong> deben estar
              correctamente configuradas en el plan de cuentas y usadas en cada asiento de venta y compra.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
