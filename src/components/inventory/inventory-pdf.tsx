'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 9,
    paddingTop: 36, paddingBottom: 48, paddingHorizontal: 36,
    backgroundColor: '#ffffff', color: '#1a1a2e',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
    paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#031926',
  },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#031926', marginBottom: 3 },
  companyDetail: { fontSize: 8, color: '#777', marginBottom: 2 },
  reportTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#468189', marginBottom: 4 },
  reportDate: { fontSize: 8, color: '#777' },

  kpiGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  kpiBox: {
    flex: 1, padding: 10, borderRadius: 6,
    backgroundColor: '#f8fafa', borderWidth: 1, borderColor: '#e0eded',
  },
  kpiValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#031926', marginBottom: 2 },
  kpiLabel: { fontSize: 7, color: '#468189', fontFamily: 'Helvetica-Bold' },

  sectionTitle: {
    fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#F4E9CD',
    marginBottom: 0, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  sectionHeader: {
    backgroundColor: '#031926', padding: '8 10',
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
    marginBottom: 1,
  },

  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f0f5f5',
    paddingVertical: 6, paddingHorizontal: 8, marginBottom: 1,
  },
  tableHeaderText: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    color: '#468189', textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { fontSize: 8, color: '#333' },
  tableCellBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#031926' },

  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4, marginTop: 1 },

  footer: {
    position: 'absolute', bottom: 20, left: 36, right: 36,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#e0eded', paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#9DBEBB' },
})

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const STATUS_CONFIG = {
  sin_stock:   { label: 'Sin Stock',   color: '#d94f4f' },
  stock_bajo:  { label: 'Stock Bajo',  color: '#e67e22' },
  stock_normal:{ label: 'Normal',      color: '#27ae60' },
}

interface InventoryPDFProps {
  products:  any[]
  overview:  any
  settings:  Record<string, string>
}

export function InventoryPDF({ products, overview, settings }: InventoryPDFProps) {
  const now = new Date().toLocaleString('es-HN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const getStatus = (p: any) => {
    if (p.stock <= 0)          return 'sin_stock'
    if (p.stock <= p.min_stock) return 'stock_bajo'
    return 'stock_normal'
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{settings.company_name || 'Ordeon'}</Text>
            {settings.company_rtn     && <Text style={styles.companyDetail}>RTN: {settings.company_rtn}</Text>}
            {settings.company_address && <Text style={styles.companyDetail}>{settings.company_address}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.reportTitle}>Reporte de Inventario</Text>
            <Text style={styles.reportDate}>Generado: {now}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          {[
            { label: 'Total Productos', value: String(overview?.total_productos ?? 0) },
            { label: 'Valor Total',     value: fmt(overview?.valor_total ?? 0) },
            { label: 'Stock Normal',    value: String(overview?.stock_normal ?? 0) },
            { label: 'Stock Bajo',      value: String(overview?.stock_bajo ?? 0) },
            { label: 'Sin Stock',       value: String(overview?.sin_stock ?? 0) },
          ].map(kpi => (
            <View key={kpi.label} style={styles.kpiBox}>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabla */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Detalle de Inventario</Text>
        </View>

        {/* Header tabla */}
        <View style={styles.tableHeader}>
          {[
            { label: 'Estado',           width: '8%'  },
            { label: 'Código',           width: '8%'  },
            { label: 'Producto',         width: '22%' },
            { label: 'Categoría',        width: '10%' },
            { label: 'Unidad',           width: '6%'  },
            { label: 'Stock',            width: '7%'  },
            { label: 'Mínimo',           width: '7%'  },
            { label: 'P. Compra',        width: '10%' },
            { label: 'Valor en Stock',   width: '12%' },
            { label: 'P. Lista A',       width: '10%' },
          ].map(col => (
            <Text key={col.label}
              style={[styles.tableHeaderText, { width: col.width }]}>
              {col.label}
            </Text>
          ))}
        </View>

        {/* Filas */}
        {products.map((p, i) => {
          const status = getStatus(p)
          const cfg    = STATUS_CONFIG[status]
          const valor  = Number(p.stock) * Number(p.purchase_price || 0)

          return (
            <View key={p.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <View style={{ width: '8%', flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.tableCell, { color: cfg.color, fontSize: 7 }]}>
                  {cfg.label}
                </Text>
              </View>
              <Text style={[styles.tableCell, { width: '8%', fontFamily: 'Helvetica-Bold' }]}>
                {p.code}
              </Text>
              <Text style={[styles.tableCellBold, { width: '22%' }]}>{p.name}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>
                {p.product_categories?.name ?? 'Sin cat.'}
              </Text>
              <Text style={[styles.tableCell, { width: '6%' }]}>{p.unit}</Text>
              <Text style={[styles.tableCellBold, { width: '7%', color: cfg.color }]}>
                {Number(p.stock).toLocaleString('es-HN')}
              </Text>
              <Text style={[styles.tableCell, { width: '7%' }]}>
                {Number(p.min_stock).toLocaleString('es-HN')}
              </Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>
                {p.purchase_price ? fmt(p.purchase_price) : '—'}
              </Text>
              <Text style={[styles.tableCellBold, { width: '12%', color: '#468189' }]}>
                {valor > 0 ? fmt(valor) : '—'}
              </Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>
                {fmt(p.price_a)}
              </Text>
            </View>
          )
        })}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{settings.company_name || 'Ordeon'} · Inventario</Text>
          <Text style={styles.footerText}>{now}</Text>
        </View>

      </Page>
    </Document>
  )
}