'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useAccountingPeriods } from '@/lib/hooks/use-accounting-periods'
import { useCreateJournalEntry } from '@/lib/hooks/use-journal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface LineForm {
  account_id: string
  debit: string
  credit: string
  description: string
}

const BLANK_LINE: LineForm = { account_id: '', debit: '', credit: '', description: '' }

export default function NuevoAsientoPage() {
  const router = useRouter()
  const { data: accounts } = useAccounts()
  const { data: periods }  = useAccountingPeriods()
  const createEntry = useCreateJournalEntry()

  const openPeriod = periods?.find(p => p.status === 'open')
  const detailAccounts = (accounts ?? []).filter(a => a.is_detail)

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate]           = useState(today)
  const [description, setDesc]    = useState('')
  const [reference, setReference] = useState('')
  const [periodId, setPeriodId]   = useState(openPeriod?.id ?? 'none')
  const [lines, setLines]         = useState<LineForm[]>([
    { ...BLANK_LINE },
    { ...BLANK_LINE },
  ])

  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0
  const diff        = totalDebit - totalCredit

  const addLine = () => setLines(ls => [...ls, { ...BLANK_LINE }])
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: keyof LineForm, value: string) => {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  const handleSave = async () => {
    if (!date)        { toast.error('Ingresa la fecha del asiento'); return }
    if (!description) { toast.error('Ingresa una descripción'); return }
    const validLines = lines.filter(l => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
    if (validLines.length < 2) { toast.error('El asiento necesita al menos 2 líneas'); return }
    if (!isBalanced)  { toast.error(`El asiento no balancea. Diferencia: L. ${Math.abs(diff).toFixed(2)}`); return }

    try {
      await createEntry.mutateAsync({
        date,
        description,
        reference:  reference || undefined,
        source:     'manual',
        period_id:  periodId !== 'none' ? periodId : undefined,
        lines: validLines.map(l => ({
          account_id:  l.account_id,
          debit:       parseFloat(l.debit)  || 0,
          credit:      parseFloat(l.credit) || 0,
          description: l.description || undefined,
        })),
      })
      toast.success('Asiento guardado')
      router.push('/dashboard/contabilidad/diario')
    } catch (e: any) {
      toast.error(e.message ?? 'Error al guardar')
    }
  }

  const fmt = (n: number) =>
    `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
          Nuevo Asiento
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#468189' }}>Partida doble — débitos = créditos</p>
      </div>

      {/* Cabecera del asiento */}
      <div className="rounded-xl p-6 shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)', background: '#fff' }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: '#031926' }}>Datos del Asiento</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fecha *</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Período Contable</Label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sin período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin período</SelectItem>
                {(periods ?? []).filter(p => p.status === 'open').map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Descripción *</Label>
            <Input value={description} onChange={e => setDesc(e.target.value)}
              placeholder="ej. Venta de mercadería..." className="mt-1" />
          </div>
          <div>
            <Label>Referencia</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)}
              placeholder="ej. ORD-0042 / FAC-001 (opcional)" className="mt-1" />
          </div>
        </div>
      </div>

      {/* Líneas del asiento */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
        <div className="px-5 py-4" style={{ background: '#031926' }}>
          <h2 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>Líneas del Asiento</h2>
        </div>
        <div className="p-4">
          <table className="w-full mb-3">
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th className="text-left pb-2 pr-4 text-xs font-bold" style={{ color: '#9DBEBB' }}>Cuenta</th>
                <th className="text-left pb-2 pr-4 text-xs font-bold" style={{ color: '#9DBEBB' }}>Descripción</th>
                <th className="text-right pb-2 pr-4 text-xs font-bold" style={{ color: '#27ae60' }}>Débito (L.)</th>
                <th className="text-right pb-2 pr-4 text-xs font-bold" style={{ color: '#2980b9' }}>Crédito (L.)</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td className="py-2 pr-3" style={{ minWidth: 240 }}>
                    <select
                      value={line.account_id}
                      onChange={e => updateLine(i, 'account_id', e.target.value)}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm"
                      style={{ color: line.account_id ? '#031926' : '#aaa' }}>
                      <option value="">Seleccionar cuenta...</option>
                      {detailAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <Input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                      placeholder="Descripción (opcional)" className="h-9" />
                  </td>
                  <td className="py-2 pr-3">
                    <Input type="number" min="0" step="0.01"
                      value={line.debit}
                      onChange={e => { updateLine(i, 'debit', e.target.value); if (e.target.value) updateLine(i, 'credit', '') }}
                      placeholder="0.00" className="h-9 text-right"
                      style={{ color: '#27ae60', fontWeight: 600 }} />
                  </td>
                  <td className="py-2 pr-3">
                    <Input type="number" min="0" step="0.01"
                      value={line.credit}
                      onChange={e => { updateLine(i, 'credit', e.target.value); if (e.target.value) updateLine(i, 'debit', '') }}
                      placeholder="0.00" className="h-9 text-right"
                      style={{ color: '#2980b9', fontWeight: 600 }} />
                  </td>
                  <td className="py-2">
                    {lines.length > 2 && (
                      <button onClick={() => removeLine(i)} className="p-1 rounded hover:bg-red-50">
                        <Trash2 className="w-4 h-4" style={{ color: '#d94f4f' }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addLine}
            className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg"
            style={{ color: '#468189', background: '#46818918' }}>
            <Plus className="w-4 h-4" /> Agregar línea
          </button>
        </div>

        {/* Totales + balance indicator */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: '#f8fafa', borderTop: '1px solid #eee' }}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${isBalanced ? 'text-green-600' : 'text-red-500'}`}>
            {isBalanced
              ? <><CheckCircle2 className="w-4 h-4" /> Asiento balanceado</>
              : <><AlertCircle className="w-4 h-4" /> Diferencia: {fmt(Math.abs(diff))}</>
            }
          </div>
          <div className="flex items-center gap-6 text-sm font-bold">
            <span style={{ color: '#27ae60' }}>Débito: {fmt(totalDebit)}</span>
            <span style={{ color: '#2980b9' }}>Crédito: {fmt(totalCredit)}</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!isBalanced || createEntry.isPending}
          style={{ background: '#468189', color: '#F4E9CD', opacity: (!isBalanced || createEntry.isPending) ? 0.5 : 1 }}>
          {createEntry.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Guardar Asiento
        </Button>
      </div>
    </div>
  )
}
