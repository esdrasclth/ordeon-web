'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FileText, Ban, CircleDollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentModal } from '@/components/facturacion/payment-modal'

const supabase = createClient()

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  emitida:  { bg: '#27ae6015', color: '#27ae60', label: 'Emitida'  },
  borrador: { bg: '#e67e2215', color: '#e67e22', label: 'Borrador' },
  anulada:  { bg: '#d94f4f15', color: '#d94f4f', label: 'Anulada'  },
}

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pendiente: { bg: '#d94f4f15', color: '#d94f4f', label: 'Pendiente' },
  parcial:   { bg: '#e67e2215', color: '#e67e22', label: 'Parcial'   },
  pagada:    { bg: '#27ae6015', color: '#27ae60', label: 'Pagada'    },
}

export function InvoiceList({
  invoices,
  onRefresh,
}: {
  invoices:  any[]
  onRefresh: () => void
}) {
  const [voiding,        setVoiding]        = useState<string | null>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null)

  const handleVoid = async (invoice: any) => {
    const reason = prompt('Motivo de anulación:')
    if (!reason) return

    setVoiding(invoice.id)
    const { error } = await supabase.rpc('void_invoice', {
      p_invoice_id: invoice.id,
      p_reason:     reason,
    })

    if (error) {
      toast.error('Error al anular: ' + error.message)
    } else {
      toast.success(`Factura ${invoice.invoice_number} anulada`)
      onRefresh()
    }
    setVoiding(null)
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl p-12 text-center"
        style={{ background: '#fff', border: '1px solid rgba(70,129,137,0.12)' }}>
        <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: '#9DBEBB' }} />
        <p className="text-sm font-semibold" style={{ color: '#555' }}>No hay facturas emitidas</p>
        <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
          Las facturas que emitas aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(70,129,137,0.15)' }}>
        <div className="px-5 py-4" style={{ background: '#031926' }}>
          <h3 className="text-sm font-bold" style={{ color: '#F4E9CD' }}>
            Facturas emitidas
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
              {['No. Factura', 'Cliente', 'Fecha', 'Subtotal', 'ISV', 'Total', 'Estado', 'Cobro', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left"
                  style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => {
              const style        = STATUS_STYLES[inv.status] ?? STATUS_STYLES.borrador
              const payStyle     = PAYMENT_STATUS_STYLES[inv.payment_status ?? 'pendiente']
              const canPay       = inv.status === 'emitida' && (inv.payment_status ?? 'pendiente') !== 'pagada'
              return (
                <tr key={inv.id}
                  style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono font-bold" style={{ color: '#031926' }}>
                      {inv.invoice_number}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold" style={{ color: '#031926' }}>
                      {inv.client_name}
                    </p>
                    {inv.client_rtn && (
                      <p className="text-xs font-mono" style={{ color: '#9DBEBB' }}>
                        RTN: {inv.client_rtn}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                    {new Date(inv.issued_at).toLocaleDateString('es-HN')}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                    L. {Number(inv.subtotal).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#555' }}>
                    L. {Number(inv.isv_amount).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: '#031926' }}>
                    L. {Number(inv.total).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full font-bold"
                      style={{ background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.status !== 'anulada' && (
                      <span className="text-xs px-2 py-1 rounded-full font-bold"
                        style={{ background: payStyle.bg, color: payStyle.color }}>
                        {payStyle.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost"
                        onClick={() => window.open(`/dashboard/facturacion/${inv.id}/pdf`, '_blank')}
                        style={{ color: '#468189' }}
                        title="Ver PDF">
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      {canPay && (
                        <Button size="sm" variant="ghost"
                          onClick={() => setPaymentInvoice(inv)}
                          style={{ color: '#27ae60' }}
                          title="Registrar cobro">
                          <CircleDollarSign className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {inv.status === 'emitida' && (
                        <Button size="sm" variant="ghost"
                          onClick={() => handleVoid(inv)}
                          disabled={voiding === inv.id}
                          style={{ color: '#d94f4f' }}
                          title="Anular factura">
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  )
}