export interface WarehouseBin {
  id: number
  area_id: number

  row_index: number
  col_index: number
  bin_code: string

  is_dedicated: boolean
  dedicated_part_number?: string | null
  capacity?: number | null

  created_at?: string
  updated_at?: string
}

export interface WarehouseBinUpdatePayload {
  is_dedicated?: boolean
  dedicated_part_number?: string | null
  capacity?: number | null
}