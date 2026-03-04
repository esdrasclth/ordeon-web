'use client'

import { useState, useMemo } from 'react'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/lib/hooks/use-products'
import { ProductForm } from '@/components/products/product-form'
import { StockBadge } from '@/components/shared/stock-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, Search, Pencil, PackageX, Eye, Trash2 } from 'lucide-react'
import { Product } from '@/types'
import { toast } from 'sonner'
import { useCategories } from '@/lib/hooks/use-categories'
import Link from 'next/link'

const PAGE_SIZE = 50

export default function ProductosPage() {
  const { data: products, isLoading } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const { data: categories } = useCategories()

  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('all')
  const [showForm,        setShowForm]        = useState(false)
  const [editingProduct,  setEditingProduct]  = useState<Product | null>(null)
  const [deletingId,      setDeletingId]      = useState<string | null>(null)
  const [page,            setPage]            = useState(1)

  const getStatus = (p: Product) => {
    if (Number(p.stock) <= 0) return 'sin_stock'
    if (Number(p.stock) <= Number(p.min_stock)) return 'stock_bajo'
    return 'normal'
  }

  const filtered = useMemo(() => {
    return products?.filter(p => {
      const matchSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || getStatus(p) === statusFilter
      return matchSearch && matchStatus
    }) ?? []
  }, [products, search, statusFilter])

  const handleSearch = (v: string) => { setSearch(v);       setPage(1) }
  const handleFilter = (v: string) => { setStatusFilter(v); setPage(1) }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCreate = async (data: any) => {
    try {
      await createProduct.mutateAsync(data)
      toast.success('Producto creado correctamente')
      setShowForm(false)
    } catch {
      toast.error('Error al crear el producto')
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingProduct) return
    try {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...data })
      toast.success('Producto actualizado')
      setEditingProduct(null)
    } catch {
      toast.error('Error al actualizar el producto')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro que deseas eliminar este producto? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await deleteProduct.mutateAsync(id)
      toast.success('Producto eliminado correctamente')
    } catch (e: any) {
      if (e.message?.includes('orden')) {
        toast.error('No se puede eliminar — tiene órdenes asociadas. Desactívalo desde edición.')
      } else {
        toast.error('Error al eliminar el producto')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Catálogo de Productos
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>
            {products?.filter(p => p.active).length ?? 0} productos activos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} style={{ background: '#468189', color: '#F4E9CD' }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9DBEBB' }} />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="pl-10 h-10"
            style={{ borderColor: '#d0e0de' }}
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all',        label: 'Todos'      },
            { value: 'normal',     label: 'Normal'     },
            { value: 'stock_bajo', label: 'Stock Bajo' },
            { value: 'sin_stock',  label: 'Sin Stock'  },
          ].map(f => (
            <button key={f.value} onClick={() => handleFilter(f.value)}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: statusFilter === f.value ? '#468189' : '#fff',
                color:      statusFilter === f.value ? '#F4E9CD' : '#777',
                border:     `1px solid ${statusFilter === f.value ? '#468189' : '#ddd'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>

        {/* Header tabla con paginación */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: '#031926' }}>
          <p className="text-sm font-bold" style={{ color: '#F4E9CD' }}>
            Productos
            <span className="ml-2 opacity-60 font-normal">({filtered.length})</span>
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#F4E9CD' }}>
                ‹
              </button>
              <span className="text-xs" style={{ color: '#9DBEBB' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#F4E9CD' }}>
                ›
              </button>
            </div>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow style={{ background: '#f8fafa' }}>
              {['Código', 'Producto', 'Unidad', 'Stock', 'Lista A', 'Lista B', 'Lista C', 'Estado', ''].map(h => (
                <TableHead key={h} style={{ color: '#9DBEBB', fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12" style={{ color: '#9DBEBB' }}>
                  Cargando productos...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12" style={{ color: '#9DBEBB' }}>
                  <PackageX className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((product, i) => {
                const status = getStatus(product)
                return (
                  <TableRow key={product.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fbfb' }}>
                    <TableCell className="font-mono text-xs font-semibold" style={{ color: '#468189' }}>
                      {product.code}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm" style={{ color: '#031926' }}>{product.name}</p>
                      {product.description && (
                        <p className="text-xs mt-0.5 truncate max-w-48" style={{ color: '#9DBEBB' }}>
                          {product.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: '#555' }}>{product.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold"
                          style={{
                            color: status === 'sin_stock'  ? '#d94f4f'
                                 : status === 'stock_bajo' ? '#e67e22'
                                 : '#27ae60'
                          }}>
                          {Number(product.stock).toLocaleString('es-HN')}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                          style={{
                            background: status === 'sin_stock'  ? '#d94f4f15'
                                      : status === 'stock_bajo' ? '#e67e2215'
                                      : '#27ae6015',
                            color:      status === 'sin_stock'  ? '#d94f4f'
                                      : status === 'stock_bajo' ? '#e67e22'
                                      : '#27ae60',
                          }}>
                          {status === 'sin_stock'  ? 'Sin stock'
                         : status === 'stock_bajo' ? 'Stock bajo'
                         : 'Normal'}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#9DBEBB' }}>
                        mín. {Number(product.min_stock).toLocaleString('es-HN')}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold text-sm" style={{ color: '#031926' }}>
                      L. {Number(product.price_a).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: '#555' }}>
                      L. {Number(product.price_b).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: '#555' }}>
                      L. {Number(product.price_c).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge style={{
                        background: product.active ? '#27ae60' : '#bbb',
                        color: '#fff', border: 'none'
                      }}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/productos/${product.id}`}>
                          <Button size="sm" variant="ghost" style={{ color: '#468189' }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => setEditingProduct(product)}
                          style={{ color: '#468189' }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleDelete(product.id)}
                          disabled={deleteProduct.isPending && deletingId === product.id}
                          style={{ color: '#d94f4f' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Paginación inferior */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
            <p className="text-xs" style={{ color: '#9DBEBB' }}>
              Mostrando {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} productos
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                style={{ border: '1px solid #ddd', color: '#555' }}>«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                style={{ border: '1px solid #ddd', color: '#555' }}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 rounded text-xs font-bold"
                    style={{
                      background: page === p ? '#468189' : 'transparent',
                      color:      page === p ? '#F4E9CD' : '#555',
                      border:     `1px solid ${page === p ? '#468189' : '#ddd'}`,
                    }}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                style={{ border: '1px solid #ddd', color: '#555' }}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30"
                style={{ border: '1px solid #ddd', color: '#555' }}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Nuevo Producto
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            loading={createProduct.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
              Editar Producto
            </DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProduct(null)}
              loading={updateProduct.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}