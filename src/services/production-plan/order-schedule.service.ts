import { api } from '../../plugins/axios'
import type {
  POListParams,
  CreatePOPayload,
  UpdatePOPayload,
  AddProductPayload,
  UpdateProductPayload,
  AddSchedulePayload,
  UpdateSchedulePayload,
  ReschedulePayload,
  RejectPOPayload,
  CancelPOPayload,
} from '../../types/production-plan/order-schedule'

const BASE = '/production-plan/order-schedule'
const orderScheduleService = {

  // ── List & Detail ──────────────────────────────────────────────────────────

  getOrders(params?: POListParams) {
    return api.get(`${BASE}`, { params })
  },

  getOrder(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  // ── Dropdown ───────────────────────────────────────────────────────────────

  getDropdown() {
    return api.get(`${BASE}/dropdown`)
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────

  createOrder(data: CreatePOPayload) {
    return api.post(`${BASE}`, data)
  },

  updateOrder(id: number | string, data: UpdatePOPayload) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteOrder(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // ── Products ───────────────────────────────────────────────────────────────

  addProduct(id: number | string, data: AddProductPayload) {
    return api.post(`${BASE}/${id}/products`, data)
  },

  updateProduct(id: number | string, product_id: number | string, data: UpdateProductPayload) {
    return api.put(`${BASE}/${id}/products/${product_id}`, data)
  },

  deleteProduct(id: number | string, product_id: number | string) {
    return api.delete(`${BASE}/${id}/products/${product_id}`)
  },

  // ── Schedules ──────────────────────────────────────────────────────────────

  addSchedule(id: number | string, product_id: number | string, data: AddSchedulePayload) {
    return api.post(`${BASE}/${id}/products/${product_id}/schedules`, data)
  },

  updateSchedule(
    id: number | string,
    product_id: number | string,
    schedule_id: number | string,
    data: UpdateSchedulePayload,
  ) {
    return api.put(`${BASE}/${id}/products/${product_id}/schedules/${schedule_id}`, data)
  },

  deleteSchedule(
    id: number | string,
    product_id: number | string,
    schedule_id: number | string,
  ) {
    return api.delete(`${BASE}/${id}/products/${product_id}/schedules/${schedule_id}`)
  },

  // ── Status Transitions ─────────────────────────────────────────────────────

  release(id: number | string) {
    return api.post(`${BASE}/${id}/release`)
  },

  reject(id: number | string, data: RejectPOPayload) {
    return api.post(`${BASE}/${id}/reject`, data)
  },

  cancel(id: number | string, data: CancelPOPayload) {
    return api.post(`${BASE}/${id}/cancel`, data)
  },

  complete(id: number | string) {
    return api.post(`${BASE}/${id}/complete`)
  },

  close(id: number | string) {
    return api.post(`${BASE}/${id}/close`)
  },

  // ── Reschedule ─────────────────────────────────────────────────────────────

  reschedule(id: number | string, data: ReschedulePayload) {
    return api.post(`${BASE}/${id}/reschedule`, data)
  },

  getRescheduleLogs(id: number | string) {
    return api.get(`${BASE}/${id}/reschedule-logs`)
  },
}

export default orderScheduleService