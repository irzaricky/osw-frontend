export interface AnalyticsParams {
  date_from?: string
  date_to?: string
  line_id?: number
  shift_id?: number
  status?: string
  [key: string]: any
}

export interface ExecutiveSummary {
  total_production_orders: number
  total_work_orders: number
  total_planned_qty: number
  total_actual_qty: number
  achievement_rate: number
  completed_work_orders: number
  in_progress_work_orders: number
  total_good_qty: number
  total_reject_qty: number
  total_scrap_qty: number
  defect_rate: number
  total_downtime_minutes: number
  total_issues: number
  avg_capacity_utilization: number
}

export interface ProductionTrendItem {
  production_date: string
  planned_qty: number
  actual_qty: number
}

export interface LineUtilizationItem {
  line_name: string
  avg_utilization_pct: number
  total_planned_qty: number
  total_actual_qty: number
}

export interface WorkOrderStatusItem {
  status: string
  total: number
}

export interface OutputQualityItem {
  work_date: string
  qty_good: number
  qty_reject: number
  qty_scrap: number
}

export interface DowntimeByTypeItem {
  issue_type: string
  total_downtime_minutes: number
  total_occurrences: number
}

export interface TopDowntimeStationItem {
  station_code: string
  station_name: string
  total_downtime_minutes: number
  total_issues: number
}

export interface DefectByTypeItem {
  defect_type: string
  total_defect_qty: number
  total_occurrences: number
}

export interface LineEfficiencyItem {
  line_name: string
  total_planned_qty: number
  total_actual_qty: number
  efficiency_pct: number
}

export interface OnTimeDelivery {
  on_time: number
  late: number
  not_completed: number
}

export interface RescheduleFrequencyItem {
  reschedule_date: string
  total_reschedules: number
  total_impacted_wo: number
}

export interface CapacityFeasibilityItem {
  status: string
  total: number
}

export interface IssueDetail {
  id: number
  reported_time: string
  wo_number: string
  station_code: string
  station_name: string
  issue_type: string
  downtime_minutes: number | null
  defect_type: string | null
  defect_qty: number | null
  severity: string | null
  reported_by: string | null
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}