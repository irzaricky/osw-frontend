export interface MprDetail {
  id: number
  mpr_id: number
  part_id: number
  qty: number
  required_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  part?: {
    id: number
    part_number: string
    part_name: string
  }
}

export interface MprLog {
  id: number
  mpr_id: number
  action: string
  created_at: string
}

export interface Mpr {
  id: number
  number: string
  description: string
  request_date: string
  type: 'manual' | 'auto'
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  remarks: string | null
  mrp_id: number | null
  created_by: number
  approved_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  details?: MprDetail[]
  logs?: MprLog[]
  creator?: {
    id: number
    email: string
  }
  approver?: {
    id: number
    email: string
  } | null
  mrp?: {
    id: number
    number: string
    description: string
  } | null
}