export interface StationBuffer {
  buffer_stock_id: number
  station_id: number
  station_name: string

  part_id: number
  part_number: string
  part_name: string

  qty_kanban: number
  qty_pcs: number

  standard_buffer_stock: number

  shortage_kanban: number

  need_replenishment: boolean

  aging_days: number

  oldest_supply_at?: string
  latest_supply_at?: string
}

export interface StationBufferSummary {
  total_buffer_items: number
  need_replenishment_items: number
  safe_buffer_items: number

  total_buffer_kanban: number
  total_buffer_pcs: number

  aging_7_days: number
  aging_30_days: number

  total_scrap_kanban: number
  total_scrap_pcs: number
}

export interface StationBufferLog {
  log_id: number

  transaction_type: 'IN' | 'OUT' | 'SCRAP'

  station_name: string

  part_number: string
  part_name: string

  qty_kanban: number
  qty_pcs: number

  remarks?: string

  created_at: string
}