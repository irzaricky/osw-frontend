import type { Warehouse } from './warehouse'

export interface WarehouseArea {
  id: number
  warehouse_id: number

  area_code: string
  name: string

  total_cols: number
  total_rows: number
  

  warehouse?: Warehouse

  createdAt?: string
  updatedAt?: string
}

export interface WarehouseAreaPayload {
  warehouse_id: number
  area_code: string
  name: string
  total_cols: number
  total_rows: number
  
}