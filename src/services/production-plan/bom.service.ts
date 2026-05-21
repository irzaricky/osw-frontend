import { api } from "../../plugins/axios";
import type {
  BomListParams,
  CreateBomPayload,
  UpdateBomPayload,
  ReplaceDetailsPayload,
  AddBomDetailPayload,
  UpdateBomDetailPayload,
  RejectBomPayload,
} from "../../types/production-plan/bom";

const BASE = "/production-plan/bom";

const bomService = {
  // ── Reference data ─────────────────────────────────────────────────────────

  /** GET /bom/dd-doc-status */
  getDocStatuses() {
    return api.get(`${BASE}/dd-doc-status`);
  },

  /** GET /bom/dd-activation-status */
  getActivationStatuses() {
    return api.get(`${BASE}/dd-activation-status`);
  },

  /** GET /bom/dropdown — semua BOM (untuk select/combo) */
  getDropdown() {
    return api.get(`${BASE}/dropdown`);
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────

  /** GET /bom?page=&limit=&search=&doc_status_id=&activation_status_id=&parent_part_id= */
  getBoms(params?: BomListParams) {
    return api.get(`${BASE}`, { params });
  },

  /** GET /bom/:id */
  getBom(id: number | string) {
    return api.get(`${BASE}/${id}`);
  },

  /**
   * POST /bom
   * bom_number di-generate otomatis dari parent_part_id.
   * `details` opsional — bisa ditambah belakangan via addDetail / updateBom.
   */
  createBom(data: CreateBomPayload) {
    return api.post(`${BASE}`, data);
  },

  /**
   * PUT /bom/:id
   * bom_number & parent_part_id tidak bisa diubah.
   *
   * - Jika `details` disertakan (termasuk []) → replace seluruh detail.
   * - Jika `details` tidak disertakan (undefined) → detail tidak disentuh.
   */
  updateBom(id: number | string, data: UpdateBomPayload) {
    return api.put(`${BASE}/${id}`, data);
  },

  /** DELETE /bom/:id — soft delete, Draft only */
  deleteBom(id: number | string) {
    return api.delete(`${BASE}/${id}`);
  },

  // ── BOM Details — single-row operations ────────────────────────────────────

  /**
   * POST /bom/:id/details
   * Tambah satu baris detail. Cek duplikat part_id dilakukan di server.
   */
  addDetail(id: number | string, data: AddBomDetailPayload) {
    return api.post(`${BASE}/${id}/details`, data);
  },

  /**
   * PUT /bom/:id/details/:detailId
   * Update satu baris detail. Cek duplikat part_id (jika berubah) dilakukan di server.
   */
  updateDetail(
    id: number | string,
    detailId: number | string,
    data: UpdateBomDetailPayload
  ) {
    return api.put(`${BASE}/${id}/details/${detailId}`, data);
  },

  /** DELETE /bom/:id/details/:detailId */
  deleteDetail(id: number | string, detailId: number | string) {
    return api.delete(`${BASE}/${id}/details/${detailId}`);
  },

  /**
   * PUT /bom/:id/details/replace
   * Bulk-replace semua detail sekaligus.
   * Cocok untuk save setelah drag-to-reorder atau edit tabel massal.
   */
  replaceDetails(id: number | string, data: ReplaceDetailsPayload) {
    return api.put(`${BASE}/${id}/details/replace`, data);
  },

  // ── Approval Workflow ──────────────────────────────────────────────────────

  /**
   * POST /bom/:id/return-to-draft
   * REJECTED atau PENDING_APPROVAL → DRAFT
   */
  returnToDraft(id: number | string) {
    return api.post(`${BASE}/${id}/return-to-draft`);
  },

  /**
   * POST /bom/:id/submit
   * DRAFT atau REJECTED → PENDING_APPROVAL
   * Minimal 1 detail wajib ada.
   */
  submit(id: number | string) {
    return api.post(`${BASE}/${id}/submit`);
  },

  /**
   * POST /bom/:id/approve
   * PENDING_APPROVAL → APPROVED
   */
  approve(id: number | string) {
    return api.post(`${BASE}/${id}/approve`);
  },

  /**
   * POST /bom/:id/reject
   * PENDING_APPROVAL → REJECTED
   * Body: { reject_reason }
   */
  reject(id: number | string, data: RejectBomPayload) {
    return api.post(`${BASE}/${id}/reject`, data);
  },

  // ── Activation ─────────────────────────────────────────────────────────────

  /**
   * POST /bom/:id/activate
   * Hanya BOM berstatus APPROVED yang bisa diaktifkan.
   */
  activate(id: number | string) {
    return api.post(`${BASE}/${id}/activate`);
  },

  /**
   * POST /bom/:id/deactivate
   * Hanya BOM berstatus ACTIVE yang bisa dinonaktifkan.
   */
  deactivate(id: number | string) {
    return api.post(`${BASE}/${id}/deactivate`);
  },

  // ── Versioning ─────────────────────────────────────────────────────────────

  /**
   * POST /bom/:id/new-version
   * Clone BOM APPROVED menjadi DRAFT baru dengan bom_version + 1.
   * Semua details ikut di-clone.
   */
  newVersion(id: number | string) {
    return api.post(`${BASE}/${id}/new-version`);
  },
};

export default bomService;
