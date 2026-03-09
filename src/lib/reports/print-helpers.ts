// Shared utilities for print/PDF report pages

export const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; }
  @media print {
    @page { margin: 15mm 12mm; size: A4 landscape; }
    .no-print { display: none !important; }
  }
  .header { background: #031926; color: #F4E9CD; padding: 20px 24px; margin-bottom: 16px; }
  .logo   { font-size: 20px; font-weight: 900; font-family: Georgia, serif; }
  .logo span { color: #468189; }
  .meta   { display: flex; gap: 24px; margin-top: 6px; font-size: 11px; color: rgba(244,233,205,0.7); flex-wrap: wrap; }
  .container { padding: 0 24px; }
  .report-title { margin-bottom: 14px; font-size: 16px; font-weight: 800; color: #031926; }
  table   { width: 100%; border-collapse: collapse; }
  th      { background: #031926; color: #F4E9CD; padding: 6px 8px; text-align: left; font-size: 11px; white-space: nowrap; }
  th.right, td.right { text-align: right; }
  th.center, td.center { text-align: center; }
  td      { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
  tr:nth-child(even) td { background: #fafafa; }
  tr.total-row td { font-weight: 700; background: #f0fdf4; border-top: 2px solid #468189; }
  tr.alert td { background: #fff7ed; }
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; }
  .badge-green  { background: #f0fdf4; color: #16a34a; }
  .badge-red    { background: #fee2e2; color: #dc2626; }
  .badge-yellow { background: #fefce8; color: #ca8a04; }
  .badge-gray   { background: #f1f5f9; color: #64748b; }
  .badge-blue   { background: #eff6ff; color: #2563eb; }
  .controls { padding: 12px 24px; display: flex; gap: 8px; align-items: center; }
  .btn { padding: 6px 14px; border-radius: 6px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; padding: 0 24px; margin-bottom: 16px; }
  .summary-card { background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; }
  .summary-card .val { font-size: 18px; font-weight: 800; color: #031926; font-family: Georgia, serif; }
  .summary-card .lbl { font-size: 10px; color: #64748b; margin-top: 2px; }
  .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; padding: 0 24px; }
`

export function getPeriodDates(period: string, from?: string, to?: string) {
  const now = new Date()
  if (period === 'custom' && from && to) return { start: from + 'T00:00:00', end: to + 'T23:59:59' }
  const start = new Date(now)
  if      (period === 'today') start.setHours(0, 0, 0, 0)
  else if (period === 'week')  { start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0) }
  else if (period === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0) }
  else if (period === 'year')  { start.setMonth(0, 1); start.setHours(0, 0, 0, 0) }
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: endOfDay.toISOString() }
}

export const PERIOD_LABEL: Record<string, string> = {
  today: 'Hoy', week: 'Esta semana', month: 'Este mes', year: 'Este año',
}

export function getPeriodLabel(period: string, from?: string, to?: string) {
  if (period === 'custom') return `${from} — ${to}`
  return PERIOD_LABEL[period] ?? 'Este mes'
}

export const fmt = (n: number | string | null | undefined) =>
  `L. ${Number(n ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

export const STATUS_ORDEN: Record<string, string> = {
  pendiente: 'Pendiente', pendiente_aprobacion: 'Pend. aprobación',
  en_preparacion: 'En preparación', preparada: 'Preparada',
  despachada: 'Despachada', facturada: 'Facturada',
  cancelada: 'Cancelada', rechazada: 'Rechazada',
}
