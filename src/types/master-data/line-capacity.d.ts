// ── Saved master params (satu baris per bulan) ────────────────────────────────
export interface LineCapacitySavedParams {
  id:                              number
  param_year:                      number
  param_month:                     number
  period:                          string   // "YYYY-MM"
  default_working_days:            number
  default_shifts_per_day:          number
  default_working_hours_per_shift: number
  default_efficiency_factor:       number
  default_overtime_hours:          number
  default_manpower:                number
  default_max_takt_time:           number   // detik
  calculated_at:                   string | null
}
 
// ── Aktual line — kondisi saat ini (stations, jobs, group) ────────────────────
 
export interface LineActualStation {
  station_id:        number
  station_code:      string
  name:              string
  sequence:          number
  total_jobs:        number
  takt_time_seconds: number
  jobs: {
    id:            number
    job_code:      string
    name:          string
    standard_time: number
  }[]
}
 
export interface LineActualGroup {
  group_id:        number
  group_name:      string
  total_members:   number
  total_operators: number
}
 
export interface LineActualSummary {
  total_active_stations: number
  total_active_jobs:     number
  max_takt_time_seconds: number
  bottleneck_station:    LineActualStation | null
  default_manpower:      number
  total_all_members:     number
  groups:                LineActualGroup[]
  stations:              LineActualStation[]
}
 
export interface LineCalendarParams {
  working_days:             number
  shifts_per_day:           number
  working_hours_per_shift:  number
  overtime_hours:           number
  total_overtime_days:      number
  date_range: {
    start: string | null
    end:   string | null
  }
  requested_range: {
    start: string
    end:   string
  }
  breakdown: {
    avg_net_minutes_per_working_day:  number
    avg_net_minutes_per_overtime_day: number
    working_day_count:                number
    overtime_day_count:               number
  }
}
 
// ── Response GET /line-capacity/:line_id/params ───────────────────────────────
// Sekarang mengembalikan array params (multi-baris per bulan)
 
export interface LineCapacityParamsResponse {
  line: {
    id:        number
    line_code: string
    name:      string
  }
  actual:       LineActualSummary
  total_params: number
  params:       LineCapacitySavedParams[]
}
 
// ── Response GET /line-capacity/:line_id/params/preview ──────────────────────
 
export interface LineCapacityPreviewResponse {
  line: {
    id:        number
    line_code: string
    name:      string
  }
  preview_period: {
    year:      number
    month:     number
    period:    string
    startDate: string
    endDate:   string
  }
  already_calculated: boolean
  existing_param:     LineCapacitySavedParams | null
  calendar_params:    LineCalendarParams | null
  actual:             LineActualSummary
}
 
// ── Response POST /line-capacity/:line_id/calculate ───────────────────────────
 
export interface LineCapacityCalculateResponse {
  line: {
    id:        number
    line_code: string
    name:      string
  }
  period: {
    year:      number
    month:     number
    period:    string
    startDate: string
    endDate:   string
  }
  created:      boolean
  saved_params: LineCapacitySavedParams
  derived_from: {
    calendar:    LineCalendarParams
    actual_line: {
      total_active_stations: number
      total_active_jobs:     number
      default_manpower:      number
      max_takt_time_seconds: number
    }
  }
}
 
// ── Request payload POST /line-capacity/:line_id/calculate ───────────────────
 
export interface LineCapacityCalculatePayload {
  year?:             number   // default: tahun berjalan
  month?:            number   // default: bulan berjalan
  efficiency_factor?: number  // default: dari baris terbaru atau 0.85
}
 
// Alias
export type LineCapacityParams = LineCapacityParamsResponse