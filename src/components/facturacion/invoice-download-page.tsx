'use client'

import { useState } from 'react'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { InvoicePDFDocument } from './invoice-pdf-document'
import { Download, ArrowLeft, Eye } from 'lucide-react'

export function InvoiceDownloadPage({ invoice, config }: { invoice: any; config: any }) {
  const [preview, setPreview] = useState(false)
  const filename = `Factura-${invoice.invoice_number}.pdf`

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f4f4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: 24,
    }}>

      {/* Card central */}
      {!preview && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          {/* Logo / título */}
          <div style={{
            width: 56, height: 56,
            background: '#031926',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 24,
          }}>
            🧾
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#031926', margin: '0 0 4px' }}>
            {invoice.invoice_number}
          </h1>
          <p style={{ fontSize: 13, color: '#468189', margin: '0 0 24px' }}>
            {config.business_name}
          </p>

          <div style={{
            background: '#f8fafa',
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            {[
              { label: 'Cliente',  value: invoice.client_name },
              { label: 'Fecha',    value: new Date(invoice.issued_at).toLocaleDateString('es-HN') },
              { label: 'Total',    value: `L. ${Number(invoice.total).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` },
              { label: 'Estado',   value: invoice.status === 'anulada' ? '⚠ Anulada' : '✓ Emitida' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: '1px solid #eee', fontSize: 13,
              }}>
                <span style={{ color: '#888' }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: '#031926' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PDFDownloadLink
              document={<InvoicePDFDocument invoice={invoice} config={config} />}
              fileName={filename}
              style={{ textDecoration: 'none' }}
            >
              {({ loading }) => (
                <button style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: loading ? '#9DBEBB' : '#468189',
                  color: '#F4E9CD',
                  border: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                  <Download size={16} />
                  {loading ? 'Preparando PDF...' : 'Descargar PDF'}
                </button>
              )}
            </PDFDownloadLink>

            <button
              onClick={() => setPreview(true)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 10,
                background: '#f0f4f4',
                color: '#031926',
                border: '1px solid #d0e0de',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
              <Eye size={16} />
              Vista previa
            </button>

            <button
              onClick={() => window.history.back()}
              style={{
                width: '100%',
                padding: '10px 20px',
                borderRadius: 10,
                background: 'transparent',
                color: '#888',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}>
              <ArrowLeft size={14} />
              Volver
            </button>
          </div>
        </div>
      )}

      {/* Vista previa fullscreen */}
      {preview && (
        <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 50 }}>
          <div style={{
            position: 'absolute', top: 16, right: 16, zIndex: 100,
            display: 'flex', gap: 8,
          }}>
            <PDFDownloadLink
              document={<InvoicePDFDocument invoice={invoice} config={config} />}
              fileName={filename}
              style={{ textDecoration: 'none' }}
            >
              {({ loading }) => (
                <button style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: '#468189', color: '#F4E9CD',
                  border: 'none', cursor: 'pointer', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Download size={14} />
                  {loading ? 'Preparando...' : 'Descargar'}
                </button>
              )}
            </PDFDownloadLink>

            <button
              onClick={() => setPreview(false)}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: '#fff', color: '#031926',
                border: '1px solid #ccc', cursor: 'pointer',
              }}>
              ← Volver
            </button>
          </div>

          <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <InvoicePDFDocument invoice={invoice} config={config} />
          </PDFViewer>
        </div>
      )}
    </div>
  )
}