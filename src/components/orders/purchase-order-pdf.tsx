'use client'

import { useEffect } from 'react'

interface POForPDF {
  id: string
  po_number: number
  order_date: string
  expected_date: string | null
  payment_terms: string | null
  status: string
  subtotal: number
  isv_amount: number
  discount_amount: number
  total: number
  notes: string | null
  suppliers: {
    name: string; rtn: string | null; phone: string | null
    email: string | null; address: string | null; city: string | null; department: string | null
  } | null
  purchase_order_items: Array<{
    id: string; quantity: number; unit_cost: number
    isv_rate: number; isv_amount: number; discount_pct: number
    discount_amount: number; line_total: number
    products: { code: string; name: string; unit: string } | null
  }>
}

interface CompanyInfo {
  name?: string; rtn?: string; address?: string; phone?: string; email?: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('es-HN', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export function PurchaseOrderPDF({ po, company }: { po: POForPDF; company: CompanyInfo }) {
  const poLabel = `OC-${String(po.po_number).padStart(5, '0')}`

  useEffect(() => {
    // Auto-print after a short delay so the page renders first
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Botón de control — no se imprime */}
      <div className="no-print" style={{
        position: 'fixed', top: 16, right: 16, zIndex: 100, display: 'flex', gap: 8
      }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: '#031926', color: '#f4e9cd', border: 'none', cursor: 'pointer'
          }}
        >
          🖨️ Imprimir / Guardar PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 14,
            background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer'
          }}
        >
          Cerrar
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: Letter; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Inter', Arial, sans-serif; background: #f5f7f7; margin: 0; padding: 0; }
        .page { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; }
        @media print { .page { padding: 0; box-shadow: none; } }
      `}</style>

      <div className="page">
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#031926', margin: 0 }}>
              {company.name ?? 'Empresa'}
            </h1>
            {company.rtn    && <p style={{ margin: '2px 0', fontSize: 12, color: '#64748b' }}>RTN: {company.rtn}</p>}
            {company.address && <p style={{ margin: '2px 0', fontSize: 12, color: '#64748b' }}>{company.address}</p>}
            {company.phone  && <p style={{ margin: '2px 0', fontSize: 12, color: '#64748b' }}>Tel: {company.phone}</p>}
            {company.email  && <p style={{ margin: '2px 0', fontSize: 12, color: '#64748b' }}>{company.email}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: '#031926', color: '#f4e9cd', padding: '8px 20px',
              borderRadius: 8, fontSize: 20, fontWeight: 800, marginBottom: 8
            }}>
              ORDEN DE COMPRA
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#031926', margin: '4px 0' }}>{poLabel}</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0' }}>Fecha: {fmtDate(po.order_date)}</p>
            {po.expected_date && (
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0' }}>
                Entrega esperada: {fmtDate(po.expected_date)}
              </p>
            )}
          </div>
        </div>

        {/* Línea divisora */}
        <div style={{ borderTop: '2px solid #031926', marginBottom: 24 }} />

        {/* Proveedor */}
        <div style={{
          background: '#f8fafc', borderRadius: 8, padding: '16px 20px',
          marginBottom: 24, border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
            Proveedor
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#031926', margin: '0 0 4px' }}>
            {po.suppliers?.name ?? '—'}
          </p>
          {po.suppliers?.rtn      && <p style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>RTN: {po.suppliers.rtn}</p>}
          {po.suppliers?.address  && <p style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>{po.suppliers.address}</p>}
          {po.suppliers?.city     && <p style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>{po.suppliers.city}{po.suppliers.department ? `, ${po.suppliers.department}` : ''}</p>}
          {po.suppliers?.phone    && <p style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>Tel: {po.suppliers.phone}</p>}
          {po.suppliers?.email    && <p style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>{po.suppliers.email}</p>}
          {po.payment_terms && (
            <p style={{ fontSize: 12, color: '#475569', margin: '6px 0 0', fontWeight: 600 }}>
              Términos de pago: {po.payment_terms}
            </p>
          )}
        </div>

        {/* Tabla de productos */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#031926', color: '#f4e9cd' }}>
              {['#', 'Código', 'Descripción', 'Unid.', 'Cantidad', 'Precio Unit.', 'Desc.', 'ISV', 'Total'].map(h => (
                <th key={h} style={{
                  padding: '10px 10px', textAlign: h === '#' || h === 'Cantidad' || h === 'Precio Unit.' || h === 'Desc.' || h === 'ISV' || h === 'Total' ? 'right' : 'left',
                  fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {po.purchase_order_items.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
                  {item.products?.code ?? '—'}
                </td>
                <td style={{ padding: '9px 10px', fontWeight: 500, color: '#1e293b' }}>
                  {item.products?.name ?? '—'}
                </td>
                <td style={{ padding: '9px 10px', color: '#64748b', fontSize: 12 }}>
                  {item.products?.unit ?? ''}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600 }}>
                  {fmt(item.quantity)}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                  L. {fmt(item.unit_cost)}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#64748b' }}>
                  {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#64748b' }}>
                  {item.isv_rate > 0 ? `${item.isv_rate}%` : '—'}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#031926' }}>
                  L. {fmt(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <div style={{ minWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderTop: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Subtotal</span>
              <span>L. {fmt(po.subtotal)}</span>
            </div>
            {po.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Descuento</span>
                <span style={{ color: '#ef4444' }}>- L. {fmt(po.discount_amount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>ISV</span>
              <span>L. {fmt(po.isv_amount)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
              background: '#031926', color: '#f4e9cd', borderRadius: 8, marginTop: 6,
              fontSize: 16, fontWeight: 800
            }}>
              <span>TOTAL</span>
              <span>L. {fmt(po.total)}</span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {po.notes && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 4px' }}>Notas</p>
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{po.notes}</p>
          </div>
        )}

        {/* Firmas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
          {[
            { label: 'Elaborado por', line: true },
            { label: 'Autorizado por', line: true },
            { label: 'Recibido por (Proveedor)', line: true },
          ].map(({ label, line }) => (
            <div key={label} style={{ textAlign: 'center', flex: 1, margin: '0 16px' }}>
              {line && <div style={{ borderTop: '1px solid #94a3b8', width: '100%', marginBottom: 6 }} />}
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Pie de página */}
        <p style={{ textAlign: 'center', fontSize: 10, color: '#cbd5e1', marginTop: 24 }}>
          Documento generado por Ordeon ERP · {poLabel} · {fmtDate(po.order_date)}
        </p>
      </div>
    </>
  )
}
