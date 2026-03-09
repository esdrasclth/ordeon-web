'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInvoicePayments, useRegisterPayment } from '@/lib/hooks/use-payments'
import { Loader2, CheckCircle2, Clock, CircleDollarSign } from 'lucide-react'
import { toast } from 'sonner'

const METHODS = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'tarjeta',       label: 'Tarjeta' },
]

const fmt = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

interface Props {
  invoice: {
    id: string
    invoice_number: string
    client_name: string
    total: number
    paid_amount: number
    payment_status: string
  }
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ invoice, onClose, onSuccess }: Props) {
  const pending = invoice.total - (invoice.paid_amount ?? 0)

  const [amount,        setAmount]        = useState<number | ''>(Number(pending.toFixed(2)))
  const [paymentDate,   setPaymentDate]   = useState(new Date().toISOString().split('T')[0])
  const [method,        setMethod]        = useState('efectivo')
  const [reference,     setReference]     = useState('')
  const [notes,         setNotes]         = useState('')

  const { data: payments, isLoading: loadingPayments } = useInvoicePayments(invoice.id)
  const register = useRegisterPayment()

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Ingresa un monto válido'); return }
    if (Number(amount) > pending + 0.01) { toast.error(`El monto supera el saldo pendiente (${fmt(pending)})`); return }

    try {
      await register.mutateAsync({
        invoice_id:     invoice.id,
        invoice_number: invoice.invoice_number,
        client_name:    invoice.client_name,
        amount:         Number(amount),
        payment_date:   paymentDate,
        payment_method: method,
        reference:      reference || undefined,
        notes:          notes || undefined,
      })
      toast.success(`Cobro de ${fmt(Number(amount))} registrado`)
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al registrar el cobro')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Registrar Cobro
          </DialogTitle>
        </DialogHeader>

        {/* Resumen de la factura */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: '#f8fafa', border: '1px solid #e5e5e5' }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9DBEBB' }}>Factura</p>
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm" style={{ color: '#031926' }}>{invoice.invoice_number}</span>
            <span className="text-sm font-semibold" style={{ color: '#031926' }}>{invoice.client_name}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            {[
              { label: 'Total',     value: fmt(invoice.total),                   color: '#031926' },
              { label: 'Pagado',    value: fmt(invoice.paid_amount ?? 0),        color: '#27ae60' },
              { label: 'Pendiente', value: fmt(pending),                          color: pending > 0 ? '#d94f4f' : '#27ae60' },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-2" style={{ background: '#fff', border: '1px solid #eee' }}>
                <p className="text-xs" style={{ color: '#9DBEBB' }}>{item.label}</p>
                <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de cobro */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold" style={{ color: '#555' }}>Monto a cobrar *</Label>
              <Input
                type="number" min={0.01} step={0.01} max={Number(pending.toFixed(2))}
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={e => e.target.select()}
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: '#555' }}>Fecha de pago *</Label>
              <Input
                type="date" value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="mt-1 h-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold" style={{ color: '#555' }}>Método de pago *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold" style={{ color: '#555' }}>Referencia <span style={{ color: '#9DBEBB' }}>(opcional)</span></Label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="No. cheque, referencia bancaria..."
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold" style={{ color: '#555' }}>Notas <span style={{ color: '#9DBEBB' }}>(opcional)</span></Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones..."
              className="mt-1 h-9"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={register.isPending || !amount || Number(amount) <= 0}
            style={{ background: '#468189', color: '#F4E9CD' }}
          >
            {register.isPending
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <CircleDollarSign className="w-4 h-4 mr-2" />}
            Registrar Cobro
          </Button>
        </div>

        {/* Historial de cobros previos */}
        {(loadingPayments || (payments && payments.length > 0)) && (
          <div className="border-t pt-4 mt-2">
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#9DBEBB' }}>
              Cobros registrados
            </p>
            {loadingPayments ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" style={{ color: '#468189' }} />
            ) : (
              <div className="space-y-2">
                {payments!.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: '#f0faf5', border: '1px solid #d4edda' }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#031926' }}>
                        {new Date(p.payment_date + 'T00:00:00').toLocaleDateString('es-HN')}
                        <span className="ml-2 text-xs font-normal capitalize" style={{ color: '#9DBEBB' }}>
                          {p.payment_method}
                        </span>
                      </p>
                      {p.reference && (
                        <p className="text-xs font-mono" style={{ color: '#9DBEBB' }}>Ref: {p.reference}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#27ae60' }} />
                      <span className="text-sm font-bold" style={{ color: '#27ae60' }}>{fmt(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
