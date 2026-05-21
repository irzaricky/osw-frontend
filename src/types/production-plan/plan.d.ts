export type PlanStatus     = 'Draft' | 'Pending_Approval' | 'Approved' | 'Rejected'
export type OverallStatus  = 'Not_Calculated' | 'POSSIBLE' | 'IMPOSSIBLE'
export type DetailStatus   = 'Not_Calculated' | 'POSSIBLE' | 'IMPOSSIBLE'
export type ParamType      = 'BASE'
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
// Plan detail line — pivot table: satu detail bisa melewati banyak line
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanDetailLine {
  id:             number
  plan_detail_id: number
  line_id:        number
  sequence:       number
  qty_capacity?:  number | null
  capacity_gap?:  number | null
  status?:        DetailStatus | null
  line?:          { id: number; name: string }
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
  status?:       DetailStatus | null
  customer?:     { id: number; name: string }
  part?:         { id: number; part_number: string; part_name: string; uom?: { id: number; name: string } }
  detail_lines?: PlanDetailLine[]
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
// param_type selalu 'BASE' (ADJUSTED dihapus, sekarang pakai adjustments table)
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
  total_capacity_units:   number
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
  created_by?:             number | null
  created_at?:             string
  line?:                   { id: number; name: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Available DOs
// ─────────────────────────────────────────────────────────────────────────────

export interface AvailableDO {
  id:            number
  do_number:     string
  shipment_date: string
  customer_id:   number
  customer?:     { id: number; name: string }
  details?:      AvailableDODetail[]
}

export interface AvailableDODetail {
  id:           number
  sent_qty:     number
  received_qty?: number | null
  planDetail?: {
    id:        number
    spo_detail_id: number
    planned_qty:   number
    spoDetail?: {
      id:      number
      part_id: number
      part?: {
        id:          number
        part_number: string
        part_name:   string
        uom?: { id: number; name: string }
      }
    }
  }
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
 * Hanya param_type 'BASE' yang dibuat; tidak ada ADJUSTED.
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
  line_id:                    number
  overall_status:             OverallStatus
  line_status:                OverallStatus
  total_capacity_units:       number
  total_qty_request:          number
  total_required_minutes:     number
  effective_capacity_minutes: number
  capacity_gap_minutes:       number
  utilization_pct:            number
  capacity_info: {
    total_stations:       number
    total_jobs:           number
    max_takt_time_seconds: number
    capacity_per_hour:    number
    regular_minutes:      number
    overtime_minutes:     number
    available_minutes:    number
  }
  params_used:         Omit<CapacityParam, 'id' | 'plan_id' | 'line_id' | 'param_type' | 'line'>
  adjustments_applied: number
  detail_lines_count:  number
}