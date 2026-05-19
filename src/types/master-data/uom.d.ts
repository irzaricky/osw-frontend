// ─────────────────────────────────────────────────────────────────────────────
// UOM — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface Uom {
  id:         number
  code:       string
  name:       string
  is_active:  boolean
  created_at?: string
  updated_at?: string
}

export interface UomDropdownItem {
  id:   number
  code: string
  name: string
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface UomListParams {
  page?:      number
  limit?:     number
  search?:    string
  is_active?: boolean | string
  [key: string]: any
}

export interface CreateUomPayload {
  code:       string
  name:       string
  is_active?: boolean
}

export interface UpdateUomPayload {
  code:      string
  name:      string
  is_active: boolean
}