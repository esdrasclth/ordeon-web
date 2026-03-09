import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function getPeriodDates(period: string, from?: string, to?: string) {
  const now = new Date()
  if (period === 'custom' && from && to) {
    return { start: from + 'T00:00:00', end: to + 'T23:59:59' }
  }
  const start = new Date(now)
  if      (period === 'today') { start.setHours(0, 0, 0, 0) }
  else if (period === 'week')  { start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0) }
  else if (period === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0) }
  else if (period === 'year')  { start.setMonth(0, 1); start.setHours(0, 0, 0, 0) }
  // end = end of today (23:59:59.999) to include all records created today
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: endOfDay.toISOString() }
}

const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export async function GET(req: NextRequest) {
  // Auth check con anon key (respeta RLS para verificar identidad)
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })

  const { data: profile } = await authClient
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return new Response('Sin empresa', { status: 400 })

  // Admin client para queries de datos (bypass RLS — reportes ven todo)
  const supabase = createAdminClient()

  const sp     = req.nextUrl.searchParams
  const module = sp.get('module') ?? 'ventas'
  const period = sp.get('period') ?? 'month'
  const from   = sp.get('from')   ?? undefined
  const to     = sp.get('to')     ?? undefined
  const { start, end } = getPeriodDates(period, from, to)
  const cid = profile.company_id

  // ── VENTAS ────────────────────────────────────────────────────────────────
  if (module === 'ventas') {
    const { data: orders } = await supabase
      .from('sales_orders')
      .select('id, total, status, order_date, profiles(full_name), clients(id, name)')
      .eq('company_id', cid)
      .gte('order_date', start)
      .lte('order_date', end)

    const active  = (orders ?? []).filter(o => o.status !== 'cancelada')
    const totalVentas    = active.reduce((s, o) => s + Number(o.total ?? 0), 0)
    const totalOrdenes   = active.length
    const ticketPromedio = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0
    const clienteIds     = new Set(active.map(o => (o.clients as any)?.id).filter(Boolean))

    // Por día
    const byDay: Record<string, number> = {}
    active.forEach(o => {
      const d = o.order_date?.slice(5) ?? '' // MM-DD
      byDay[d] = (byDay[d] ?? 0) + Number(o.total ?? 0)
    })
    const porDia = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dia, total]) => ({ dia, total }))

    // Por vendedor
    const byVend: Record<string, number> = {}
    active.forEach(o => {
      const v = (o.profiles as any)?.full_name ?? 'Sin asignar'
      byVend[v] = (byVend[v] ?? 0) + Number(o.total ?? 0)
    })
    const porVendedor = Object.entries(byVend)
      .sort((a, b) => b[1] - a[1])
      .map(([vendedor, total]) => ({ vendedor, total }))

    // Por producto — sales_order_items
    const porProducto: { producto: string; total: number; unidades: number }[] = []
    if (active.length > 0) {
      const { data: items } = await supabase
        .from('sales_order_items')
        .select('quantity, line_total, products(name)')
        .in('order_id', active.map(o => o.id))

      const byProd: Record<string, { total: number; unidades: number }> = {}
      ;(items ?? []).forEach(i => {
        const p = (i.products as any)?.name ?? 'Desconocido'
        if (!byProd[p]) byProd[p] = { total: 0, unidades: 0 }
        byProd[p].total    += Number(i.line_total ?? 0)
        byProd[p].unidades += Number(i.quantity ?? 0)
      })
      porProducto.push(...Object.entries(byProd)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([producto, d]) => ({ producto, total: d.total, unidades: d.unidades })))
    }

    // Por estado
    const byStatus: Record<string, number> = {}
    ;(orders ?? []).forEach(o => { byStatus[o.status] = (byStatus[o.status] ?? 0) + 1 })
    const STATUS_ES: Record<string, string> = {
      pendiente: 'Pendiente', pendiente_aprobacion: 'Pend. aprobación',
      en_preparacion: 'En preparación', preparada: 'Preparada',
      despachada: 'Despachada', facturada: 'Facturada',
      cancelada: 'Cancelada', rechazada: 'Rechazada',
    }
    const porEstado = Object.entries(byStatus)
      .map(([estado, cantidad]) => ({ estado: STATUS_ES[estado] ?? estado, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)

    return Response.json({
      kpis: { totalVentas, totalOrdenes, ticketPromedio, clientesUnicos: clienteIds.size },
      porDia, porVendedor, porProducto, porEstado,
    })
  }

  // ── INVENTARIO ────────────────────────────────────────────────────────────
  if (module === 'inventario') {
    const [{ data: products }, { data: movements }] = await Promise.all([
      supabase.from('products')
        .select('id, name, stock, min_stock, purchase_price, active')
        .eq('company_id', cid).eq('active', true),
      supabase.from('stock_movements')
        .select('type, quantity')
        .eq('company_id', cid)
        .gte('created_at', start)
        .lte('created_at', end),
    ])

    const prods = products ?? []
    const movs  = movements ?? []

    const totalProductos  = prods.length
    const bajoMinimo      = prods.filter(p => Number(p.stock) <= Number(p.min_stock)).length
    const valorInventario = prods.reduce((s, p) => s + Number(p.stock ?? 0) * Number(p.purchase_price ?? 0), 0)

    const topStock = [...prods]
      .sort((a, b) => Number(b.stock) - Number(a.stock))
      .slice(0, 10)
      .map(p => ({ producto: p.name, stock: Number(p.stock) }))

    const byTipo: Record<string, number> = {}
    movs.forEach(m => { byTipo[m.type] = (byTipo[m.type] ?? 0) + 1 })
    const TIPO_ES: Record<string, string> = {
      entrada: 'Entrada', salida: 'Salida', ajuste: 'Ajuste',
      venta: 'Venta', devolucion: 'Devolución',
    }
    const movPorTipo = Object.entries(byTipo)
      .map(([tipo, cantidad]) => ({ tipo: TIPO_ES[tipo] ?? tipo, cantidad }))

    return Response.json({
      kpis: { totalProductos, bajoMinimo, valorInventario, movimientos: movs.length },
      topStock,
      movPorTipo,
    })
  }

  // ── FACTURACIÓN ───────────────────────────────────────────────────────────
  if (module === 'facturacion') {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()

    const [{ data: invoices }, { data: allYear }] = await Promise.all([
      supabase.from('invoices')
        .select('id, status, subtotal, isv_amount, total, issued_at')
        .eq('company_id', cid)
        .gte('issued_at', start)
        .lte('issued_at', end),
      supabase.from('invoices')
        .select('subtotal, isv_amount, issued_at, status')
        .eq('company_id', cid)
        .gte('issued_at', yearStart),
    ])

    const invs   = (invoices ?? [])
    const active = invs.filter(i => i.status !== 'anulada')

    const totalFacturado  = active.reduce((s, i) => s + Number(i.total ?? 0), 0)
    const totalIsv        = active.reduce((s, i) => s + Number(i.isv_amount ?? 0), 0)
    const pendientesCobro = invs.filter(i => i.status === 'pendiente' || i.status === 'emitida').length

    // Por mes (año actual)
    const byMes: Record<number, { subtotal: number; isv: number }> = {}
    for (let m = 0; m < 12; m++) byMes[m] = { subtotal: 0, isv: 0 }
    ;(allYear ?? []).filter(i => i.status !== 'anulada').forEach(i => {
      const m = new Date(i.issued_at).getMonth()
      byMes[m].subtotal += Number(i.subtotal ?? 0)
      byMes[m].isv      += Number(i.isv_amount ?? 0)
    })
    const porMes = Object.entries(byMes).map(([m, d]) => ({
      mes: MES[Number(m)], subtotal: d.subtotal, isv: d.isv,
    }))

    // Aging (solo pendientes/emitidas)
    const now = new Date()
    const aging = [
      { rango: 'Al día',   cantidad: 0 },
      { rango: '1-30d',    cantidad: 0 },
      { rango: '31-60d',   cantidad: 0 },
      { rango: '+60d',     cantidad: 0 },
    ]
    invs.filter(i => i.status === 'pendiente' || i.status === 'emitida').forEach(i => {
      const due   = new Date(i.issued_at)
      const days  = Math.floor((now.getTime() - due.getTime()) / 86400000)
      if      (days <= 0)  aging[0].cantidad++
      else if (days <= 30) aging[1].cantidad++
      else if (days <= 60) aging[2].cantidad++
      else                 aging[3].cantidad++
    })

    return Response.json({
      kpis: { totalFacturas: invs.length, totalFacturado, totalIsv, pendientesCobro },
      porMes, aging,
    })
  }

  // ── COMPRAS ───────────────────────────────────────────────────────────────
  if (module === 'compras') {
    const [{ data: pos }, { data: payments }] = await Promise.all([
      supabase.from('purchase_orders')
        .select('id, status, subtotal, total, suppliers(name)')
        .eq('company_id', cid)
        .gte('order_date', start.split('T')[0])
        .lte('order_date', end.split('T')[0]),
      supabase.from('supplier_payments')
        .select('amount')
        .eq('company_id', cid)
        .gte('payment_date', start.split('T')[0])
        .lte('payment_date', end.split('T')[0]),
    ])

    const active = (pos ?? []).filter(p => p.status !== 'cancelada')
    const totalComprado = active.reduce((s, p) => s + Number(p.total ?? 0), 0)
    const totalPagado   = (payments ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0)
    const provNames     = new Set(active.map(p => (p.suppliers as any)?.name).filter(Boolean))

    const byProv: Record<string, number> = {}
    active.forEach(p => {
      const name = (p.suppliers as any)?.name ?? 'Sin proveedor'
      byProv[name] = (byProv[name] ?? 0) + Number(p.total ?? 0)
    })
    const porProveedor = Object.entries(byProv)
      .sort((a, b) => b[1] - a[1])
      .map(([proveedor, total]) => ({ proveedor, total }))

    const byStatus: Record<string, number> = {}
    ;(pos ?? []).forEach(p => { byStatus[p.status] = (byStatus[p.status] ?? 0) + 1 })
    const STATUS_ES: Record<string, string> = {
      borrador: 'Borrador', enviada: 'Enviada',
      recibida_parcial: 'Recibida parcial', recibida: 'Recibida', cancelada: 'Cancelada',
    }
    const porEstado = Object.entries(byStatus)
      .map(([estado, cantidad]) => ({ estado: STATUS_ES[estado] ?? estado, cantidad }))

    return Response.json({
      kpis: { totalOC: (pos ?? []).length, totalComprado, proveedores: provNames.size, totalPagado },
      porProveedor, porEstado,
    })
  }

  return new Response('Módulo no válido', { status: 400 })
}
