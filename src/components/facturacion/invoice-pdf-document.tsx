'use client'

import { Document, Page, Text, View, StyleSheet, Line, Svg } from '@react-pdf/renderer'

const C = {
  dark:   '#031926',
  teal:   '#468189',
  light:  '#9DBEBB',
  cream:  '#F4E9CD',
  gray:   '#555555',
  lgray:  '#f8fafa',
  border: '#e0eded',
  red:    '#d94f4f',
  white:  '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    fontFamily:        'Helvetica',
    fontSize:          10,
    paddingTop:        36,
    paddingBottom:     48,
    paddingHorizontal: 40,
    backgroundColor:   C.white,
    color:             C.dark,
  },

  // Header
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'flex-start',
    marginBottom:      20,
    paddingBottom:     16,
    borderBottomWidth: 2,
    borderBottomColor: C.dark,
  },
  companyName: {
    fontSize:     20,
    fontFamily:   'Helvetica-Bold',
    color:        C.dark,
    marginBottom: 3,
  },
  commercialName: {
    fontSize:     11,
    color:        C.teal,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize:     9,
    color:        C.gray,
    marginBottom: 2,
  },
  invoiceBadge: {
    backgroundColor: C.dark,
    borderRadius:    6,
    padding:         '8 14',
    alignItems:      'flex-end',
    marginBottom:    6,
  },
  invoiceBadgeVoided: {
    backgroundColor: C.red,
    borderRadius:    6,
    padding:         '8 14',
    alignItems:      'flex-end',
    marginBottom:    6,
  },
  invoiceBadgeLabel: {
    fontSize:   8,
    color:      C.cream,
    opacity:    0.7,
    marginBottom: 3,
  },
  invoiceBadgeNumber: {
    fontSize:   16,
    fontFamily: 'Helvetica-Bold',
    color:      C.cream,
  },
  invoiceDate: {
    fontSize:  9,
    color:     C.gray,
    textAlign: 'right',
  },
  voidedText: {
    fontSize:   10,
    fontFamily: 'Helvetica-Bold',
    color:      C.red,
    textAlign:  'right',
    marginTop:  3,
  },

  // Cliente box
  clientBox: {
    backgroundColor: C.lgray,
    borderRadius:    6,
    padding:         '10 14',
    marginBottom:    18,
  },
  clientLabel: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    color:        C.light,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clientGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },
  clientName: {
    fontSize:   12,
    fontFamily: 'Helvetica-Bold',
    color:      C.dark,
    width:      '50%',
  },
  clientRtn: {
    fontSize:  9,
    color:     C.gray,
    width:     '50%',
    textAlign: 'right',
  },
  clientAddress: {
    fontSize:  9,
    color:     C.gray,
    width:     '50%',
    marginTop: 3,
  },
  clientEmail: {
    fontSize:  9,
    color:     C.gray,
    width:     '50%',
    textAlign: 'right',
    marginTop: 3,
  },

  // Tabla
  tableHeader: {
    flexDirection:     'row',
    backgroundColor:   C.dark,
    paddingVertical:   7,
    paddingHorizontal: 8,
    borderRadius:      4,
    marginBottom:      1,
  },
  tableHeaderText: {
    fontSize:   8,
    fontFamily: 'Helvetica-Bold',
    color:      C.cream,
  },
  tableRow: {
    flexDirection:     'row',
    paddingVertical:   7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 9,
    color:    C.gray,
  },
  tableCellBold: {
    fontSize:   9,
    fontFamily: 'Helvetica-Bold',
    color:      C.dark,
  },
  tableCellRed: {
    fontSize: 9,
    color:    C.red,
  },

  colDesc:  { width: '38%' },
  colQty:   { width: '8%',  textAlign: 'center' },
  colPrice: { width: '14%', textAlign: 'right'  },
  colDisc:  { width: '10%', textAlign: 'right'  },
  colIsv:   { width: '16%', textAlign: 'right'  },
  colTotal: { width: '14%', textAlign: 'right'  },

  // Totales
  totalsContainer: {
    alignItems:   'flex-end',
    marginBottom: 18,
    marginTop:    4,
  },
  totalsBox: {
    width: 260,
  },
  totalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 9, color: C.gray    },
  totalValue: { fontSize: 9, color: C.gray    },
  totalGreenValue: { fontSize: 9, color: '#27ae60' },
  totalDivider: {
    borderTopWidth: 2,
    borderTopColor: C.dark,
    marginVertical: 6,
  },
  grandRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  grandLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.dark  },
  grandValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.dark  },

  // CAI box
  caiBox: {
    backgroundColor: C.lgray,
    borderRadius:    6,
    padding:         '10 14',
    marginBottom:    14,
  },
  caiGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
  caiItem: { width: '48%', marginBottom: 4 },
  caiLabel: { fontSize: 7, color: C.light, marginBottom: 2 },
  caiValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark },

  // Notas / footer text
  footerNote: {
    fontSize:  9,
    color:     C.teal,
    textAlign: 'center',
    marginBottom: 4,
  },

  // Footer fijo
  footer: {
    position:       'absolute',
    bottom:         20,
    left:           40,
    right:          40,
    flexDirection:  'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop:     8,
  },
  footerText: { fontSize: 7, color: C.light },
})

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function InvoicePDFDocument({ invoice, config }: { invoice: any; config: any }) {
  const items    = invoice.invoice_items ?? []
  const isVoided = invoice.status === 'anulada'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{config.business_name}</Text>
            {config.commercial_name && (
              <Text style={styles.commercialName}>{config.commercial_name}</Text>
            )}
            <Text style={styles.companyDetail}>RTN: {config.rtn}</Text>
            {config.address && <Text style={styles.companyDetail}>{config.address}</Text>}
            {config.phone   && <Text style={styles.companyDetail}>Tel: {config.phone}</Text>}
            {config.email   && <Text style={styles.companyDetail}>{config.email}</Text>}
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <View style={isVoided ? styles.invoiceBadgeVoided : styles.invoiceBadge}>
              <Text style={styles.invoiceBadgeLabel}>FACTURA</Text>
              <Text style={styles.invoiceBadgeNumber}>{invoice.invoice_number}</Text>
            </View>
            <Text style={styles.invoiceDate}>
              Fecha: {new Date(invoice.issued_at).toLocaleDateString('es-HN')}
            </Text>
            {isVoided && <Text style={styles.voidedText}>⚠ ANULADA</Text>}
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.clientBox}>
          <Text style={styles.clientLabel}>Cliente</Text>
          <View style={styles.clientGrid}>
            <Text style={styles.clientName}>{invoice.client_name}</Text>
            {invoice.client_rtn && (
              <Text style={styles.clientRtn}>RTN: {invoice.client_rtn}</Text>
            )}
            {invoice.client_address && (
              <Text style={styles.clientAddress}>{invoice.client_address}</Text>
            )}
            {invoice.client_email && (
              <Text style={styles.clientEmail}>{invoice.client_email}</Text>
            )}
          </View>
        </View>

        {/* Tabla */}
        <View style={{ marginBottom: 4 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Precio</Text>
            <Text style={[styles.tableHeaderText, styles.colDisc]}>Desc.</Text>
            <Text style={[styles.tableHeaderText, styles.colIsv]}>ISV</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {items.map((item: any, i: number) => {
            const discAmount = Number(item.unit_price) * (Number(item.discount_pct) / 100)
            const lineTotal  = (Number(item.unit_price) - discAmount) * Number(item.quantity)
            const isvAmount  = Number(item.isv_amount ?? 0) * Number(item.quantity)
            return (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell,     styles.colQty]}>{Number(item.quantity)}</Text>
                <Text style={[styles.tableCell,     styles.colPrice]}>{fmt(Number(item.unit_price))}</Text>
                <Text style={[styles.tableCellRed,  styles.colDisc]}>
                  {Number(item.discount_pct) > 0 ? `${Number(item.discount_pct)}%` : '-'}
                </Text>
                <Text style={[styles.tableCell,     styles.colIsv]}>{fmt(isvAmount)}</Text>
                <Text style={[styles.tableCellBold, styles.colTotal]}>{fmt(lineTotal)}</Text>
              </View>
            )
          })}
        </View>

        {/* Totales */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal (sin ISV)</Text>
              <Text style={styles.totalValue}>{fmt(Number(invoice.subtotal))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ISV ({invoice.isv_rate}%)</Text>
              <Text style={styles.totalValue}>{fmt(Number(invoice.isv_amount))}</Text>
            </View>
            {Number(invoice.discount_amount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuentos</Text>
                <Text style={styles.totalGreenValue}>- {fmt(Number(invoice.discount_amount))}</Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandValue}>{fmt(Number(invoice.total))}</Text>
            </View>
          </View>
        </View>

        {/* CAI */}
        <View style={styles.caiBox}>
          <View style={styles.caiGrid}>
            <View style={styles.caiItem}>
              <Text style={styles.caiLabel}>CAI</Text>
              <Text style={styles.caiValue}>{invoice.cai}</Text>
            </View>
            <View style={styles.caiItem}>
              <Text style={styles.caiLabel}>Fecha límite emisión</Text>
              <Text style={styles.caiValue}>
                {new Date(invoice.cai_expires_at).toLocaleDateString('es-HN')}
              </Text>
            </View>
            <View style={{ width: '100%' }}>
              <Text style={styles.caiLabel}>Rango autorizado</Text>
              <Text style={styles.caiValue}>{invoice.range_from} — {invoice.range_to}</Text>
            </View>
          </View>
        </View>

        {/* Notas */}
        {invoice.notes && (
          <Text style={{ fontSize: 9, color: C.gray, marginBottom: 8 }}>
            Notas: {invoice.notes}
          </Text>
        )}

        {/* Footer text */}
        {config.footer_text && (
          <Text style={styles.footerNote}>{config.footer_text}</Text>
        )}

        {/* Footer fijo */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Documento generado por Ordeon · {new Date().toLocaleDateString('es-HN')}
          </Text>
          <Text style={styles.footerText}>
            {config.business_name} · {invoice.invoice_number}
          </Text>
        </View>

      </Page>
    </Document>
  )
}