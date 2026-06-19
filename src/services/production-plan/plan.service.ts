import { api } from '../../plugins/axios'
import type {
  PlanListParams,
  CreatePlanPayload,
  UpdatePlanPayload,
  UpdateCapacityParamPayload,
  CalculateCapacityPayload,
  AddCalendarAdjustmentPayload,
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

  createPlan(data: CreatePlanPayload) {
    return api.post(`${BASE}`, data)
  },

  updatePlan(id: number | string, data: UpdatePlanPayload) {
    return api.put(`${BASE}/${id}`, data)
  },

  syncDOs(id: number | string, data: { do_ids: number[] }) {
    return api.put(`${BASE}/${id}/dos`, data)
  },

  deletePlan(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  /**
   * PUT /production-plan/plan/:id/capacity-params
   * Update specific param values. param_type is automatically set to 'adjusted'.
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

  /**
   * GET /production-plan/plan/:id/calendar-preview
   * Returns per-date calendar view combining base shift calendars + adjustments.
   */
  getCalendarPreview(id: number | string) {
    return api.get(`${BASE}/${id}/calendar-preview`)
  },

  addCalendarAdjustment(id: number | string, data: AddCalendarAdjustmentPayload) {
    return api.post(`${BASE}/${id}/calendar-adjustments`, data)
  },

  updateCalendarAdjustment(id: number | string, adjustment_id: number, data: {  overtime_minutes: number }) {
    return api.put(`${BASE}/${id}/calendar-adjustments/${adjustment_id}`, data)
  },

  deleteCalendarAdjustment(id: number | string, adjustment_id: number) {
    return api.delete(`${BASE}/${id}/calendar-adjustments/${adjustment_id}`)
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