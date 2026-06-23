// ─── Enums ────────────────────────────────────────────────────────────────────

export type WorkOrderStatus = 'Released' | 'In_Progress' | 'Completed' | 'Cancelled'
export type StationStatus   = 'Pending' | 'In_Progress' | 'Completed'
export type IssueType       = 'DOWNTIME' | 'DEFECT' | 'MATERIAL' | 'OTHER' | 'PAUSE'
export type IssueSeverity   = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface WorkOrder {
  id:                   number
  wo_number:            string
  po_id:                number
  po_schedule_id?:      number | null
  part_id:              number
  line_id:              number
  shift_id?:            number | null
  work_date:            string
  planned_quantity:     number
  actual_quantity:      number
  status:               WorkOrderStatus
  sequence?:            number | null
  actual_start_time?:   string | null
  actual_end_time?:     string | null
  created_at?:          string
  updated_at?:          string
  deleted_at?:          string | null
  production_order?:    { id: number; po_number: string }
  part?:                { id: number; part_number: string; part_name: string }
  line?:                { id: number; line_code: string; name: string }
  shift?:               { id: number; name: string; start_time: string; end_time: string } | null
  stations?:            WorkOrderStation[]
  // Aggregate fields returned by API for display purposes
  cumulative_qty_good?:   number
  cumulative_qty_reject?: number
  cumulative_qty_scrap?:  number
  completion_pct?:        number
}

export interface WorkOrderStation {
  id:                number
  wo_id:             number
  station_id:        number
  wo_station_number: string | null  // new: unique identifier e.g. WO-2024-001-ST1
  sequence:          number
  status:            StationStatus
  planned_quantity?: number | null
  actual_quantity?:  number | null
  started_at?:       string | null
  completed_at?:     string | null
  notes?:            string | null  // new
  station?:          { id: number; station_code: string; name: string; sequence: number }
}

export interface WorkOrderStationDetail extends WorkOrderStation {
  progresses?: WorkOrderProgress[]
  issues?:     WorkOrderIssue[]
  materials?:  WorkOrderMaterial[]
}

// wo_station_id replaces wo_id — FK now points to s_work_order_stations
export interface WorkOrderProgress {
  id:                  number
  wo_station_id:       number
  qty_good:            number
  qty_reject:          number
  qty_scrap:           number
  cumulative_qty_good: number
  cumulative_qty:      number
  progress_pct:        number
  reported_at:         string
  progress_time:       string
  reported_by?:        number | null
}

export interface WorkOrderIssue {
  id:                      number
  wo_station_id:           number
  issue_type:              IssueType
  issue_description:       string
  severity?:               IssueSeverity | null
  reported_by?:            number | null
  reported_time:           string
  downtime_start?:         string | null
  downtime_end?:           string | null
  downtime_minutes?:       number | null
  defect_qty?:             number | null
  defect_type?:            string | null
  pause_reason?:           string | null
  paused_by?:              number | null
  paused_at?:              string | null
  resumed_by?:             number | null
  resumed_at?:             string | null
  pause_duration_minutes?: number | null
  shift_end_qty?:          number | null
  resolution?:             string | null
  resolved_by?:            number | null
  resolved_time?:          string | null
}

export interface WorkOrderMaterial {
  id:               number
  wo_station_id:    number
  material_part_id: number
  planned_quantity: number
  actual_quantity:  number | null
  uom?:             string | null
  material_part?:   { id: number; part_number: string; part_name: string }
}

// ─── Supporting Types ─────────────────────────────────────────────────────────

export interface MaterialCheckResult {
  id:               number
  material_part_id: number
  material_part?:   { id: number; part_number: string; part_name: string }
  uom?:             string | null
  planned_quantity: number
  current_stock:    number
  shortage:         number
  sufficient:       boolean
}

export interface MaterialCheckResponse {
  wo_id:          number
  wo_number:      string
  materials:      MaterialCheckResult[]
  shortage_count: number
  all_sufficient: boolean
}

export interface DailySummary {
  work_date:        string
  line_id_filter?:  number | null
  stage_filter?:    number | null
  shift_id_filter?: number | null
  total_wo:         number
  status_breakdown: Partial<Record<WorkOrderStatus, number>>
  stage_breakdown?: Record<string, {
    stage:         number
    wo_count:      number
    total_planned: number
    total_actual:  number
  }>
  lines_active?:    number
  stages_active?:   number
  total_planned:    number
  total_actual:     number
  achievement_pct:  number
  active_issues:    number
}

export interface Shift {
  id:           number
  name:         string
  shift_number: number
  start_time:   string
  end_time:     string
  type?:        string
  category?:    string
  active?:      boolean
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface WorkOrderListParams {
  page?:      number
  limit?:     number
  search?:    string
  status?:    WorkOrderStatus
  work_date?: string
  line_id?:   number
  po_id?:     number
  stage?:     number
  shift_id?:  number
  [key: string]: any
}

export interface DailySummaryParams {
  work_date?: string
  line_id?:   number
  stage?:     number
  shift_id?:  number
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface StartWorkOrderPayload {
  force_start?:   boolean
  shortage_note?: string | null
}

export interface AddProgressPayload {
  qty_good:    number
  qty_reject?: number
  qty_scrap?:  number
  reported_by: number
}

export interface ReportIssuePayload {
  issue_type:        IssueType
  issue_description: string
  reported_by:       number
  severity?:         IssueSeverity | null
  downtime_start?:   string | null
  downtime_end?:     string | null
  downtime_minutes?: number | null
  defect_qty?:       number | null
  defect_type?:      string | null
  pause_reason?:     string | null
  paused_by?:        number | null
  paused_at?:        string | null
  shift_end_qty?:    number | null
}

export interface ResolveIssuePayload {
  resolution:              string
  resolved_by:             number
  resumed_by?:             number | null
  resumed_at?:             string | null
  pause_duration_minutes?: number | null
}

export interface CompleteStationPayload {
  actual_quantity:          number
  under_production_reason?: string | null
}

export interface UpdateStationStatusPayload {
  status: StationStatus
}

export interface UpdateMaterialActualPayload {
  actual_quantity: number
}