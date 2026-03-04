'use client'

import { useState, useMemo } from 'react'
import { useProducts } from '@/lib/hooks/use-products'
import { PdfDownloadButton } from '@/components/inventory/pdf-download-button'
import { memo } from 'react'
import {
    useInventoryOverview,
    useInventoryByCategory,
    useProductRotation,
} from '@/lib/hooks/use-stock'
import { useSettings } from '@/lib/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Boxes, TrendingUp, AlertTriangle, XCircle,
    Search, FileDown, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'

const fmt = (n: number) =>
    `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

const STATUS_CONFIG = {
    normal: { label: 'Normal', color: '#27ae60', bg: '#27ae6015' },
    stock_bajo: { label: 'Stock Bajo', color: '#e67e22', bg: '#e67e2215' },
    sin_stock: { label: 'Sin Stock', color: '#d94f4f', bg: '#d94f4f15' },
}

const ROTATION_CONFIG = {
    normal: { label: 'Normal', color: '#27ae60' },
    baja: { label: 'Baja', color: '#e67e22' },
    sin_rotacion: { label: 'Sin rotación', color: '#d94f4f' },
}

const FILTROS = [
    { value: 'all', label: 'Todos' },
    { value: 'normal', label: 'Normal' },
    { value: 'stock_bajo', label: 'Stock Bajo' },
    { value: 'sin_stock', label: 'Sin Stock' },
] as const

const PAGE_SIZE = 50

const StockRow = memo(function StockRow({ p, i }: { p: any; i: number }) {
    const stock = Number(p.stock)
    const status = stock <= 0 ? 'sin_stock' : stock <= Number(p.min_stock) ? 'stock_bajo' : 'normal'
    const cfg = STATUS_CONFIG[status]
    const valor = stock * Number(p.purchase_price || 0)

    return (
        <tr style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <td className="px-4 py-3">
                <span className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                </span>
            </td>
            <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: '#468189' }}>{p.code}</td>
            <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#031926' }}>{p.name}</td>
            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                {p.product_categories?.name ?? '—'}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>{p.unit}</td>
            <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: cfg.color }}>
                {stock.toLocaleString('es-HN')}
            </td>
            <td className="px-4 py-3 text-sm text-center" style={{ color: '#e67e22' }}>
                {Number(p.stock_reserved ?? 0) > 0
                    ? Number(p.stock_reserved).toLocaleString('es-HN')
                    : '—'}
            </td>
            <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: '#27ae60' }}>
                {(stock - Number(p.stock_reserved ?? 0)).toLocaleString('es-HN')}
            </td>
            <td className="px-4 py-3 text-xs text-center" style={{ color: '#777' }}>
                {Number(p.min_stock).toLocaleString('es-HN')}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>
                {p.purchase_price ? `L. ${Number(p.purchase_price).toFixed(2)}` : '—'}
            </td>
            <td className="px-4 py-3 text-sm font-bold" style={{ color: '#468189' }}>
                {valor > 0 ? `L. ${valor.toLocaleString('es-HN', { minimumFractionDigits: 2 })}` : '—'}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>L. {Number(p.price_a).toFixed(2)}</td>
            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>L. {Number(p.price_b).toFixed(2)}</td>
            <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>L. {Number(p.price_c).toFixed(2)}</td>
        </tr>
    )
})

export default function InventarioPage() {
    const { data: products, isLoading: productsLoading } = useProducts()
    const { data: overview, isLoading: overviewLoading } = useInventoryOverview()
    const { data: byCategory } = useInventoryByCategory()
    const { data: rotation, isLoading: rotationLoading } = useProductRotation(90)
    const { data: settings } = useSettings()

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [activeTab, setActiveTab] = useState<'stock' | 'rotacion'>('stock')
    const [alertasOpen, setAlertasOpen] = useState(false)
    const [page, setPage] = useState(1)

    const getStatus = (p: any) => {
        const stock = Number(p.stock)
        if (stock <= 0) return 'sin_stock'
        if (stock <= Number(p.min_stock)) return 'stock_bajo'
        return 'normal'
    }

    const filtered = useMemo(() => products?.filter(p => {
        if (!p.active) return false
        const matchSearch = search === '' ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.code.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || getStatus(p) === statusFilter
        return matchSearch && matchStatus
    }) ?? [], [products, search, statusFilter])

    // Reset página al filtrar
    const handleSearch = (v: string) => { setSearch(v); setPage(1) }
    const handleFilter = (v: string) => { setStatusFilter(v); setPage(1) }

    // Paginación
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const alertas = products?.filter(p => p.active && p.stock <= p.min_stock) ?? []
    const alertasSinStock = alertas.filter(p => p.stock <= 0)
    const alertasStockBajo = alertas.filter(p => p.stock > 0)

    const activeProducts = useMemo(
        () => products?.filter(p => p.active) ?? [],
        [products]
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold"
                        style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                        Inventario
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#468189' }}>
                        Estado actual del stock y valoración
                    </p>
                </div>
                {products && settings && (
                    <PdfDownloadButton
                        products={activeProducts}
                        overview={overview}
                        settings={settings}
                    />
                )}
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                {[
                    { label: 'Valor Total', value: overviewLoading ? '...' : fmt(overview?.valor_total ?? 0), icon: <TrendingUp className="w-5 h-5" />, color: '#468189' },
                    { label: 'Total Productos', value: overviewLoading ? '...' : String(overview?.total_productos ?? 0), icon: <Boxes className="w-5 h-5" />, color: '#031926' },
                    { label: 'Stock Normal', value: overviewLoading ? '...' : String(overview?.stock_normal ?? 0), icon: <Boxes className="w-5 h-5" />, color: '#27ae60' },
                    { label: 'Stock Bajo', value: overviewLoading ? '...' : String(overview?.stock_bajo ?? 0), icon: <AlertTriangle className="w-5 h-5" />, color: '#e67e22' },
                    { label: 'Sin Stock', value: overviewLoading ? '...' : String(overview?.sin_stock ?? 0), icon: <XCircle className="w-5 h-5" />, color: '#d94f4f' },
                ].map(kpi => (
                    <div key={kpi.label} className="rounded-xl p-5 shadow-sm"
                        style={{ background: '#fff', border: '1px solid rgba(68,129,137,0.12)' }}>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${kpi.color}18` }}>
                                <div style={{ color: kpi.color }}>{kpi.icon}</div>
                            </div>
                            <div>
                                <p className="text-lg font-bold"
                                    style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
                                    {kpi.value}
                                </p>
                                <p className="text-xs font-semibold mt-0.5" style={{ color: kpi.color }}>
                                    {kpi.label}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Alertas — colapsable y en tabla */}
            {alertas.length > 0 && (
                <div className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(230,126,34,0.3)' }}>
                    <button
                        onClick={() => setAlertasOpen(v => !v)}
                        className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:opacity-90"
                        style={{ background: '#fff8f0' }}
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#e67e22' }} />
                            <span className="text-sm font-bold" style={{ color: '#e67e22' }}>
                                {alertas.length} producto(s) requieren reabastecimiento
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: '#d94f4f15', color: '#d94f4f' }}>
                                {alertasSinStock.length} sin stock
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: '#e67e2215', color: '#e67e22' }}>
                                {alertasStockBajo.length} stock bajo
                            </span>
                        </div>
                        {alertasOpen
                            ? <ChevronUp className="w-4 h-4" style={{ color: '#e67e22' }} />
                            : <ChevronDown className="w-4 h-4" style={{ color: '#e67e22' }} />
                        }
                    </button>

                    {alertasOpen && (
                        <div style={{ background: '#fff' }}>
                            <table className="w-full">
                                <thead>
                                    <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                                        {['Estado', 'Código', 'Producto', 'Unidad', 'Stock actual', 'Mínimo'].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-left"
                                                style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {alertas.map((p, i) => (
                                        <tr key={p.id}
                                            style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f5f5f5' }}>
                                            <td className="px-4 py-2.5">
                                                <span className="text-xs font-bold px-2 py-1 rounded-full"
                                                    style={{
                                                        background: p.stock <= 0 ? '#d94f4f15' : '#e67e2215',
                                                        color: p.stock <= 0 ? '#d94f4f' : '#e67e22',
                                                    }}>
                                                    {p.stock <= 0 ? 'Sin stock' : 'Stock bajo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs font-mono font-bold" style={{ color: '#468189' }}>
                                                {p.code}
                                            </td>
                                            <td className="px-4 py-2.5 text-sm font-medium" style={{ color: '#031926' }}>
                                                {p.name}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs" style={{ color: '#777' }}>{p.unit}</td>
                                            <td className="px-4 py-2.5 text-sm font-bold text-center"
                                                style={{ color: p.stock <= 0 ? '#d94f4f' : '#e67e22' }}>
                                                {Number(p.stock).toLocaleString('es-HN')}
                                            </td>
                                            <td className="px-4 py-2.5 text-sm text-center" style={{ color: '#777' }}>
                                                {Number(p.min_stock).toLocaleString('es-HN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Valoración por categoría */}
            {byCategory && byCategory.length > 0 && (
                <div className="rounded-xl overflow-hidden shadow-sm"
                    style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
                    <div className="px-5 py-4" style={{ background: '#031926' }}>
                        <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                            Valoración por Categoría
                        </h3>
                    </div>
                    <div className="p-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        {byCategory.map(cat => {
                            const pct = overview?.valor_total
                                ? (cat.valor_total / overview.valor_total) * 100
                                : 0
                            return (
                                <div key={cat.category} className="rounded-lg p-4"
                                    style={{ background: '#f8fafa', border: `1px solid ${cat.color}30` }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                                        <p className="text-xs font-bold" style={{ color: '#031926' }}>{cat.category}</p>
                                    </div>
                                    <p className="text-lg font-bold" style={{ color: cat.color }}>
                                        {fmt(cat.valor_total)}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                                        {cat.total_products} productos · {Number(cat.total_units).toLocaleString('es-HN')} uds
                                    </p>
                                    <div className="h-1.5 rounded-full mt-2" style={{ background: '#e8efee' }}>
                                        <div className="h-full rounded-full"
                                            style={{ width: `${pct}%`, background: cat.color }} />
                                    </div>
                                    <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                                        {pct.toFixed(1)}% del valor total
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div>
                <div className="flex gap-2 mb-4">
                    {[
                        { key: 'stock', label: 'Vista de Stock' },
                        { key: 'rotacion', label: 'Rotación de Productos' },
                    ].map(tab => (
                        <button key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{
                                background: activeTab === tab.key ? '#468189' : '#fff',
                                color: activeTab === tab.key ? '#F4E9CD' : '#777',
                                border: `1px solid ${activeTab === tab.key ? '#468189' : '#ddd'}`,
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Stock */}
                {activeTab === 'stock' && (
                    <div>
                        {/* Filtros */}
                        <div className="flex gap-3 mb-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                    style={{ color: '#9DBEBB' }} />
                                <Input
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Buscar por nombre o código..."
                                    className="pl-10 h-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                {[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'normal', label: 'Normal' },
                                    { value: 'stock_bajo', label: 'Stock Bajo' },
                                    { value: 'sin_stock', label: 'Sin Stock' },
                                ].map(f => (
                                    <button key={f.value} onClick={() => handleFilter(f.value)}
                                        className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                                        style={{
                                            background: statusFilter === f.value ? '#468189' : '#fff',
                                            color: statusFilter === f.value ? '#F4E9CD' : '#777',
                                            border: `1px solid ${statusFilter === f.value ? '#468189' : '#ddd'}`,
                                        }}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="rounded-xl overflow-hidden shadow-sm"
                            style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
                            <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#031926' }}>
                                <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                                    Stock por Producto
                                    <span className="ml-2 opacity-60 font-normal">({filtered.length} productos)</span>
                                </h3>
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                                            style={{ background: 'rgba(255,255,255,0.1)', color: '#F4E9CD' }}
                                        >
                                            ‹
                                        </button>
                                        <span className="text-xs" style={{ color: '#9DBEBB' }}>
                                            {page} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                                            style={{ background: 'rgba(255,255,255,0.1)', color: '#F4E9CD' }}
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            </div>
                            {productsLoading ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} />
                                </div>
                            ) : (
                                <>
                                    <table className="w-full">
                                        <thead>
                                            <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                                                {['Estado', 'Código', 'Producto', 'Categoría', 'Unidad', 'Stock', 'Reservado', 'Disponible', 'Mínimo', 'P. Compra', 'Valor Stock', 'Lista A', 'Lista B', 'Lista C'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left"
                                                        style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginated.map((p, i) => (
                                                <StockRow key={p.id} p={p} i={i} />
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Paginación inferior */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between px-5 py-3"
                                            style={{ borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
                                            <p className="text-xs" style={{ color: '#9DBEBB' }}>
                                                Mostrando {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} productos
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPage(1)}
                                                    disabled={page === 1}
                                                    className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                                                    style={{ border: '1px solid #ddd', color: '#555' }}
                                                >
                                                    «
                                                </button>
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                                                    style={{ border: '1px solid #ddd', color: '#555' }}
                                                >
                                                    ‹
                                                </button>
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                                                    return (
                                                        <button key={p} onClick={() => setPage(p)}
                                                            className="w-7 h-7 rounded text-xs font-bold"
                                                            style={{
                                                                background: page === p ? '#468189' : 'transparent',
                                                                color: page === p ? '#F4E9CD' : '#555',
                                                                border: `1px solid ${page === p ? '#468189' : '#ddd'}`,
                                                            }}>
                                                            {p}
                                                        </button>
                                                    )
                                                })}
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                                                    style={{ border: '1px solid #ddd', color: '#555' }}
                                                >
                                                    ›
                                                </button>
                                                <button
                                                    onClick={() => setPage(totalPages)}
                                                    disabled={page === totalPages}
                                                    className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                                                    style={{ border: '1px solid #ddd', color: '#555' }}
                                                >
                                                    »
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Rotación */}
                {activeTab === 'rotacion' && (
                    <div className="rounded-xl overflow-hidden shadow-sm"
                        style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
                        <div className="px-5 py-4" style={{ background: '#031926' }}>
                            <h3 className="font-bold text-sm" style={{ color: '#F4E9CD' }}>
                                Rotación de Productos — Últimos 90 días
                            </h3>
                        </div>
                        {rotationLoading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#468189' }} />
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr style={{ background: '#f8fafa', borderBottom: '1px solid #eee' }}>
                                        {['Rotación', 'Código', 'Producto', 'Stock', 'Vendido (90d)', 'Movimientos', 'Valor en Stock'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left"
                                                style={{ fontSize: 11, color: '#9DBEBB', fontWeight: 700 }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rotation?.map((p, i) => {
                                        const cfg = ROTATION_CONFIG[p.rotacion as keyof typeof ROTATION_CONFIG]
                                        const valor = Number(p.valor_stock)
                                        return (
                                            <tr key={p.id}
                                                style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                                                        style={{ background: cfg.color + '15', color: cfg.color }}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: '#468189' }}>{p.code}</td>
                                                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#031926' }}>{p.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <p className="text-sm font-bold" style={{ color: cfg.color }}>
                                                        {Number(p.stock).toLocaleString('es-HN')}
                                                    </p>
                                                    {Number((p as any).stock_reserved ?? 0) > 0 && (
                                                        <p className="text-xs" style={{ color: '#e67e22' }}>
                                                            {Number((p as any).stock_reserved).toLocaleString('es-HN')} reservado
                                                        </p>
                                                    )}
                                                    <p className="text-xs" style={{ color: '#27ae60' }}>
                                                        {(Number(p.stock) - Number((p as any).stock_reserved ?? 0)).toLocaleString('es-HN')} disp.
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: cfg.color }}>
                                                    {Number(p.total_vendido).toLocaleString('es-HN')} {p.unit}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center" style={{ color: '#555' }}>
                                                    {p.num_movimientos}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-bold" style={{ color: '#468189' }}>
                                                    {valor > 0 ? fmt(valor) : '—'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}