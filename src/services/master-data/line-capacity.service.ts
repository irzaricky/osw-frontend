import { api } from '../../plugins/axios'
import type {
  LineCapacityCalculatePayload,
} from '../../types/master-data/line-capacity'

// ─────────────────────────────────────────────────────────────────────────────
// Line Capacity service
// Base path: /master-data/line-capacity
// ─────────────────────────────────────────────────────────────────────────────

const lineCapacityService = {

  /**
   * GET /master-data/line-capacity/:line_id/params
   *
   * Mengembalikan:
   *   - saved_params: nilai tersimpan di s_line_capacity_params (null jika belum ada)
   *   - actual: kondisi aktual line saat ini (stations, jobs, manpower dari group)
   *
   * Dipakai di:
   *   1. Master Data → detail line → preview sebelum calculate
   *   2. Production Plan → capacity tab → preview sebelum save BASE
   */
  getParams(lineId: number | string) {
    return api.get(`/master-data/line-capacity/${lineId}/params`)
  },

  /**
   * POST /master-data/line-capacity/:line_id/calculate
   *
   * Menghitung dari kondisi aktual line (stations, jobs, employee group)
   * lalu UPSERT ke s_line_capacity_params.
   *
   * Kolom yang dihitung otomatis (tidak dari payload):
   *   - default_manpower    ← jumlah operator aktif dari employee group
   *   - default_max_takt_time ← MAX takt time per station (bottleneck)
   *
   * Kolom dari payload (opsional — fallback ke nilai tersimpan atau default sistem):
   *   - working_days, shifts_per_day, working_hours_per_shift,
   *     efficiency_factor, overtime_hours
   */
  calculate(lineId: number | string, data?: LineCapacityCalculatePayload) {
    return api.post(`/master-data/line-capacity/${lineId}/calculate`, data ?? {})
  },
}

export default lineCapacityService