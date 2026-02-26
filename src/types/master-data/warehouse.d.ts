import type { Line } from './line'

export interface WarehouseCategory {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface Warehouse {
  id: number
  warehouse_code: string
  name: string
  line_id?: number
  line?: Pick<Line, 'id' | 'name'> | null
  category_id?: number
  category?: Pick<WarehouseCategory, 'id' | 'name'> | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}