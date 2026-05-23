import { api } from '../../plugins/axios'
import type {
  POListParams,
  CreatePOPayload,
  UpdatePOPayload,
  UpdateSchedulePayload,
  ReschedulePayload,
  ApprovePOPayload,
  RejectPOPayload,
} from '../../types/production-plan/order-schedule'

const BASE = '/production-plan/order-schedule'

const orderScheduleService = {

  getOrders(params?: POListParams) {
    return api.get(`${BASE}`, { params })
  },

  getOrder(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDropdown() {
    return api.get(`${BASE}/dropdown`)
  },

  createOrder(data: CreatePOPayload) {
    return api.post(`${BASE}`, data)
  },

  updateOrder(id: number | string, data: UpdatePOPayload) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteOrder(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  generateSchedule(id: number | string) {
    return api.post(`${BASE}/${id}/generate-schedule`)
  },

  updateSchedule(id: number | string, schedule_id: number | string, data: UpdateSchedulePayload) {
    return api.put(`${BASE}/${id}/schedules/${schedule_id}`, data)
  },

  submit(id: number | string) {
    return api.post(`${BASE}/${id}/submit`)
  },

  approve(id: number | string, data: ApprovePOPayload) {
    return api.post(`${BASE}/${id}/approve`, data)
  },

  reject(id: number | string, data: RejectPOPayload) {
    return api.post(`${BASE}/${id}/reject`, data)
  },

  release(id: number | string) {
    return api.post(`${BASE}/${id}/release`)
  },

  reschedule(id: number | string, data: ReschedulePayload) {
    return api.post(`${BASE}/${id}/reschedule`, data)
  },
}

export default orderScheduleService