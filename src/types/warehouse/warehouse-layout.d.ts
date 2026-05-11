import type { Warehouse } from '../master-data/warehouse'

export interface WarehouseLayout {
  id: number
  warehouse_id: number
  warehouse?: Pick<Warehouse, 'id' | 'warehouse_code' | 'name' | 'category_id' | 'category'> | null
  placed_area_count: number
  total_area_count: number

  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface WarehouseLayoutDetail {
  id: number
  warehouse: Pick<Warehouse, 'id' | 'warehouse_code' | 'name' | 'category_id' | 'category'> | null
  area_layouts: AreaLayout[]

  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface AreaLayout {
  id: number
  start_row: number
  start_col: number
  area_id: number
  area: AreaDetail
  area_spacings: AreaSpacing[]
}

export interface AreaDetail {
  id: number
  area_code: string
  total_rows: number
  total_cols: number
  name: string
  bins: WarehouseBin[]
}

export interface WarehouseBin {
  id: number
  bin_code: string
  capacity: number
  row_index: number
  col_index: number
  stock_count: number
  filled_percentage: number
}

export interface AreaSpacing {
  id: number
  area_layout_id: number
  col_index: number
  col_spacing: number
}

interface AreaLayoutPayload {
  area_id?: number
  start_row?: number
  start_col?: number
  area_spacings?: {
    col_index: number
    col_spacing: number
  }[]
}