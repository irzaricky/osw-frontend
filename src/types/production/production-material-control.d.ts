export interface ProductionMaterialResult {
  id: number
  production_date: string
  shift_id: number
  shift_name?: string
  station_id: number
  station_name?: string

  part_id: number
  product_part_number?: string
  product_part_name?: string

  material_part_id: number
  material_part_number?: string
  material_part_name?: string

  planning_qty: number
  actual_qty: number
  total_ok: number
  total_ng: number
  remarks?: string | null
  created_at?: string
}

export interface ProductionMaterialResultPayload {
  production_date: string
  shift_id: number
  station_id: number
  part_id: number
  material_part_id: number
  planning_qty: number
  actual_qty: number
  total_ok: number
  total_ng: number
  remarks?: string
}

export interface MaterialReplacement {
  id: number
  production_result_id: number
  station_id: number
  station_name?: string
  material_part_id: number
  part_number?: string
  part_name?: string
  qty_replacement: number
  replacement_reason?: string | null
  created_at?: string
}

export interface MaterialReplacementPayload {
  production_result_id: number
  station_id: number
  material_part_id: number
  qty_replacement: number
  replacement_reason?: string
}

export interface ScrapCrusher {
  id: number
  scrap_date: string
  production_result_id: number

  part_id: number
  product_part_number?: string
  product_part_name?: string

  material_part_id: number
  material_part_number?: string
  material_part_name?: string

  qty_scrap: number
  weight_per_pcs: number
  total_weight: number

  remarks?: string | null
  created_at?: string
}

export interface ScrapCrusherPayload {
  production_result_id: number
  scrap_date: string
  part_id: number
  material_part_id: number
  qty_scrap: number
  weight_per_pcs?: number
  remarks?: string
}
export interface BufferStatus {
  id: number
  station_id: number
  station_name?: string

  part_id: number
  part_number?: string
  part_name?: string

  qty_kanban: number
  qty_pcs: number
  standard_buffer_stock: number
  shortage_pcs: number

  buffer_status: 'Safe' | 'Need Replenishment' | 'Empty'

  oldest_supply_at?: string | null
  latest_supply_at?: string | null
  aging_days?: number
}