// types/material/mdo.d.ts
// ─────────────────────────────────────────────────────────────
// CHANGELOG:
//  • MdoDetail.part — weight sudah ada ✅ (tidak berubah)
//  • TAMBAH: MpoSourceDetail — interface untuk data source MPO/MPR/MRP
//    yang di-return oleh mpo.js getSourceData(), agar weight bisa
//    diakses saat frontend auto-fill form MPO dari MPR/MRP.
//  • TAMBAH: MrpDetailPart & MprDetailPart — typing part di detail
//    MRP dan MPR (dipakai saat preview/referensi berat di form MPO).
//  • Mdo.mdo_details → pastikan tipe MdoDetail (sudah include weight).
//  • MdoPreviewSplitDetail.part — weight sudah ada ✅ (tidak berubah)
// ─────────────────────────────────────────────────────────────

// ─── Part base dengan weight ───────────────────────────────────────────────────
/** Representasi minimal SParts yang SELALU menyertakan weight */
export interface PartWithWeight {
  id: number
  part_name: string
  part_number: string
  /** NULL berarti master data belum diisi — harus ditangani sebagai 0 + warning */
  weight: number | null
  uom?: {
    id: number
    name: string
    code: string
  }
}

// ─── MDO Detail ────────────────────────────────────────────────────────────────
export interface MdoDetail {
  id: number
  mdo_id: number
  part_id: number
  qty: number
  notes: string | null
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  /** part.weight tersedia karena backend include sudah menyertakannya */
  part?: PartWithWeight
}

// ─── MDO Log (audit trail) ──────────────────────────────────────────────────────
export interface MdoLog {
  id: number
  mdo_id: number
  action: string
  status: string | null
  notes: string | null
  user_id: number | null
  created_at: string
  user?: {
    id: number
    email: string
    user_detail?: {
      full_name: string
    }
  }
}

// ─── MDO Header ────────────────────────────────────────────────────────────────
export interface Mdo {
  id: number
  /** Backend field is 'number', not 'mdo_number' */
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
  status: 'draft' | 'scheduled' | 'in_transit' | 'arrived' | 'cancelled' | 'rejected'
  created_by: number
  createdAt: string
  updatedAt: string
  deleted_at: string | null
  /** Backend relation alias is 'mdo_details', not 'details' */
  mdo_details?: MdoDetail[]
  logs?: MdoLog[]
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
    /** Backend uses 'plate_number', not 'license_plate' */
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
  /** Computed fields dari detail endpoint */
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
  /** Dock is linked via area → warehouse, not directly */
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
  /** Dipakai frontend untuk hitung estimasi berat sebelum submit MDO */
  weight: number | null
}

export interface MdoDropdownMpo {
  id: number
  /** Backend field is 'number', not 'mpo_number' */
  number: string
  description: string | null
  supplier_name?: string
  details?: MdoDropdownMpoDetail[]
}

export interface MdoDropdownVehicle {
  id: number
  /** Backend uses 'plate_number', not 'license_plate' */
  plate_number: string
  vehicle_code: string
  vehicle_type?: {
    name: string
    load_capacity: number
  }
}

// ─── MPO Source Data (direturn oleh mpo.js getSourceData) ─────────────────────
/**
 * Shape part di dalam detail source data MPO (dari MPR maupun MRP).
 * Dipakai saat auto-fill form MPO — frontend perlu weight untuk
 * preview berat total sebelum MDO dibuat.
 */
export interface MpoSourcePart {
  id: number
  part_number: string
  part_name: string
  price: number | null
  supplier_id: number | null
  /** WAJIB ada — backend sudah di-patch untuk menyertakan weight */
  weight: number | null
  uom?: {
    id: number
    name: string
    code: string
  }
  supplier?: {
    id: number
    supplier_code: string
    name: string
  }
}

export interface MpoSourceDetail {
  part_id: number
  qty: number
  notes: string | null
  required_date?: string | null // hanya ada di MPR
  part: MpoSourcePart
}

export interface MpoSourceData {
  source_type: 'mpr' | 'mrp'
  source_id: number
  source_number: string
  details: MpoSourceDetail[]
}

// ─── MRP Detail Part (direturn oleh mrp.js includeMrpDetails) ─────────────────
/**
 * Shape part di dalam SMrpDetail.
 * weight digunakan jika di masa depan estimasi berat MRP perlu ditampilkan.
 */
export interface MrpDetailPart {
  id: number
  part_number: string
  part_name: string
  safety_stock: number
  lead_time_days: number
  /** WAJIB ada — backend sudah di-patch untuk menyertakan weight */
  weight: number | null
  uom?: {
    id: number
    name: string
    code: string
  }
}

export interface MrpDetail {
  id: number
  mrp_id: number
  part_id: number
  bom_id: number | null
  qty: number
  notes: string | null
  stock_qty?: number       // computed di detail endpoint
  shortage_qty?: number    // computed di detail endpoint
  part?: MrpDetailPart
  bom?: {
    id: number
    bom_number: string
    bom_version: string
    description: string | null
  }
}

// ─── MPR Detail Part ───────────────────────────────────────────────────────────
export interface MprDetailPart {
  id: number
  part_number: string
  part_name: string
  /** WAJIB ada — backend sudah di-patch untuk menyertakan weight */
  weight: number | null
}

export interface MprDetail {
  id: number
  mpr_id: number
  part_id: number
  qty: number
  required_date: string | null
  notes: string | null
  part?: MprDetailPart
}

// ─── Audit Weight (response dari GET /audit-weight) ───────────────────────────
export interface WeightAuditItem {
  part_id: number
  part_number: string
  part_name: string
  /** NULL atau <= 0 menandakan data belum valid */
  weight: number | null
  qty: number | null
}

export interface WeightAuditResult {
  ok: boolean
  missing_weight: WeightAuditItem[]
  warnings: string[]
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