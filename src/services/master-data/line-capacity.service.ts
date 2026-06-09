import { api } from '../../plugins/axios'
import type {
  LineCapacityCalculatePayload,
} from '../../types/master-data/line-capacity'
 
const lineCapacityService = {
 
  /**
   * GET /master-data/line-capacity/:line_id/params
   *
   * Mengembalikan semua baris params yang tersimpan (multi-baris per bulan)
   * beserta aktual line (stations, jobs, manpower).
   *
   * Query params opsional:
   *   year : filter per tahun
   */
  getParams(lineId: number | string, year?: number) {
    const params: Record<string, any> = {}
    if (year) params.year = year
    return api.get(`/master-data/line-capacity/${lineId}/params`, { params })
  },
 
  /**
   * GET /master-data/line-capacity/:line_id/params/preview
   *
   * Preview kalkulasi dari shift calendar untuk bulan tertentu,
   * TANPA menyimpan ke DB.
   *
   * Query params:
   *   year  : integer, default tahun berjalan
   *   month : integer 1-12, default bulan berjalan
   */
  previewParams(lineId: number | string, year?: number, month?: number) {
    const params: Record<string, any> = {}
    if (year)  params.year  = year
    if (month) params.month = month
    return api.get(`/master-data/line-capacity/${lineId}/params/preview`, { params })
  },
 
  /**
   * POST /master-data/line-capacity/:line_id/calculate
   *
   * Hitung dan simpan parameter kapasitas untuk bulan yang dipilih.
   * Jika baris (line_id, year, month) sudah ada → update.
   * Jika belum ada → insert baris baru.
   *
   * Body:
   *   year             : integer, default tahun berjalan
   *   month            : integer 1-12, default bulan berjalan
   *   efficiency_factor: number 0.1-1, default dari baris terbaru atau 0.85
   */
  calculate(lineId: number | string, data?: LineCapacityCalculatePayload) {
    return api.post(`/master-data/line-capacity/${lineId}/calculate`, data ?? {})
  },
 
  /**
   * DELETE /master-data/line-capacity/:line_id/params/:year/:month
   *
   * Hapus satu baris parameter untuk bulan tertentu.
   * Hanya baris bulan yang sudah lewat yang boleh dihapus.
   */
  deleteParam(lineId: number | string, year: number, month: number) {
    return api.delete(`/master-data/line-capacity/${lineId}/params/${year}/${month}`)
  },
}
 
export default lineCapacityService