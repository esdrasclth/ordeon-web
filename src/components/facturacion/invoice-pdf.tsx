'use client'

import { useEffect, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDFDocument } from '@/components/facturacion/invoice-pdf-document'
import { Download, ArrowLeft } from 'lucide-react'

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

export function InvoicePDF({ invoice, config }: { invoice: any; config: any }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const items    = invoice.invoice_items ?? []
  const filename = `Factura-${invoice.invoice_number}.pdf`

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { size: letter; margin: 15mm; }
        }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .page {
          background: #fff;
          max-width: 800px;
          margin: 20px auto;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px 10px; text-align: left; font-size: 12px; }
        th { background: #031926; color: #F4E9CD; font-weight: 700; }
        tr:nth-child(even) td { background: #f8fafa; }
        .mono { font-family: 'Courier New', monospace; }
      `}</style>

      {/* Botones — no imprimen */}
      <div className="no-print" style={{
        position: 'fixed', top: 16, right: 16,
        display: 'flex', gap: 8, zIndex: 100,
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid #ccc', background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13,
          }}>
          <ArrowLeft size={14} /> Volver
        </button>

        {mounted && (
          <PDFDownloadLink
            document={<InvoicePDFDocument invoice={invoice} config={config} />}
            fileName={filename}
            style={{ textDecoration: 'none' }}
          >
            {({ loading }) => (
              <button style={{
                padding: '8px 16px', borderRadius: 8,
                background: loading ? '#9DBEBB' : '#468189',
                color: '#F4E9CD', border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Download size={14} />
                {loading ? 'Preparando...' : 'Descargar PDF'}
              </button>
            )}
          </PDFDownloadLink>
        )}
      </div>

      <div className="page">

        {/* Encabezado empresa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#031926', margin: 0 }}>
              {config.business_name}
            </h1>
            {config.commercial_name && (
              <p style={{ fontSize: 12, color: '#468189', margin: '2px 0' }}>{config.commercial_name}</p>
            )}
            <p style={{ fontSize: 11, color: '#555', margin: '2px 0' }}>RTN: <span className="mono">{config.rtn}</span></p>
            {config.address && <p style={{ fontSize: 11, color: '#555', margin: '2px 0' }}>{config.address}</p>}
            {config.phone && <p style={{ fontSize: 11, color: '#555', margin: '2px 0' }}>Tel: {config.phone}</p>}
            {config.email && <p style={{ fontSize: 11, color: '#555', margin: '2px 0' }}>{config.email}</p>}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: invoice.status === 'anulada' ? '#d94f4f' : '#031926',
              color: '#F4E9CD', padding: '8px 16px', borderRadius: 8, marginBottom: 8,
            }}>
              <p style={{ fontSize: 10, margin: 0, opacity: 0.7 }}>FACTURA</p>
              <p style={{ fontSize: 18, fontWeight: 900, margin: 0, fontFamily: 'Courier New' }}>
                {invoice.invoice_number}
              </p>
            </div>
            <p style={{ fontSize: 11, color: '#555', margin: '2px 0' }}>
              Fecha: <strong>{new Date(invoice.issued_at).toLocaleDateString('es-HN')}</strong>
            </p>
            {invoice.status === 'anulada' && (
              <p style={{ fontSize: 12, fontWeight: 900, color: '#d94f4f', margin: '4px 0' }}>⚠ ANULADA</p>
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '2px solid #031926', marginBottom: 20 }} />

        {/* Cliente */}
        <div style={{ background: '#f8fafa', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9DBEBB', margin: '0 0 6px', textTransform: 'uppercase' }}>
            Cliente
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#031926', margin: 0 }}>{invoice.client_name}</p>
            {invoice.client_rtn && (
              <p style={{ fontSize: 11, color: '#555', margin: 0 }}>RTN: <span className="mono">{invoice.client_rtn}</span></p>
            )}
            {invoice.client_address && (
              <p style={{ fontSize: 11, color: '#555', margin: 0 }}>{invoice.client_address}</p>
            )}
            {invoice.client_email && (
              <p style={{ fontSize: 11, color: '#555', margin: 0 }}>{invoice.client_email}</p>
            )}
          </div>
        </div>

        {/* Tabla items */}
        <table style={{ marginBottom: 20 }}>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Descripción</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Cant.</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Precio</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Desc.</th>
              <th style={{ width: '15%', textAlign: 'right' }}>ISV</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i: number) => {
              const discAmount = Number(item.unit_price) * (Number(item.discount_pct) / 100)
              const lineTotal  = (Number(item.unit_price) - discAmount) * Number(item.quantity)
              const isvAmount  = Number(item.isv_amount ?? 0) * Number(item.quantity)
              return (
                <tr key={i}>
                  <td style={{ color: '#031926', fontWeight: 500 }}>{item.description}</td>
                  <td style={{ textAlign: 'center', color: '#555' }}>{Number(item.quantity)}</td>
                  <td style={{ textAlign: 'right', color: '#555' }}>{fmt(Number(item.unit_price))}</td>
                  <td style={{ textAlign: 'right', color: '#d94f4f' }}>
                    {Number(item.discount_pct) > 0 ? `${Number(item.discount_pct)}%` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: '#555' }}>{fmt(isvAmount)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#031926' }}>{fmt(lineTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totales */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ width: 260 }}>
            {[
              { label: 'Subtotal (sin ISV)', value: fmt(Number(invoice.subtotal)) },
              { label: `ISV (${invoice.isv_rate}%)`, value: fmt(Number(invoice.isv_amount)) },
              ...(Number(invoice.discount_amount) > 0
                ? [{ label: 'Descuentos', value: `- ${fmt(Number(invoice.discount_amount))}` }]
                : []),
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: '#555' }}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', marginTop: 4,
              borderTop: '2px solid #031926',
              fontSize: 15, fontWeight: 900, color: '#031926',
            }}>
              <span>TOTAL</span>
              <span>{fmt(Number(invoice.total))}</span>
            </div>
          </div>
        </div>

        {/* CAI */}
        <div style={{ background: '#f8fafa', borderRadius: 8, padding: '10px 14px', fontSize: 10, color: '#555', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <p style={{ margin: 0 }}><strong>CAI:</strong> <span className="mono">{invoice.cai}</span></p>
            <p style={{ margin: 0 }}><strong>Fecha límite emisión:</strong> {new Date(invoice.cai_expires_at).toLocaleDateString('es-HN')}</p>
            <p style={{ margin: 0 }}><strong>Rango autorizado:</strong> <span className="mono">{invoice.range_from} — {invoice.range_to}</span></p>
          </div>
        </div>

        {invoice.notes && (
          <p style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>
            <strong>Notas:</strong> {invoice.notes}
          </p>
        )}
        {config.footer_text && (
          <p style={{ fontSize: 10, color: '#9DBEBB', textAlign: 'center', marginTop: 16 }}>
            {config.footer_text}
          </p>
        )}
        <p style={{ fontSize: 9, color: '#ccc', textAlign: 'center', marginTop: 8 }}>
          Documento generado por Ordeon · {new Date().toLocaleString('es-HN')}
        </p>
      </div>
    </>
  )
}