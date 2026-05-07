export interface TakeOutType {
  id: number
  name: string
}

export interface TakeOutStatus {
  id: number
  name: string
}

export interface TakeOutArea {
  id: number
  name: string
}

export interface TakeOut {
  wo_id: number
  wo_number: string
  wo_category: string
  wo_date: string
  wo_description?: string | null

  type?: TakeOutType
  area?: TakeOutArea
  status?: TakeOutStatus

  total_label: number
  total_scanned_out: number
  remaining: number
  progress: number
}

export interface TakeOutLabel {
  wo_item_label_id: number
  label_number: string
  is_scanned_in: boolean
  is_scanned_out: boolean
}

export interface TakeOutItem {
  wo_item_id: number
  part_id: number
  part_number: string
  part_name: string
  part_category: string

  package_id?: number | null
  package_code?: string | null
  package_name?: string | null
  capacity_per_kanban: number

  total_kanban: number
  total_label: number
  total_scanned_out: number
  remaining: number

  total_pcs: number
  scanned_out_pcs: number
  remaining_pcs: number

  progress: number
  labels: TakeOutLabel[]
}

export interface TakeOutDetail {
  wo_id: number
  wo_number: string
  wo_category: string
  wo_date: string
  wo_description?: string | null

  type?: TakeOutType
  area?: TakeOutArea
  status?: TakeOutStatus

  total_label: number
  total_scanned_out: number
  remaining: number

  total_pcs: number
  scanned_out_pcs: number
  remaining_pcs: number

  progress: number
  items: TakeOutItem[]
}

export interface TakeOutRecommendationStock {
  stock_id: number
  wo_item_label_id: number
  label_number: string
  part_id: number
  part_number: string
  part_name: string
  bin_id: number
  bin_code: string
  placement_at: string
  qty_per_kanban: number
}

export interface TakeOutRecommendationBinStock {
  stock_id: number
  label_number: string
  part_id: number
  part_number: string
  part_name: string
  is_target_part: boolean
  placement_at?: string | null
  qty_per_kanban?: number
}

export interface TakeOutRecommendationBin {
  bin_id: number
  bin_code: string
  is_recommended_bin: boolean
  stocks: TakeOutRecommendationBinStock[]
}

export interface TakeOutRecommendation {
  wo_item_id: number
  part_id: number
  part_number: string
  part_name: string
  total_kanban: number
  recommended_label: TakeOutRecommendationStock | null
  bins: TakeOutRecommendationBin[]
}