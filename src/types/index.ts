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
  category_id: string | null
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