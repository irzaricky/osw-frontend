export type PlanStatus     = 'Draft' | 'Pending_Approval' | 'Approved' | 'Rejected'
export type OverallStatus  = 'Not_Calculated' | 'POSSIBLE' | 'IMPOSSIBLE'
export type DetailStatus   = 'Not_Calculated' | 'POSSIBLE' | 'IMPOSSIBLE'
export type ParamType      = 'BASE' | 'ADJUSTED'
export type AdjustmentType =
  | 'WORKING_DAYS'
  | 'SHIFTS_PER_DAY'
  | 'WORKING_HOURS'
  | 'MANPOWER'
  | 'EFFICIENCY'
  | 'OVERTIME'

// ─────────────────────────────────────────────────────────────────────────────
// Production Plan
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductionPlan {
  id:                     number
  plan_number:            string
  plan_description?:      string | null
  earliest_delivery_date?: string | null
  latest_delivery_date?:  string | null
  total_products:         number
  total_qty_request:      number
  total_qty_capacity:     number
  overall_status:         OverallStatus
  status:                 PlanStatus
  notes?:                 string | null
  // created_by, approved_by, rejected_by → INTEGER FK ke s_users
  // API mengembalikan user object jika di-include, atau id saja
  created_by?:            number | null
  approved_by?:           number | null
  approved_at?:           string | null
  approval_notes?:        string | null
  rejected_by?:           number | null
  rejected_at?:           string | null
  rejection_reason?:      string | null
  created_at?:            string
  updated_at?:            string
  details?:               PlanDetail[]
  do_references?:         DoReference[]
  capacity_params?:       CapacityParam[]
  capacity_results?:      CapacityResult[]
  adjustments?:           PlanAdjustment[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan detail (per part / DO line)
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanDetail {
  id:            number
  plan_id:       number
  sequence:      number
  do_id:         number
  do_detail_id:  number
  customer_id:   number
  part_id:       number
  delivery_date: string
  qty_request:   number
  qty_capacity?: number | null
  capacity_gap?: number | null
  status?:       DetailStatus | null
  notes?:        string | null
  customer?:     { id: number; name: string }
  part?:         { id: number; part_number: string; part_name: string; uom: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// DO references
// ─────────────────────────────────────────────────────────────────────────────

export interface DoReference {
  id:             number
  plan_id:        number
  do_id:          number
  delivery_order?: { id: number; do_number: string; shipment_date: string }
}

export interface SyncDOsPayload {
  do_ids: number[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Capacity params — snapshot dari s_line_capacity_params saat plan dibuat
// ─────────────────────────────────────────────────────────────────────────────

export interface CapacityParam {
  id:                      number
  plan_id:                 number
  line_id:                 number
  param_type:              ParamType
  working_days:            number
  shifts_per_day:          number
  working_hours_per_shift: number
  manpower:                number
  efficiency_factor:       number
  overtime_hours:          number
  max_takt_time:           number   // detik — di-copy dari s_line_capacity_params.default_max_takt_time
  line?:                   { id: number; name: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Capacity results
// ─────────────────────────────────────────────────────────────────────────────

export interface CapacityResult {
  id:                     number
  plan_id:                number
  line_id:                number
  total_stations:         number
  total_jobs:             number
  max_takt_time?:         number | null   // detik
  capacity_per_hour?:     number | null
  total_capacity_minutes: number
  total_required_minutes: number
  capacity_gap_minutes?:  number | null
  utilization_pct?:       number | null
  status:                 OverallStatus
  calculated_at?:         string | null
  calculation_version:    number
  line?:                  { id: number; name: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Adjustments
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanAdjustment {
  id:                      number
  plan_id:                 number
  line_id:                 number
  adjustment_type:         AdjustmentType
  adjustment_description?: string | null
  sequence:                number
  base_value:              number
  adjusted_value:          number
  difference?:             number | null
  capacity_impact_minutes?: number | null
  created_by?:             number | null
  created_at?:             string
  line?:                   { id: number; name: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Available DOs
// ─────────────────────────────────────────────────────────────────────────────

export interface AvailableDO {
  id:          number
  do_number:   string
  shipment_date: string
  customer_id: number
  customer?:   { id: number; name: string }
  details?:    AvailableDODetail[]
}

export interface AvailableDODetail {
  id:                      number
  sent_qty:                number
  received_qty?:           number | null
  delivery_plan_detail_id: number
}

// ─────────────────────────────────────────────────────────────────────────────
// API request payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanListParams {
  page?:           number
  limit?:          number
  search?:         string
  status?:         PlanStatus
  overall_status?: OverallStatus
  [key: string]:   any
}

export interface CreatePlanPayload {
  plan_description?: string | null
  do_ids:            number[]
  notes?:            string | null
}

export interface UpdatePlanPayload {
  plan_description?: string | null
  notes?:            string | null
}

/**
 * POST /production-plan/:id/capacity-params
 *
 * Hanya kirim line_id — server otomatis copy semua nilai dari
 * s_line_capacity_params (master default line) ke s_production_plan_capacity_params.
 *
 * Jika master belum ada → server return 404 dengan pesan yang jelas.
 */
export interface CapacityParamPayload {
  line_id: number
}

/** POST /production-plan/:id/calculate */
export interface CalculateCapacityPayload {
  line_id: number
}

export interface AddAdjustmentPayload {
  line_id:                number
  adjustment_type:        AdjustmentType
  adjustment_description?: string | null
  adjusted_value:         number
}

export interface ApprovePayload {
  approval_notes?: string | null
}

export interface RejectPayload {
  rejection_reason: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculation result (response calculateCapacity)
// ─────────────────────────────────────────────────────────────────────────────

export interface CalculationResult {
  overall_status:         OverallStatus
  total_capacity_units:   number
  total_required_minutes: number
  total_capacity_minutes: number
  capacity_gap_minutes:   number
  utilization_pct:        number
  capacity_info: {
    total_stations:       number
    total_jobs:           number
    max_takt_time_seconds: number
    capacity_per_hour:    number
    regular_minutes:      number
    overtime_minutes:     number
    available_minutes:    number
  }
  params_used:            Omit<CapacityParam, 'id' | 'plan_id' | 'line_id' | 'param_type' | 'line'>
  adjustments_applied:    number
  details:                PlanDetail[]
}