// ─────────────────────────────────────────────────────────────────────────────
// Line Capacity Params — Type Definitions
// Endpoint base: /master-data/line-capacity
// ─────────────────────────────────────────────────────────────────────────────

// ── Saved master params (s_line_capacity_params) ──────────────────────────────

export interface LineCapacitySavedParams {
  id:                              number
  default_working_days:            number
  default_shifts_per_day:          number
  default_working_hours_per_shift: number
  default_efficiency_factor:       number
  default_overtime_hours:          number
  default_manpower:                number
  default_max_takt_time:           number   // detik
  last_updated_at?:                string | null
}

// ── Aktual line — kondisi saat ini (stations, jobs, group) ────────────────────

export interface LineActualStation {
  station_id:        number
  station_code:      string
  name:              string
  sequence:          number
  total_jobs:        number
  takt_time_seconds: number  // SUM standard_time semua job di station ini
  jobs: {
    id:            number
    job_code:      string
    name:          string
    standard_time: number   // detik
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

// ── Response GET /line-capacity/:line_id/params ───────────────────────────────

export interface LineCapacityParamsResponse {
  line: {
    id:        number
    line_code: string
    name:      string
  }
  // null jika belum pernah di-calculate
  saved_params: LineCapitySavedParams | null
  actual:       LineActualSummary
}

// ── Response POST /line-capacity/:line_id/calculate ───────────────────────────

export interface LineCapacityCalculateResponse {
  line: {
    id:        number
    line_code: string
    name:      string
  }
  saved_params:     LineCapacitySavedParams
  calculated_from:  LineActualSummary
}

// ── Request payload POST /line-capacity/:line_id/calculate ───────────────────

export interface LineCapacityCalculatePayload {
  working_days?:            number   // default: nilai tersimpan atau 22
  shifts_per_day?:          number   // default: nilai tersimpan atau 1
  working_hours_per_shift?: number   // default: nilai tersimpan atau 7
  efficiency_factor?:       number   // default: nilai tersimpan atau 0.85
  overtime_hours?:          number   // default: nilai tersimpan atau 0
}

// Alias untuk konsistensi naming (saved_params bisa keduanya)
export type LineCapitySavedParams  = LineCapacitySavedParams
export type LineCapacityParams     = LineCapacityParamsResponse