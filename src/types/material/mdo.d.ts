// types/material/mdo.d.ts

export interface MdoDetail {
  id: number
  mdo_id: number
  part_id: number
  qty: number
  notes: string | null
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  part?: {
    id: number
    part_name: string
    part_number: string
    weight: number | null
    uom?: {
      id: number
      name: string
    }
  }
}

export interface Mdo {
  id: number
  // Backend field is 'number', not 'mdo_number'
  number: string
  mpo_id: number
  target_date: string
  target_time: string | null
  warehouse_id: number | null
  dock_id: number | null
  vehicle_id: number | null
  transporter: string | null
  description: string | null
  remarks: string | null
  status: 'draft' | 'scheduled' | 'in_transit' | 'arrived'
  created_by: number
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  // Backend relation alias is 'mdo_details', not 'details'
  mdo_details?: MdoDetail[]
  mpo?: {
    id: number
    number: string
    description: string | null
    status: string
  }
  dock?: {
    id: number
    name: string
  }
  vehicle?: {
    id: number
    // Backend uses 'plate_number', not 'license_plate'
    plate_number: string
    vehicle_code: string
    vehicle_type?: {
      name: string
      load_capacity: number
    }
  }
  creator?: {
    id: number
    email: string
    user_detail?: {
      full_name: string
    }
  }
  // Extra computed fields returned by detail endpoint
  total_weight_kg?: number
  vehicle_capacity_kg?: number
  capacity_usage_pct?: number | null
  warnings?: string[]
}

// ─── Dropdown Types ────────────────────────────────────────────────────────────

export interface MdoDropdownWarehouse {
  id: number
  name: string
  warehouse_code: string
}

export interface MdoDropdownDockSlot {
  time: string
  available: boolean
}

export interface MdoDropdownDock {
  id: number
  name: string
  // Dock is linked via area → warehouse, not directly
  area?: {
    id: number
    name: string
    warehouse_id: number
  }
  slots?: MdoDropdownDockSlot[]
}

export interface MdoDropdownMpoDetail {
  id: number
  part_name: string
  part_number: string
  ordered_qty: number
  remaining_qty: number
  weight: number | null
}

export interface MdoDropdownMpo {
  id: number
  // Backend field is 'number', not 'mpo_number'
  number: string
  description: string | null
  // Backend includes supplier via join with ref_suppliers or similar
  supplier_name?: string
  details?: MdoDropdownMpoDetail[]
}

export interface MdoDropdownVehicle {
  id: number
  // Backend uses 'plate_number', not 'license_plate'
  plate_number: string
  vehicle_code: string
  vehicle_type?: {
    name: string
    load_capacity: number
  }
}

// ─── Preview Split Response ────────────────────────────────────────────────────

export interface MdoPreviewSplitDetail {
  part_id: number
  part: {
    id: number
    part_name: string
    part_number: string
    weight: number | null
  }
  ordered_qty: number
  covered_qty: number
  remaining_qty: number
  suggested_qty: number
  weight_per_unit_kg: number
  subtotal_weight_kg: number
}

export interface MdoPreviewSplit {
  vehicle: {
    id: number
    vehicle_code: string
    plate_number: string
    vehicle_type: string
    capacity_kg: number
  }
  suggested_qty_details: MdoPreviewSplitDetail[]
  remaining_after: {
    part_id: number
    part: { part_name: string; part_number: string }
    remaining_qty: number
  }[]
  is_fully_covered: boolean
  total_weight_kg: number
  vehicle_capacity_kg: number
  capacity_usage_pct: number
  warnings: string[]
}