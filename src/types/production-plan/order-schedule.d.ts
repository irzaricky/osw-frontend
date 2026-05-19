export type POStatus =
  | 'Draft'
  | 'Released'
  | 'In_Progress'
  | 'Completed'
  | 'Closed'
  | 'Rejected'
  | 'Cancelled'

export type POPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type ScheduleStatus = 'Scheduled' | 'In_Progress' | 'Completed' | 'Cancelled'

// ─────────────────────────────────────────────────────────────────────────────
// Production Order Header
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductionOrder {
  id:                      number
  po_number:               string
  plan_id:                 number
  production_start_date:   string
  production_end_date:     string
  earliest_delivery_date?: string | null
  latest_delivery_date?:   string | null
  priority:                POPriority
  po_description?:         string | null
  notes?:                  string | null
  status:                  POStatus
  total_products:          number
  total_planned_qty:       number
  total_scheduled_qty:     number
  released_by?:            number | null
  released_at?:            string | null
  rejected_by?:            number | null
  rejected_at?:            string | null
  cancelled_by?:           number | null
  cancelled_at?:           string | null
  completed_at?:           string | null
  closed_at?:              string | null
  created_at?:             string
  updated_at?:             string
  // Relations
  plan?: {
    id:               number
    plan_number:      string
    plan_description?: string | null
    overall_status:   string
  }
  creator?:   { id: number; email: string }
  releaser?:  { id: number; email: string }
  rejecter?:  { id: number; email: string }
  canceller?: { id: number; email: string }
  products?:  POProduct[]
  reschedule_logs?: RescheduleLog[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Line
// ─────────────────────────────────────────────────────────────────────────────

export interface POProduct {
  id:             number
  po_id:          number
  sequence:       number
  plan_detail_id: number
  customer_id:    number
  part_id:        number
  line_id:        number
  delivery_date:  string
  planned_qty:    number
  scheduled_qty:  number
  notes?:         string | null
  // Relations
  customer?:    { id: number; name: string }
  part?:        { id: number; part_number: string; part_name: string }
  line?:        { id: number; name: string }
  plan_detail?: {
    id:            number
    qty_request:   number
    qty_capacity?: number | null
    capacity_gap?: number | null
    status?:       string | null
    delivery_date: string
  }
  schedules?: POSchedule[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule entry (daily)
// ─────────────────────────────────────────────────────────────────────────────

export interface POSchedule {
  id:                      number
  po_id:                   number
  po_product_id:           number
  sequence:                number
  part_id:                 number
  line_id:                 number
  shift_id:                number
  production_date:         string
  planned_qty_per_day:     number
  line_capacity_per_day?:  number | null
  utilization_pct?:        number | null
  status:                  ScheduleStatus
  notes?:                  string | null
  // Relations
  line?:  { id: number; name: string }
  shift?: { id: number; name: string; start_time: string; end_time: string }
  part?:  { id: number; part_number: string; part_name: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reschedule Log
// ─────────────────────────────────────────────────────────────────────────────

export interface RescheduleLog {
  id:                number
  po_id:             number
  old_start_date:    string
  old_end_date:      string
  new_start_date:    string
  new_end_date:      string
  reschedule_reason: string
  impacted_wo_count: number
  rescheduled_at:    string
  rescheduler?:      { id: number; email: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown item
// ─────────────────────────────────────────────────────────────────────────────

export interface PODropdownItem {
  id:                    number
  po_number:             string
  status:                POStatus
  production_start_date: string
  production_end_date:   string
}

// ─────────────────────────────────────────────────────────────────────────────
// API Request Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface POListParams {
  page?:      number
  limit?:     number
  search?:    string
  status?:    POStatus
  priority?:  POPriority
  plan_id?:   number
  date_from?: string
  date_to?:   string
  [key: string]: any
}

export interface CreatePOPayload {
  plan_id:               number
  production_start_date: string
  production_end_date:   string
  priority?:             POPriority
  po_description?:       string | null
  notes?:                string | null
  products: {
    plan_detail_id: number
    customer_id:    number
    part_id:        number
    line_id:        number
    delivery_date:  string
    planned_qty:    number
    notes?:         string | null
  }[]
}

export interface UpdatePOPayload {
  production_start_date?: string
  production_end_date?:   string
  priority?:              POPriority
  po_description?:        string | null
  notes?:                 string | null
}

export interface AddProductPayload {
  plan_detail_id: number
  customer_id:    number
  part_id:        number
  line_id:        number
  delivery_date:  string
  planned_qty:    number
  notes?:         string | null
}

export interface UpdateProductPayload {
  line_id?:       number
  delivery_date?: string
  planned_qty?:   number
  notes?:         string | null
}

export interface AddSchedulePayload {
  production_date:       string
  shift_id:              number
  planned_qty_per_day:   number
  line_capacity_per_day?: number | null
  notes?:                string | null
}

export interface UpdateSchedulePayload {
  production_date?:       string
  shift_id?:              number
  planned_qty_per_day?:   number
  line_capacity_per_day?: number | null
  status?:                ScheduleStatus
  notes?:                 string | null
}

export interface ReschedulePayload {
  new_start_date:    string
  new_end_date:      string
  reschedule_reason: string
}

export interface RejectPOPayload {
  reason: string
}

export interface CancelPOPayload {
  reason: string
}