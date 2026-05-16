export interface PlacementType {
  id: number
  name: string
}

export interface PlacementStatus {
  id: number
  name: string
}

export interface PlacementArea {
  id: number
  name: string
}

// =======================
// LIST (index page)
// =======================
export interface Placement {
  wo_id: number
  wo_number: string
  wo_category: string
  wo_date: string
  wo_description?: string | null

  type?: PlacementType
  area?: PlacementArea
  status?: PlacementStatus

  total_label: number
  total_scanned: number
  remaining: number
  progress: number
}

// =======================
// DETAIL PAGE
// =======================
export interface PlacementPart {
  id: number
  part_number: string
  part_name: string
  part_category: string
  package_code?: string | null
  package?: {
    package_code: string
    name: string
    capacity: number
  } | null
}

export interface PlacementLabel {
  wo_item_label_id: number
  label_number: string
  is_scanned_in: boolean
  is_scanned_out: boolean
}

export interface PlacementItem {
  wo_item_id: number
  part_id: number

  part_unique: string
  part_number: string
  part_name: string
  part_category: string

  total_kanban: number
  total_label: number
  total_scanned: number
  remaining: number
  progress: number

  labels: PlacementLabel[]
  package_code?: string | null
  package_name?: string | null
  capacity_per_kanban: number

  total_pcs: number
  scanned_pcs: number
  remaining_pcs: number
}

export interface PlacementDetail {
  wo_id: number
  wo_number: string
  wo_category: string
  wo_date: string
  wo_description?: string | null

  type?: PlacementType
  area?: PlacementArea
  status?: PlacementStatus

  total_label: number
  total_scanned: number
  remaining: number
  progress: number

  items: PlacementItem[]
  total_pcs: number
  scanned_pcs: number
  remaining_pcs: number
}

// =======================
// SCAN RESULT
// =======================
export interface PlacementScanResult {
  wo_id: number
  wo_item_label_id: number
  label_number: string
  part: PlacementPart
}

// =======================
// BIN
// =======================
export interface PlacementBin {
  id: number
  bin_code: string
  area_id: number
  capacity: number
  used_capacity: number
  remaining_capacity: number | null
  is_dedicated: boolean
  dedicated_part_number?: string | null
  allowed_part_category?: string | null

  bin_type?: 'FREE' | 'CATEGORY' | 'DEDICATED'
  status: 'Unconfigured' | 'Free' | 'Empty' | 'Available' | 'Full'
}