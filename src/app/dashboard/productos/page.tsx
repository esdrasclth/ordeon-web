'use client'

import { useState } from 'react'
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
import { Plus, Search, Pencil, PackageX } from 'lucide-react'
import { Product } from '@/types'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export default function ProductosPage() {
  const { data: products, isLoading } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  ) ?? []

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
        toast.error('No se puede eliminar — tiene órdenes asociadas. Desactívalo desde el formulario de edición.')
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#031926', fontFamily: 'Georgia, serif' }}>
            Catálogo de Productos
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#468189' }}>
            {products?.filter(p => p.active).length ?? 0} productos activos
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          style={{ background: '#468189', color: '#F4E9CD' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9DBEBB' }} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="pl-10 h-11"
          style={{ borderColor: '#d0e0de' }}
        />
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(68,129,137,0.15)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: '#031926' }}>
              {['Código', 'Producto', 'Unidad', 'Stock', 'Lista A', 'Lista B', 'Lista C', 'Estado', ''].map(h => (
                <TableHead key={h} style={{ color: '#F4E9CD', fontWeight: 700, fontSize: 11, letterSpacing: '0.05em' }}>
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
              filtered.map((product, i) => (
                <TableRow
                  key={product.id}
                  style={{ background: i % 2 === 0 ? '#fff' : '#f9fbfb' }}
                >
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
                    <StockBadge stock={product.stock} minStock={product.min_stock} />
                    <p className="text-xs mt-1" style={{ color: '#9DBEBB' }}>
                      {product.stock} / mín {product.min_stock}
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
                      color: '#fff',
                      border: 'none'
                    }}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingProduct(product)}
                        style={{ color: '#468189' }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteProduct.isPending && deletingId === product.id}
                        style={{ color: '#d94f4f' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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