import type { Suppliers } from './suppliers'

export interface PartDropdown {
  id: number
  part_number: string
  part_name: string
  part_type_code?: string | null
}

export interface Parts {
  id: number
  part_number: string
  part_name: string
  part_type_code: string
  part_category: string
  supplier_id: number
  suppliers?: Pick<Suppliers, 'id' | 'name' | 'supplier_code'>
  price: number
  safety_stock: number
  lead_time_days: number
  model_name: string
  model_code?: string
  generation: string
  color: string
  color_code?: string
  uom: string
  package_name: string
  package_code?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}