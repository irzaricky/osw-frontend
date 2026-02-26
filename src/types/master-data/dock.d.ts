import type { WarehouseArea } from './warehouse-area'

export interface Dock {
  id: number
  dock_code: string
  name: string
  area_id: number
  area?: Pick<WarehouseArea, 'id' | 'name'> | null
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}