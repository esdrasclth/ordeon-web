'use client'

import { useState } from 'react'
import { useAccountingPeriods, useCreatePeriod, useClosePeriod, useReopenPeriod } from '@/lib/hooks/use-accounting-periods'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CalendarDays, Plus, Lock, LockOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PeriodosPage() {
  const { data: periods, isLoading } = useAccountingPeriods()
  const create  = useCreatePeriod()
  const close   = useClosePeriod()
  const reopen  = useReopenPeriod()

  const [open, setOpen]         = useState(false)
  const [name, setName]         = useState('')
  const [startDate, setStart]   = useState('')
  const [endDate, setEnd]       = useState('')

  const currentYear = new Date().getFullYear()

  const handleCreate = async () => {
    if (!name || !startDate || !endDate) { toast.error('Completa todos los campos'); return }
    if (new Date(startDate) > new Date(endDate)) { toast.error('La fecha de inicio debe ser anterior al fin'); return }
    try {
      await create.mutateAsync({ name, start_date: startDate, end_date: endDate })
      toast.success('Período creado')
      setOpen(false); setName(''); setStart(''); setEnd('')
    } catch (e: any) { toast.error(e.message) }
  }

  const handleClose = async (id: string, name: string) => {
    if (!confirm(`¿Cerrar el período "${name}"? No podrás agregar asientos en él.`)) return
    try { await close.mutateAsync(id); toast.success('Período cerrado') }
    catch (e: any) { toast.error(e.message) }
  }

  const handleReopen = async (id: string) => {
    try { await reopen.mutateAsync(id); toast.success('Período reabierto') }
    catch (e: any) { toast.error(e.message) }
  }

  const quickCreate = (year: number, month: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    setName(`${['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][month]} ${year}`)
    setStart(`${year}-${pad(month)}-01`)
    setEnd(`${year}-${pad(month)}-${lastDay}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Períodos Contables
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>Gestión de períodos abiertos y cerrados</p>
        </div>
        <Button onClick={() => setOpen(true)}
          className="flex items-center gap-2"
          style={{ background: '#468189', color: '#F4E9CD' }}>
          <Plus className="w-4 h-4" /> Nuevo Período
        </Button>
      </div>

      {/* Quick create shortcuts */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#9DBEBB' }}>Crear rápido mes {currentYear}:</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <button key={m} onClick={() => { quickCreate(currentYear, m); setOpen(true) }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: '#fff', color: '#468189', border: '1px solid #ddd' }}>
              {['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][m]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de períodos */}
      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} /></div>
      ) : !periods?.length ? (
        <div className="p-12 text-center rounded-xl" style={{ border: '1px solid #eee', color: '#9DBEBB' }}>
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Sin períodos contables creados</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
          <div className="px-5 py-4" style={{ background: '#031926' }}>
            <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>Períodos</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                {['Nombre', 'Inicio', 'Fin', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#031926' }}>{p.name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#777' }}>
                    {new Date(p.start_date).toLocaleDateString('es-HN')}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#777' }}>
                    {new Date(p.end_date).toLocaleDateString('es-HN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit"
                      style={{
                        background: p.status === 'open' ? '#27ae6015' : '#77777715',
                        color:      p.status === 'open' ? '#27ae60' : '#777',
                      }}>
                      {p.status === 'open' ? <LockOpen className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {p.status === 'open' ? 'Abierto' : 'Cerrado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'open' ? (
                      <button onClick={() => handleClose(p.id, p.name)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: '#77777715', color: '#555' }}>
                        <Lock className="w-3.5 h-3.5" /> Cerrar
                      </button>
                    ) : (
                      <button onClick={() => handleReopen(p.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: '#46818918', color: '#468189' }}>
                        <LockOpen className="w-3.5 h-3.5" /> Reabrir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Período Contable</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>Nombre *</Label>
              <Input value={name} onChange={e => setName(e.target.value)}
                placeholder="ej. Enero 2026" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha inicio *</Label>
                <Input type="date" value={startDate} onChange={e => setStart(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Fecha fin *</Label>
                <Input type="date" value={endDate} onChange={e => setEnd(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={create.isPending}
                style={{ background: '#468189', color: '#F4E9CD' }}>
                {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
