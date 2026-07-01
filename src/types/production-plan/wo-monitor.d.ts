import type { WorkOrderStatus, IssueType, IssueSeverity } from './work-order'

export type WOHealth = 'not_started' | 'on_track' | 'at_risk' | 'critical' | 'completed'

export interface MonitorIssue {
  id:                 number
  wo_station_id:      number
  station_name?:      string | null
  station_code?:      string | null
  wo_station_number?: string | null
  issue_type:         IssueType
  severity?:          IssueSeverity | null
  reported_time:      string
  issue_description:  string
  paused_at?:         string | null
  downtime_start?:    string | null
}

export interface MonitorWO {
  id:                number
  wo_number:         string
  status:            WorkOrderStatus
  stage:             number
  part?:             { part_name: string; part_number: string | null } | null
  line?:             { name: string } | null
  shift?:            { name: string } | null
  planned_quantity:  number
  actual_quantity:   number
  qty_good:          number
  qty_reject:        number
  qty_scrap:         number
  progress_pct:      number
  deviation:         number
  health:            WOHealth
  actual_start_time?: string | null
  actual_end_time?:   string | null
  downtime_minutes:  number
  downtime_count:    number
  open_issues:       MonitorIssue[]
  open_issue_count:  number
}

export interface MonitorSummary {
  work_date:               string
  total_wo:                number
  not_started:             number
  on_track:                number
  at_risk:                 number
  critical:                number
  completed:               number
  total_planned:           number
  total_good:              number
  total_reject:            number
  total_scrap:             number
  total_downtime:          number
  total_open_issues:       number
  overall_achievement_pct: number
}

export interface LiveMonitorResponse {
  summary:     MonitorSummary
  work_orders: MonitorWO[]
}

export interface MonitorParams {
  work_date?: string
  line_id?:   number
  shift_id?:  number
}