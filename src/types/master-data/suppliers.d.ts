export interface SupplierDropdown {
  id: number
  supplier_code: string
  name: string
}

export interface Suppliers {
  id: number
  supplier_code: string
  name: string
  email?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}