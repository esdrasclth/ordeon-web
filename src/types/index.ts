export type UserRole = 'admin' | 'supervisor' | 'vendedor' | 'almacen' | 'facturacion'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  region: string | null
  phone: string | null
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  code: string
  name: string
  description: string | null
  category_id?: string | null
  product_categories?: ProductCategory | null
  unit: string
  price_a: number
  price_b: number
  price_c: number
  stock: number
  min_stock: number
  image_url: string | null
  active: boolean
  created_at: string
  updated_at: string
  purchase_price?: number
  stock_reserved?: number
}

export interface Client {
  id: string
  code: string | null
  name: string
  rtn: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  department: string | null
  price_list: 'A' | 'B' | 'C'
  credit_limit: number
  current_balance: number
  payment_terms: string | null
  assigned_vendor: string | null
  status: 'active' | 'blocked' | 'inactive'
  notes: string | null
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'pendiente'
  | 'pendiente_aprobacion'
  | 'en_preparacion'
  | 'preparada'
  | 'despachada'
  | 'facturada'
  | 'cancelada'
  | 'rechazada'

export interface SalesOrder {
  id: string
  order_number: number
  client_id: string
  vendor_id: string
  status: OrderStatus
  order_date: string
  delivery_date: string | null
  payment_terms: string
  delivery_method: string
  warehouse_id: string | null
  price_list: string
  subtotal: number
  isv_amount: number
  discount_amount: number
  total: number
  notes: string | null
  invoice_number: string | null
  invoiced_at: string | null
  created_at: string
  updated_at: string
  // Relaciones
  clients?: { name: string; rtn: string | null }
  profiles?: { full_name: string }
}

export interface SalesOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  unit_price_base: number
  isv_rate: number
  isv_amount: number
  discount_pct: number
  discount_amount: number
  line_total: number
  created_at: string
  // Relaciones
  products?: { name: string; code: string; unit: string }
}

export interface OrderStatusLog {
  id: string
  order_id: string
  status: OrderStatus
  changed_by: string | null
  notes: string | null
  created_at: string
  profiles?: { full_name: string }
}

export interface OrderItemForm {
  product_id: string
  product_name: string
  product_code: string
  unit: string
  quantity: number
  unit_price: number
  discount_pct: number
}

export interface ProductCategory {
  id: string
  name: string
  description: string | null
  color: string
  active: boolean
  created_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  type: 'entrada' | 'salida' | 'ajuste' | 'venta' | 'devolucion'
  quantity: number
  stock_before: number
  stock_after: number
  notes: string | null
  created_by: string | null
  created_at: string
  profiles?: { full_name: string }
}