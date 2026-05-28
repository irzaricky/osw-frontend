import { api } from '../../plugins/axios'
import type {
  PlanListParams,
  CreatePlanPayload,
  UpdatePlanPayload,
  CapacityParamPayload,
  CalculateCapacityPayload,
  AddAdjustmentPayload,
  ApprovePayload,
  RejectPayload,
} from '../../types/production-plan/plan'

// ─────────────────────────────────────────────────────────────────────────────
// Production Plan service
const BASE = '/production-plan/plan'
// ─────────────────────────────────────────────────────────────────────────────

const productionPlanService = {

  // ── List & Detail ──────────────────────────────────────────────────────────

  getPlans(params?: PlanListParams) {
    return api.get(`${BASE}`, { params })
  },

  getPlan(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  // ── Dropdown & Lookups ─────────────────────────────────────────────────────

  getDropdown() {
    return api.get(`${BASE}/dropdown`)
  },

  // [~] plan_month wajib dikirim sebagai query param agar BE bisa filter DO
  //     yang shipment_date-nya jatuh di bulan tersebut
  getAvailableDeliveryOrders(plan_month: string) {
    return api.get(`${BASE}/available-dos`, { params: { plan_month } })
  },

  syncDOs(id: number | string, data: { do_ids: number[] }) {
    return api.put(`${BASE}/${id}/dos`, data)
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────

  createPlan(data: CreatePlanPayload) {
    return api.post(`${BASE}`, data)
  },

  updatePlan(id: number | string, data: UpdatePlanPayload) {
    return api.put(`${BASE}/${id}`, data)
  },

  deletePlan(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // ── Capacity plan ──────────────────────────────────────────────────────────

  /**
   * POST /production-plan/plan/:id/capacity-params
   *
   * Hanya kirim { line_id } — server copy semua nilai dari
   * s_line_capacity_params (master default line) ke snapshot plan.
   * Endpoint akan return 404 jika master line belum di-setup.
   * Hanya bisa membuat BASE param; tidak ada ADJUSTED.
   */
  saveCapacityParams(id: number | string, data: CapacityParamPayload) {
    return api.post(`${BASE}/${id}/capacity-params`, data)
  },

  /**
   * POST /production-plan/plan/:id/calculate
   *
   * Jalankan kalkulasi kapasitas untuk satu lini.
   * Detail yang dihitung diambil dari SProductionPlanDetailLine (pivot table).
   * Parameter diambil dari BASE snapshot + adjustments yang ada di DB.
   */
  calculateCapacity(id: number | string, data: CalculateCapacityPayload) {
    return api.post(`${BASE}/${id}/calculate`, data)
  },

  calculateAllCapacity(id: number | string) {
    return api.post(`${BASE}/${id}/calculate-all`)
  },

  // ── Adjustments ────────────────────────────────────────────────────────────

  addAdjustment(id: number | string, data: AddAdjustmentPayload) {
    return api.post(`${BASE}/${id}/adjustments`, data)
  },

  deleteAdjustment(id: number | string, adjId: number | string) {
    return api.delete(`${BASE}/${id}/adjustments/${adjId}`)
  },

  // ── Approval Workflow ──────────────────────────────────────────────────────

  submitForApproval(id: number | string) {
    return api.post(`${BASE}/${id}/submit`)
  },

  approve(id: number | string, data?: ApprovePayload) {
    return api.post(`${BASE}/${id}/approve`, data)
  },

  reject(id: number | string, data: RejectPayload) {
    return api.post(`${BASE}/${id}/reject`, data)
  },
}

export default productionPlanService