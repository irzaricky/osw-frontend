import type { Parts } from '../master-data/parts'
import type { Uom } from '../master-data/uom'

export type { Uom }
export type BomPart = Pick<Parts, 'id' | 'part_number' | 'part_name'>

// ─── Reference / lookup entities ──────────────────────────────────────────────

export interface BomDocStatus {
  id: number
  code: string   // 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  name: string
  sequence: number
}

export interface BomActivationStatus {
  id: number
  code: string   // 'ACTIVE' | 'INACTIVE'
  name: string
  sequence: number
}

// ─── Detail type values (must match backend ALLOWED_DETAIL_TYPES) ──────────────

export type BomDetailType = 'material' | 'phantom' | 'byproduct' | 'co-product'

// ─── BOM Detail (s_bom_details) ───────────────────────────────────────────────

export interface BomDetail {
  id: number
  bom_id: number
  part_id: number
  qty_required: number
  level?: number | null
  type?: BomDetailType | null
  notes?: string | null
  uom_id?: number | null
  scrap_percentage: number
  sequence: number
  child_bom_id?: number | null
  created_at?: string
  updated_at?: string
  // relations
  part?: BomPart
  uom?: Pick<Uom, 'id' | 'code' | 'name'>
  child_bom?: {
    id: number
    bom_number: string
    bom_version: number
    parent_part?: BomPart
  }
}

// ─── BOM Header (s_boms) ──────────────────────────────────────────────────────

export interface Bom {
  id: number
  bom_number: string
  description?: string | null
  parent_part_id?: number | null
  notes?: string | null
  bom_version: number
  uom_id?: number | null
  doc_status_id?: number | null
  activation_status_id?: number | null
  reject_reason?: string | null
  created_by?: number | null
  approved_by?: number | null
  approved_at?: string | null
  activated_at?: string | null
  created_at?: string
  updated_at?: string
  // relations
  parent_part?: BomPart
  uom?: Pick<Uom, 'id' | 'code' | 'name'>
  doc_status?: BomDocStatus
  activation_status?: BomActivationStatus
  creator?: { id: number; email: string }
  approver?: { id: number; email: string }
  details?: BomDetail[]
  component_count?: number | null
}

// ─── Dropdown ──────────────────────────────────────────────────────────────────

export interface BomDropdownItem {
  id: number
  bom_number: string
  bom_version: number
  parent_part?: BomPart
}

// ─── Detail payload (shared antara create & update) ───────────────────────────

export interface BomDetailItem {
  part_id: number
  uom_id?: number | null
  qty_required: number
  scrap_percentage?: number
  level?: number | null
  sequence?: number
  type?: BomDetailType | null
  notes?: string | null
  child_bom_id?: number | null
}

// ─── API Payloads ──────────────────────────────────────────────────────────────

export interface CreateBomPayload {
  parent_part_id: number          // required — dipakai untuk generate bom_number
  description?: string | null
  uom_id?: number | null
  notes?: string | null
  details?: BomDetailItem[]       // opsional saat create
}

/** bom_number & parent_part_id tidak bisa diubah setelah create */
export interface UpdateBomPayload {
  description?: string | null
  uom_id?: number | null
  notes?: string | null
  details?: BomDetailItem[]
}

export interface UpdateBomDetailItem extends BomDetailItem {
  id?: number
}

// Single-row detail operations (opsional, alternatif selain update header+details sekaligus)
export type AddBomDetailPayload    = BomDetailItem
export type UpdateBomDetailPayload = BomDetailItem

export interface RejectPayload {
  reject_reason: string
}

export interface BomListParams {
  page?: number
  limit?: number
  search?: string
  doc_status_id?: number
  activation_status_id?: number
  parent_part_id?: number
  [key: string]: any
}