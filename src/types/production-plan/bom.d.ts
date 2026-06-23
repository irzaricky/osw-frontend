import type { Parts } from "../master-data/parts";
import type { Uom } from "../master-data/uom";

export type { Uom };
export type BomPart = Pick<
  Parts,
  "id" | "part_number" | "part_name" | "part_type_code"
>;

// ─── Reference / lookup entities ──────────────────────────────────────────────

export interface BomDocStatus {
  code: string; // 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  name: string;
}

export interface BomActivationStatus {
  code: string; // 'ACTIVE' | 'INACTIVE'
  name: string;
}

// ─── BOM Detail (s_bom_details) ───────────────────────────────────────────────

export interface BomDetail {
  id: number;
  bom_id: number;
  part_id: number;
  qty_required: number;
  level?: number | null;
  type?: BomDetailType | null;
  notes?: string | null;
  uom_id?: number | null;
  scrap_percentage: number;
  sequence: number;
  child_bom_id?: number | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  part?: BomPart;
  uom?: Pick<Uom, "id" | "code" | "name">;
  child_bom?: {
    id: number;
    bom_number: string;
    bom_version: number;
    parent_part?: Pick<BomPart, "id" | "part_number" | "part_name">;
  };
}

// ─── BOM Header (s_boms) ──────────────────────────────────────────────────────

export interface Bom {
  id: number;
  bom_number: string;
  description?: string | null;
  parent_part_id?: number | null;
  notes?: string | null;
  bom_version: number;
  uom_id?: number | null;
  doc_status?: string | null;
  activation_status?: string | null;
  reject_reason?: string | null;
  created_by?: number | null;
  approved_by?: number | null;
  approved_at?: string | null;
  activated_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  parent_part?: BomPart;
  uom?: Pick<Uom, "id" | "code" | "name">;
  creator?: { id: number; email: string };
  approver?: { id: number; email: string };
  details?: BomDetail[];
  component_count?: number | null;
}

// ─── Dropdown ──────────────────────────────────────────────────────────────────

export interface BomDropdownItem {
  id: number;
  bom_number: string;
  bom_version: number;
  parent_part?: Pick<BomPart, "id" | "part_number" | "part_name">;
}

// ─── Detail payload (shared antara add & update) ───────────────────────────────

export interface BomDetailItem {
  part_id: number;
  uom_id?: number | null;
  qty_required: number;
  scrap_percentage?: number; // default 0
  level?: number | null;
  sequence?: number; // default 0
  type?: BomDetailType | null;
  notes?: string | null;
  child_bom_id?: number | null;
}

// ─── API Payloads ──────────────────────────────────────────────────────────────

export interface CreateBomPayload {
  /** Required — dipakai untuk generate bom_number */
  parent_part_id: number;
  description?: string | null;
  uom_id?: number | null;
  notes?: string | null;
  /** Opsional saat create; bisa ditambah belakangan */
  details?: BomDetailItem[];
}

/**
 * bom_number & parent_part_id tidak bisa diubah setelah create.
 *
 * Jika `details` disertakan (termasuk array kosong []) → replace seluruh detail.
 * Jika `details` tidak disertakan (undefined) → detail tidak disentuh.
 */
export interface UpdateBomPayload {
  description?: string | null;
  uom_id?: number | null;
  notes?: string | null;
  details?: BomDetailItem[];
}

/**
 * PUT /boms/:id/details/replace
 * Bulk-replace semua detail sekaligus (e.g. setelah drag-to-reorder).
 */
export interface ReplaceDetailsPayload {
  details: BomDetailItem[];
}

// Single-row detail operations
export type AddBomDetailPayload = BomDetailItem;
export type UpdateBomDetailPayload = BomDetailItem;

export interface RejectBomPayload {
  reject_reason: string;
}

// ─── Query params ──────────────────────────────────────────────────────────────

export interface BomListParams {
  page?: number;
  limit?: number;
  search?: string;
  doc_status?: string;
  activation_status?: string;
  parent_part_id?: number;
  [key: string]: any;
}
