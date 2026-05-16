export interface SprDetail {
  id: number
  spr_id: number
  part_id: number
  qty: number
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  part?: {
    part_number: string
    part_name: string
  }
}

export interface SprLog {
  id: number
  spr_id: number
  action: string
  remarks?: string
  user?: {
    id: number
    email: string
    user_detail?: { full_name: string }
  }
  snapshot?: string
  createdAt: string
}

export interface Spr {
  id: number
  spr_number: string
  spr_name: string
  source: 'Automatic' | 'Manual'
  forecast_id: number | null
  request_date: string
  required_date: string
  confirmed_date: string | null
  description: string
  status: 'Draft' | 'Submitted' | 'Waiting Review Supervisor Sales' | 'Waiting Review PPIC' | 'Approved' | 'Rejected'
  remarks: string | null
  created_by: number
  approved_by: number | null
  sales_order_approved_by: number | null
  ppic_approved_by: number | null
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  details?: SprDetail[]
  logs?: SprLog[]
  creator?: {
    id: number
    email: string
    user_detail?: { full_name: string }
  }
  sales_order_approver?: {
    id: number
    email: string
    user_detail?: { full_name: string }
  } | null
  ppic_approver?: {
    id: number
    email: string
    user_detail?: { full_name: string }
  } | null
  forecast?: {
    id: number
    forecast_number: string
  } | null
}
