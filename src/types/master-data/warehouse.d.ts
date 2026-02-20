export interface WarehouseCategory {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface Line {
  id: number
  line_code: string
  name: string
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface Warehouse {
  id: number
  warehouse_code: string
  name: string
  line?: Line | null
  category?: WarehouseCategory
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
}

export interface WarehousePayload {
  warehouse_code: string
  name: string
  line_id?: number
  category_id: number
  notes?: string
}