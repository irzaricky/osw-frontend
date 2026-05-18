export interface SdoStatusCounts {
  Draft: number
  Scheduled: number
  'In Transit': number
  Delivered: number
  [key: string]: number
}

export interface DateRange {
  start: string
  end: string
}

export interface Kpis {
  total_spos: number
  total_ordered_qty: number
  total_sent_qty: number
  active_plans_count: number
  total_plans_count: number
  sdo_status_counts: SdoStatusCounts
}

export interface DockUtilization {
  id: number
  name: string
  total_hours: number
  avg_daily_hours?: number
  plan_count: number
}

export interface AnalyticsSummary {
  date_range: DateRange
  kpis: Kpis
  dock_utilization: DockUtilization[]
}

export interface AnalyticsFilters {
  start_date?: string
  end_date?: string
}
