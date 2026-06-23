export type POStatus =
  | 'Draft'
  | 'Pending_Approval'
  | 'Approved'
  | 'Released'
  | 'Rejected'

export type POPriority = 'Low' | 'Medium' | 'High'

export type ScheduleStatus = 'Scheduled' | 'In_Progress' | 'Completed' | 'Cancelled'

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
  created_by?:             number | null
  created_at?:             string
  updated_at?:             string
  plan?:            { id: number; plan_number: string; plan_month: string; plan_description?: string | null }
  creator?:         { id: number; email: string }
  releaser?:        { id: number; email: string }
  rejector?:        { id: number; email: string }
  products?:        POProduct[]
  schedules?:       POSchedule[]
  reschedule_logs?: RescheduleLog[]
}

export interface POProduct {
  id:             number
  po_id:          number
  sequence:       number
  plan_detail_id: number
  customer_id:    number
  part_id:        number
  line_id:        number | null
  delivery_date:  string
  planned_qty:    number
  scheduled_qty:  number
  customer?: { id: number; customer_code: string; name: string }
  part?:     { id: number; part_number: string; part_name: string }
  line?:     { id: number; line_code: string; name: string }
}

export interface POSchedule {
  id:                    number
  po_id:                 number
  po_product_id:         number
  sequence:              number
  part_id:               number
  line_id:               number
  shift_id:              number
  production_date:       string
  planned_qty_per_day:   number
  actual_qty_per_day:    number
  line_capacity_per_day?: number | null
  regular_cap_snapshot?: number | null // Non-overtime capacity at generation time; basis for the derived overtime fields below
  utilization_pct?:      number | null
  status:                ScheduleStatus
  notes?:                string | null
  line?:  { id: number; line_code: string; name: string }
  shift?: { id: number; name: string; start_time: string; end_time: string }
  part?:  { id: number; part_number: string; part_name: string }
  line_name_snapshot?:  string | null
  shift_name_snapshot?: string | null
  has_overtime?:  boolean // Derived server-side on read, not a stored column
  overtime_qty?:  number  // Derived server-side on read, not a stored column
}

export interface RescheduleLog {
  id:                number
  po_id:             number
  old_start_date:    string
  old_end_date:      string
  new_start_date:    string
  new_end_date:      string
  reschedule_reason: string
  impacted_wo_count: number
  rescheduled_by?:   number | null
  rescheduled_at:    string
}

export interface CapacityViolation {
  line_id:                number
  line_name:              string
  severity:               'FATAL' | 'OVERCOMMIT'
  total_demand:           number
  total_capacity:         number
  shortage:               number
  additional_days_needed?: number
  message:                string
}

export interface PODropdownItem {
  id:                     number
  po_number:              string
  status:                 POStatus
  production_start_date:  string
  production_end_date:    string
}

export interface POListParams {
  page?:    number
  limit?:   number
  search?:  string
  status?:  POStatus
  plan_id?: number
  [key: string]: any
}

export interface CreatePOPayload {
  plan_id:               number
  production_start_date: string
  production_end_date:   string
  priority?:             POPriority
  po_description?:       string | null
}

export interface UpdatePOPayload {
  production_start_date?: string
  production_end_date?:   string
  priority?:              POPriority
  po_description?:        string | null
}

export interface UpdateSchedulePayload {
  production_date?:     string
  shift_id?:            number
  planned_qty_per_day?: number
  notes?:               string | null
}

export interface ReschedulePayload {
  new_start_date:    string
  new_end_date:      string
  reschedule_reason: string
}

export interface ApprovePOPayload {
  notes?: string | null
}

export interface RejectPOPayload {
  notes: string
}