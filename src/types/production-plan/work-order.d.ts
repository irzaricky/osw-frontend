export type WorkOrderStatus =
  | 'Released'
  | 'In_Progress'
  | 'Completed'
  | 'Cancelled'

export type StationStatus =
  | 'Pending'
  | 'In_Progress'
  | 'Completed'

export type IssueType =
  | 'DOWNTIME'
  | 'DEFECT'
  | 'MATERIAL'
  | 'OTHER'
  | 'PAUSE'

export type IssueSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'

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
  notes?:               string | null
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
  progresses?:          WorkOrderProgress[]
  issues?:              WorkOrderIssue[]
  materials?:           WorkOrderMaterial[]
  // Enriched fields
  cumulative_qty_good?:   number
  cumulative_qty_reject?: number
  cumulative_qty_scrap?:  number
  completion_pct?:        number
}

export interface WorkOrderStation {
  id:               number
  wo_id:            number
  station_id:       number
  sequence:         number
  status:           StationStatus
  planned_quantity?: number | null
  actual_quantity?:  number | null
  started_at?:       string | null
  completed_at?:     string | null
  station?:          { id: number; station_code: string; name: string; sequence: number }
}

export interface WorkOrderProgress {
  id:                   number
  wo_id:                number
  qty_good:             number
  qty_reject:           number
  qty_scrap:            number
  cumulative_qty_good:  number
  reported_at:          string
  reported_by_user_id?: number | null
  // Legacy fields (backward compat)
  progress_time?:       string
  cumulative_qty?:      number
  progress_pct?:        number
  reported_by?:         string | null
  completion_pct?:      number
}

export interface WorkOrderIssue {
  id:                   number
  wo_id:                number
  issue_type:           IssueType
  issue_description:    string
  severity?:            IssueSeverity | null
  reported_by_user_id?: number | null
  reported_time:        string
  downtime_start?:      string | null
  downtime_end?:        string | null
  downtime_minutes?:    number | null
  defect_qty?:          number | null
  defect_type?:         string | null
  pause_reason?:        string | null
  paused_by?:           string | null
  paused_at?:           string | null
  resumed_by?:          string | null
  resumed_at?:          string | null
  pause_duration_minutes?: number | null
  resolution?:          string | null
  resolved_by?:         string | null
  resolved_time?:       string | null
}

export interface WorkOrderMaterial {
  id:               number
  wo_id:            number
  material_part_id: number
  planned_quantity: number
  actual_quantity:  number | null
  uom?:             string | null
  material_part?:   { id: number; part_number: string; part_name: string }
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

export interface AddProgressPayload {
  qty_good:            number
  qty_reject?:         number
  qty_scrap?:          number
  shift_end_qty?:      number | null
  reported_by_user_id: number
}

export interface ReportIssuePayload {
  issue_type:          IssueType
  issue_description:   string
  reported_by_user_id: number
  severity?:           IssueSeverity | null
  downtime_start?:     string | null
  downtime_end?:       string | null
  downtime_minutes?:   number | null
  defect_qty?:         number | null
  defect_type?:        string | null
  pause_reason?:       string | null
  paused_by?:          string | null
  paused_at?:          string | null
}

export interface ResolveIssuePayload {
  resolution:              string
  resolved_by:             string
  resumed_by?:             string | null
  resumed_at?:             string | null
  pause_duration_minutes?: number | null
}

export interface CompleteWorkOrderPayload {
  actual_quantity:          number
  under_production_reason?: string | null
}

export interface UpdateStationStatusPayload {
  status: StationStatus
}

export interface UpdateMaterialActualPayload {
  actual_quantity: number
}