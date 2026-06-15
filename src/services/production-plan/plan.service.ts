import { api } from '../../plugins/axios'
import type {
  PlanListParams,
  CreatePlanPayload,
  UpdatePlanPayload,
  CapacityParamPayload,
  UpdateCapacityParamPayload,
  CalculateCapacityPayload,
  ApprovePayload,
  RejectPayload,
} from '../../types/production-plan/plan'

const BASE = '/production-plan/plan'

const productionPlanService = {

  getPlans(params?: PlanListParams) {
    return api.get(`${BASE}`, { params })
  },

  getPlan(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDropdown() {
    return api.get(`${BASE}/dropdown`)
  },

  getAvailableDeliveryOrders(plan_month: string) {
    return api.get(`${BASE}/available-dos`, { params: { plan_month } })
  },

  syncDOs(id: number | string, data: { do_ids: number[] }) {
    return api.put(`${BASE}/${id}/dos`, data)
  },

  createPlan(data: CreatePlanPayload) {
    return api.post(`${BASE}`, data)
  },

  updatePlan(id: number | string, data: UpdatePlanPayload) {
    return api.put(`${BASE}/${id}`, data)
  },

  deletePlan(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  /**
   * POST /production-plan/plan/:id/capacity-params
   * Reset ke BASE dari master line. Hanya kirim { line_id }.
   */
  saveCapacityParams(id: number | string, data: CapacityParamPayload) {
    return api.post(`${BASE}/${id}/capacity-params`, data)
  },

  /**
   * PUT /production-plan/plan/:id/capacity-params
   * Update nilai param tertentu. param_type otomatis jadi 'adjusted'.
   */
  updateCapacityParams(id: number | string, data: UpdateCapacityParamPayload) {
    return api.put(`${BASE}/${id}/capacity-params`, data)
  },

  calculateCapacity(id: number | string, data: CalculateCapacityPayload) {
    return api.post(`${BASE}/${id}/calculate`, data)
  },

  calculateAllCapacity(id: number | string) {
    return api.post(`${BASE}/${id}/calculate-all`)
  },

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