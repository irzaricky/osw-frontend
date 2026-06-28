// types/material/analytics.d.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tipe response untuk endpoint GET /material/analytics/{mrp|mpr|mpo|mdo}
// Backend: module/material/analytics.js
// Dipakai oleh stores/material/analytics.store.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface MaterialAnalyticsDateRange {
  start: string
  end: string
}

// ─── MRP ─────────────────────────────────────────────────────────────────────
export interface MrpShortagePart {
  part_id: number
  part_number: string | null
  part_name: string | null
  uom_code: string | null
  total_shortage_qty: number
}

export interface MrpAnalytics {
  date_range: MaterialAnalyticsDateRange
  kpis: {
    total: number
    approved: number
    rejected: number
    rejection_rate: number
  }
  status_breakdown: {
    Draft: number
    Submitted: number
    Approved: number
    Rejected: number
  }
  priority_breakdown: {
    High: number
    Medium: number
    Low: number
  }
  monthly_trend: { month: string; count: number }[]
  top_shortage_parts: MrpShortagePart[]
}

// ─── MPR ─────────────────────────────────────────────────────────────────────
export interface MprRequestedPart {
  part_id: number
  part_number: string | null
  part_name: string | null
  total_qty: number
}

export interface MprAnalytics {
  date_range: MaterialAnalyticsDateRange
  kpis: {
    total: number
    approved: number
    rejected: number
    rejection_rate: number
  }
  /** Backend MPR status disimpan lowercase */
  status_breakdown: {
    draft: number
    submitted: number
    approved: number
    rejected: number
  }
  /** Berdasarkan kolom mrp_id (lihat catatan di analytics.js getMprAnalytics) */
  source_breakdown: {
    from_mrp: number
    manual: number
  }
  top_requested_parts: MprRequestedPart[]
  monthly_trend: { month: string; count: number }[]
}

// ─── MPO ─────────────────────────────────────────────────────────────────────
export interface MpoTopSupplier {
  supplier_id: number
  supplier_name: string | null
  total_spend: number
  order_count: number
}

export interface MpoAnalytics {
  date_range: MaterialAnalyticsDateRange
  kpis: {
    total_orders: number
    total_spend: number
    avg_order_value: number
    rejection_rate: number
  }
  /** Backend MPO status disimpan lowercase (beda dari Mpo['status'] di mpo.d.ts yang kapital) */
  status_breakdown: {
    draft: number
    submitted: number
    approved: number
    rejected: number
  }
  top_suppliers: MpoTopSupplier[]
  monthly_spend_trend: { month: string; spend: number }[]
}

// ─── MDO ─────────────────────────────────────────────────────────────────────
export interface MdoDockUtilization {
  dock_id: number
  dock_name: string | null
  mdo_count: number
  /** Estimasi — lihat catatan desain di analytics.js getMdoAnalytics */
  estimated_hours: number
}

export interface MdoVehiclePerformance {
  vehicle_id: number
  plate_number: string | null
  trip_count: number
  total_weight_kg: number
}

export interface MdoAnalytics {
  date_range: MaterialAnalyticsDateRange
  kpis: {
    total: number
    avg_capacity_usage_pct: number
    missing_weight_count: number
  }
  status_breakdown: {
    draft: number
    scheduled: number
    in_transit: number
    arrived: number
  }
  dock_utilization: MdoDockUtilization[]
  vehicle_performance: MdoVehiclePerformance[]
}

// ─── Shared filter params ──────────────────────────────────────────────────
export interface MaterialAnalyticsParams {
  start_date?: string
  end_date?: string
}