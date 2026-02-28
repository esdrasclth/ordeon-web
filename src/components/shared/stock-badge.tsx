import { Badge } from '@/components/ui/badge'

interface StockBadgeProps {
  stock: number
  minStock: number
}

export function StockBadge({ stock, minStock }: StockBadgeProps) {
  if (stock === 0) {
    return (
      <Badge style={{ background: '#d94f4f', color: '#fff', border: 'none' }}>
        Sin Stock
      </Badge>
    )
  }
  if (stock < minStock) {
    return (
      <Badge style={{ background: '#e67e22', color: '#fff', border: 'none' }}>
        Stock Bajo
      </Badge>
    )
  }
  return (
    <Badge style={{ background: '#27ae60', color: '#fff', border: 'none' }}>
      Disponible
    </Badge>
  )
}