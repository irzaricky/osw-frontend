export interface SpoDetail {
  id: number
  spo_id: number
  part_id: number
  ordered_qty: number
  sent_qty: number
  status: 'Open' | 'Partial' | 'Fulfilled'
  createdAt: string
  updatedAt: string
  part?: {
    part_number: string
    part_name: string
  }
  order?: Spo
}

export interface Spo {
  id: number
  spo_number: string
  spr_id: number | null
  customer_id: number
  shipping_address: string
  spo_date: string
  delivery_due_date: string
  status: 'Draft' | 'Submitted' | 'Locked' | 'Processing' | 'Completed'
  remarks: string | null
  created_by: number
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  details?: SpoDetail[]
  customer?: {
    id: number
    name: string
    customer_code: string
  }
  spr?: {
    id: number
    spr_number: string
  } | null
  creator?: {
    id: number
    email: string
    user_detail?: { full_name: string }
  }
}

export interface SpoSdoHistoryAggregation {
  part_id: number
  part_number: string
  part_name: string
  ordered_qty: number
  delivered_qty: number
  remaining_qty: number
}

export interface SpoSdoHistoryItem {
  id: number
  do_number: string
  do_date: string
  status: string
  received_at: string | null
  items: { part_id: number; qty: number }[]
}

export interface SpoSdoHistory {
  spo_info: {
    id: number
    spo_number: string
    status: string
  }
  aggregation: SpoSdoHistoryAggregation[]
  sdo_history: SpoSdoHistoryItem[]
}

export interface SprDropdownItem {
  id: number
  spr_number: string
  spr_name: string
  source: 'Automatic' | 'Manual'
  forecast_id: number | null
  forecast?: { customer_id: number } | null
  request_date?: string
  required_date?: string
  details?: {
    part_id: number
    qty: number
    part?: { part_number: string; part_name: string }
  }[]
}
