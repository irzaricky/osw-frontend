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
// Base path: /production-plan/plan
// ─────────────────────────────────────────────────────────────────────────────

const productionPlanService = {

  // ── List & Detail ──────────────────────────────────────────────────────────

  getPlans(params?: PlanListParams) {
    return api.get('/production-plan/plan', { params })
  },

  getPlan(id: number | string) {
    return api.get(`/production-plan/plan/${id}`)
  },

  // ── Dropdown & Lookups ─────────────────────────────────────────────────────

  getDropdown() {
    return api.get('/production-plan/plan/dropdown')
  },

  getAvailableDeliveryOrders() {
    return api.get('/production-plan/plan/available-dos')
  },

  syncDOs(id: number | string, data: { do_ids: number[] }) {
    return api.put(`/production-plan/plan/${id}/dos`, data)
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────

  createPlan(data: CreatePlanPayload) {
    return api.post('/production-plan/plan', data)
  },

  updatePlan(id: number | string, data: UpdatePlanPayload) {
    return api.put(`/production-plan/plan/${id}`, data)
  },

  deletePlan(id: number | string) {
    return api.delete(`/production-plan/plan/${id}`)
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
    return api.post(`/production-plan/plan/${id}/capacity-params`, data)
  },

  /**
   * POST /production-plan/plan/:id/calculate
   *
   * Jalankan kalkulasi kapasitas untuk satu lini.
   * Detail yang dihitung diambil dari SProductionPlanDetailLine (pivot table).
   * Parameter diambil dari BASE snapshot + adjustments yang ada di DB.
   */
  calculateCapacity(id: number | string, data: CalculateCapacityPayload) {
    return api.post(`/production-plan/plan/${id}/calculate`, data)
  },

  // ── Adjustments ────────────────────────────────────────────────────────────

  addAdjustment(id: number | string, data: AddAdjustmentPayload) {
    return api.post(`/production-plan/plan/${id}/adjustments`, data)
  },

  deleteAdjustment(id: number | string, adjId: number | string) {
    return api.delete(`/production-plan/plan/${id}/adjustments/${adjId}`)
  },

  // ── Approval Workflow ──────────────────────────────────────────────────────

  submitForApproval(id: number | string) {
    return api.post(`/production-plan/plan/${id}/submit`)
  },

  approve(id: number | string, data?: ApprovePayload) {
    return api.post(`/production-plan/plan/${id}/approve`, data)
  },

  reject(id: number | string, data: RejectPayload) {
    return api.post(`/production-plan/plan/${id}/reject`, data)
  },
}

export default productionPlanService