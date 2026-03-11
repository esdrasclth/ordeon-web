'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function SubscriptionPaymentForm({
    companies,
    onClose,
    onSave
}: {
    companies: { id: string; name: string }[]
    onClose: () => void
    onSave: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        company_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'transferencia',
        reference: '',
        next_payment_at: ''
    })

    // Autofill next payment date to 30 days from the payment date
    const handleDateChange = (val: string) => {
        setFormData(prev => {
            const nextDate = new Date(val + 'T12:00:00')
            nextDate.setDate(nextDate.getDate() + 30) // Add 30 days roughly for subscription
            return {
                ...prev,
                payment_date: val,
                next_payment_at: nextDate.toISOString().split('T')[0]
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.company_id || !formData.amount || !formData.payment_date) {
            toast.error('Por favor completa todos los campos requeridos')
            return
        }

        setLoading(true)
        const res = await fetch('/api/superadmin/register-subscription-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                amount: Number(formData.amount)
            }),
        })

        const data = await res.json()
        if (!res.ok) {
            toast.error(data.error || 'Error al guardar el pago')
            setLoading(false)
            return
        }

        toast.success('Pago registrado exitosamente')
        onSave()
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(3, 25, 38, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#031926'
                }}>
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: '#F4E9CD', fontFamily: 'Georgia, serif' }}>
                            Registrar Pago
                        </h2>
                        <p className="text-xs" style={{ color: '#9DBEBB' }}>Añadir pago de suscripción mensual</p>
                    </div>
                    <button onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        style={{ color: '#F4E9CD' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#468189' }}>
                            Empresa (Cliente) *
                        </label>
                        <Select
                            value={formData.company_id}
                            onValueChange={val => setFormData({ ...formData, company_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione una empresa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: '#468189' }}>
                                Monto (L.) *
                            </label>
                            <Input
                                type="number" step="0.01" min="0"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: '#468189' }}>
                                Método de pago *
                            </label>
                            <Select
                                value={formData.payment_method}
                                onValueChange={val => setFormData({ ...formData, payment_method: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transferencia">Transferencia</SelectItem>
                                    <SelectItem value="tarjeta">Tarjeta (Stripe/PayPal)</SelectItem>
                                    <SelectItem value="efectivo">Efectivo</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: '#468189' }}>
                                Fecha de pago *
                            </label>
                            <Input
                                type="date"
                                value={formData.payment_date}
                                onChange={e => handleDateChange(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: '#468189' }}>
                                Renovar Vencimiento
                            </label>
                            <Input
                                type="date"
                                value={formData.next_payment_at}
                                onChange={e => setFormData({ ...formData, next_payment_at: e.target.value })}
                                title="Si dejas este campo vacío, no se actualizará el vencimiento de la empresa."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#468189' }}>
                            Referencia / Comprobante
                        </label>
                        <Input
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Ej. TR-100293 (Opcional)"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 font-bold"
                            style={{ background: '#468189', color: '#F4E9CD' }}
                        >
                            {loading ? 'Guardando...' : 'Guardar Pago'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
