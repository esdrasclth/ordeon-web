'use client'

import {
  Document, Page, Text, View, StyleSheet, Font
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        10,
    paddingTop:      40,
    paddingBottom:   50,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    color:           '#1a1a2e',
  },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   28,
    paddingBottom:  20,
    borderBottomWidth: 2,
    borderBottomColor: '#031926',
  },
  companyBlock: {
    flex: 1,
  },
  companyName: {
    fontSize:   22,
    fontFamily: 'Helvetica-Bold',
    color:      '#031926',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color:    '#777',
    marginBottom: 2,
  },
  orderBlock: {
    alignItems: 'flex-end',
  },
  orderTitle: {
    fontSize:     14,
    fontFamily:   'Helvetica-Bold',
    color:        '#468189',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  orderNumber: {
    fontSize:   20,
    fontFamily: 'Helvetica-Bold',
    color:      '#031926',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 9,
    color:    '#777',
  },

  // Badges
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      4,
    marginTop:         6,
  },
  statusText: {
    fontSize:   9,
    fontFamily: 'Helvetica-Bold',
    color:      '#ffffff',
  },

  // Info grid
  infoGrid: {
    flexDirection:  'row',
    gap:            12,
    marginBottom:   24,
  },
  infoBox: {
    flex:              1,
    backgroundColor:   '#f8fafa',
    borderRadius:      6,
    padding:           14,
    borderWidth:       1,
    borderColor:       '#e0eded',
  },
  infoBoxTitle: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    color:        '#468189',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoRow: {
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 8,
    color:    '#9DBEBB',
    marginBottom: 1,
  },
  infoValue: {
    fontSize:   9,
    fontFamily: 'Helvetica-Bold',
    color:      '#031926',
  },

  // Tabla
  tableContainer: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: '#031926',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius:    4,
    marginBottom:    1,
  },
  tableHeaderText: {
    fontSize:   8,
    fontFamily: 'Helvetica-Bold',
    color:      '#F4E9CD',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection:     'row',
    paddingVertical:   8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 9,
    color:    '#333',
  },
  tableCellBold: {
    fontSize:   9,
    fontFamily: 'Helvetica-Bold',
    color:      '#031926',
  },

  // Columnas tabla
  colCode:    { width: '8%'  },
  colName:    { width: '28%' },
  colUnit:    { width: '8%'  },
  colQty:     { width: '8%', textAlign: 'center' },
  colPrice:   { width: '12%', textAlign: 'right' },
  colBase:    { width: '12%', textAlign: 'right' },
  colIsv:     { width: '12%', textAlign: 'right' },
  colDisc:    { width: '6%',  textAlign: 'center' },
  colTotal:   { width: '14%', textAlign: 'right' },

  // Totales
  totalsContainer: {
    alignItems:      'flex-end',
    marginBottom:    20,
  },
  totalsBox: {
    width:           240,
    backgroundColor: '#f8fafa',
    borderRadius:    6,
    padding:         14,
    borderWidth:     1,
    borderColor:     '#e0eded',
  },
  totalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   6,
  },
  totalLabel: {
    fontSize: 9,
    color:    '#777',
  },
  totalValue: {
    fontSize: 9,
    color:    '#333',
  },
  totalDivider: {
    borderTopWidth: 1.5,
    borderTopColor: '#031926',
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize:   12,
    fontFamily: 'Helvetica-Bold',
    color:      '#031926',
  },
  grandTotalValue: {
    fontSize:   12,
    fontFamily: 'Helvetica-Bold',
    color:      '#468189',
  },

  // Factura
  invoiceBox: {
    backgroundColor: '#f0f9f8',
    borderRadius:    6,
    padding:         14,
    borderWidth:     1,
    borderColor:     '#468189',
    marginBottom:    16,
  },
  invoiceTitle: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    color:        '#468189',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  invoiceNumber: {
    fontSize:   14,
    fontFamily: 'Helvetica-Bold',
    color:      '#031926',
  },

  // Notas
  notesBox: {
    backgroundColor: '#f8fafa',
    borderRadius:    6,
    padding:         12,
    borderWidth:     1,
    borderColor:     '#e0eded',
    marginBottom:    16,
  },
  notesTitle: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    color:        '#468189',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  notesText: {
    fontSize:   9,
    color:      '#555',
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    position:   'absolute',
    bottom:     24,
    left:       40,
    right:      40,
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    borderTopWidth: 1,
    borderTopColor: '#e0eded',
    paddingTop:     10,
  },
  footerText: {
    fontSize: 8,
    color:    '#9DBEBB',
  },
})

const STATUS_LABELS: Record<string, string> = {
  pendiente:      'Pendiente',
  en_preparacion: 'En Preparación',
  preparada:      'Preparada',
  despachada:     'Despachada',
  facturada:      'Facturada',
  cancelada:      'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  pendiente:      '#e67e22',
  en_preparacion: '#2980b9',
  preparada:      '#27ae60',
  despachada:     '#16a085',
  facturada:      '#468189',
  cancelada:      '#d94f4f',
}

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface OrderPDFProps {
  order:    any
  settings: Record<string, string>
}

export function OrderPDF({ order, settings }: OrderPDFProps) {
  const orderDate = new Date(order.order_date).toLocaleDateString('es-HN', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const deliveryDate = order.delivery_date
    ? new Date(order.delivery_date).toLocaleDateString('es-HN', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : '—'

  const statusColor = STATUS_COLORS[order.status] ?? '#888'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>
              {settings.company_name || 'Ordeon'}
            </Text>
            {settings.company_rtn && (
              <Text style={styles.companyDetail}>RTN: {settings.company_rtn}</Text>
            )}
            {settings.company_address && (
              <Text style={styles.companyDetail}>{settings.company_address}</Text>
            )}
            {settings.company_phone && (
              <Text style={styles.companyDetail}>Tel: {settings.company_phone}</Text>
            )}
            {settings.company_email && (
              <Text style={styles.companyDetail}>{settings.company_email}</Text>
            )}
          </View>

          <View style={styles.orderBlock}>
            <Text style={styles.orderTitle}>Orden de Venta</Text>
            <Text style={styles.orderNumber}>
              #{String(order.order_number).padStart(5, '0')}
            </Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {STATUS_LABELS[order.status] ?? order.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Info grid: Cliente + Detalles */}
        <View style={styles.infoGrid}>

          {/* Cliente */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Cliente</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{order.clients?.name ?? '—'}</Text>
            </View>
            {order.clients?.rtn && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>RTN</Text>
                <Text style={styles.infoValue}>{order.clients.rtn}</Text>
              </View>
            )}
            {order.clients?.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{order.clients.phone}</Text>
              </View>
            )}
            {order.clients?.city && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ciudad</Text>
                <Text style={styles.infoValue}>{order.clients.city}</Text>
              </View>
            )}
          </View>

          {/* Detalles */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Detalles</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vendedor</Text>
              <Text style={styles.infoValue}>{order.profiles?.full_name ?? '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lista de precios</Text>
              <Text style={styles.infoValue}>Lista {order.price_list}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Términos de pago</Text>
              <Text style={styles.infoValue}>{order.payment_terms}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Método de entrega</Text>
              <Text style={styles.infoValue}>{order.delivery_method}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha estimada de entrega</Text>
              <Text style={styles.infoValue}>{deliveryDate}</Text>
            </View>
          </View>
        </View>

        {/* Tabla de productos */}
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colCode]}>Código</Text>
            <Text style={[styles.tableHeaderText, styles.colName]}>Producto</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unidad</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>P. c/ISV</Text>
            <Text style={[styles.tableHeaderText, styles.colBase]}>P. s/ISV</Text>
            <Text style={[styles.tableHeaderText, styles.colIsv]}>ISV</Text>
            <Text style={[styles.tableHeaderText, styles.colDisc]}>Desc.</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {/* Filas */}
          {order.sales_order_items?.map((item: any, i: number) => (
            <View
              key={item.id}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableCell, styles.colCode]}>{item.products?.code}</Text>
              <Text style={[styles.tableCellBold, styles.colName]}>{item.products?.name}</Text>
              <Text style={[styles.tableCell, styles.colUnit]}>{item.products?.unit}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{fmt(item.unit_price)}</Text>
              <Text style={[styles.tableCell, styles.colBase]}>{fmt(item.unit_price_base)}</Text>
              <Text style={[styles.tableCell, styles.colIsv]}>{fmt(item.isv_amount)}</Text>
              <Text style={[styles.tableCell, styles.colDisc]}>
                {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
              </Text>
              <Text style={[styles.tableCellBold, styles.colTotal]}>{fmt(item.line_total)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal (sin ISV)</Text>
              <Text style={styles.totalValue}>{fmt(Number(order.subtotal))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ISV ({settings.isv_rate ?? 15}%)</Text>
              <Text style={styles.totalValue}>{fmt(Number(order.isv_amount))}</Text>
            </View>
            {Number(order.discount_amount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuentos</Text>
                <Text style={[styles.totalValue, { color: '#27ae60' }]}>
                  -{fmt(Number(order.discount_amount))}
                </Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{fmt(Number(order.total))}</Text>
            </View>
          </View>
        </View>

        {/* Factura */}
        {order.invoice_number && (
          <View style={styles.invoiceBox}>
            <Text style={styles.invoiceTitle}>Número de Factura</Text>
            <Text style={styles.invoiceNumber}>{order.invoice_number}</Text>
          </View>
        )}

        {/* Notas */}
        {order.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notas</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {settings.company_name || 'Ordeon'} · Orden #{String(order.order_number).padStart(5, '0')}
          </Text>
          <Text style={styles.footerText}>
            Generado el {new Date().toLocaleDateString('es-HN')}
          </Text>
        </View>

      </Page>
    </Document>
  )
}