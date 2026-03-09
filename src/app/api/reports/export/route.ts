import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildWorkbook, excelResponse } from '@/lib/reports/excel'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function getPeriodDates(period: string, from?: string, to?: string) {
  const now = new Date()
  if (period === 'custom' && from && to) {
    return { start: from, end: to + 'T23:59:59' }
  }
  const start = new Date(now)
  if (period === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    start.setDate(1); start.setHours(0, 0, 0, 0)
  } else if (period === 'year') {
    start.setMonth(0, 1); start.setHours(0, 0, 0, 0)
  }
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: endOfDay.toISOString() }
}

const fmt = (n: any) => Number(n ?? 0).toFixed(2)

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
  const type   = sp.get('type') ?? 'ventas'
  const period = sp.get('period') ?? 'month'
  const from   = sp.get('from') ?? undefined
  const to     = sp.get('to')   ?? undefined
  const { start, end } = getPeriodDates(period, from, to)
  const cid    = profile.company_id

  // ── VENTAS ────────────────────────────────────────────────────────────────
  if (type === 'ventas') {
    const { data: orders } = await supabase
      .from('sales_orders')
      .select('order_number, status, total, order_date, profiles(full_name), clients(name, city)')
      .eq('company_id', cid)
      .gte('order_date', start)
      .lte('order_date', end)
      .order('order_date', { ascending: false })

    const rows = (orders ?? []).map(o => ({
      'N° Orden':    o.order_number ?? '',
      'Fecha':       o.order_date,
      'Cliente':     (o.clients as any)?.name ?? '—',
      'Ciudad':      (o.clients as any)?.city ?? '—',
      'Vendedor':    (o.profiles as any)?.full_name ?? '—',
      'Estado':      o.status,
      'Total (HNL)': fmt(o.total),
    }))

    const buffer = buildWorkbook([{ name: 'Ventas', data: rows }])
    return excelResponse(buffer, `ventas_${period}_${Date.now()}.xlsx`)
  }

  // ── INVENTARIO ────────────────────────────────────────────────────────────
  if (type === 'inventario') {
    const { data: products } = await supabase
      .from('products')
      .select('code, name, unit, stock, min_stock, purchase_price, sale_price, active')
      .eq('company_id', cid)
      .order('name')

    const rows = (products ?? []).map(p => ({
      'Código':               p.code ?? '',
      'Producto':             p.name,
      'Unidad':               p.unit ?? '',
      'Stock Actual':         Number(p.stock ?? 0),
      'Stock Mínimo':         Number(p.min_stock ?? 0),
      'Alerta':               Number(p.stock) <= Number(p.min_stock) ? 'SÍ' : 'NO',
      'Precio Compra (HNL)':  fmt(p.purchase_price),
      'Precio Venta (HNL)':   fmt(p.sale_price),
      'Valor Inventario':     fmt(Number(p.stock) * Number(p.purchase_price ?? 0)),
      'Activo':               p.active ? 'Sí' : 'No',
    }))

    const buffer = buildWorkbook([{ name: 'Inventario', data: rows }])
    return excelResponse(buffer, `inventario_${Date.now()}.xlsx`)
  }

  // ── MOVIMIENTOS DE STOCK ──────────────────────────────────────────────────
  if (type === 'movimientos') {
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('type, quantity, reason, created_at, products(code, name, unit), profiles(full_name)')
      .eq('company_id', cid)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })

    const rows = (movements ?? []).map(m => ({
      'Fecha':    new Date(m.created_at).toLocaleDateString('es-HN'),
      'Producto': (m.products as any)?.name ?? '—',
      'Código':   (m.products as any)?.code ?? '—',
      'Tipo':     m.type === 'entrada' ? 'Entrada' : 'Salida',
      'Cantidad': Number(m.quantity),
      'Motivo':   m.reason ?? '—',
      'Usuario':  (m.profiles as any)?.full_name ?? '—',
    }))

    const buffer = buildWorkbook([{ name: 'Movimientos', data: rows }])
    return excelResponse(buffer, `movimientos_stock_${Date.now()}.xlsx`)
  }

  // ── FISCAL ISV ────────────────────────────────────────────────────────────
  if (type === 'isv') {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('invoice_number, issued_at, status, subtotal, isv_amount, total, clients(name, rtn)')
      .eq('company_id', cid)
      .gte('issued_at', start.split('T')[0])
      .lte('issued_at', end.split('T')[0])
      .order('issued_at', { ascending: false })

    const rows = (invoices ?? []).map(inv => ({
      'N° Factura':        inv.invoice_number ?? '',
      'Fecha Emisión':     new Date(inv.issued_at).toLocaleDateString('es-HN'),
      'Cliente':           (inv.clients as any)?.name ?? '—',
      'RTN Cliente':       (inv.clients as any)?.rtn ?? '—',
      'Estado':            inv.status ?? '',
      'Subtotal (HNL)':    fmt(inv.subtotal),
      'ISV 15% (HNL)':     fmt(inv.isv_amount),
      'Total (HNL)':       fmt(inv.total),
    }))

    const totalIsv = (invoices ?? []).reduce((s, i) => s + Number(i.isv_amount ?? 0), 0)
    rows.push({
      'N° Factura': 'TOTAL',
      'Fecha Emisión': '',
      'Cliente': '',
      'RTN Cliente': '',
      'Estado': '',
      'Subtotal (HNL)': fmt((invoices ?? []).reduce((s, i) => s + Number(i.subtotal ?? 0), 0)),
      'ISV 15% (HNL)':  fmt(totalIsv),
      'Total (HNL)':    fmt((invoices ?? []).reduce((s, i) => s + Number(i.total ?? 0), 0)),
    })

    const buffer = buildWorkbook([{ name: 'ISV Causado', data: rows }])
    return excelResponse(buffer, `reporte_isv_${Date.now()}.xlsx`)
  }

  // ── CUENTAS POR COBRAR ────────────────────────────────────────────────────
  if (type === 'cxc') {
    const { data: clients } = await supabase
      .from('clients')
      .select('name, rtn, city, phone, current_balance, credit_limit, status')
      .eq('company_id', cid)
      .gt('current_balance', 0)
      .order('current_balance', { ascending: false })

    const rows = (clients ?? []).map(c => ({
      'Cliente':             c.name,
      'RTN':                 c.rtn ?? '—',
      'Ciudad':              c.city ?? '—',
      'Teléfono':            c.phone ?? '—',
      'Saldo Pendiente':     fmt(c.current_balance),
      'Límite Crédito':      fmt(c.credit_limit ?? 0),
      'Crédito Disponible':  fmt(Math.max(0, Number(c.credit_limit ?? 0) - Number(c.current_balance))),
      'Estado':              c.status,
      'Excede límite':       Number(c.current_balance) > Number(c.credit_limit ?? 0) ? 'SÍ' : 'NO',
    }))

    const buffer = buildWorkbook([{ name: 'Cuentas x Cobrar', data: rows }])
    return excelResponse(buffer, `cuentas_por_cobrar_${Date.now()}.xlsx`)
  }

  // ── COMPRAS ───────────────────────────────────────────────────────────────
  if (type === 'compras') {
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('po_number, order_date, status, subtotal, isv_amount, total, suppliers(name, rtn)')
      .eq('company_id', cid)
      .gte('order_date', start.split('T')[0])
      .lte('order_date', end.split('T')[0])
      .order('order_date', { ascending: false })

    const rows = (pos ?? []).map(p => ({
      'OC N°':             `OC-${String(p.po_number).padStart(5, '0')}`,
      'Fecha':             p.order_date,
      'Proveedor':         (p.suppliers as any)?.name ?? '—',
      'RTN Proveedor':     (p.suppliers as any)?.rtn ?? '—',
      'Estado':            p.status,
      'Subtotal (HNL)':    fmt(p.subtotal),
      'ISV (HNL)':         fmt((p as any).isv_amount),
      'Total (HNL)':       fmt(p.total),
    }))

    const buffer = buildWorkbook([{ name: 'Compras', data: rows }])
    return excelResponse(buffer, `compras_${period}_${Date.now()}.xlsx`)
  }

  // ── FACTURAS EMITIDAS ─────────────────────────────────────────────────────
  if (type === 'facturas') {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('invoice_number, issued_at, status, subtotal, isv_amount, total, clients(name, rtn)')
      .eq('company_id', cid)
      .gte('issued_at', start.split('T')[0])
      .lte('issued_at', end.split('T')[0])
      .order('issued_at', { ascending: false })

    const rows = (invoices ?? []).map(inv => ({
      'N° Factura':        inv.invoice_number ?? '',
      'Fecha Emisión':     inv.issued_at,
      'Cliente':           (inv.clients as any)?.name ?? '—',
      'RTN Cliente':       (inv.clients as any)?.rtn ?? '—',
      'Estado':            inv.status ?? '',
      'Subtotal (HNL)':    fmt(inv.subtotal),
      'ISV 15% (HNL)':     fmt(inv.isv_amount),
      'Total (HNL)':       fmt(inv.total),
    }))

    const buffer = buildWorkbook([{ name: 'Facturas', data: rows }])
    return excelResponse(buffer, `facturas_${period}_${Date.now()}.xlsx`)
  }

  // ── AGING FACTURAS PENDIENTES ─────────────────────────────────────────────
  if (type === 'aging_facturas') {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('invoice_number, issued_at, status, total, clients(name, rtn, phone)')
      .eq('company_id', cid)
      .in('status', ['pendiente', 'emitida'])
      .order('issued_at', { ascending: false })

    const now2 = new Date()
    const rows = (invoices ?? []).map(inv => {
      const issued = new Date(inv.issued_at)
      const days = Math.floor((now2.getTime() - issued.getTime()) / 86400000)
      return {
        'N° Factura':    inv.invoice_number ?? '',
        'Fecha Emisión': inv.issued_at,
        'Vencimiento':   inv.issued_at,
        'Días Vencido':  Math.max(0, days),
        'Rango':         days <= 0 ? 'Al día' : days <= 30 ? '1-30 días' : days <= 60 ? '31-60 días' : '+60 días',
        'Cliente':       (inv.clients as any)?.name ?? '—',
        'RTN':           (inv.clients as any)?.rtn ?? '—',
        'Teléfono':      (inv.clients as any)?.phone ?? '—',
        'Total (HNL)':   fmt(inv.total),
        'Estado':        inv.status,
      }
    })

    const buffer = buildWorkbook([{ name: 'Aging Facturas', data: rows }])
    return excelResponse(buffer, `aging_facturas_${Date.now()}.xlsx`)
  }

  // ── VENTAS POR VENDEDOR ───────────────────────────────────────────────────
  if (type === 'ventas_vendedor') {
    const { data: orders } = await supabase
      .from('sales_orders')
      .select('total, profiles(full_name)')
      .eq('company_id', cid)
      .gte('order_date', start)
      .lte('order_date', end)
      .neq('status', 'cancelada')

    const byVend: Record<string, { total: number; ordenes: number }> = {}
    const grandTotal = (orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0)
    ;(orders ?? []).forEach(o => {
      const v = (o.profiles as any)?.full_name ?? 'Sin asignar'
      if (!byVend[v]) byVend[v] = { total: 0, ordenes: 0 }
      byVend[v].total   += Number(o.total ?? 0)
      byVend[v].ordenes += 1
    })

    const rows = Object.entries(byVend)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([vendedor, d], i) => ({
        'Ranking':            i + 1,
        'Vendedor':           vendedor,
        'Órdenes':            d.ordenes,
        'Total Ventas (HNL)': fmt(d.total),
        'Ticket Promedio':    fmt(d.ordenes > 0 ? d.total / d.ordenes : 0),
        '% del Total':        grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) + '%' : '0%',
      }))

    const buffer = buildWorkbook([{ name: 'Ventas por Vendedor', data: rows }])
    return excelResponse(buffer, `ventas_vendedor_${period}_${Date.now()}.xlsx`)
  }

  // ── VENTAS POR PRODUCTO ───────────────────────────────────────────────────
  if (type === 'ventas_producto') {
    const { data: orders } = await supabase
      .from('sales_orders').select('id')
      .eq('company_id', cid)
      .gte('order_date', start)
      .lte('order_date', end)
      .neq('status', 'cancelada')

    const activeIds = (orders ?? []).map(o => o.id)
    if (activeIds.length === 0) {
      const buffer = buildWorkbook([{ name: 'Ventas por Producto', data: [{ 'Mensaje': 'Sin datos' }] }])
      return excelResponse(buffer, `ventas_producto_${period}_${Date.now()}.xlsx`)
    }

    const { data: items } = await supabase
      .from('sales_order_items')
      .select('quantity, line_total, products(code, name, unit)')
      .in('order_id', activeIds)

    const byProd: Record<string, { code: string; unit: string; total: number; unidades: number }> = {}
    ;(items ?? []).forEach(i => {
      const name = (i.products as any)?.name ?? 'Desconocido'
      if (!byProd[name]) byProd[name] = {
        code: (i.products as any)?.code ?? '', unit: (i.products as any)?.unit ?? '',
        total: 0, unidades: 0,
      }
      byProd[name].total    += Number(i.line_total ?? 0)
      byProd[name].unidades += Number(i.quantity ?? 0)
    })

    const grandTotal = Object.values(byProd).reduce((s, d) => s + d.total, 0)
    const rows = Object.entries(byProd)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([producto, d], i) => ({
        'Ranking':           i + 1,
        'Código':            d.code,
        'Producto':          producto,
        'Unidad':            d.unit,
        'Unidades Vendidas': d.unidades,
        'Ingresos (HNL)':    fmt(d.total),
        '% del Total':       grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) + '%' : '0%',
      }))

    const buffer = buildWorkbook([{ name: 'Ventas por Producto', data: rows }])
    return excelResponse(buffer, `ventas_producto_${period}_${Date.now()}.xlsx`)
  }

  // ── VENTAS POR CLIENTE ────────────────────────────────────────────────────
  if (type === 'ventas_cliente') {
    const { data: orders } = await supabase
      .from('sales_orders')
      .select('total, clients(name, rtn, city, phone)')
      .eq('company_id', cid)
      .gte('order_date', start)
      .lte('order_date', end)
      .neq('status', 'cancelada')

    const byClient: Record<string, { rtn: string; city: string; phone: string; total: number; frecuencia: number }> = {}
    ;(orders ?? []).forEach(o => {
      const name = (o.clients as any)?.name ?? 'Sin cliente'
      if (!byClient[name]) byClient[name] = {
        rtn: (o.clients as any)?.rtn ?? '—', city: (o.clients as any)?.city ?? '—',
        phone: (o.clients as any)?.phone ?? '—', total: 0, frecuencia: 0,
      }
      byClient[name].total     += Number(o.total ?? 0)
      byClient[name].frecuencia += 1
    })

    const rows = Object.entries(byClient)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cliente, d], i) => ({
        'Ranking':         i + 1,
        'Cliente':         cliente,
        'RTN':             d.rtn,
        'Ciudad':          d.city,
        'Teléfono':        d.phone,
        'N° Órdenes':      d.frecuencia,
        'Total Comprado':  fmt(d.total),
        'Ticket Promedio': fmt(d.frecuencia > 0 ? d.total / d.frecuencia : 0),
      }))

    const buffer = buildWorkbook([{ name: 'Ventas por Cliente', data: rows }])
    return excelResponse(buffer, `ventas_cliente_${period}_${Date.now()}.xlsx`)
  }

  // ── ÓRDENES POR ESTADO ────────────────────────────────────────────────────
  if (type === 'ordenes_estado') {
    const { data: orders } = await supabase
      .from('sales_orders')
      .select('order_number, status, total, order_date, clients(name), profiles(full_name)')
      .eq('company_id', cid)
      .gte('order_date', start)
      .lte('order_date', end)
      .order('status')

    const STATUS_ES: Record<string, string> = {
      pendiente: 'Pendiente', pendiente_aprobacion: 'Pend. aprobación',
      en_preparacion: 'En preparación', preparada: 'Preparada',
      despachada: 'Despachada', facturada: 'Facturada',
      cancelada: 'Cancelada', rechazada: 'Rechazada',
    }
    const rows = (orders ?? []).map(o => ({
      'N° Orden':    o.order_number ?? '',
      'Fecha':       o.order_date,
      'Estado':      STATUS_ES[o.status] ?? o.status,
      'Cliente':     (o.clients as any)?.name ?? '—',
      'Vendedor':    (o.profiles as any)?.full_name ?? '—',
      'Total (HNL)': fmt(o.total),
    }))

    const buffer = buildWorkbook([{ name: 'Órdenes por Estado', data: rows }])
    return excelResponse(buffer, `ordenes_estado_${period}_${Date.now()}.xlsx`)
  }

  // ── STOCK BAJO MÍNIMO ─────────────────────────────────────────────────────
  if (type === 'stock_bajo') {
    const { data: products } = await supabase
      .from('products')
      .select('code, name, unit, stock, min_stock, purchase_price')
      .eq('company_id', cid).eq('active', true).order('name')

    const rows = (products ?? [])
      .filter(p => Number(p.stock) <= Number(p.min_stock))
      .map(p => ({
        'Código':          p.code ?? '',
        'Producto':        p.name,
        'Unidad':          p.unit ?? '',
        'Stock Actual':    Number(p.stock ?? 0),
        'Stock Mínimo':    Number(p.min_stock ?? 0),
        'Diferencia':      Number(p.min_stock ?? 0) - Number(p.stock ?? 0),
        'Precio Compra':   fmt(p.purchase_price),
        'Valor a Reponer': fmt((Number(p.min_stock ?? 0) - Number(p.stock ?? 0)) * Number(p.purchase_price ?? 0)),
      }))

    const buffer = buildWorkbook([{ name: 'Stock Bajo Mínimo', data: rows }])
    return excelResponse(buffer, `stock_bajo_${Date.now()}.xlsx`)
  }

  // ── ROTACIÓN DE INVENTARIO ────────────────────────────────────────────────
  if (type === 'rotacion') {
    const { data: products } = await supabase
      .from('products').select('id, code, name, stock, purchase_price')
      .eq('company_id', cid).eq('active', true)

    const { data: movements } = await supabase
      .from('stock_movements')
      .select('product_id, quantity')
      .eq('company_id', cid)
      .gte('created_at', start)
      .lte('created_at', end)
      .in('type', ['salida', 'venta'])

    const movByProd: Record<string, number> = {}
    ;(movements ?? []).forEach(m => {
      movByProd[m.product_id] = (movByProd[m.product_id] ?? 0) + Number(m.quantity ?? 0)
    })

    const rows = (products ?? [])
      .map(p => ({
        'Código':           p.code ?? '',
        'Producto':         p.name,
        'Stock Actual':     Number(p.stock ?? 0),
        'Unidades Salidas': movByProd[p.id] ?? 0,
        'Índice Rotación':  Number(p.stock ?? 0) > 0
          ? ((movByProd[p.id] ?? 0) / Number(p.stock)).toFixed(2) : '—',
        'Estado':           (movByProd[p.id] ?? 0) === 0 ? 'Sin rotación'
          : (movByProd[p.id] ?? 0) > 50 ? 'Alta rotación' : 'Normal',
      }))
      .sort((a, b) => Number(b['Unidades Salidas']) - Number(a['Unidades Salidas']))

    const buffer = buildWorkbook([{ name: 'Rotación Inventario', data: rows }])
    return excelResponse(buffer, `rotacion_inventario_${period}_${Date.now()}.xlsx`)
  }

  // ── VALORACIÓN DE INVENTARIO ──────────────────────────────────────────────
  if (type === 'valoracion') {
    const { data: products } = await supabase
      .from('products')
      .select('code, name, unit, stock, purchase_price, categories(name)')
      .eq('company_id', cid).eq('active', true).order('name')

    const rows = (products ?? []).map(p => ({
      'Categoría':         (p.categories as any)?.name ?? 'Sin categoría',
      'Código':            p.code ?? '',
      'Producto':          p.name,
      'Unidad':            p.unit ?? '',
      'Stock':             Number(p.stock ?? 0),
      'Costo Unitario':    fmt(p.purchase_price),
      'Valor Total (HNL)': fmt(Number(p.stock ?? 0) * Number(p.purchase_price ?? 0)),
    }))

    const buffer = buildWorkbook([{ name: 'Valoración Inventario', data: rows }])
    return excelResponse(buffer, `valoracion_inventario_${Date.now()}.xlsx`)
  }

  // ── PAGOS A PROVEEDORES ───────────────────────────────────────────────────
  if (type === 'pagos_proveedores') {
    const { data: payments } = await supabase
      .from('supplier_payments')
      .select('payment_date, amount, payment_method, reference, notes, suppliers(name, rtn), purchase_orders(po_number)')
      .eq('company_id', cid)
      .gte('payment_date', start.split('T')[0])
      .lte('payment_date', end.split('T')[0])
      .order('payment_date', { ascending: false })

    const rows = (payments ?? []).map(p => ({
      'Fecha':          p.payment_date,
      'Proveedor':      (p.suppliers as any)?.name ?? '—',
      'RTN Proveedor':  (p.suppliers as any)?.rtn ?? '—',
      'OC Referida':    (p.purchase_orders as any)?.po_number
        ? `OC-${String((p.purchase_orders as any).po_number).padStart(5, '0')}` : '—',
      'Monto (HNL)':    fmt(p.amount),
      'Método':         p.payment_method ?? '—',
      'Referencia':     p.reference ?? '—',
      'Notas':          p.notes ?? '',
    }))

    const buffer = buildWorkbook([{ name: 'Pagos Proveedores', data: rows }])
    return excelResponse(buffer, `pagos_proveedores_${period}_${Date.now()}.xlsx`)
  }

  return new Response('Tipo de reporte no válido', { status: 400 })
}
