'use client'

import { useState, useRef, useEffect } from 'react'
import { useAllMovements, useAdjustStockBatch } from '@/lib/hooks/use-stock'
import { useProducts } from '@/lib/hooks/use-products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    Plus, Minus, RefreshCw, Search,
    ArrowLeftRight, Loader2, Trash2, Package
} from 'lucide-react'
import { toast } from 'sonner'

const fmt = (n: number) =>
    Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })

const MOVEMENT_CONFIG: Record<string, {
    label: string; color: string; bg: string; icon: React.ReactNode
}> = {
    entrada: { label: 'Entrada', color: '#27ae60', bg: '#27ae6015', icon: <Plus className="w-3.5 h-3.5" /> },
    salida: { label: 'Salida', color: '#d94f4f', bg: '#d94f4f15', icon: <Minus className="w-3.5 h-3.5" /> },
    ajuste: { label: 'Ajuste', color: '#2980b9', bg: '#2980b915', icon: <RefreshCw className="w-3.5 h-3.5" /> },
    venta: { label: 'Venta', color: '#e67e22', bg: '#e67e2215', icon: <Minus className="w-3.5 h-3.5" /> },
    devolucion: { label: 'Devolución', color: '#9b59b6', bg: '#9b59b615', icon: <Plus className="w-3.5 h-3.5" /> },
}

const REASONS_SALIDA = ['Merma', 'Daño', 'Vencimiento', 'Consumo interno', 'Robo/pérdida', 'Otro']
const REASONS_AJUSTE = ['Inventario físico', 'Error de conteo', 'Corrección sistema', 'Otro']

interface MovementLine {
    product_id: string
    quantity: string
}

export default function MovimientosPage() {
    const { data: movements, isLoading: movementsLoading } = useAllMovements()
    const { data: products } = useProducts()
    const adjustBatch = useAdjustStockBatch()

    // Filtros
    const [filterType, setFilterType] = useState('all')
    const [filterSearch, setFilterSearch] = useState('')

    // Modal
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<'entrada' | 'salida' | 'ajuste'>('entrada')

    // Form
    const [lines, setLines] = useState<MovementLine[]>([{ product_id: '', quantity: '' }])
    const [reference, setReference] = useState('')
    const [supplier, setSupplier] = useState('')
    const [reason, setReason] = useState('')
    const [notes, setNotes] = useState('')
    // Búsqueda por línea — cada línea tiene su propio texto de búsqueda y visibilidad de dropdown
    const [lineSearches, setLineSearches] = useState<string[]>([''])
    const [lineDropdowns, setLineDropdowns] = useState<boolean[]>([false])
    const searchRefs = useRef<(HTMLDivElement | null)[]>([])

    // Cerrar dropdowns al hacer click fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            setLineDropdowns(prev => prev.map((_, i) =>
                searchRefs.current[i]?.contains(e.target as Node) ? prev[i] : false
            ))
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const openModal = (type: 'entrada' | 'salida' | 'ajuste') => {
        setModalType(type)
        setLines([{ product_id: '', quantity: '' }])
        setReference('')
        setSupplier('')
        setReason('')
        setNotes('')
        setLineSearches([''])
        setLineDropdowns([false])
        setShowModal(true)
    }

    const addLine = () => {
        setLines(l => [...l, { product_id: '', quantity: '' }])
        setLineSearches(s => [...s, ''])
        setLineDropdowns(d => [...d, false])
    }

    const removeLine = (i: number) => {
        setLines(l => l.filter((_, idx) => idx !== i))
        setLineSearches(s => s.filter((_, idx) => idx !== i))
        setLineDropdowns(d => d.filter((_, idx) => idx !== i))
    }

    const updateLine = (i: number, field: keyof MovementLine, value: string) =>
        setLines(l => l.map((line, idx) => idx === i ? { ...line, [field]: value } : line))

    const handleSubmit = async () => {
        const validLines = lines.filter(l => l.product_id && l.quantity && Number(l.quantity) > 0)
        if (validLines.length === 0) {
            toast.error('Agrega al menos un producto con cantidad válida')
            return
        }

        try {
            await adjustBatch.mutateAsync({
                movements: validLines.map(l => ({
                    product_id: l.product_id,
                    quantity: Number(l.quantity),
                })),
                type: modalType,
                reference: reference || undefined,
                supplier: supplier || undefined,
                reason: reason || undefined,
                notes: notes || undefined,
            })
            toast.success(`${MOVEMENT_CONFIG[modalType].label} registrada correctamente`)
            setShowModal(false)
        } catch (e: any) {
            toast.error(e.message?.includes('insuficiente')
                ? 'Stock insuficiente en uno o más productos'
                : 'Error al registrar el movimiento'
            )
        }
    }

    // Filtrar movimientos
    const filtered = movements?.filter(m => {
        const matchType = filterType === 'all' || m.type === filterType
        const matchSearch = filterSearch === '' ||
            (m as any).products?.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
            (m as any).products?.code.toLowerCase().includes(filterSearch.toLowerCase()) ||
            (m.reference ?? '').toLowerCase().includes(filterSearch.toLowerCase())
        return matchType && matchSearch
    }) ?? []

    // Productos filtrados por texto de búsqueda de cada línea
    const getFilteredProducts = (lineIdx: number) => {
        const q = lineSearches[lineIdx]?.toLowerCase() ?? ''
        return (products?.filter(p =>
            p.active && (
                q === '' ||
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q)
            )
        ) ?? []).slice(0, 8)
    }

    // KPIs del día
    const today = new Date().toDateString()
    const todayMovs = movements?.filter(m =>
        new Date(m.created_at).toDateString() === today
    ) ?? []
    const entradas = todayMovs.filter(m => m.type === 'entrada' || m.type === 'devolucion')
    const salidas = todayMovs.filter(m => m.type === 'salida')
    const ajustes = todayMovs.filter(m => m.type === 'ajuste')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold"
                        style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                        Movimientos de Inventario
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#468189' }}>
                        Control de entradas, salidas y ajustes de stock
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => openModal('entrada')}
                        style={{ background: '#27ae60', color: '#fff' }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Entrada
                    </Button>
                    <Button onClick={() => openModal('salida')}
                        style={{ background: '#d94f4f', color: '#fff' }}>
                        <Minus className="w-4 h-4 mr-2" />
                        Salida
                    </Button>
                    <Button onClick={() => openModal('ajuste')}
                        style={{ background: '#2980b9', color: '#fff' }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Ajuste
                    </Button>
                </div>
            </div>

            {/* KPIs del día */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                    {
                        label: 'Movimientos hoy',
                        value: String(todayMovs.length),
                        icon: <ArrowLeftRight className="w-5 h-5" />,
                        color: '#468189',
                    },
                    {
                        label: 'Entradas hoy',
                        value: String(entradas.length),
                        sub: `${entradas.reduce((a, m) => a + Number(m.quantity), 0)} uds`,
                        icon: <Plus className="w-5 h-5" />,
                        color: '#27ae60',
                    },
                    {
                        label: 'Salidas hoy',
                        value: String(salidas.length),
                        sub: `${salidas.reduce((a, m) => a + Number(m.quantity), 0)} uds`,
                        icon: <Minus className="w-5 h-5" />,
                        color: '#d94f4f',
                    },
                    {
                        label: 'Ajustes hoy',
                        value: String(ajustes.length),
                        icon: <RefreshCw className="w-5 h-5" />,
                        color: '#2980b9',
                    },
                ].map(kpi => (
                    <div key={kpi.label} className="rounded-xl p-5 shadow-sm"
                        style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${kpi.color}18` }}>
                                <div style={{ color: kpi.color }}>{kpi.icon}</div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold"
                                    style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                                    {kpi.value}
                                </p>
                                <p className="text-xs font-semibold" style={{ color: kpi.color }}>
                                    {kpi.label}
                                </p>
                                {(kpi as any).sub && (
                                    <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>{(kpi as any).sub}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex gap-3 items-center">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: '#9DBEBB' }} />
                    <Input
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                        placeholder="Buscar producto o referencia..."
                        className="pl-10 h-10"
                        style={{ borderColor: '#d0e0de' }}
                    />
                </div>
                <div className="flex gap-2">
                    {[
                        { value: 'all', label: 'Todos' },
                        { value: 'entrada', label: 'Entradas' },
                        { value: 'salida', label: 'Salidas' },
                        { value: 'ajuste', label: 'Ajustes' },
                        { value: 'venta', label: 'Ventas' },
                        { value: 'devolucion', label: 'Devoluciones' },
                    ].map(tab => (
                        <button key={tab.value} onClick={() => setFilterType(tab.value)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                background: filterType === tab.value ? '#468189' : '#fff',
                                color: filterType === tab.value ? '#F4E9CD' : '#777',
                                border: `1px solid ${filterType === tab.value ? '#468189' : '#ddd'}`,
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla de movimientos */}
            <div className="rounded-xl overflow-hidden shadow-sm"
                style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
                <div className="px-5 py-4" style={{ background: '#031926' }}>
                    <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                        Historial de Movimientos
                        <span className="ml-2 opacity-60 font-normal">
                            ({filtered.length} registros)
                        </span>
                    </h3>
                </div>

                {movementsLoading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center" style={{ color: '#9DBEBB' }}>
                        <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Sin movimientos registrados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                                    {['Fecha', 'Tipo', 'Producto', 'Cant.', 'Antes', 'Después', 'Valor L.', 'Referencia', 'Proveedor/Motivo', 'Usuario', 'Notas'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left whitespace-nowrap"
                                            style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m, i) => {
                                    const cfg = MOVEMENT_CONFIG[m.type] ?? MOVEMENT_CONFIG.ajuste
                                    const isPositive = ['entrada', 'devolucion'].includes(m.type)
                                    const valor = (m as any).products?.purchase_price
                                        ? Number(m.quantity) * Number((m as any).products.purchase_price)
                                        : null

                                    return (
                                        <tr key={m.id}
                                            style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>

                                            {/* Fecha */}
                                            <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#777' }}>
                                                {new Date(m.created_at).toLocaleString('es-HN', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>

                                            {/* Tipo */}
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full w-fit"
                                                    style={{ background: cfg.bg, color: cfg.color }}>
                                                    {cfg.icon} {cfg.label}
                                                </span>
                                            </td>

                                            {/* Producto */}
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold" style={{ color: '#031926' }}>
                                                    {(m as any).products?.name ?? '—'}
                                                </p>
                                                <p className="text-xs font-mono" style={{ color: '#9DBEBB' }}>
                                                    {(m as any).products?.code}
                                                </p>
                                            </td>

                                            {/* Cantidad */}
                                            <td className="px-4 py-3 text-sm font-bold text-center"
                                                style={{ color: cfg.color }}>
                                                {isPositive ? '+' : m.type === 'ajuste' ? '' : '-'}{fmt(Number(m.quantity))}
                                                <span className="text-xs font-normal ml-1" style={{ color: '#9DBEBB' }}>
                                                    {(m as any).products?.unit}
                                                </span>
                                            </td>

                                            {/* Antes */}
                                            <td className="px-4 py-3 text-sm text-center" style={{ color: '#777' }}>
                                                {fmt(Number(m.stock_before))}
                                            </td>

                                            {/* Después */}
                                            <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: '#031926' }}>
                                                {fmt(Number(m.stock_after))}
                                            </td>

                                            {/* Valor L. */}
                                            <td className="px-4 py-3 text-sm font-bold" style={{ color: '#468189' }}>
                                                {valor !== null
                                                    ? `L. ${valor.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
                                                    : '—'
                                                }
                                            </td>

                                            {/* Referencia */}
                                            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                                                {(m as any).reference ?? '—'}
                                            </td>

                                            {/* Proveedor/Motivo */}
                                            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                                                {(m as any).supplier || (m as any).reason || '—'}
                                            </td>

                                            {/* Usuario */}
                                            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                                                {(m as any).profiles?.full_name ?? '—'}
                                            </td>

                                            {/* Notas */}
                                            <td className="px-4 py-3 text-xs" style={{ color: '#777', maxWidth: 150 }}>
                                                {m.notes ?? '—'}
                                            </td>

                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de movimiento */}
            {showModal && (
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"
                        aria-describedby={undefined}>
                        <DialogHeader>
                            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                                <span className="flex items-center gap-2">
                                    <span style={{ color: MOVEMENT_CONFIG[modalType].color }}>
                                        {MOVEMENT_CONFIG[modalType].icon}
                                    </span>
                                    Registrar {MOVEMENT_CONFIG[modalType].label}
                                </span>
                            </DialogTitle>
                        </DialogHeader>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>

                            {/* Datos del documento */}
                            <div className="rounded-lg p-4"
                                style={{ background: '#f8fafa', border: '1px solid #e0eded' }}>
                                <p className="text-xs font-bold uppercase tracking-wide mb-3"
                                    style={{ color: '#468189' }}>
                                    Datos del documento
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                                            # Referencia / Factura
                                        </Label>
                                        <Input
                                            value={reference}
                                            onChange={e => setReference(e.target.value)}
                                            placeholder="FAC-001, REC-2024..."
                                            className="mt-1.5 h-10"
                                        />
                                    </div>
                                    {modalType === 'entrada' && (
                                        <div>
                                            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                                                Proveedor
                                            </Label>
                                            <Input
                                                value={supplier}
                                                onChange={e => setSupplier(e.target.value)}
                                                placeholder="Nombre del proveedor..."
                                                className="mt-1.5 h-10"
                                            />
                                        </div>
                                    )}
                                    {(modalType === 'salida' || modalType === 'ajuste') && (
                                        <div>
                                            <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                                                Motivo
                                            </Label>
                                            <Select value={reason} onValueChange={setReason}>
                                                <SelectTrigger className="mt-1.5 h-10">
                                                    <SelectValue placeholder="Seleccionar motivo..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(modalType === 'salida' ? REASONS_SALIDA : REASONS_AJUSTE).map(r => (
                                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <Label style={{ color: '#031926', fontWeight: 600, fontSize: 12 }}>
                                        Notas (opcional)
                                    </Label>
                                    <Textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Observaciones adicionales..."
                                        className="mt-1.5 resize-none"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Líneas de productos */}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide mb-3"
                                    style={{ color: '#468189' }}>
                                    Productos
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {lines.map((line, i) => {
                                        const selected = products?.find(p => p.id === line.product_id)
                                        const filtered = getFilteredProducts(i)
                                        return (
                                            <div key={i} className="rounded-lg p-3"
                                                style={{ background: '#f8fafa', border: '1px solid #e0eded' }}>
                                                <div className="flex gap-3 items-start">
                                                    {/* Combobox buscador por línea */}
                                                    <div className="flex-1">
                                                        <div
                                                            ref={el => { searchRefs.current[i] = el }}
                                                            className="relative"
                                                        >
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                                                                style={{ color: '#9DBEBB' }} />
                                                            <input
                                                                type="text"
                                                                value={lineSearches[i] ?? ''}
                                                                onChange={e => {
                                                                    const v = e.target.value
                                                                    setLineSearches(s => s.map((x, idx) => idx === i ? v : x))
                                                                    setLineDropdowns(d => d.map((x, idx) => idx === i ? true : x))
                                                                    // Si el usuario borra el texto, limpiar selección
                                                                    if (!v) updateLine(i, 'product_id', '')
                                                                }}
                                                                onFocus={() =>
                                                                    setLineDropdowns(d => d.map((x, idx) => idx === i ? true : x))
                                                                }
                                                                placeholder={selected ? selected.name : 'Buscar producto por nombre o código...'}
                                                                className="w-full h-10 pl-10 pr-4 rounded-md border text-sm outline-none transition-colors"
                                                                style={{
                                                                    borderColor: lineDropdowns[i] ? '#468189' : 'rgba(68,129,137,0.3)',
                                                                    boxShadow: lineDropdowns[i] ? '0 0 0 2px rgba(68,129,137,0.12)' : 'none',
                                                                    color: '#031926',
                                                                    background: '#fff',
                                                                }}
                                                            />

                                                            {lineDropdowns[i] && (
                                                                <div
                                                                    className="absolute z-30 mt-1 w-full rounded-lg overflow-hidden shadow-xl"
                                                                    style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.25)' }}
                                                                >
                                                                    {filtered.length === 0 ? (
                                                                        <p className="p-3 text-sm text-center" style={{ color: '#9DBEBB' }}>Sin resultados</p>
                                                                    ) : (
                                                                        <ul className="max-h-52 overflow-y-auto">
                                                                            {filtered.map(p => (
                                                                                <li key={p.id}>
                                                                                    <button
                                                                                        type="button"
                                                                                        onMouseDown={e => {
                                                                                            e.preventDefault()
                                                                                            updateLine(i, 'product_id', p.id)
                                                                                            setLineSearches(s => s.map((x, idx) => idx === i ? '' : x))
                                                                                            setLineDropdowns(d => d.map((x, idx) => idx === i ? false : x))
                                                                                        }}
                                                                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
                                                                                        style={{
                                                                                            background: p.id === line.product_id ? 'rgba(68,129,137,0.08)' : 'transparent',
                                                                                            borderBottom: '1px solid #f5f5f5',
                                                                                        }}
                                                                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(68,129,137,0.06)')}
                                                                                        onMouseLeave={e => (e.currentTarget.style.background = p.id === line.product_id ? 'rgba(68,129,137,0.08)' : 'transparent')}
                                                                                    >
                                                                                        <div>
                                                                                            <span className="font-mono text-xs mr-2" style={{ color: '#9DBEBB' }}>{p.code}</span>
                                                                                            <span className="text-sm font-medium" style={{ color: '#031926' }}>{p.name}</span>
                                                                                            <span className="text-xs ml-2" style={{ color: '#9DBEBB' }}>{p.unit}</span>
                                                                                        </div>
                                                                                        <span className="text-xs font-semibold ml-3 flex-shrink-0"
                                                                                            style={{ color: Number(p.stock) <= Number(p.min_stock) ? '#e67e22' : '#27ae60' }}>
                                                                                            Stock: {p.stock}
                                                                                        </span>
                                                                                    </button>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {selected && (
                                                            <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                                                                Stock actual: <strong style={{ color: '#031926' }}>
                                                                    {selected.stock} {selected.unit}
                                                                </strong>
                                                                {modalType === 'ajuste' && line.quantity && (
                                                                    <span className="ml-2">
                                                                        → Nuevo stock: <strong style={{ color: '#2980b9' }}>
                                                                            {line.quantity} {selected.unit}
                                                                        </strong>
                                                                    </span>
                                                                )}
                                                                {modalType === 'entrada' && line.quantity && (
                                                                    <span className="ml-2">
                                                                        → Nuevo stock: <strong style={{ color: '#27ae60' }}>
                                                                            {Number(selected.stock) + Number(line.quantity)} {selected.unit}
                                                                        </strong>
                                                                    </span>
                                                                )}
                                                                {modalType === 'salida' && line.quantity && (
                                                                    <span className="ml-2">
                                                                        → Nuevo stock: <strong style={{
                                                                            color: Number(selected.stock) - Number(line.quantity) < 0
                                                                                ? '#d94f4f' : '#031926'
                                                                        }}>
                                                                            {Number(selected.stock) - Number(line.quantity)} {selected.unit}
                                                                        </strong>
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="w-32">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={line.quantity}
                                                            onChange={e => updateLine(i, 'quantity', e.target.value)}
                                                            placeholder={modalType === 'ajuste' ? 'Stock final' : 'Cantidad'}
                                                            className="h-10 text-center"
                                                        />
                                                    </div>
                                                    {lines.length > 1 && (
                                                        <Button size="sm" variant="ghost"
                                                            onClick={() => removeLine(i)}
                                                            style={{ color: '#d94f4f', height: 40 }}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <Button variant="outline" onClick={addLine} className="w-full mt-3 h-9"
                                    style={{ borderStyle: 'dashed', color: '#468189', borderColor: '#468189' }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar producto
                                </Button>
                            </div>

                            {/* Resumen */}
                            {lines.some(l => l.product_id && l.quantity) && (
                                <div className="rounded-lg p-3"
                                    style={{ background: MOVEMENT_CONFIG[modalType].bg, border: `1px solid ${MOVEMENT_CONFIG[modalType].color}30` }}>
                                    <p className="text-xs font-bold" style={{ color: MOVEMENT_CONFIG[modalType].color }}>
                                        Resumen: {lines.filter(l => l.product_id && l.quantity).length} producto(s) ·{' '}
                                        {lines.filter(l => l.product_id && l.quantity)
                                            .reduce((a, l) => a + Number(l.quantity), 0)} unidades totales
                                    </p>
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={adjustBatch.isPending}
                                    style={{
                                        background: MOVEMENT_CONFIG[modalType].color,
                                        color: '#fff'
                                    }}
                                >
                                    {adjustBatch.isPending
                                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</>
                                        : <>Confirmar {MOVEMENT_CONFIG[modalType].label}</>
                                    }
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}