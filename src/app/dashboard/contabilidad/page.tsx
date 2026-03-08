'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useJournalEntries } from '@/lib/hooks/use-journal'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useAccountingPeriods } from '@/lib/hooks/use-accounting-periods'
import { useIncomeStatement, useTrialBalance } from '@/lib/hooks/use-financial-reports'
import {
  BookOpen, FileText, TrendingUp, Scale, BarChart3,
  CalendarDays, Receipt, Loader2, ArrowRight, Plus
} from 'lucide-react'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

export default function ContabilidadPage() {
  const currentYear  = new Date().getFullYear()
  const [fromDate]   = useState(`${currentYear}-01-01`)
  const [toDate]     = useState(`${currentYear}-12-31`)

  const { data: entries,  isLoading: eLoading }  = useJournalEntries({ from: fromDate, to: toDate })
  const { data: accounts, isLoading: aLoading }  = useAccounts()
  const { data: periods,  isLoading: pLoading }  = useAccountingPeriods()
  const { data: income,   isLoading: iLoading }  = useIncomeStatement(fromDate, toDate)
  const { data: trial,    isLoading: tLoading }  = useTrialBalance(fromDate, toDate)

  const openPeriod = periods?.find(p => p.status === 'open')
  const totalDebit  = trial?.reduce((s, r) => s + r.totalDebit,  0) ?? 0
  const totalCredit = trial?.reduce((s, r) => s + r.totalCredit, 0) ?? 0
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01

  const QUICK_LINKS = [
    { href: '/dashboard/contabilidad/cuentas',       icon: BookOpen,     label: 'Plan de Cuentas',        desc: `${accounts?.length ?? 0} cuentas activas` },
    { href: '/dashboard/contabilidad/diario',         icon: FileText,     label: 'Libro Diario',           desc: `${entries?.length ?? 0} asientos` },
    { href: '/dashboard/contabilidad/mayor',          icon: BarChart3,    label: 'Libro Mayor',            desc: 'Por cuenta' },
    { href: '/dashboard/contabilidad/comprobacion',   icon: Scale,        label: 'Balance de Comprobación',desc: isBalanced ? '✓ Balanceado' : '⚠ Revisar' },
    { href: '/dashboard/contabilidad/balance',        icon: TrendingUp,   label: 'Balance General',        desc: 'Activos vs Pasivos' },
    { href: '/dashboard/contabilidad/resultados',     icon: Receipt,      label: 'Estado de Resultados',   desc: income ? fmt(income.utilidadNeta) : '…' },
    { href: '/dashboard/contabilidad/periodos',        icon: CalendarDays, label: 'Períodos Contables',     desc: openPeriod ? `Abierto: ${openPeriod.name}` : 'Sin período activo' },
    { href: '/dashboard/contabilidad/impuestos',      icon: Receipt,      label: 'Reporte ISV/SAR',        desc: 'Honduras' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Contabilidad
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>
            Módulo contable — partida doble
          </p>
        </div>
        <Link href="/dashboard/contabilidad/diario/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#468189', color: '#F4E9CD' }}>
          <Plus className="w-4 h-4" /> Nuevo Asiento
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          {
            label: 'Período activo',
            value: pLoading ? '...' : openPeriod?.name ?? 'Ninguno',
            sub: openPeriod ? 'Abierto' : 'Sin período',
            color: openPeriod ? '#27ae60' : '#e67e22',
          },
          {
            label: 'Asientos (año)',
            value: eLoading ? '...' : String(entries?.length ?? 0),
            sub: 'En el año actual',
            color: '#468189',
          },
          {
            label: 'Utilidad Neta',
            value: iLoading ? '...' : (income ? fmt(income.utilidadNeta) : '—'),
            sub: `Ingresos ${income ? fmt(income.totalIngresos) : '—'}`,
            color: (income?.utilidadNeta ?? 0) >= 0 ? '#27ae60' : '#d94f4f',
          },
          {
            label: 'Balance',
            value: tLoading ? '...' : (isBalanced ? 'Balanceado ✓' : 'Desbalance ⚠'),
            sub: `Débitos: ${fmt(totalDebit)}`,
            color: isBalanced ? '#27ae60' : '#d94f4f',
          },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-5 shadow-sm"
            style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#9DBEBB' }}>{kpi.label}</p>
            <p className="text-xl font-bold" style={{ color: kpi.color, fontFamily: 'Georgia, serif' }}>{kpi.value}</p>
            <p className="text-xs mt-1" style={{ color: '#777' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="font-bold text-sm mb-3" style={{ color: '#031926' }}>Accesos rápidos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {QUICK_LINKS.map(link => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-4 p-4 rounded-xl group transition-all hover:shadow-md"
                style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#46818918' }}>
                  <Icon className="w-5 h-5" style={{ color: '#468189' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#031926' }}>{link.label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#9DBEBB' }}>{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ color: '#468189' }} />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Últimos asientos */}
      <div className="rounded-xl overflow-hidden shadow-sm"
        style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#031926' }}>
          <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>Últimos Asientos</h3>
          <Link href="/dashboard/contabilidad/diario"
            className="text-xs font-semibold" style={{ color: '#9DBEBB' }}>
            Ver todos →
          </Link>
        </div>
        {eLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#468189' }} />
          </div>
        ) : !entries?.length ? (
          <div className="p-10 text-center" style={{ color: '#9DBEBB' }}>
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin asientos registrados</p>
            <Link href="/dashboard/contabilidad/diario/nuevo"
              className="inline-block mt-3 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: '#46818918', color: '#468189' }}>
              Crear primer asiento
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                {['N°', 'Fecha', 'Descripción', 'Referencia', 'Origen', 'Débito', 'Crédito'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left"
                    style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 10).map((e, i) => {
                const totalD = (e.journal_lines ?? []).reduce((s, l) => s + Number(l.debit), 0)
                const totalC = (e.journal_lines ?? []).reduce((s, l) => s + Number(l.credit), 0)
                return (
                  <tr key={e.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <td className="px-4 py-2.5 text-xs font-mono font-bold" style={{ color: '#468189' }}>
                      #{e.entry_number}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#777' }}>
                      {new Date(e.date).toLocaleDateString('es-HN')}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium" style={{ color: '#031926', maxWidth: 200 }}>
                      <p className="truncate">{e.description}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#9DBEBB' }}>
                      {e.reference ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={{ background: '#46818912', color: '#468189' }}>
                        {e.source}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-right" style={{ color: '#27ae60' }}>
                      {fmt(totalD)}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-right" style={{ color: '#2980b9' }}>
                      {fmt(totalC)}
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
