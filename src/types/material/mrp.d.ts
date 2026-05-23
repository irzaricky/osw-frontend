export interface MrpDetail {
  id: number
  mrp_id: number
  part_id: number
  qty: number
  bom_id?: number | null
  notes?: string | null
  part?: {
    id: number
    part_number: string
    part_name: string
    uom?: {
      id: number
      name: string
      code: string
    }
  }
  bom?: {
    id: number
    bom_number?: string
  }
}

export interface Mrp {
  id: number
  number: string
  description?: string | null
  spr_id?: number | null
  production_plan_id?: number | null
  priority?: string | null
  notes?: string | null
  rejected_notes?: string | null
  status: string
  created_by: number
  approved_by?: number | null
  approved_at?: string | null
  createdAt?: string
  updatedAt?: string
  deleted_at?: string | null
  sales_plan?: {
    id: number
    spr_number: string
    description?: string
  }
  production_plan?: {
    id: number
    plan_number: string
    plan_description?: string
  }
  creator?: {
    id: number
    email: string
    user_detail?: {
      full_name: string
    }
  }
  approver?: {
    id: number
    email: string
    user_detail?: {
      full_name: string
    }
  }
  details?: MrpDetail[]
}

// Payload for loadSalesPlanData response
export interface SalesPlanLoadData {
  primary_bom?: {
    id: number
    bom_number: string
    bom_version: number
    description: string
    display_label: string
  } | null;
  salesPlan: {
    id: number
    spr_number: string
    description?: string
    details: {
      id: number
      part_id: number
      qty: number
      part?: {
        id: number
        part_number: string
        part_name: string
        uom?: { id: number; name: string; code: string }
      }
    }[]
  }
  bomDetails: {
    part_id: number
    bom_id: number
    component_id: number
    qty_per: number
    component?: {
      id: number
      part_number: string
      part_name: string
      uom?: { id: number; name: string; code: string }
    }
  }[]
  warehouseStock: {
    part_id: number
    qty_on_hand: number
    part?: {
      id: number
      part_number: string
      part_name: string
    }
  }[]
  suggestedDetails: {
    part_id: number
    qty: number
    bom_id?: number
    part?: {
      id: number
      part_number: string
      part_name: string
      uom?: { id: number; name: string; code: string }
    }
    stock_on_hand?: number
    safety_stock?: number
    gross_requirement?: number
    net_requirement?: number
  }[]
}