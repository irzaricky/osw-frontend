import type { Suppliers } from './suppliers'
import type { Uom } from './uom'

export interface PartDropdown {
  id: number
  part_number: string
  part_name: string
  part_type_code?: string | null
  available_stock?: number
  remaining_qty?: number
  uom?: {
    id: number
    code: string
    name: string
  } | null
}

export interface PartType {
  code: string
  name: string
}

export interface PartCategory {
  id: number
  code: string
  name: string
}

export interface PartPackage {
  id: number
  package_code: string
  name: string
}

export interface Parts {
  id: number
  part_number: string
  part_name: string
  part_type_code: string
  part_category: string | null
  supplier_id?: number | null
  uom_id?: number | null
  package_id?: number | null
  price?: number | null
  safety_stock: number
  lead_time_days: number
  model_name?: string | null
  model_code?: string | null
  generation?: string | null
  color?: string | null
  color_code?: string | null

  // Relations (dari include)
  part_type?: PartType
  category?: PartCategory
  supplier?: Pick<Suppliers, 'id' | 'name' | 'supplier_code'>
  uom?: Pick<Uom, 'id' | 'code' | 'name'>
  package?: PartPackage

  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}