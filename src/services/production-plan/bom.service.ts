import { api } from '../../plugins/axios'
import type {
  BomListParams,
  CreateBomPayload,
  UpdateBomPayload,
  AddBomDetailPayload,
  UpdateBomDetailPayload,
  RejectPayload,
} from '../../types/production-plan/bom'

const BASE = '/production-plan/bom'

const bomService = {
  // ── Reference data ─────────────────────────────────────────────────────────
  getDocStatuses() {
    return api.get(`${BASE}/dd-doc-status`)
  },
  getActivationStatuses() {
    return api.get(`${BASE}/dd-activation-status`)
  },
  getDropdown() {
    return api.get(`${BASE}/dropdown`)
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────
  getBoms(params?: BomListParams) {
    return api.get(`${BASE}`, { params })
  },
  getBom(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },
  /**
   * Buat BOM baru. bom_number di-generate otomatis dari parent_part_id.
   * details opsional — bisa langsung diisi sekaligus atau ditambah belakangan.
   */
  createBom(data: CreateBomPayload) {
    return api.post(`${BASE}`, data)
  },
  /**
   * Update header BOM (description, uom_id, notes).
   * bom_number & parent_part_id tidak bisa diubah.
   *
   * Jika `details` disertakan → replace seluruh detail sekaligus (termasuk [] untuk hapus semua).
   * Jika `details` tidak disertakan (undefined) → detail tidak disentuh.
   */
  updateBom(id: number | string, data: UpdateBomPayload) {
    return api.put(`${BASE}/${id}`, data)
  },
  deleteBom(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // ── BOM Details (single-row, opsional) ────────────────────────────────────
  // Alternatif jika FE perlu operasi baris per baris.
  // Untuk save semua detail sekaligus, cukup pakai updateBom() dengan field details[].
  addDetail(id: number | string, data: AddBomDetailPayload) {
    return api.post(`${BASE}/${id}/details`, data)
  },
  updateDetail(id: number | string, detailId: number | string, data: UpdateBomDetailPayload) {
    return api.put(`${BASE}/${id}/details/${detailId}`, data)
  },
  deleteDetail(id: number | string, detailId: number | string) {
    return api.delete(`${BASE}/${id}/details/${detailId}`)
  },

  // ── Approval Workflow ──────────────────────────────────────────────────────
  /** DRAFT atau REJECTED → PENDING_APPROVAL. Minimal 1 detail wajib ada. */
  submit(id: number | string) {
    return api.post(`${BASE}/${id}/submit`)
  },
  /** PENDING_APPROVAL → APPROVED */
  approve(id: number | string) {
    return api.post(`${BASE}/${id}/approve`)
  },
  /** PENDING_APPROVAL → REJECTED. Body: { reject_reason } */
  reject(id: number | string, data: RejectPayload) {
    return api.post(`${BASE}/${id}/reject`, data)
  },

  // ── Activation ─────────────────────────────────────────────────────────────
  /** Hanya BOM berstatus APPROVED yang bisa diaktifkan */
  activate(id: number | string) {
    return api.post(`${BASE}/${id}/activate`)
  },
  /** Hanya BOM berstatus ACTIVE yang bisa dinonaktifkan */
  deactivate(id: number | string) {
    return api.post(`${BASE}/${id}/deactivate`)
  },

  // ── Versioning ─────────────────────────────────────────────────────────────
  /** Clone BOM APPROVED menjadi DRAFT baru dengan bom_version + 1 */
  newVersion(id: number | string) {
    return api.post(`${BASE}/${id}/new-version`)
  },
}

export default bomService