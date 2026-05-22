export interface MpoDetail {
  id: number
  mpo_id: number
  part_id: number
  qty: number
  price: number
  supplier_id: number
  notes?: string | null
  part?: {
    part_number: string
    part_name: string
    uom?: { code: string }
  }
  supplier?: {
    id: number
    supplier_code: string
    name: string
  }
}

export interface Mpo {
  id: number
  number: string
  mpr_id: number | null
  mrp_id: number | null
  supplier_id: number
  warehouse_id: number
  description: string | null
  po_date: string
  payment_term: string | null
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
  remarks: string | null
  created_by: number
  approved_by: number | null
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  details?: MpoDetail[]
  supplier?: {
    id: number
    supplier_code: string
    name: string
  }
  warehouse?: {
    id: number
    name: string
  }
  purchase_request?: {
    id: number
    number: string
  } | null
  mrp?: {
    id: number
    number: string
  } | null
  creator?: {
    id: number
    email: string
    user_detail?: { full_name: string }
  }
  approver?: {
    id: number
    email: string
    user_detail?: { full_name: string }
  }
  logs?: MpoLog[]
}

export interface MpoLog {
  id: number
  mpo_id: number
  action: string
  notes: string | null
  created_by: number
  createdAt: string
  user?: {
    email: string
    user_detail?: { full_name: string }
  }
}

export interface MpoSourceData {
  source_type: 'mpr' | 'mrp'
  source_id: number
  source_number: string
  details: {
    part_id: number
    qty: number
    part?: {
      part_number: string
      part_name: string
      uom?: { code: string }
      price?: number
      supplier_id?: number
      supplier?: { id: number; supplier_code: string; name: string }
    }
  }[]
}

export interface MpoDropdownSupplier {
  id: number
  supplier_code: string
  name: string
  email?: string
}