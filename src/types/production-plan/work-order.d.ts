export type WorkOrderStatus =
  | 'Draft'
  | 'Released'
  | 'In_Progress'
  | 'Completed'
  | 'Cancelled'

export type StationStatus =
  | 'Pending'
  | 'In_Progress'
  | 'Completed'

export type JobStatus =
  | 'Pending'
  | 'In_Progress'
  | 'Completed'

export type IssueType =
  | 'DOWNTIME'
  | 'DEFECT'
  | 'MATERIAL'
  | 'OTHER'

// ─── Core entities ────────────────────────────────────────────────────────────

export interface WorkOrder {
  id:                      number
  wo_number:               string
  po_id:                   number
  po_schedule_id?:         number | null
  part_id:                 number
  line_id:                 number
  factory_id:              number
  shift_id?:               number | null
  work_date:               string
  planned_quantity:        number
  actual_quantity:         number
  status:                  WorkOrderStatus
  notes?:                  string | null
  created_at?:             string
  updated_at?:             string
  deleted_at?:             string | null
  production_order?:       { id: number; po_number: string }
  part?:                   { id: number; part_number: string; part_name: string }
  line?:                   { id: number; line_code: string; name: string }
  factory?:                { id: number; name: string }
  shift?:                  { id: number; name: string; start_time: string; end_time: string } | null
  stations?:               WorkOrderStation[]
  progresses?:             WorkOrderProgress[]
  issues?:                 WorkOrderIssue[]
}

export interface WorkOrderStation {
  id:              number
  wo_id:           number
  station_id:      number
  sequence:        number
  status:          StationStatus
  planned_quantity?: number | null
  actual_quantity?:  number | null
  station?:        { id: number; station_code: string; name: string; sequence: number }
  jobs?:           WorkOrderStationJob[]
}

export interface WorkOrderStationJob {
  id:            number
  wo_station_id: number
  job_id:        number
  sequence:      number
  status:        JobStatus
  actual_time?:  number | null
  job?:          { id: number; job_code: string; name: string; standard_time: number }
}

export interface WorkOrderProgress {
  id:             number
  wo_id:          number
  progress_time:  string
  cumulative_qty: number
  progress_pct:   number
  reported_by:    string
}

export interface WorkOrderIssue {
  id:                number
  wo_id:             number
  issue_type:        IssueType
  issue_description: string
  reported_by:       string
  reported_time:     string
  downtime_start?:   string | null
  downtime_end?:     string | null
  downtime_minutes?: number | null
  defect_qty?:       number | null
  defect_type?:      string | null
  resolution?:       string | null
  resolved_by?:      string | null
  resolved_time?:    string | null
}

// ─── Daily Summary ────────────────────────────────────────────────────────────

export interface DailySummary {
  work_date:        string
  total_wo:         number
  status_breakdown: Partial<Record<WorkOrderStatus, number>>
  total_planned:    number
  total_actual:     number
  achievement_pct:  number
  active_issues:    number
}

// ─── List Params ──────────────────────────────────────────────────────────────

export interface WorkOrderListParams {
  page?:      number
  limit?:     number
  search?:    string
  status?:    WorkOrderStatus
  work_date?: string
  line_id?:   number
  po_id?:     number
  [key: string]: any
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface AddProgressPayload {
  cumulative_qty: number
  reported_by:    string
}

export interface ReportIssuePayload {
  issue_type:        IssueType
  issue_description: string
  reported_by:       string
  downtime_start?:   string | null
  downtime_end?:     string | null
  downtime_minutes?: number | null
  defect_qty?:       number | null
  defect_type?:      string | null
}

export interface ResolveIssuePayload {
  resolution:  string
  resolved_by: string
}

export interface CompleteWorkOrderPayload {
  actual_quantity:          number
  under_production_reason?: string | null
}

export interface UpdateStationJobStatusPayload {
  status:      JobStatus
  actual_time?: number | null
}