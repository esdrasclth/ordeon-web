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
  warehouse_id?: string | null
  profiles?: { full_name: string }
}

export interface Warehouse {
  id: string
  company_id: string
  name: string
  code: string
  location: string | null
  is_default: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseStock {
  id: string
  warehouse_id: string
  product_id: string
  stock: number
  min_stock: number
  stock_reserved: number
  updated_at: string
  products?: { name: string; code: string; unit: string }
}

// ─── Contabilidad ─────────────────────────────────────────────────────────────

export type AccountType = 'activo' | 'pasivo' | 'capital' | 'ingreso' | 'gasto' | 'costo'

export interface Account {
  id: string
  company_id: string
  code: string
  name: string
  type: AccountType
  subtype: string | null
  parent_id: string | null
  is_detail: boolean
  active: boolean
  created_at: string
}

// ─── Compras ──────────────────────────────────────────────────────────────────

export type PurchaseOrderStatus =
  | 'borrador'
  | 'enviada'
  | 'recibida_parcial'
  | 'recibida'
  | 'cancelada'

export interface Supplier {
  id: string
  company_id: string
  code: string | null
  name: string
  rtn: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  department: string | null
  country: string
  credit_limit: number
  current_balance: number
  payment_terms: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  company_id: string
  po_number: number
  supplier_id: string
  warehouse_id: string | null
  status: PurchaseOrderStatus
  order_date: string
  expected_date: string | null
  received_date: string | null
  payment_terms: string | null
  subtotal: number
  isv_amount: number
  discount_amount: number
  total: number
  notes: string | null
  created_by: string | null
  received_by: string | null
  created_at: string
  updated_at: string
  // Relaciones
  suppliers?: { name: string; rtn: string | null }
  purchase_order_items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  po_id: string
  product_id: string
  quantity: number
  qty_received: number
  unit_cost: number
  isv_rate: number
  isv_amount: number
  discount_pct: number
  discount_amount: number
  line_total: number
  created_at: string
  // Relaciones
  products?: { name: string; code: string; unit: string }
}

export interface SupplierPayment {
  id: string
  company_id: string
  supplier_id: string
  po_id: string | null
  amount: number
  payment_date: string
  payment_method: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'otro'
  reference: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  // Relaciones
  suppliers?: { name: string }
}

export interface PurchaseOrderItemForm {
  product_id: string
  product_name: string
  product_code: string
  unit: string
  quantity: number
  unit_cost: number
  isv_rate: number
  discount_pct: number
}

// ─── Contabilidad ─────────────────────────────────────────────────────────────

export type JournalEntrySource =
  | 'manual'
  | 'venta'
  | 'compra'
  | 'ajuste_stock'
  | 'factura'
  | 'pago'
  | 'devolucion'

export interface JournalEntry {
  id: string
  company_id: string
  period_id: string | null
  entry_number: number
  date: string
  description: string
  reference: string | null
  source: JournalEntrySource
  source_id: string | null
  created_by: string | null
  created_at: string
  journal_lines?: JournalLine[]
}

export interface JournalLine {
  id: string
  entry_id: string
  account_id: string
  debit: number
  credit: number
  description: string | null
  accounts?: Account
}

export interface AccountingPeriod {
  id: string
  company_id: string
  name: string
  start_date: string
  end_date: string
  status: 'open' | 'closed'
  created_at: string
}