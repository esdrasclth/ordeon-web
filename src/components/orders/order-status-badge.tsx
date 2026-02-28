import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pendiente:       { label: 'Pendiente',       color: '#fff', bg: '#e67e22' },
  en_preparacion:  { label: 'En Preparación',  color: '#fff', bg: '#2980b9' },
  preparada:       { label: 'Preparada',        color: '#fff', bg: '#27ae60' },
  despachada:      { label: 'Despachada',       color: '#fff', bg: '#16a085' },
  facturada:       { label: 'Facturada',        color: '#fff', bg: '#468189' },
  cancelada:       { label: 'Cancelada',        color: '#fff', bg: '#d94f4f' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge style={{ background: config.bg, color: config.color, border: 'none', fontSize: 11 }}>
      {config.label}
    </Badge>
  )
}

export { STATUS_CONFIG }