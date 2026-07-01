export type PlanStatus     = 'Draft' | 'Pending_Approval' | 'Approved' | 'Rejected'
export type OverallStatus  = 'Not_Calculated' | 'POSSIBLE' | 'IMPOSSIBLE'
export type DetailStatus   = 'Not_Calculated' | 'POSSIBLE' | 'IMPOSSIBLE'
export type ParamType      = 'base' | 'adjusted'
export type PlanType       = 'ORIGINAL' | 'AMENDMENT'
export type AdjustmentType = 'ADD_SHIFT' | 'ADD_OVERTIME'

// Master calendar day status used to distinguish working day / holiday / uninitialized in the calendar grid.
export type MasterDayStatus = 'WORKING_DAY' | 'HOLIDAY' | 'UNINITIALIZED'

// ─────────────────────────────────────────────────────────────────────────────
// Production Plan
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductionPlan {
  id:                      number
  plan_number:             string
  plan_month:              string
  plan_type:               PlanType
  parent_plan_id?:         number | null
  parent_plan?:            { id: number; plan_number: string } | null
  plan_description?:       string | null
  earliest_delivery_date?: string | null
  latest_delivery_date?:   string | null
  total_products:          number
  total_qty_request:       number
  total_qty_capacity:      number
  overall_status:          OverallStatus
  status:                  PlanStatus
  notes?:                  string | null
  created_by?:             number | null
  approved_by?:            number | null
  approved_at?:            string | null
  approval_notes?:         string | null
  rejected_by?:            number | null
  rejected_at?:            string | null
  rejection_reason?:       string | null
  created_at?:             string
  updated_at?:             string
  details?:                PlanDetail[]
  capacity_params?:        CapacityParam[]
  capacity_results?:       CapacityResult[]
  calendar_adjustments?:   CalendarAdjustment[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan detail — one row per (customer, part, delivery_date)
// assigned_line_id & routing_id are auto-assigned from active routing on create/sync
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanDetail {
  id:               number
  plan_id:          number
  sequence:         number
  do_id:            number
  do_detail_id:     number
  customer_id:      number
  part_id:          number
  delivery_date:    string
  qty_request:      number
  qty_capacity?:    number | null
  capacity_gap?:    number | null
  status?:          DetailStatus | null
  assigned_line_id?: number | null
  routing_id?:       number | null
  required_minutes?: number | null
  priority_level?:   string | null
  delivery_order?:  { id: number; do_number: string; shipment_date: string }
  customer?:        { id: number; name: string }
  part?:            { id: number; part_number: string; part_name: string; uom?: { id: number; name: string } }
  assigned_line?:   { id: number; name: string }
  routing?:         { id: number; routing_code: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Capacity params — snapshot from s_line_capacity_params
// param_type: 'base' (from master default) or 'adjusted' (after manual edit)
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
  max_takt_time:           number
  line?:                   { id: number; name: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Capacity results
// ─────────────────────────────────────────────────────────────────────────────

export interface CapacityResult {
  id:                     number
  plan_id:                number
  line_id:                number
  max_takt_time?:         number | null
  capacity_per_hour?:     number | null
  total_capacity_minutes: number
  total_required_minutes: number
  capacity_gap_minutes?:  number | null
  utilization_pct?:       number | null
  status:                 OverallStatus
  total_capacity_units:   number
  calculated_at?:         string | null
  line?:                  { id: number; name: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar adjustment — per-plan calendar override entry
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarAdjustment {
  id:                  number
  plan_id:             number
  date:                string
  adjustment_type:     AdjustmentType
  shift_id?:           number | null
  overtime_minutes?:   number | null
  reason:              string
  inherited_from_plan?: number | null
  shift?:              { id: number; name: string; shift_number: number } | null
  created_at?:         string
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar preview — per-date view combining base calendar + adjustments.
// master_status: day status from line master calendar, used for grid coloring and determining valid adjustment actions.
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarDayPreview {
  date:          string
  is_holiday:    boolean
  master_status: MasterDayStatus
  base_shifts:   { shift_id: number; shift?: { id: number; shift_number: number; name: string }; date_event: string }[]
  adjustments:   CalendarAdjustment[]
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
  id:            number
  sent_qty:      number
  received_qty?: number | null
  planDetail?: {
    id:           number
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
  plan_month?:     string
  plan_type?:      PlanType
  [key: string]:   any
}

export interface CreatePlanPayload {
  plan_month:        string
  plan_type?:        PlanType
  parent_plan_id?:   number
  plan_description?: string | null
  do_ids:            number[]
  notes?:            string | null
}

export interface UpdatePlanPayload {
  plan_description?: string | null
  notes?:            string | null
}

export interface SyncDOsPayload {
  do_ids: number[]
}

export interface UpdateCapacityParamPayload {
  line_id:                  number
  working_days?:            number
  shifts_per_day?:          number
  working_hours_per_shift?: number
  manpower?:                number
  efficiency_factor?:       number
  overtime_hours?:          number
  max_takt_time?:           number
}

export interface CalculateCapacityPayload {
  line_id: number
}

// shift_number (bukan shift_id): backend addCalendarAdjustment menerima urutan
// shift (1/2/3/dst), sesuai payload yang dikirim dari PlanCapacityTabs.vue
// (lihat handleSubmit -> emit('add-adjustment', { shift_number, ... })).
export interface AddCalendarAdjustmentPayload {
  date:              string
  adjustment_type:   AdjustmentType
  shift_number?:     number | null
  overtime_minutes?: number | null
}

export interface ApprovePayload {
  approval_notes?: string | null
}

export interface RejectPayload {
  rejection_reason: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculation result (response from calculateCapacity)
// ─────────────────────────────────────────────────────────────────────────────

export interface CalculationResult {
  line_id:                    number
  overall_status:             OverallStatus
  line_status:                OverallStatus
  total_capacity_units:       number
  total_qty_this_line:        number
  total_required_minutes:     number
  effective_capacity_minutes: number
  capacity_gap_minutes:       number
  utilization_pct:            number
  capacity_info: {
    max_takt_time_seconds:          number
    capacity_per_hour:              number
    effective_total_cap_minutes:    number
    effective_total_cap_units:      number
    has_calendar_adjustments:       boolean
  }
  params_used: {
    param_type:              ParamType
    working_days:            number
    shifts_per_day:          number
    working_hours_per_shift: number
    efficiency_factor:       number
    overtime_hours:          number
    max_takt_time:           number
  }
}