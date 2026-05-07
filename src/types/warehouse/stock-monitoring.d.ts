export interface StockMonitoringSummary {
  total_kanban: number
  total_pcs: number
  total_parts: number
  occupied_bins: number
  total_bins: number
  full_bins: number
  empty_bins: number
  low_capacity_bins: number
}

export interface StockByPart {
  part_id: number
  part_number: string
  part_name: string
  part_category?: string | null
  package_id?: number | null
  package_code?: string | null
  package_name?: string | null
  capacity_per_kanban: number
  total_kanban: number
  total_pcs: number
  total_bins: number
  oldest_stock_at?: string | null
  latest_stock_at?: string | null
}

export interface StockPartLabel {
  stock_id: number
  label_number: string
  part_number: string
  part_name: string
  bin_id: number
  bin_code: string
  warehouse_area: string
  qty_per_kanban: number
  placement_date: string
}

export interface StockByBin {
  bin_id: number
  bin_code: string
  area_id?: number | null
  warehouse_area?: string | null
  capacity: number
  is_dedicated?: boolean
  dedicated_part_number?: string | null
  used_capacity: number
  remaining_capacity: number
  total_part_variant: number
  total_kanban: number
  total_pcs: number
  status: 'Empty' | 'Available' | 'Full'
}

export interface StockBinItem {
  stock_id: number
  label_number: string
  part_number: string
  part_name: string
  qty_per_kanban: number
  placement_date: string
}